<?php

class ErrorController extends Zend_Controller_Action
{
    private $_layout;

    public function errorAction()
    {
        $this->_layout = new Zend_Layout();
        $this->_layout->title = 'エラーページ';
        $errors = $this->_getParam('error_handler');

        if (!$errors || !$errors instanceof ArrayObject) {
            $this->view->message = 'You have reached the error page';
            return;
        }

        switch ($errors->type) {
            case Zend_Controller_Plugin_ErrorHandler::EXCEPTION_NO_ROUTE:
            case Zend_Controller_Plugin_ErrorHandler::EXCEPTION_NO_CONTROLLER:
            case Zend_Controller_Plugin_ErrorHandler::EXCEPTION_NO_ACTION:
                // 404 error -- controller or action not found
                $this->getResponse()->setHttpResponseCode(404);
                $priority = Zend_Log::NOTICE;
                $this->view->message = '指定されたページは存在しないか、削除されました。';
                $this->view->code = 404;
                break;
            default:
                // application error
                $code = $errors->exception->getCode();
                if (empty($code)) {
                    $code = 500;
                }
                $this->view->code = $code;
                switch ($code) {
                    case 403:
                        $priority = Zend_Log::NOTICE;
                        $this->view->message = 'このページへのアクセス権限が確認出来ません。';
                        break;
                    case 404:
                        $priority = Zend_Log::NOTICE;
                        $this->view->message = '指定されたページは存在しないか、削除されました。';
                        break;
                    case 410:
                        $priority = Zend_Log::NOTICE;
                        $this->view->message = '指定されたページは削除されました。';
                        break;
                    default:
                        $priority = Zend_Log::CRIT;
                        $this->view->message = 'このページは工事中です。';
                        $code = 500;
                        break;
                }
                $this->getResponse()->setHttpResponseCode($code);
                break;
        }
        $this->view->errorType = $errors->type;

        // Log exception, if logger available
        if ($log = $this->getLog()) {
            $log->log($this->view->message, $priority, $errors->exception);
            $log->log('Request Parameters', $priority, $errors->request->getParams());
        }

        // conditionally display exceptions
        if ($this->getInvokeArg('displayExceptions') == true) {
            $this->view->exception = $errors->exception;
        }

        $this->view->request = $errors->request;
    }

    public function maintenanceAction()
    {
        $this->_layout = new Zend_Layout();
        $this->_layout->title = 'メンテナンス中...';
        $this->getResponse()->setHttpResponseCode(503);
    }

    public function getLog()
    {
        $bootstrap = $this->getInvokeArg('bootstrap');
        if (!$bootstrap->hasResource('Log')) {
            return false;
        }
        $log = $bootstrap->getResource('Log');
        return $log;
    }


}

