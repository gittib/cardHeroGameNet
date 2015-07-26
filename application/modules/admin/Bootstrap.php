<?php

class Admin_Bootstrap extends Zend_Application_Module_Bootstrap
{
    protected function _initAdminModule() {
        if (preg_match(';^/admin/;', $_SERVER['REQUEST_URI'] . '/')) {
            $this->_adminInitValidate();
            $this->_adminInitDB();
        }
    }

    private function _adminInitValidate() {
        $aUserInfo = Common::checkLogin();
        if (!$aUserInfo || $aUserInfo['user_id'] != 1) {
            $this->_adminInitReplaceErrorRoute();
        }
    }

    private function _adminInitReplaceErrorRoute() {
        $this->bootstrap('frontController');
        $front = Zend_Controller_Front::getInstance();
        $front->setRouter(new Zend_Controller_Router_Rewrite());
        $router = $front->getRouter();

        // わざと存在しないMVCに飛ばして404を吐かせる
        $route = new Zend_Controller_Router_Route_Regex(
            '(.*)?',
            array(
                'module'        => 'admin',
                'controller'    => 'index',
                'action'        => 'not-exist',
            )
        );
        $router->addRoute('auth_error', $route);
    }

    private function _adminInitDB() {
        $conf = Zend_Registry::get('config');

        $db = Zend_Db::factory('PDO_PGSQL', array(
            'host'      => $conf->database->host,
            'username'  => $conf->database->admin->username,
            'password'  => $conf->database->admin->password,
            'dbname'    => $conf->database->dbname,
        ));
        if (APPLICATION_ENV != 'production') {
            $db->getProfiler()->setEnabled(true);
        }
        Zend_Registry::set('db', $db);
    }
}

