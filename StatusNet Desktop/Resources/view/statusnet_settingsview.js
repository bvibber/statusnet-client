StatusNet.SettingsView = function() {
}
StatusNet.SettingsView.prototype.init = function() {
	var db = StatusNet.getDB();
	var accounts = StatusNet.Account.listAll(db);
	var bits = '';
	for (var i = 0; i < accounts.length; i++) {
		var ac = accounts[i];
		bits += '<tr><td>' + ac.username + '</td><td>' + ac.apiroot + '</td></tr>';
	}
	StatusNet.debug('HEY GUYS' + bits);
	$("#accountlist").html(bits);

	$("#button_addaccount").click(function() {

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
}
