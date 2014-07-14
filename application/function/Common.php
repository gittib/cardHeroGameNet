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
        for ($i = 0 ; $i < 1000 ; $i++) {
            $sNewKey = md5(rand(1, 10000) . date('YmdHis') . rand(1,10000));
            $sel = "select count(*) from t_login_key where temp_key = '{$sNewKey}'";
            $cnt = $db->fetchOne($sel);
            if ($cnt <= 0) {
                $set = array(
                        'temp_key'      => $sNewKey,
                        'limit_time'    => date('Y-m-d H:i:s', time() + $nCookieLimitSec),
                        );
                $where = array($db->quoteInto('user_id = ?', $userId));
                $db->update('t_login_key', $set, $where);
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

    /**
     * 一週間以上ターンエンドされていないフィールドを削除する
     */
    public function deleteUnlinkedField()
    {
        $db = Zend_Registry::get('db');
        $limitDate = date('Y-m-d', time() - 3600*24*7);
        $sub = $db->select()
            ->from(
                array('tgc' => 't_game_cards'),
                array(
                    'game_card_id',
                )
            )
            ->join(
                array('tgf' => 't_game_field'),
                'tgf.game_field_id = tgc.game_field_id',
                array()
            )
            ->where('tgf.end_flg = 0')
            ->where('tgf.upd_date <= ?', $limitDate);
        $where = array("game_card_id in({$sub})");

        $db->beginTransaction();
        try {
            $db->delete('t_game_monster_status', $where);
            $db->delete('t_game_monster', $where);
            $db->delete('t_game_cards', $where);

            $db->commit();
        } catch (Exception $e) {
            $db->rollBack();
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
        if (!is_array($qp)) {
            return '';
        }
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
-->
</style>

_eos_;
        $ret = "<table cellspacing=0 cellpadding=0 border=0 class='sql_debug'>\n";
        $ret .= "    <tr><th>#</th><th>Query</th><th>time[sec]</th></tr>\n";
        $num = 1;
        foreach ($qp as $query) {
            $sql = $query->getQuery();
            $sec = $query->getElapsedSecs();
            foreach ($query->getQueryParams() as $prm) {
                $sql = preg_replace('/^([^?]*)\?/s', "$1'{$prm}'", $sql);
            }
            $ret .= "    <tr><td>{$num}</td><td>{$sql}</td><td>{$sec}</td></tr>\n";
            $num++;
        }
        $sec = $db->getProfiler()->getTotalElapsedSecs();
        $ret .= "    <tr><td>#</td><td>Total Time</td><td>{$sec}</td></tr>\n";
        $ret .= "</table>\n";
        return $sCss . $ret;
    }
}
