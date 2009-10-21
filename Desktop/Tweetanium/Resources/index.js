$(function() {
  var tc = new TwitterClient("username", "password");
  tc.getAppceleratorTweets();
  
  $("a.external").live("click", function() {
    Titanium.Desktop.openURL($(this).attr("href"));
    return false;
  });
  
  $("#refresh").click(function() {
    tc.getAppceleratorTweets();
    return false;
  });
});