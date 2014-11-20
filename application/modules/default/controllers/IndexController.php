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
        $layout->title = 'スマホで遊べるカードヒーロー！';
        $layout->description = 'スマホでカードヒーローを遊べるWebサイトです。１ターンの行動を投稿することで、掲示板形式で対戦ができます。面白そうな投稿があれば、横から投稿するのもOKです。';
    }

    public function memoAction()
    {
        if (APPLICATION_ENV != 'testing') {
            throw new Zend_Controller_Action_Exception('test env only.', 403);
        }
    }

}

