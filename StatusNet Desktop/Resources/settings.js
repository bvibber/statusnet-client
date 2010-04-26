$LAB
	.script("statusnet.js").wait()
   	.script("view/statusnet_login_dialog.js")
   	.script("model/statusnet_account.js")
	.script("view/statusnet_sidebar.js")
 	.script("statusnet_client.js")
	.script("view/statusnet_timelineview.js")
	.script("model/statusnet_timeline.js")
   	.wait(function(){
	
    var db = StatusNet.getDB();
	var accounts = StatusNet.Account.listAll(db);
	var bits = '';
	for (var i = 0; i < accounts.length; i++) {
		var ac = accounts[i];
		bits += '<tr><td>' + ac.username + '</td><td>' + ac.apiroot + '</td></tr>';
	}
	$("#accountlist").html(bits);

	$("#button_addaccount").click(

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
});
