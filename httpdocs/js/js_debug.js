$(function () {
    $('body').append(
        '<style>' +
        '<!--' +
        'table#my_console_window {' +
          'width : 100%' +
          'border: solid 1px;' +
        '}' +
        'table#my_console_window th {' +
          'border: solid 1px #eeeeee;' +
          'background-color: #eeffee;' +
          'font-size: 10px;' +
        '}' +
        'table#my_console_window td {' +
          'border: solid 1px #eeeeee;' +
          'background-color: #ffffff;' +
          'font-size: 10px;' +
        '}' +
        'table#my_console_window tr.error td {' +
          'background-color: #ffcccc;' +
        '}' +
        '#my_console_log_cnt {' +
          'position : fixed;' +
          'top: 0;' +
          'right: 0;' +
          'padding: 2px;' +
          'padding-right: 8px;' +
          'color: white;' +
          'background-color: black;' +
        '}' +
        '-->' +
        '</style>' +
        '<div id="my_console_log_cnt"></div>' +
        '<table id="my_console_window"><tr><th colspan=2>console.log() Output</th></tr></table>'
    );

    var _fnConsole = function (dbg_msg, sClass) {
        var disp = dbg_msg;
        try {
            disp = JSON.stringify(dbg_msg, null, true).replace(/\\n/g, '\n').replace(/[\r\n]+/g, '<br />').replace(/,"/g, ', "');
            if (disp == '{}') {
                throw 'muripo';
            }
        } catch (e) {
            disp = dbg_msg;
        }
        var iCnt = $('#my_console_window tr').size();
        $('#my_console_window').append(
            '<tr class="'+sClass+'"><td>' + iCnt + '</td><td>' + disp + '</td></tr>'
        );
        $('#my_console_log_cnt').text(iCnt);
    };

    console.error_bk = console.error;
    console.error = function (dbg_msg) {
        console.error_bk(dbg_msg);
        _fnConsole(dbg_msg, 'error');
    };

    console.log_bk = console.log;
    console.log = function (dbg_msg) {
        console.log_bk(dbg_msg);
        _fnConsole(dbg_msg, 'log');
    };
});

function clear_my_console_log(sLog) {
    $('#my_console_window tr.log').remove();
    $('#my_console_window tr.error').remove();
    if (sLog) {
        console.log(sLog);
    }
}
