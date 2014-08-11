<!DOCTYPE html>
<html>
<head>
<meta charset="utf8">
<script src="/js/jquery-2.0.2.min.js"></script>
<script>
$(function() {
    var df = $.Deferred();
    var output = $("#output");
    df.then(
        function(arg) {
            output.append("成功側のコールバックが呼ばれました。もらった引数は [" + arg + "] です。");
        },
        function(arg) {
            output.append("失敗側のコールバックが呼ばれました。もらった引数は [" + arg + "] です。");
        }
    ).pipe(function(arg) {
        var sUrl = '/api/card-data/';
        var df = $.Deferred();
        if (false) {
            $.getJSON(sUrl, null, function() {
                output.append('getJSONおわた ');
                df.resolve();
            });
        } else {
            output.append(' getJSONいらね ');
            df.resolve('jsonいらん方向で');
        }
        return df.promise();
    }).always(function(arg) {
        output.append("どっちでもコールされるはずです。");
        output.append(arg + 'end');
    });
    $("#btnResolve").click(function() {
        df.resolve("成功したよ");
    });
    $("#btnReject").click(function() {
        df.reject("失敗したよ");
    });
});
</script>
<style type="text/css">
* {
    background-color : #000;
    color : #fff;
}
</style>
</head>
<body>
<p>
<button type="button" id="btnResolve">Resolveを呼び出します</button>
<button type="button" id="btnReject">Rejectを呼び出します</button>
</p>
<p id="output"></p>
</body>
</html>
