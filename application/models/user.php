<?php

class model_User {
    private $_db;
    private $_config;
    private $_salt;

    public function __construct()
    {
        $this->_db      = Zend_Registry::get('db');
        $this->_config  = Zend_Registry::get('config');
        $this->_salt    = $this->_config->user->salt;
    }

    public function updateFrontInfo($aInput)
    {
        try {
            $aLoginInfo = Common::checkLogin();
            $where = array($this->_db->quoteInto('user_id = ?', $aLoginInfo['user_id']));
            $set = array(
                'nick_name' => $aInput['nickname'],
            );

            $this->_db->update('t_user', $set, $where);
        } catch(Exception $e) {
            return false;
        }
        return true;
    }

    public function regist($aUserInfo)
    {
        try {
            if (!isset($aUserInfo) || !is_array($aUserInfo)) {
                throw new Exception('ユーザー情報未取得');
            }
            $sel = $this->_db->select()
                ->from(
                    't_user',
                    array('user_id')
                )
                ->where('login_id = ?', $aUserInfo['login_id']);

            $row = $this->_db->fetchAll($sel);
            if (count($row) > 0) {
                throw new Exception('ログインID被り');
            }

            $set = array(
                'login_id'  => $aUserInfo['login_id'],
                'password'  => md5($aUserInfo['password'] . $this->_salt),
                'nick_name' => $aUserInfo['nickname'],
            );

            $this->_db->insert('t_user', $set);
        } catch(Exception $e) {
            return false;
        }
        return true;
    }

    public function login($loginId, $password)
    {
        $sel = $this->_db->select()
            ->from(
                't_user',
                array(
                    'user_id',
                    'mail',
                    'nick_name',
                )
            )
            ->where('login_id = ?', $loginId)
            ->where('password = ?', md5($password . $this->_salt));
        $aUserInfo = $this->_db->fetchRow($sel);
        $tmpKey = '';
        try {
            $this->_db->beginTransaction();
            if (isset($aUserInfo) && $aUserInfo !== FALSE) {

                $set = array(
                    'last_login_date'   => date('Y-m-d H:i:s'),
                );
                $where = array($this->_db->quoteInto('user_id = ?', $aUserInfo['user_id']));
                $this->_db->update('t_user', $set, $where);
                $this->_db->delete('t_login_key', $where);

                $set = array(
                    'user_id'       => $aUserInfo['user_id'],
                    'temp_key'      => rand(1, 1000000000),
                    'limit_time'    => date('Y-m-d H:i:s', time() + 3600),
                );
                $tmpKey = $set['temp_key'];
                $this->_db->insert('t_login_key', $set);
                $this->_db->Commit();

            } else {
                throw new Exception('ユーザー情報未登録');
            }
        } catch (Exception $e) {
            $this->_db->rollBack();
            return array(false, null);
        }
        Common::checkLogin($tmpKey);
        return array(true, $aUserInfo);
    }

    public function logout()
    {
        $aUserInfo = Common::checkLogin();
        $where = array($this->_db->quoteInto('user_id = ?', $aUserInfo['user_id']));
        $this->_db->delete('t_login_key', $where);
        setcookie('login_key', '', time() - 1800, '/');
        Common::checkLogin(Common::$logoutMessage);
    }
}
