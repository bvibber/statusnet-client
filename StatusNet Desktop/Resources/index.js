$(function() {

     var db = StatusNet.getDB();

     var ac = StatusNet.Account.getDefault(db);

     var snc = null;

     if (ac === null) {
          ld = new StatusNet.LoginDialog(function(account) {
               ac = account;
               ac.ensure(db);
               snc = new StatusNet.Client(ac);
               });

          ld.show();
     } else {
          snc = new StatusNet.Client(ac);
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

     // @todo move to a general init
     $('#update_button').bind('click', function() { snc.postNotice(); });



});