<?php

class model_Deck {
    private $_db;

    public function __construct() {
        $this->_db = Zend_Registry::get('db');
    }

    /**
     * @param aArgs['page_no']
     * @param aArgs['max_rare_max']
     * @param aArgs['sum_rare_max']
     *
     * @return aDeck
     */
    public function getDeckList($aArgs)
    {
        $iDecksInPage = 10;  // １ページあたりに表示するデッキの数

        // ログインしてない時用に、絶対にヒットしないダミーIDで初期化しておく
        $userId = -1;
        $nPage = 1;
        if (isset($aArgs['page_no']) && $aArgs['page_no'] != '') {
            $nPage = $aArgs['page_no'];
        }
        $aUserInfo = Common::checkLogin();
        if (isset($aUserInfo)) {
            $userId = $aUserInfo['user_id'];
        }

        $sub = $this->_db->select()
            ->from(
                array('td' => 't_deck'),
                array('deck_id')
            )
            ->where('td.open_flg = 1 or td.user_id = ?', $userId)
            ->order(array(
                'upd_date desc',
                'deck_id desc',
            ))
            ->limitPage($nPage, $iDecksInPage);
        if (isset($aArgs['max_rare_max']) && $aArgs['max_rare_max'] != '') {
            $sub2 = $this->_db->select()
                ->distinct()
                ->from(
                    array('vd' => 'v_deck'),
                    array(
                        'deck_id',
                    )
                )
                ->where('vd.max_rare <= ?', $aArgs['max_rare_max']);
            $sub->where('td.deck_id in(?)', $sub2);
        }
        if (isset($aArgs['sum_rare_max']) && $aArgs['sum_rare_max'] != '') {
            $sub3 = $this->_db->select()
                ->distinct()
                ->from(
                    array('vd' => 'v_deck'),
                    array(
                        'deck_id',
                    )
                )
                ->where('vd.sum_rare <= ?', $aArgs['sum_rare_max']);
            $sub->where('td.deck_id in(?)', $sub3);
        }

        $sel = $this->_db->select()
            ->from(
                array('td' => 't_deck'),
                array(
                    'deck_id',
                    'user_id',
                    'deck_name',
                    'master_card_id',
                )
            )
            ->joinLeft(
                array('tu' => 't_user'),
                'tu.user_id = td.user_id',
                array(
                    'nick_name',
                )
            )
            ->joinLeft(
                array('tdc' => 't_deck_card'),
                'tdc.deck_id = td.deck_id',
                array(
                    'card_id',
                    'num',
                )
            )
            ->joinLeft(
                array('mc_master' => 'm_card'),
                'mc_master.card_id = td.master_card_id',
                array(
                    'master_card_name'          => 'card_name',
                    'master_rare'               => 'rare',
                    'master_image_file_name'    => 'image_file_name',
                )
            )
            ->joinLeft(
                array('mc' => 'm_card'),
                'mc.card_id = tdc.card_id',
                array(
                    'card_name',
                    'category',
                    'rare',
                    'image_file_name',
                )
            )
            ->joinLeft(
                array('mcs' => 'm_category_sort'),
                'mcs.category = mc.category',
                array()
            )
            ->where('tdc.deck_id in ?', $sub)
            ->order(array(
                'td.upd_date desc',
                'td.deck_id desc',
                'mcs.sort_no',
                'tdc.card_id',
            ));
        $stmt = $this->_db->fetchAll($sel);
        $aDeck = array();
        foreach ($stmt as $key => $val) {
            $deckId = $val['deck_id'];
            if (!isset($aDeck[$deckId])) {
                if (!isset($val['nick_name']) || $val['nick_name'] == '') {
                    $val['nick_name'] = 'Guest';
                }
                $aDeck[$deckId] = array(
                    'deck_id'           => $val['deck_id'],
                    'deck_name'         => $val['deck_name'],
                    'rare_sum'          => $val['master_rare'],
                    'rare_max'          => $val['master_rare'],
                    'owner_id'          => $val['user_id'],
                    'owner_nick_name'   => $val['nick_name'],
                    'master_card_name'  => $val['master_card_name'],
                    'master_image'      => $val['master_image_file_name'],
                    'deck_cards_num'    => 0,
                    'front_cards_num'   => 0,
                    'back_cards_num'    => 0,
                    'magic_cards_num'   => 0,
                    'super_cards_num'   => 0,
                    'cards'             => array(),
                );
            }
            if (isset($val['card_id'])) {
                $aDeck[$deckId]['cards'][] = array(
                    'card_id'           => $val['card_id'],
                    'num'               => $val['num'],
                    'card_name'         => $val['card_name'],
                    'rare'              => $val['rare'],
                    'image_file_name'   => $val['image_file_name'],
                );
                if ($aDeck[$deckId]['rare_max'] < $val['rare']) {
                    $aDeck[$deckId]['rare_max'] = $val['rare'];
                }
                $aDeck[$deckId]['rare_sum'] += $val['rare'] * $val['num'];

                $aDeck[$deckId]['deck_cards_num'] += $val['num'];
                switch($val['category']) {
                    case 'monster_front':
                        $aDeck[$deckId]['front_cards_num'] += $val['num'];
                        break;
                    case 'monster_back':
                        $aDeck[$deckId]['back_cards_num'] += $val['num'];
                        break;
                    case 'magic':
                        $aDeck[$deckId]['magic_cards_num'] += $val['num'];
                        break;
                    case 'super_front':
                    case 'super_back':
                        $aDeck[$deckId]['super_cards_num'] += $val['num'];
                        break;
                }
            }
        }

        // APIからjsに渡す際、順序が狂わないように配列の添字を外す
        $aRet = array();
        foreach ($aDeck as $val) {
            $aRet[] = $val;
        }
        return $aRet;
    }

    public function getCardList() {
        $sel = $this->_db->select()
            ->from(
                array('mc' => 'm_card'),
                array(
                    'card_id',
                    'card_name',
                    'category',
                    'rare',
                    'proposer',
                    'image_file_name',
                )
            )
            ->order(array(
                'card_id',
            ));
        return $this->_db->fetchAll($sel);
    }

    public function initDeckCard($deckId) {
        $sel = $this->_db->select()
            ->from(
                array('td' => 't_deck'),
                array(
                    'deck_name',
                    'user_id',
                    'master_card_id',
                )
            )
            ->join(
                array('master' => 'm_card'),
                'master.card_id = td.master_card_id',
                array(
                    'master_card_name'          => 'card_name',
                    'master_image_file_name'    => 'image_file_name',
                    'master_rare'               => 'rare',
                )
            )
            ->join(
                array('tdc' => 't_deck_card'),
                'tdc.deck_id = td.deck_id',
                array(
                    'card_id',
                    'num',
                )
            )
            ->join(
                array('mc' => 'm_card'),
                'mc.card_id = tdc.card_id',
                array(
                    'card_name',
                    'category',
                    'rare',
                    'image_file_name',
                )
            )
            ->where('td.deck_id = ?', $deckId)
            ->order(array(
                'card_id',
            ));
        $stmt = $this->_db->fetchAll($sel);
        $aRet = array();
        foreach ($stmt as $val) {
            $aRet['deck_name']              = $val['deck_name'];
            $aRet['master_card_id']         = $val['master_card_id'];
            $aRet['master_image_file_name'] = $val['master_image_file_name'];
            $aRet['rare']                   = $val['master_rare'];
            if (!isset($aRet['cards'])) {
                $aRet['cards'] = array();
            }
            for ($i = 0 ; $i < $val['num'] ; $i++) {
                $aCardData = array(
                    'card_id'           => $val['card_id'],
                    'card_name'         => $val['card_name'],
                    'image_file_name'   => $val['image_file_name'],
                    'rare'              => $val['rare'],
                );
                switch ($val['category']) {
                    case 'monster_front':
                        $aCardData['cate'] = 'front';
                        break;
                    case 'monster_back':
                        $aCardData['cate'] = 'back';
                        break;
                    case 'magic':
                        $aCardData['cate'] = 'magic';
                        break;
                    case 'super_front':
                    case 'super_back':
                        $aCardData['cate'] = 'super';
                        break;
                    default:
                        break;
                }
                $aRet['cards'][] = $aCardData;
            }
        }
        return $aRet;
    }

    public function registDeck($aDeckInfo, $aDeckCardID) {
        try {
            $this->_db->beginTransaction();

            $deckId = '';
            try {
                if (!isset($aDeckInfo['user_id']) || $aDeckInfo['user_id'] == '') {
                    throw new Exception('new_regist');
                }
                if (!isset($aDeckInfo['deck_id']) || $aDeckInfo['deck_id'] == '') {
                    throw new Exception('new_regist');
                }
                $deckId = $aDeckInfo['deck_id'];
                $sel = $this->_db->select()
                    ->from(
                        array('td' => 't_deck'),
                        array(
                            'cnt'   => new Zend_Db_Expr('count(*)'),
                        )
                    )
                    ->where('deck_id = ?', $deckId)
                    ->where('user_id = ?', $aDeckInfo['user_id']);
                $cnt = $this->_db->fetchOne($sel);
                if ($cnt <= 0) {
                    throw new Exception('new_regist');
                }
                $set = array(
                    'user_id'           => $aDeckInfo['user_id'],
                    'deck_name'         => $aDeckInfo['deck_name'],
                    'master_card_id'    => $aDeckInfo['master_card_id'],
                    'upd_date'          => new Zend_Db_Expr('now()'),
                );
                $where = array(
                    $this->_db->quoteInto('deck_id = ?', $deckId),
                );
                $this->_db->update('t_deck', $set, $where);
                $this->_db->delete('t_deck_card', $where);
            } catch (Exception $e) {
                if ($e->getMessage() != 'new_regist') {
                    throw $e;
                }
                $set = array(
                    'user_id'           => $aDeckInfo['user_id'],
                    'deck_name'         => $aDeckInfo['deck_name'],
                    'master_card_id'    => $aDeckInfo['master_card_id'],
                );
                $this->_db->insert('t_deck', $set);
                $sel = 'select max(deck_id) from t_deck';
                $deckId = $this->_db->fetchOne($sel);
            }

            $aDeck = array();
            foreach ($aDeckCardID as $cardId) {
                if (!isset($aDeck[$cardId])) {
                    $aDeck[$cardId] = 1;
                } else {
                    $aDeck[$cardId]++;
                }
            }
            foreach ($aDeck as $cardId => $num) {
                $set = array(
                    'deck_id'   => $deckId,
                    'card_id'   => $cardId,
                    'num'       => $num,
                );
                $this->_db->insert('t_deck_card', $set);
            }

            $this->_db->commit();
        } catch (Exception $e) {
            $this->_db->rollBack();
            throw $e;
        }
    }
}
