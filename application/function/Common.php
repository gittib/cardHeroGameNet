<?php

class Common {

    public static $logoutMessage = 'logout_message';

    /**
     * クッキーの値を見てログイン状態の確認と期限更新を行う
     *
     * @return ログインしているユーザのユーザ情報。未ログイン時はnull
     */
    public static function checkLogin($sLoginKey = '')
    {
        $nCookieLimitSec = 30 * 24 * 3600;

        if ($sLoginKey == self::$logoutMessage) {
            Zend_Registry::set('current_login_key', null);
            return null;
        }

        if (Zend_Registry::isRegistered('current_login_key')) {
            // クッキーの値は次のアクセスまで変わらないので、Zend_Registryでテンポラリキーを引き回す
            $sLoginKey = Zend_Registry::get('current_login_key');
        }
        if ($sLoginKey == '') {
            if (!isset($_COOKIE['login_key']) || $_COOKIE['login_key'] == '') {
                return null;
            }
            $sLoginKey = $_COOKIE['login_key'];
        }
        $db = Zend_Registry::get('db');
        $sel = $db->select()
            ->from(
                array('tu' => 't_user'),
                array(
                    'user_id',
                    'nick_name',
                )
            )
            ->join(
                array('tlk' => 't_login_key'),
                'tlk.user_id = tu.user_id',
                array()
            )
            ->where('tlk.temp_key = ?', (string)$sLoginKey)
            ->where('tlk.limit_time >= now()');
        $aUserInfo = $db->fetchRow($sel);
        if (!isset($aUserInfo) || !$aUserInfo) {
            // クッキー値がDBに載ってなかったら消しておく
            setcookie('login_key', '', time() - 1800, '/');
            Zend_Registry::set('current_login_key', '');
            return null;
        }
        $view = new Zend_View();
        $aUserInfo['nick_name'] = $view->escape($aUserInfo['nick_name']);
        if (Zend_Registry::isRegistered('current_login_key')) {
            return $aUserInfo;
        }

        $userId = $aUserInfo['user_id'];
        for ($i = 0 ; $i < 100 ; $i++) {
            $sNewKey = md5(rand(1, 10000) . date('YmdHis') . rand(1,10000));
            $sel = "select count(*) from t_login_key where temp_key = '{$sNewKey}'";
            $cnt = $db->fetchOne($sel);
            if ($cnt <= 0) {
                try {
                    $db->beginTransaction();
                    $set = array(
                        'temp_key'      => $sNewKey,
                        'limit_time'    => date('Y-m-d H:i:s', time() + $nCookieLimitSec),
                        'user_agent'    => $_SERVER['HTTP_USER_AGENT'],
                        'device_type'   => Common::checkUA(),
                    );
                    $where = array(
                        $db->quoteInto('temp_key = ?', (string)$sLoginKey),
                    );
                    $db->update('t_login_key', $set, $where);
                    $db->commit();
                } catch (Exception $e) {
                    $db->rollBack();
                    return null;
                }

                setcookie('login_key', $sNewKey, time() + $nCookieLimitSec, '/');
                Zend_Registry::set('current_login_key', $sNewKey);

                // エスケープ処理
                foreach ($aUserInfo as $key => $val) {
                    $aUserInfo[$key] = $view->escape($val);
                }
                return $aUserInfo;
            }
        }
        // temp_keyの再設定に失敗した場合、ログアウトさせる
        $where = array($db->quoteInto('user_id = ?', $userId));
        $db->delete('t_login_key', $where);
        setcookie('login_key', '', time() - 1800, '/');
        return null;
    }

    public static function checkUA ()
    {
        if (empty($_SERVER['HTTP_USER_AGENT'])) {
            return 'pc';
        }

        $ua = mb_strtolower($_SERVER['HTTP_USER_AGENT']);
        if(strpos($ua,'iphone') !== false){
            $device = 'iOS';
        }elseif(strpos($ua,'ipod') !== false){
            $device = 'iOS';
        }elseif((strpos($ua,'android') !== false) && (strpos($ua, 'mobile') !== false)){
            $device = 'android';
        }elseif((strpos($ua,'windows') !== false) && (strpos($ua, 'phone') !== false)){
            $device = 'mobile';
        }elseif((strpos($ua,'firefox') !== false) && (strpos($ua, 'mobile') !== false)){
            $device = 'android';
        }elseif(strpos($ua,'blackberry') !== false){
            $device = 'android';
        }elseif(strpos($ua,'ipad') !== false){
            $device = 'iOS';
        }elseif((strpos($ua,'windows') !== false) && (strpos($ua, 'touch') !== false)){
            $device = 'tablet';
        }elseif((strpos($ua,'android') !== false) && (strpos($ua, 'mobile') === false)){
            $device = 'android';
        }elseif((strpos($ua,'firefox') !== false) && (strpos($ua, 'tablet') !== false)){
            $device = 'android';
        }elseif((strpos($ua,'kindle') !== false) || (strpos($ua, 'silk') !== false)){
            $device = 'tablet';
        }elseif((strpos($ua,'playbook') !== false)){
            $device = 'tablet';
        }else{
            $device = 'pc';
        }
        return $device;
    }

    /**
     * ログイン後に現在のページに戻ってこれるよう、飛び先を記録する
     *
     * @param aOption['reset']  trueなら飛び先情報のセッションをクリアする
     * @param aOption['url']    ログイン後の飛び先URL。未指定だったら現在のURIを使う
     *
     * @return 無し
     */
    public static function setLoginLP ($aOption = array())
    {
        $oSession = Zend_Registry::get('session');
        if (isset($aOption['reset']) && $aOption['reset']) {
            unset($oSession->sLastPageBeforeLogin);
        } else {
            if (isset($aOption['url']) && $aOption['url']) {
                $sUrl = $aOption['url'];
            } else {
                $sUrl = $_SERVER['REQUEST_URI'];
            }
            $oSession->sLastPageBeforeLogin = $sUrl;
        }
    }

    /**
     * 投げてるSQLの確認
     *
     * @return 投げてるSQL一覧のHTML
     */
    public static function checkSQL()
    {
        $db = Zend_Registry::get('db');
        $qp = $db->getProfiler()->getQueryProfiles();
        $sCss = <<<_eos_
<style type="text/css">
<!--
table.sql_debug {
  border: solid 1px;
}
table.sql_debug th {
  border: solid 1px #eeeeee;
  background-color: #eeeeff;
  font-size: 10px;
}
table.sql_debug td {
  border: solid 1px #eeeeee;
  background-color: #ffffff;
  font-size: 10px;
}
table.sql_debug td.sql {
  word-break: break-all;
}
table.sql_debug td .variable {
  color: red;
}
-->
</style>

_eos_;
        $ret = "<table cellspacing=0 cellpadding=0 border=0 class='sql_debug'>\n";
        $ret .= "    <tr><th>#</th><th>Query</th><th>time[msec]</th></tr>\n";
        $num = 1;
        $sTmpNeedle = ':::hatena_temp_str:::';
        if (is_array($qp)) {
            foreach ($qp as $query) {
                $sql = htmlspecialchars($query->getQuery());
                $msec = $query->getElapsedSecs() * 1000;
                foreach ($query->getQueryParams() as $prm) {
                    $prm = '<span class="variable">' . htmlspecialchars(str_replace('?', $sTmpNeedle, $prm)) . '</span>';
                    $sql = preg_replace('/^([^?]*)\?/s', "$1'{$prm}'", $sql);
                }
                $ret .= "    <tr><td>{$num}</td><td class=\"sql\">{$sql}</td><td>{$msec}</td></tr>\n";
                $num++;
            }
            $ret = str_replace($sTmpNeedle, '?', $ret);
        }
        $msec = $db->getProfiler()->getTotalElapsedSecs() * 1000;
        $ret .= "    <tr><td>#</td><td>Total Time</td><td>{$msec}</td></tr>\n";
        $ret .= "</table>\n";
        return $sCss . $ret;
    }
}
