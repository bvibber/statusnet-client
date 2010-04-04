$(function() {

     var db = StatusNet.getDB();

     var ac = StatusNetAccount.getDefault(db);

     var snc = null;

     if (ac === null) {
          ld = new LoginDialog(function(account) {
               ac = account;
               ac.ensure(db);
               snc = new StatusNetClient(ac);
               snc.getFriendsTimeline();
               });

          ld.show();
     } else {
          snc = new StatusNetClient(ac);
          snc.getFriendsTimeline();
     }

     $('a[rel=external]').live('click', function() {
         Titanium.Desktop.openURL($(this).attr('href'));
         return false;
     });

     $("#content").click(function() {
          if (snc != null) {
               snc.refresh();
          }
          return false;
     });



});