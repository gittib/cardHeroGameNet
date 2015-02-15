<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="robots" content="NOINDEX,NOFOLLOW">
    <title>CHSMP アナリティクス除外</title>
<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

/*----------------------------------------------------------
【使い方】
  1.「UA-*******-*」を自分のAnalyticsのトラッキングIDに書き換えてからご使用ください。
  2.「dimension1」を自分のカスタムディメンション番号に書き換えます。

  以下を書き換え↓
----------------------------------------------------------*/
  ga('create', 'UA-53206929-1');
  ga('set', 'dimension1', 'Yes');
/*----------------------------------------------------------
  以上を書き換え↑
----------------------------------------------------------*/
  ga('send', 'pageview');
</script>
<style>
body {
    font-size: 13px;
    line-height: 20px;
}
.txt-warn {
    color: #c00;
}
</style>
</head>
<body>
  <div id="ready">
    <p>
      GoogleAnalyticsからの除外設定が完了しました。<br />
      <span class="txt-warn">※2年間有効ですが、月1回程度の定期的な訪問をお願いいたします。</span>
    </p>
    <p>
      <a href="/">TOPへ</a>
    </p>
  </div>
</body>
</html>
