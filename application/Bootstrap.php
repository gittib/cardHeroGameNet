<?php

class Bootstrap extends Zend_Application_Bootstrap_Bootstrap
{
    protected function _initDB()
    {
        $conf = Zend_Registry::get('config');
        $db = Zend_Db::factory( 'PDO_PGSQL', array(
                    'host'      => $conf->database->host,
                    'username'  => $conf->database->username,
                    'password'  => $conf->database->password,
                    'dbname'    => $conf->database->dbname,
                    ));
        if (APPLICATION_ENV != 'production') {
            $db->getProfiler()->setEnabled(true);
        }
        Zend_Registry::set('db', $db);
    }

    protected function _initSession()
    {
        Zend_Session::start();
        $oSession = new Zend_Session_Namespace('CHSMT');
        Zend_Registry::set('session', $oSession);
    }

    protected function _initLayout()
    {
        $l = Zend_Layout::startMvc(array(
            'layoutPath'   => APPLICATION_PATH . '/layout/views'
            ,'layout'      => 'master'
            ,'contentKey'  => 'content'
        ));
        Zend_Registry::set('layout', $l);
    }

    protected function _initRoute()
    {
        $this->bootstrap('frontController');
        $front = Zend_Controller_Front::getInstance();
        $router = $front->getRouter();

        // デッキ編集
        $route = new Zend_Controller_Router_Route_Regex(
            'deck/edit(/(\d+))?',
            array(
                'controller'    =>  'deck',
                'action'        =>  'edit',
                'deck_id'       =>  1,
            ),
            array(
                2   => 'deck_id',
            )
        );
        $router->addRoute('deck_edit', $route);

        // 返信の無いゲームフィールド一覧
        $route = new Zend_Controller_Router_Route_Regex(
            'game/(last|my-turn)(/(\d+))?',
            array(
                'controller'    =>  'game',
                'action'        =>  'last',
                'page_no'       =>  1,
            ),
            array(
                1   => 'action',
                3   => 'page_no',
            )
        );
        $router->addRoute('game_last', $route);

        // ゲームフィールド一覧
        $route = new Zend_Controller_Router_Route_Regex(
            'game(/(\d+))?',
            array(
                'controller'    =>  'game',
                'action'        =>  'index',
                'page_no'       =>  1,
            ),
            array(
                2   => 'page_no',
            )
        );
        $router->addRoute('game_list', $route);

        // ゲーム受領
        $route = new Zend_Controller_Router_Route_Regex(
            'game/receive/(\d+)(/(\d+))?',
            array(
                'controller'    =>  'game',
                'action'        =>  'receive',
                1               =>  1,
                2               =>  1,
                3               =>  1,
            ),
            array(
                1   => 'game_field_id',
                3   => 'page_no',
            )
        );
        $router->addRoute('game_receive', $route);

        // ゲーム受領(自分のデッキを使用)
        $route = new Zend_Controller_Router_Route_Regex(
            'game/receive/deck/mine/(\d+)(/(\d+))?',
            array(
                'controller'    =>  'game',
                'action'        =>  'receive',
                'deck'          => 'mine',
                1               =>  1,
                2               =>  1,
                3               =>  1,
            ),
            array(
                1   => 'game_field_id',
                3   => 'page_no',
            )
        );
        $router->addRoute('game_receive_mine', $route);

        // ゲームプレイ
        $route = new Zend_Controller_Router_Route_Regex(
            'game/(field|kifu|replay)/(\d+)',
            array(
                'controller'    =>  'game',
                'action'        =>  'field',
                2               =>  1,
            ),
            array(
                1   => 'action',
                2   => 'game_field_id',
            )
        );
        $router->addRoute('game_play', $route);

        // カード詳細
        $route = new Zend_Controller_Router_Route_Regex(
            'card/detail/(\d+)',
            array(
                'controller'    =>  'card',
                'action'        =>  'detail',
                1               =>  1,
            ),
            array(
                1   => 'card_id',
            )
        );
        $router->addRoute('card_detail', $route);

        // 指定したカードがフィニッシュしたフィールド一覧
        $route = new Zend_Controller_Router_Route_Regex(
            'ranking/finisher/fields/(\d+)(/(\d+))?',
            array(
                'module'        => 'ranking',
                'controller'    => 'finisher',
                'action'        => 'fields',
                'card_id'       => 1,
                'page_no'       => 1,
            ),
            array(
                1   => 'card_id',
                3   => 'page_no',
            )
        );
        $router->addRoute('finished_field_list', $route);

        // 指定したカードの採用状況詳細
        $route = new Zend_Controller_Router_Route_Regex(
            'ranking/deck/detail/(\d+)',
            array(
                'module'        => 'ranking',
                'controller'    => 'deck',
                'action'        => 'detail',
                'card_id'       => 1,
            ),
            array(
                1   => 'card_id',
            )
        );
        $router->addRoute('deck_ranking_detail', $route);

        // 画像が無かった時のリダイレクト用
        $route = new Zend_Controller_Router_Route_Regex(
            '.*/?([^/]+)\.(png|jpg|gif)',
            array(
                'module'        =>  'api',
                'controller'    =>  'index',
                'action'        =>  'no-image',
                1               =>  'dot',
                2               =>  'png',
            ),
            array(
                1   => 'file_name',
                2   => 'ext',
            )
        );
        $router->addRoute('no_image', $route);

        // グレースケール画像が無かった時用
        // CSSでやるようにしたので一旦コメントアウト
        $route = new Zend_Controller_Router_Route_Regex(
            '(.*)/gray_([^/]+)\.(png|jpg|gif)',
            array(
                'module'        =>  'api',
                'controller'    =>  'index',
                'action'        =>  'gray-image',
                1               =>  '/images',
                2               =>  'dot',
                3               =>  'png',
            ),
            array(
                1   => 'file_path',
                2   => 'file_name',
                3   => 'ext',
            )
        );
        //$router->addRoute('gray_scale', $route);

        // マスタデータをごにょってjsにして返す
        $route = new Zend_Controller_Router_Route_Regex(
            'js/([^/]+)\.js',
            array(
                'module'        =>  'api',
                'controller'    =>  'index',
                'action'        =>  'build-javascript',
            ),
            array(
                1   => 'script_name',
            )
        );
        $router->addRoute('build_js', $route);

        // サイトマップXML
        $route = new Zend_Controller_Router_Route_Regex(
            'sitemap.xml',
            array(
                'module'        =>  'api',
                'controller'    =>  'index',
                'action'        =>  'sitemap',
            ),
            array()
        );
        $router->addRoute('sitemap', $route);

        // robots.txt
        $route = new Zend_Controller_Router_Route_Regex(
            'robots.txt',
            array(
                'module'        =>  'api',
                'controller'    =>  'index',
                'action'        =>  'robots',
            ),
            array()
        );
        $router->addRoute('robots', $route);

        // apiモジュールのindexコントローラー
        $route = new Zend_Controller_Router_Route_Regex(
            'api/([^/]+)/?',
            array(
                'module'        =>  'api',
                'controller'    =>  'index',
                'action'        =>  'index',
            ),
            array(
                1   => 'action',
            )
        );
        $router->addRoute('api_index', $route);
    }
}

