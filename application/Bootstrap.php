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

    protected function _initLayout()
    {
        Zend_Layout::startMvc(array(
            'layoutPath'   => APPLICATION_PATH . '/layout/views'
            ,'layout'      => 'master'
            ,'contentKey'  => 'content'
        ));
    }

    protected function _initRoute()
    {
        $this->bootstrap('frontController');
        $front = Zend_Controller_Front::getInstance();
        $router = $front->getRouter();

        // デッキ編集
        $route = new Zend_Controller_Router_Route_Regex(
            'deck/edit(/(\d+))?/?',
            array(
                'controller'    =>  'deck',
                'action'        =>  'edit',
                2               =>  1,
            ),
            array(
                2   => 'deck_id',
            )
        );
        $router->addRoute('deck_edit', $route);

        // ゲームフィールド一覧
        $route = new Zend_Controller_Router_Route_Regex(
            'game(/(\d+))?/?',
            array(
                'controller'    =>  'game',
                'action'        =>  'index',
                2               =>  1,
            ),
            array(
                2   => 'page_no',
            )
        );
        $router->addRoute('game_list', $route);

        // ゲーム受領
        $route = new Zend_Controller_Router_Route_Regex(
            'game/receive/(\d+)(/(\d+))?/?',
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

        // ゲームプレイ
        $route = new Zend_Controller_Router_Route_Regex(
            'game/field/(\d+)/?',
            array(
                'controller'    =>  'game',
                'action'        =>  'field',
                1               =>  1,
            ),
            array(
                1   => 'game_field_id',
            )
        );
        $router->addRoute('game_play', $route);

        // カード詳細
        $route = new Zend_Controller_Router_Route_Regex(
            'card/detail/(\d+)/?',
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

        // 画像が無かった時のリダイレクト用
        $route = new Zend_Controller_Router_Route_Regex(
            '.*/?([^/]+)\.(png|jpg|gif)',
            array(
                'controller'    =>  'api',
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
        $route = new Zend_Controller_Router_Route_Regex(
            '(.*)/gray_([^/]+)\.(png|jpg|gif)',
            array(
                'controller'    =>  'api',
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
        $router->addRoute('gray_scale', $route);

        // マスタデータをごにょってjsにして返す
        $route = new Zend_Controller_Router_Route_Regex(
            'js/([^/]+)\.js',
            array(
                'controller'    =>  'api',
                'action'        =>  'build-javascript',
                1               =>  1,
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
                'controller'    =>  'api',
                'action'        =>  'sitemap',
            ),
            array()
        );
        $router->addRoute('sitemap', $route);
    }
}

