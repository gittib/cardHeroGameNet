<?php

class Create_FieldController extends Zend_Controller_Action
{
    private $_model;
    private $_layout;
    private $_stylesheet;
    private $_javascript;

    public function init()
    {
        /* Initialize action controller here */

        $this->_layout = new Zend_Layout();

        $this->_stylesheet = array();

        $this->_javascript = array();
    }

    public function postDispatch()
    {
        $this->_layout->stylesheet = $this->_stylesheet;
        $this->_layout->javascript = $this->_javascript;
    }
}
