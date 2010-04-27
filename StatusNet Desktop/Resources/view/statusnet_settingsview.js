StatusNet.SettingsView = function() {
	var db = StatusNet.getDB();
	this.accounts = StatusNet.Account.listAll(db);
	this.workAcct = null;
}
StatusNet.SettingsView.prototype.init = function() {
	$("#new-account").hide();

	this.showAccounts();

	var that = this;
	$("#add-account").click(function() {
		that.resetNewAccount();
		$("#new-account").show();
	});
	$("#new-username").change(function() {
		that.updateNewAccount();
	});
	$("#new-password").change(function() {
		that.updateNewAccount();
	});
	$("#new-site").change(function() {
		that.updateNewAccount();
	});
	$("#new-save").click(function() {
		that.saveNewAccount();
	});
	$("#new-cancel").click(function() {
		$("#new-account").hide();
		that.resetNewAccount();
	});
}

/**
 * @fixme really should separate this a bit more to model/view?
 */
StatusNet.SettingsView.prototype.showAccounts = function() {
	for (var i = 0; i < this.accounts.length; i++) {
		this.showAccountRow(this.accounts[i]);
	}
}

/**
 * Add an account row to the accounts list.
 * Avatar will start loading asynchronously, whee!
 * 
 * @param StatusNet.Account acct
 */
StatusNet.SettingsView.prototype.showAccountRow = function(acct) {
	var tr = document.createElement('tr');

	var td_icon = document.createElement('td');
	var img_icon = document.createElement('img');
	img_icon.src = "images/icon_processing.gif";
	td_icon.appendChild(img_icon);
	tr.appendChild(td_icon);

	var td_name = document.createElement('td');
	$(td_name).addClass('name').text(acct.username);
	tr.appendChild(td_name);

	var td_site = document.createElement('td');
	$(td_site).addClass('site').text(acct.apiroot);
	tr.appendChild(td_site);
	
	var list = $('#accountlist tbody')[0];
	list.appendChild(tr);
	
	$(tr).click(function() {
		acct.setDefault(StatusNet.getDB());
		var me = Titanium.UI.getCurrentWindow();
		me.getParent().setURL("app:///index.html");
		me.close();
	});
	
	acct.fetchUrl('account/verify_credentials.xml', function(status, xml) {
		var avatar = $("user profile_image_url", xml).text();
		StatusNet.debug(avatar);
		img_icon.src = avatar;
	}, function(status) {
		StatusNet.debug("We failed to load account info");
	});
}

/**
 * Validate input and see if we can make it work yet
 */
StatusNet.SettingsView.prototype.updateNewAccount = function() {
	this.workAcct = this.newAccount();
	if (this.workAcct == null) {
		$("#new-save").attr("disabled", "disabled");
		$("#new-avatar").attr("src", "images/default-avatar-stream.png");
	} else {
		$("#new-save").attr("disabled", "disabled");
		$("#new-avatar").attr("src", "images/icon_processing.gif");

		this.workAcct.fetchUrl('account/verify_credentials.xml', function(status, xml) {
			var avatar = $("user profile_image_url", xml).text();
			StatusNet.debug(avatar);
			$("#new-avatar").attr("src", avatar);
			$("#new-save").removeAttr("disabled");
		}, function(status) {
			StatusNet.debug("We failed to load account info");
			$("#new-avatar").attr("src", "images/default-avatar-stream.png");
		});
	}
}

/**
 * Build an account object from the info in our form, if possible.
 * We won't yet know for sure whether it's valid, however...
 * 
 * @return StatusNet.Account or null
 */
StatusNet.SettingsView.prototype.newAccount = function() {
	var username = $("#new-username").val();
	var password = $("#new-password").val();
	var site = $("#new-site").val();

	if (username == '' || password == '' || site == '') {
		return null;
	}

	if (site.substr(0, 7) == 'http://' || site.substr(0, 8) == 'https://') {
		var url = site;
		if (url.substr(url.length - 1, 1) != '/') {
			url += '/';
		}
	} else {
		var url = 'http://' + site + '/api/';
	}
	return new StatusNet.Account(username, password, url);
}

StatusNet.SettingsView.prototype.saveNewAccount = function() {
	this.workAcct.ensure(StatusNet.getDB());
	this.showAccountRow(this.workAcct);

	$("#new-account").hide();
	this.resetNewAccount();
}

StatusNet.SettingsView.prototype.resetNewAccount = function() {
	this.workAcct = null;
	$("#new-username").val("");
	$("#new-password").val("");
	$("#new-site").val("");
	$("#new-avatar").attr("src", "images/default-avatar-stream.png");
	$("#new-save").attr("disabled", "disabled");
}
