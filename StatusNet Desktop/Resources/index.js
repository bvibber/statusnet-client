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


});