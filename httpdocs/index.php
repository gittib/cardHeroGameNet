<?php

// Define path to application directory
defined('APPLICATION_PATH')
    || define('APPLICATION_PATH', realpath(dirname(__FILE__) . '/../application'));

// Define application environment
defined('APPLICATION_ENV')
    || define('APPLICATION_ENV', (getenv('APPLICATION_ENV') ? getenv('APPLICATION_ENV') : 'production'));

// Ensure library/ is on include_path
set_include_path(implode(PATH_SEPARATOR, array(
    '/var/library',
    //realpath(APPLICATION_PATH . '/../library'),
    realpath(APPLICATION_PATH . '/function'),
    get_include_path(),
)));
require_once 'Zend/Loader/Autoloader.php';
$autoloader = Zend_Loader_Autoloader::getInstance();
$autoloader->unregisterNamespace(array('Zend_', 'ZendX_'))
               ->setFallbackAutoloader(true);


/** Zend_Application */
require_once 'Zend/Application.php';
$configuration = new Zend_Config_Ini(APPLICATION_PATH . '/configs/application.ini', APPLICATION_ENV);
Zend_Registry::set('config', $configuration);

// Create application, bootstrap, and run
$application = new Zend_Application(
    APPLICATION_ENV,
    APPLICATION_PATH . '/configs/application.ini'
);

try {
    Zend_Session::start();
    $application->bootstrap()->run();
} catch (Exception $e) {
    if (APPLICATION_ENV == 'testing') {
        $sError = $e->getMessage();
        echo <<<_eos_
テスト環境なのでエラー表示<br />
<br />
<b>{$sError}</b><br />
<br />

_eos_;
        var_dump($e);
    } else {
        throw $e;
    }
}
