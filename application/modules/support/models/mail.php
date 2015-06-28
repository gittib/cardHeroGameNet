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

    public function sendRequest ($aParams) {
        $sMail = '----';
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
-------------------------------------------------------------
[名前]
{$aParams['user_name']}

[メールアドレス]
{$sMail}

[問い合わせ分類]
{$aParams['request_type']}

[問い合わせ内容]
{$aParams['message']}
-------------------------------------------------------------

早いとこ対応すれ。

_eos_;
        $head = <<<_eos_
FROM:gitti_abc@yahoo.co.jp
_eos_;

        return mb_send_mail(
            $this->_config->mail->admin,
            $title,
            $body,
            $head
        );
    }

}
