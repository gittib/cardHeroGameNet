<?php

class ApiController extends Zend_Controller_Action
{

    public function init()
    {
        /* Initialize action controller here */
    }

    public function preDispatch()
    {
        $layout = new Zend_Layout();
        $layout->disableLayout();
    }

    public function noImageAction()
    {
        $this->_redirect(
            '/images/dot.png',
            array('code' => 301)
        );
        exit();
    }


}

