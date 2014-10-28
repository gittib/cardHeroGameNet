<?php

class IndexController extends Zend_Controller_Action
{

    public function init()
    {
        /* Initialize action controller here */
    }

    public function indexAction()
    {
        // action body
        $layout = new Zend_Layout();
        $layout->stylesheet = array(
                '/css/top.css',
                );
        $layout->description = 'スマホで遊べるカードヒーロー！';
    }

}

