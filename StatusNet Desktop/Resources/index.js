$(function() {
  var tc = new StatusNetClient("username", "password");
  tc.getFriendsTimeline();

  $("a.external").live("click", function() {
    Titanium.Desktop.openURL($(this).attr("href"));
    return false;
  });

  $("#refresh").click(function() {
    tc.refresh();
    return false;
  });
});