<?php
    $fp = @fopen($argv[1], 'r');
    $sOutput = '';
    while ($s = fgets($fp)) {
        if (strpos($s, 'console') !== FALSE) {
            continue;
        }
        // 一行コメントを削除
        $s = preg_replace(';//.*$;', '', $s);

        // ;;;以降の処理はデバッグ用とみなし、削除する
        $s = preg_replace('/;;;.*$/', '', $s);

        // 改行コードをスペースに置換
        $sOutput .= preg_replace(';[\r\n]+;', ' ', $s);
    }

    // コメントブロックを削除
    $sOutput = preg_replace(';/\*.*?\*/;', '', $sOutput);

    // 2文字以上のスペースは1文字に短縮
    $sOutput = preg_replace('/  +/', ' ', $sOutput);

    // 比較演算子の前後のスペースを除去
    $sOutput = preg_replace('/ ?\|\| ?/', '||', $sOutput);
    $sOutput = preg_replace('/ ?!= ?/', '!=', $sOutput);

    // オブジェクトの末尾の要素に付いているカンマを削除
    $sOutput = str_replace(',}', '}', $sOutput);

    // オブジェクトや配列の前後のスペースを除去(危険！)
    $sOutput = preg_replace('/ ?([-+;:,{}=)(]) ?/', '\\1', $sOutput);

    // game_field.merge.js専用処理
    if (preg_replace(';^.*/;', '', $argv[1]) == 'game_field.merge.js') {
        $aReplace = array(
            'game_field_utility'    => 'gfu',
            'game_field_reactions'  => 'gfr',
            'g_field_data'          => 'gfd',
            'g_master_data'         => 'gmd',
            'rand_gen'              => 'rgn',
            'iGameCardId'           => 'l',
        );
        foreach ($aReplace as $key => $val) {
            $sOutput = str_replace($key, $val, $sOutput);
        }

        preg_match_all('/function ([a-zA-Z_]{3,})/', $sOutput, $aMatch, PREG_SET_ORDER);
        $i = 1;
        foreach ($aMatch as $val) {
            $sFunctionName = $val[1];
            if (strpos($sOutput, "var {$sFunctionName}")) {
                // 変数名に同じ名前を使ってたら、その関数名は置換しない
                continue;
            }
            $sOutput = str_replace($sFunctionName, "f{$i}", $sOutput);
            $i++;
        }
    }

    echo $sOutput;
