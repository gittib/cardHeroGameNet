<?php

class IndexController extends Zend_Controller_Action
{

    private $_model;

    public function init()
    {
        /* Initialize action controller here */
    }

    public function indexAction()
    {
        Common::setLoginLP(array(
            'reset' => true,
        ));

        $layout = new Zend_Layout();
        $layout->javascript = array(
                '/js/top.js?ver=20160922',
                );

        $layout->title = 'スマホで遊べるカードヒーロー！';
        $layout->canonical = '/';
        $sExp = "カードヒーロー@スマホは、ブラウザ上でカードヒーローを遊べるサイトです。\nフィールド一覧から気になったフィールドを選ぶと、実際にカードヒーローをプレイする事ができます。%descend%\n投稿されたフィールドへ返信し合う事で、ゲーム同様に対戦する事もできます。";
        $layout->description = preg_replace("/(\r|\n|%descend%.*)/", '', $sExp);
        $this->view->assign('sExplain', str_replace('%descend%', '', $sExp));
        $this->view->assign('aPanelInfo', $this->_getPanelList());
    }

    public function listAction()
    {
        $layout = new Zend_Layout();
        $layout->bHideHeader = true;
        $layout->bPreventAnalytics = true;
        $this->view->assign('aPanelInfo', $this->_getPanelList());
    }

    public function memoAction()
    {
        if (APPLICATION_ENV != 'testing') {
            throw new Zend_Controller_Action_Exception('test env only.', 403);
        }
        $this->_helper->layout->disableLayout();
    }

    private function  _getPanelList()
    {
        $aRet = array(
            'card_list' => array(
                'url'   => '/card/',
                'class' => 'card_list',
                'img'   => 'card_list_icon.png',
                'alt'   => 'カードリスト',
                'text'  => 'カードリスト',
            ),
            'field_list' => array(
                'url'   => '/game/',
                'class' => 'field_list',
                'img'   => 'field_list_icon.png',
                'alt'   => 'フィールドリスト',
                'text'  => 'フィールド一覧',
            ),
            'deck_list' => array(
                'url'   => '/deck/',
                'class' => 'deck_list',
                'img'   => 'deck_icon.png',
                'alt'   => 'デッキ一覧',
                'text'  => 'デッキ一覧',
            ),
            'new_game' => array(
                'url'   => '/game/lobby/',
                'class' => 'new_game',
                'img'   => 'new_game_icon.png',
                'alt'   => '新規ゲーム開始',
                'text'  => '新規ゲーム開始',
            ),
            'rankings' => array(
                'url'   => '/ranking/',
                'class' => 'rankings',
                'img'   => 'ranking_icon.png',
                'alt'   => 'ランキング',
                'text'  => 'ランキング',
            ),
            'movie' => array(
                'url'   => '/game/movie/',
                'class' => 'movie',
                'img'   => 'replay_movie_icon.png',
                'alt'   => 'ムービー',
                'text'  => 'リプレイ鑑賞',
            ),
            'support' => array(
                'url'   => '/support/mail/input/',
                'class' => 'support',
                'img'   => 'mail_icon.png',
                'alt'   => 'メール',
                'text'  => 'お問い合わせ',
            ),
        );
        if (Common::isAdmin()) {
            $aRet['admin'] = array(
                'url'   => '/admin/',
                'class' => 'support',
                'img'   => 'field_list_icon0.png',
                'alt'   => '管理画面',
                'text'  => '管理画面',
            );
        }
        return $aRet;
    }
}

