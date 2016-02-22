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
$configuration = new Zend_Config_Ini(
    APPLICATION_PATH . '/configs/application.ini',
    APPLICATION_ENV, array(
        'allowModifications'    => true,
    )
);
foreach ($configuration->config as $key => $val) {
    if (isset($configuration->$key)) {
        throw new Exception("configuration key collision!");
    }
    $configuration->$key = new Zend_Config_Ini($val, APPLICATION_ENV);
}
unset($configuration->config);
Zend_Registry::set('config', $configuration);

// Create application, bootstrap, and run
$application = new Zend_Application(
    APPLICATION_ENV,
    APPLICATION_PATH . '/configs/application.ini'
);

$application->bootstrap()->run();
