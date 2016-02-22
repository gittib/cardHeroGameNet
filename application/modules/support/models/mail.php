<?php

class Model_Support_Mail
{

    private $_db;
    private $_aDomains = false;
    private $_config;

    public function __construct() {
        $this->_db = Zend_Registry::get('db');
        $this->_config = Zend_Registry::get('config');
    }

    public function getDomains () {
        if ($this->_aDomains) {
            return $this->_aDomains;
        }

        $sel = $this->_db->select()
            ->from(
                array('mmd' => 'm_mail_domain')
            )
            ->where('mmd.del_flg = 0')
            ->order(array(
                'mail_domain',
                'domain_id',
            ));
        $rslt = $this->_db->fetchAll($sel);
        foreach ($rslt as $val) {
            $this->_aDomains[$val['domain_id']] = $val;
        }
        return $this->_aDomains;
    }

    /**
     * 問い合わせ情報をDBに登録する
     *
     *  @param  $aParams['domain_id']       メアドドメインID
     *  @param  $aParams['sender_mail']     '@'の前のメールアドレス
     *  @param  $aParams['user_name']       問い合わせ者のお名前
     *  @param  $aParams['request_type']    問い合わせ種別。日本語文字列を直で飛ばす
     *  @param  $aParams['message']         問い合わせ本文
     *
     *  @return bool    mb_send_mailの戻り値
     */
    public function insertRequest ($aParams) {
        try {
            $this->_db->beginTransaction();
            $aDefaults = array(
                'domain_id'     => 0,
                'sender_mail'   => '',
                'user_name'     => '',
                'request_type'  => '',
                'message'       => '',
            );
            foreach ($aDefaults as $key => $val) {
                if (!isset($aParams[$key])) {
                    $aParams[$key] = $val;
                }
            }
            $set = array(
                'mail_domain_id'    => $aParams['domain_id'],
                'mail'              => $aParams['sender_mail'],
                'user_name'         => $aParams['user_name'],
                'request_type'      => $aParams['request_type'],
                'message'           => $aParams['message'],
            );
            $this->_db->insert('t_mail_request', $set);
            $this->_db->commit();
        } catch (Exception $e) {
            $this->_db->rollBack();
            return false;
        }
        return true;
    }

    /**
     * 問い合わせ情報をメールで送信する
     *
     *  @param  $aParams['domain_id']       メアドドメインID
     *  @param  $aParams['sender_mail']     '@'の前のメールアドレス
     *  @param  $aParams['user_name']       問い合わせ者のお名前
     *  @param  $aParams['request_type']    問い合わせ種別。日本語文字列を直で飛ばす
     *  @param  $aParams['message']         問い合わせ本文
     *
     *  @return bool    mb_send_mailの戻り値
     */
    public function sendRequest ($aParams) {
        $sMail = '未入力';
        if (isset($aParams['domain_id'], $aParams['sender_mail']) && $aParams['domain_id'] && $aParams['sender_mail']) {
            $sel = $this->_db->select()
                ->from(
                    array('mmd' => 'm_mail_domain'),
                    array(
                        'mail_domain',
                    )
                )
                ->where('mmd.domain_id = ?', $aParams['domain_id'])
                ->order(array(
                    'mail_domain',
                    'domain_id',
                ));
            $sDomain = $this->_db->fetchOne($sel);
            $sMail = $aParams['sender_mail'] . '@' . $sDomain;
        }
        $title = '[CHSMT]問い合わせがありました';
        $body = <<<_eos_
-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
[名前]
{$aParams['user_name']}

[メールアドレス]
{$sMail}

[問い合わせ分類]
{$aParams['request_type']}

[問い合わせ内容]
{$aParams['message']}
-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

早いとこ対応すれ。

_eos_;
        $head = <<<_eos_
From:gitti_abc@yahoo.co.jp\r
To:{$this->_config->secret->mail->admin}\r
Return-Path:gitti_abc@yahoo.co.jp\r
X-Mailer: PHP/Mail
_eos_;

        return mb_send_mail(
            $this->_config->secret->mail->admin,
            $title,
            $body,
            $head
        );
    }

}
