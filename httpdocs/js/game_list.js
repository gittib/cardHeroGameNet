$(function() {
    function _changeDispMode (oSelect) {
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

    $(".game_field_info .field_title a").on('click', function(e) {
        e.preventDefault();
    });

    $(".old_field_disp_select").on("change", function() {
        _changeDispMode($(this));
    });
});
