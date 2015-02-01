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
                '/css/top.css?ver=20150201',
                );
        $layout->javascript = array(
                '/js/top.js?ver=20150201',
                );

        $layout->title = 'スマホで遊べるカードヒーロー！';
        $sExp = "カードヒーロー@スマホは、ブラウザ上でカードヒーローを遊べるサイトです。\nフィールド一覧から気になったフィールドを選ぶと、実際にカードヒーローをプレイする事ができます。%descend%\n投稿されたフィールドへ返信し合う事で、ゲーム同様に対戦する事もできます。";
        $layout->description = preg_replace("/(\r|\n|%descend%.*)/", '', $sExp);
        $this->view->assign('sExplain', str_replace('%descend%', '', $sExp));
    }

    public function memoAction()
    {
        if (APPLICATION_ENV != 'testing') {
            throw new Zend_Controller_Action_Exception('test env only.', 403);
        }
    }

}

