(function() {
    try {
        if (sessionStorage.oMasterData) {
            var g_master_data = JSON.parse(sessionStorage.oMasterData);
            if (!g_master_data.m_card) {
                throw new Error('g_master_data is invalid.');
            }
        } else {
            throw new Error('g_master_data is not yet loaded.');
        }
    } catch (e) {
        sessionStorage.oMasterData = null;
        $.getJSON('/api/get-master-data/card/', function(json) {
            sessionStorage.oMasterData = JSON.stringify(json);
        });
    }
})();

$(function() {

    function _changeDispMode (oSelect) {
        if (oSelect.size() <= 0) {
            return;
        }

        var sSelect = oSelect.val();
        $(".old_field_disp_select").each(function() {
            $(this).val(sSelect);
        });
        switch (sSelect) {
            case "normal":
                $('.res').removeAttr('disp_mode');
                break;
            case "small":
                $('.res').attr('disp_mode', 'small');
                break;
            case "hide":
                $('.res').attr('disp_mode', 'hide');
                break;
        }
        try {
            sessionStorage.setItem('old_field_disp_mode', sSelect);
        } catch (e) {}
    }

    if ($('div.pict.standby img').size()) {
        setInterval(function() {
            $('div.pict.standby img').toggle();
        }, 1000);
    }

    (function _initSelect() {
        var sSelect = 'normal';
        try {
            sSelect = sessionStorage.old_field_disp_mode;
        } catch (e) {
            sSelect = 'normal';
            sessionStorage.setItem('old_field_disp_mode', sSelect);
        }
        sSelect = sSelect || 'normal';

        $(".old_field_disp_select").each(function() {
            $(this).val(sSelect);
        });
        _changeDispMode($('.old_field_disp_select:first'));
    })();

    $(".game_field_info div.game_play.button").on("click", function() {
        if ($(this).find(".game_row").hasClass('mine')) {
            if (!confirm('あなたが投稿したフィールド図です。\n対戦相手の手札などネタバレになりますが、よろしいですか？')) {
                return;
            }
        }
        document.location = $(this).closest('div.game_field_info').find('div.field_title').find('a').attr('href');
    });

    $(".game_field_info div.view_log.button").on("click", function() {
        document.location = '/game/kifu/' + $(this).attr('game_field_id') + '/';
    });

    $(".old_field_disp_select").on("change", function() {
        _changeDispMode($(this));
    });
});
