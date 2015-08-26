<?php

class Support_HelpController extends Zend_Controller_Action
{
    private $_javascript;

    public function init()
    {
        /* Initialize action controller here */

        $this->_layout = Zend_Registry::get('layout');
        $this->_javascript = array();
    }

    public function postDispatch()
    {
        $this->_layout->javascript = $this->_javascript;
    }

    public function indexAction()
    {
        $this->_layout->title = 'カードヒーローとは';
        $this->_javascript = array(
            '/js/support_help_parallax.js',
            '/js/scroll_to_top.js',
        );
    }
}
