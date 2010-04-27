StatusNet.SettingsView = function() {
	var db = StatusNet.getDB();
	this.accounts = StatusNet.Account.listAll(db);
}
StatusNet.SettingsView.prototype.init = function() {
	this.showAccounts();

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

StatusNet.SettingsView.prototype.showAccounts = function() {
	var list = $('#accountlist tbody')[0];
	for (var i = 0; i < this.accounts.length; i++) {
		StatusNet.debug('hi');

		var acct = this.accounts[i];
		var tr = document.createElement('tr');

		StatusNet.debug('x1');
		var td_icon = document.createElement('td');
		var img_icon = document.createElement('img');
		img_icon.src = "images/icon_processing.gif";
		td_icon.appendChild(img_icon);
		tr.appendChild(td_icon);

		StatusNet.debug('x2');
		var td_name = document.createElement('td');
		$(td_name).addClass('name').text(acct.username);
		tr.appendChild(td_name);

		StatusNet.debug('x3');
		var td_site = document.createElement('td');
		$(td_site).addClass('site').text(acct.apiroot);
		tr.appendChild(td_site);
		
		StatusNet.debug('x4');
		list.appendChild(tr);
		
		acct.fetchUrl('account/verify_credentials.xml', function(status, xml) {
			var avatar = $("user profile_image_url", xml).text();
			StatusNet.debug(avatar);
			img_icon.src = avatar;
		}, function(status) {
			StatusNet.debug("We failed to load account info");
		});
		
		StatusNet.debug('bye');
	}
}
