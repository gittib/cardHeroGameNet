<?php

class My_Mail {

    /**
     * メール送信
     *
     * @param   aArgs['to']         送信先アドレス
     * @param   aArgs['from']       送信元アドレス
     * @param   aArgs['replyTo']    返信先アドレス
     * @param   aArgs['subject']    メールタイトル
     * @param   aArgs['message']    メール本文
     *
     * @return  メール送信成否
     */
    public static function send($aArgs)
    {
        $conf = Zend_Registry::get('config');

        // 引数チェック
        try {
            if (!isset($aArgs) || !$aArgs) {
                throw new Exception('$aArgs is null.');
            }
            if (!isset($aArgs['to']) || !$aArgs['to']) {
                throw new Exception('to is null.');
            }
            if (!isset($aArgs['message']) || !$aArgs['message']) {
                throw new Exception('message is null.');
            }
            if (!isset($aArgs['from']) || !$aArgs['from']) {
                $aArgs['from'] = $conf->mail->from;
            }
            if (!isset($aArgs['subject']) || !$aArgs['subject']) {
                $aArgs['subject'] = '無題';
            }
        } catch (Exception $e) {
            error_log('メール送信バリデーションエラー： ' . $e->getMessage());
            return false;
        }

        $_ml = new Zend_Mail();
        $_ml->setFrom($aArgs['from'])
            ->addTo($aArgs['to'])
            ->setSubject($aArgs['subject'])
            ->setBodyText($aArgs['message']);
        try {
            $_ml->send();
            return true;
        } catch (Exception $e) {
            error_log('メール送信失敗： ' . $e->getMessage());
            return false;
        }
    }
}
