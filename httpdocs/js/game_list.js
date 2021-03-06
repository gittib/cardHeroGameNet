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
            localStorage.setItem('old_field_disp_mode', sSelect);
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
            sSelect = localStorage.old_field_disp_mode;
        } catch (e) {
            sSelect = 'normal';
            localStorage.setItem('old_field_disp_mode', sSelect);
        }
        sSelect = sSelect || 'normal';

        $(".old_field_disp_select").each(function() {
            $(this).val(sSelect);
        });
        _changeDispMode($('.old_field_disp_select:first'));
    })();

    $(".old_field_disp_select").on("change", function() {
        _changeDispMode($(this));
    });
});
