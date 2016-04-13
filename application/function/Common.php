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
            if (empty($_COOKIE['login_key'])) {
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
                    'twitter_id',
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
        if (empty($aUserInfo)) {
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
        for ($i = 0 ; $i < 10 ; $i++) {
            $sNewKey = md5(self::makeRandStr(20));
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

    /**
     * ランダム文字列生成 (英数字)
     * $length: 生成する文字数
     */
    public static function makeRandStr($length = 8) {
        static $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJLKMNOPQRSTUVWXYZ0123456789_';
        $iRange = strlen($chars) - 1;
        $str = '';
        for ($i = 0; $i < $length; ++$i) {
            $str .= $chars[mt_rand(0, $iRange)];
        }
        return $str;
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
        if (!empty($aOption['reset'])) {
            unset($oSession->sLastPageBeforeLogin);
        } else {
            if (!empty($aOption['url'])) {
                $sUrl = $aOption['url'];
            } else {
                $sUrl = $_SERVER['REQUEST_URI'];
            }
            $oSession->sLastPageBeforeLogin = $sUrl;
        }
    }

    /**
     * 管理者か確認
     *
     * @return true:管理者 / false:管理者ではない
     */
    public static function isAdmin()
    {
        $aUserInfo = self::checkLogin();
        if (!empty($aUserInfo)) {
            return ($aUserInfo['user_id'] == 1);
        } else {
            return false;
        }
    }

    /**
     * メールの状況確認
     *
     * @return 最新のメール受信日時
     */
    public static function checkMail()
    {
        $db = Zend_Registry::get('db');
        $sel = $db->select()
            ->from(
                array('tmr' => 't_mail_request'),
                array(
                    'max_date'  => new Zend_Db_Expr("max(upd_date)"),
                )
            )
            ->where('tmr.del_flg = 0');
        return $db->fetchOne($sel);
    }

    /**
     * ツイートする
     *
     * @param   String  sTweet  ツイートする文字列
     * @param   Array   aOption オプションパラメータ
     *  'in_reply_to_status_id' リプライ先のツイートID 
     *  'possibly_sensitive'    不適切な可能性のある画像とするか？ 
     *  'lat'                   緯度 
     *  'long'                  経度 
     *  'place_id'              場所ID 
     *  'display_coordinates'   位置情報を範囲指定にするか？ 
     *  'trim_user'             ユーザーオブジェクトの省略 
     *  'media_ids'             メディアID 
     *
     * @return bool trueならツイート成功
     */
    public static function tweetNotic($sTweet, $aOption = array())
    {
        $conf = Zend_Registry::get('config');

        // 設定
        $api_key                = $conf->secret->twitter->bot->api->key;        // APIキー
        $api_secret             = $conf->secret->twitter->bot->api->secret;	    // APIシークレット
        $access_token           = $conf->secret->twitter->bot->token->key;      // アクセストークン
        $access_token_secret    = $conf->secret->twitter->bot->token->secret;   // アクセストークンシークレット
        $request_url            = 'https://api.twitter.com/1.1/statuses/update.json' ; // エンドポイント
        $request_method         = 'POST' ;

        // パラメータA (オプション)
        $aParam = array(
            'in_reply_to_status_id' => null,    // リプライ先のツイートID              
            'possibly_sensitive'    => null,    // 不適切な可能性のある画像とするか？  
            'lat'                   => null,    // 緯度                                
            'long'                  => null,    // 経度                                
            'place_id'              => null,    // 場所ID 
            'display_coordinates'   => null,    // 位置情報を範囲指定にするか？ 
            'trim_user'             => null,    // ユーザーオブジェクトの省略 
            'media_ids'             => null,    // メディアID 
        );
        foreach ($aParam as $key => $val) {
            if (empty($aOption[$key])) {
                unset($aParam[$key]);
            } else {
                $aParam[$key] = $aOption[$key];
            }
        }
        $aParam['status'] = $sTweet;

        // キーを作成する (URLエンコードする)
        $signature_key = rawurlencode( $api_secret ) . '&' . rawurlencode( $access_token_secret ) ;

        // パラメータB (署名の材料用)
        $params_b = array(
            'oauth_token' => $access_token ,
            'oauth_consumer_key' => $api_key ,
            'oauth_signature_method' => 'HMAC-SHA1' ,
            'oauth_timestamp' => time() ,
            'oauth_nonce' => microtime() ,
            'oauth_version' => '1.0' ,
        ) ;

        // パラメータAとパラメータBを合成してパラメータCを作る
        $params_c = array_merge( $aParam , $params_b ) ;

        // 連想配列をアルファベット順に並び替える
        ksort( $params_c ) ;

        // パラメータの連想配列を[キー=値&キー=値...]の文字列に変換する
        $request_params = http_build_query( $params_c , '' , '&' ) ;

        // 一部の文字列をフォロー
        $request_params = str_replace( array( '+' , '%7E' ) , array( '%20' , '~' ) , $request_params ) ;

        // 変換した文字列をURLエンコードする
        $request_params = rawurlencode( $request_params ) ;

        // リクエストメソッドをURLエンコードする
        // ここでは、URL末尾の[?]以下は付けないこと
        $encoded_request_method = rawurlencode( $request_method ) ;

        // リクエストURLをURLエンコードする
        $encoded_request_url = rawurlencode( $request_url ) ;

        // リクエストメソッド、リクエストURL、パラメータを[&]で繋ぐ
        $signature_data = $encoded_request_method . '&' . $encoded_request_url . '&' . $request_params ;

        // キー[$signature_key]とデータ[$signature_data]を利用して、HMAC-SHA1方式のハッシュ値に変換する
        $hash = hash_hmac( 'sha1' , $signature_data , $signature_key , TRUE ) ;

        // base64エンコードして、署名[$signature]が完成する
        $signature = base64_encode( $hash ) ;

        // パラメータの連想配列、[$params]に、作成した署名を加える
        $params_c['oauth_signature'] = $signature ;

        // パラメータの連想配列を[キー=値,キー=値,...]の文字列に変換する
        $header_params = http_build_query( $params_c , '' , ',' ) ;

        // リクエスト用のコンテキスト
        $context = array(
            'http' => array(
                'method' => $request_method , // リクエストメソッド
                'header' => array(			  // ヘッダー
                    'Authorization: OAuth ' . $header_params ,
                ) ,
            ) ,
        ) ;

        // オプションがある場合、コンテキストにPOSTフィールドを作成する
        if( $aParam ) {
            $context['http']['content'] = http_build_query( $aParam ) ;
        }

        // cURLを使ってリクエスト
        $curl = curl_init() ;
        curl_setopt( $curl , CURLOPT_URL , $request_url ) ;
        curl_setopt( $curl , CURLOPT_HEADER, 1 ) ; 
        curl_setopt( $curl , CURLOPT_CUSTOMREQUEST , $context['http']['method'] ) ;			// メソッド
        curl_setopt( $curl , CURLOPT_SSL_VERIFYPEER , false ) ;								// 証明書の検証を行わない
        curl_setopt( $curl , CURLOPT_RETURNTRANSFER , true ) ;								// curl_execの結果を文字列で返す
        curl_setopt( $curl , CURLOPT_HTTPHEADER , $context['http']['header'] ) ;			// ヘッダー
        if( isset( $context['http']['content'] ) && !empty( $context['http']['content'] ) ) {
            curl_setopt( $curl , CURLOPT_POSTFIELDS , $context['http']['content'] ) ;			// リクエストボディ
        }
        curl_setopt( $curl , CURLOPT_TIMEOUT , 5 ) ;										// タイムアウトの秒数
        $res1 = curl_exec( $curl ) ;
        $res2 = curl_getinfo( $curl ) ;
        curl_close( $curl ) ;

        // 取得したデータ
        $json = substr( $res1, $res2['header_size'] ) ;				// 取得したデータ(JSONなど)
        $header = substr( $res1, 0, $res2['header_size'] ) ;		// レスポンスヘッダー (検証に利用したい場合にどうぞ)

        // [cURL]ではなく、[file_get_contents()]を使うには下記の通りです…
        // $json = @file_get_contents( $request_url , false , stream_context_create( $context ) ) ;

        // JSONをオブジェクトに変換
        $obj = json_decode( $json ) ;

        // 戻り値
        $ret = true;

        // HTML用
        $html = '' ;

        // タイトル
        $html .= '<h1 style="text-align:center; border-bottom:1px solid #555; padding-bottom:12px; margin-bottom:48px; color:#D36015;">statuses/update</h1>' ;

        // エラー判定
        if( !$json || !$obj ) {
            $html .= '<h2>エラー内容</h2>' ;
            $html .= '<p>データを取得することができませんでした…。設定を見直して下さい。</p>' ;
            $ret = false;
        }

        // 検証用
        $html .= '<h2>取得したデータ</h2>' ;
        $html .= '<p>下記のデータを取得できました。</p>' ;
        $html .= 	'<h3>ボディ(JSON)</h3>' ;
        $html .= 	'<p><textarea style="width:80%" rows="8">' . $json . '</textarea></p>' ;
        $html .= 	'<h3>レスポンスヘッダー</h3>' ;
        $html .= 	'<p><textarea style="width:80%" rows="8">' . $header . '</textarea></p>' ;

        // 検証用
        $html .= '<h2>リクエストしたデータ</h2>' ;
        $html .= '<p>下記内容でリクエストをしました。</p>' ;
        $html .= 	'<h3>URL</h3>' ;
        $html .= 	'<p><textarea style="width:80%" rows="8">' . $context['http']['method'] . ' ' . $request_url . '</textarea></p>' ;
        $html .= 	'<h3>ヘッダー</h3>' ;
        $html .= 	'<p><textarea style="width:80%" rows="8">' . implode( "\r\n" , $context['http']['header'] ) . '</textarea></p>' ;

        // フッター
        $html .= '<small style="display:block; border-top:1px solid #555; padding-top:12px; margin-top:72px; text-align:center; font-weight:700;">プログラムの説明: <a href="https://syncer.jp/twitter-api-matome/post/statuses/update" target="_blank">SYNCER</a></small>' ;

        // 出力 (本稼働時はHTMLのヘッダー、フッターを付けよう)
        $html = '<html><body>' . $html . '</body></html>';
        return $ret;
    }

    /**
     * HTTPステータスコードを取得する
     * 
     * 正常な場合は200が返却され、異常な場合はそのステータスが、
     * そして存在しないURLの場合は返ってくる値はnullとなる。
     *
     * @param string $url
     * @return mixed $header status code or null
     */
    public static function getStatusCode($url) {
        $header = null;
        $options = array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER         => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_ENCODING       => "",
            CURLOPT_USERAGENT      => "CHSMT",
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_AUTOREFERER    => true,
            CURLOPT_CONNECTTIMEOUT => 30,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_MAXREDIRS      => 10,
        );
        $ch = curl_init($url);
        curl_setopt_array($ch, $options);
        $content = curl_exec($ch);

        if(!curl_errno($ch)) {
            $header = curl_getinfo($ch);
        }
        curl_close($ch);
        return $header['http_code'];
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
        $ret = "<table cellspacing='0' cellpadding='0' border='0' class='sql_debug'>\n";
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
