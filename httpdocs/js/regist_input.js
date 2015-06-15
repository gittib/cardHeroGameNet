$(function() {
    $(".submit>input").click(function() {
        var form1 = $("form[name=regist_form]");
        var re = /[^a-zA-Z0-9]/;
        var sError = "";

        var inStr = $("[name=login_id]").val();
        if (inStr.length < 4) {
            sError += "ログインIDは4文字以上にして下さい。<br />\n";
        }
        if (inStr.match(re)) {
            sError += "ログインIDには半角英数字しか使用できません。<br />\n";
        }
        inStr = $("[name=password]").val();
        if (inStr.length < 4) {
            sError += "パスワードは4文字以上にして下さい。<br />\n";
        }
        if (inStr.match(re)) {
            sError += "パスワードには半角英数字しか使用できません。<br />\n";
        }
        inStr = $("[name=nick_name]").val();
        if (inStr.length < 1) {
            sError += "ユーザー名は1文字以上にして下さい。<br />\n";
        }
        $("#message").html(sError);
        if (sError.length === 0) {
            form1.submit();
        }
    })
});
