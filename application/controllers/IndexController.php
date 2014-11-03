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
        $layout->description = 'スマホでカードヒーローを遊べるWebサイトです。１ターンの行動を投稿することで、掲示板形式で対戦ができます。面白そうな投稿があれば、横から投稿するのもOKです。';
    }

}

