StatusNet.SettingsView = function(client) {
    this.client = client;

    var db = StatusNet.getDB();
    this.accounts = StatusNet.Account.listAll(db);
    this.workAcct = null;
    this.updateTimeout = null;
    this.lastUsername = '';
    this.lastPassword = '';
    this.lastSite = '';
}

StatusNet.SettingsView.prototype.init = function(client) {
    StatusNet.debug('SettingsView.init');
    this.client = client;
    var view = this;

    // Set up our table view...
    this.table = Titanium.UI.createTableView({
        editable: true
    });
    this.table.addEventListener('click', function(event) {
        // Selected an account
        var acct = event.rowData.acct;
        StatusNet.debug('Attempting to select account: ' + acct.username + '@' + acct.getHost());
    });
    this.table.addEventListener('delete', function(event) {
        // deleted a row
        var acct = event.rowData.acct;
        StatusNet.debug('Attempting to delete account: ' + acct.username + '@' + acct.getHost());
    });
    this.window.add(this.table);

    // Create-account button
    var create = Titanium.UI.createButton({
        title: '+'
    });
    create.addEventListener('click', function() {
        view.showAddAccount();
    });
    this.window.setRightNavButton(create);

    // Edit/cancel buttons for the table view...
    var edit = Titanium.UI.createButton({
        title: 'Edit'
    });
    var cancel = Titanium.UI.createButton({
        title: 'Cancel',
        style: Titanium.UI.iPhone.SystemButtonStyle.DONE
    });
    edit.addEventListener('click', function() {
        view.window.setLeftNavButton(cancel);
        view.table.editing = true;
    });
    cancel.addEventListener('click', function() {
        view.window.setLeftNavButton(edit);
        view.table.editing = false;
    });
    this.window.setLeftNavButton(edit);

    // Now let's fill out the table!
    this.showAccounts();
}

/**
 * Open the add-new-account modal dialog
 */
StatusNet.SettingsView.prototype.showAddAccount = function() {
    var view = this;
    var window = Titanium.UI.createWindow({
        title: "Add Account",
        backgroundColor: "#bbbfcc",
        layout: 'vertical'
    });

    var cancel = Titanium.UI.createButton({
        title: "Cancel"
    });
    cancel.addEventListener('click', function() {
        window.close();
        this.fields = null;
    });
    window.setLeftNavButton(cancel);

    var save = Titanium.UI.createButton({
        title: "Save"
    });
    save.addEventListener('click', function() {
        view.updateNewAccount();
        view.saveNewAccount();
        window.close();
        this.fields = null;
    });
    window.setRightNavButton(save);

    this.fields = {};
    var fields = {site: {label: "Site", props: {
                    hintText: "identi.ca",
                    returnKeyType:Titanium.UI.RETURNKEY_NEXT,
                    keyboardType: Titanium.UI.KEYBOARD_URL,
                    autocorrect: false
                  }},
                  username: {label: "Nickname", props: {
                    hintText: "mycoolname",
                    returnKeyType:Titanium.UI.RETURNKEY_NEXT,
                    autocorrect: false
                  }},
                  password: {label: "Password", props: {
                    hintText: "Required",
                    passwordMask:true,
                    returnKeyType:Titanium.UI.RETURNKEY_DONE
                  }}};
    for (var i in fields) {
        var label = Titanium.UI.createLabel({
            text: fields[i].label,
            left: 8,
            right: 8,
            height: 30
        });
        var props = {
            left: 8,
            right: 8,
            height: 30,
            borderStyle: Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
        };
        for (var j in fields[i].props) {
            props[j] = fields[i].props[j];
        }
        var text = Titanium.UI.createTextField(props);
        window.add(label);
        window.add(text);

        this.fields[i] = text;
    }
    this.fields.site.addEventListener('return', function() {
        view.fields.username.focus();
    });
    this.fields.username.addEventListener('return', function() {
        view.fields.password.focus();
    });
    this.fields.password.addEventListener('return', function() {
        // @fixme trigger save if we're ready
    });

    this.fields.status = Titanium.UI.createLabel({
        text: "",
        left: 8,
        right: 8,
        height: 30
    });
    window.add(this.fields.status);

    window.open({
        modal: true
    });
}

/**
 * @fixme really should separate this a bit more to model/view?
 */
StatusNet.SettingsView.prototype.showAccounts = function() {
    StatusNet.debug('SettingsView.showAccounts');
    if (this.accounts.length == 0) {
        this.showAddAccount();
    } else {
        for (var i = 0; i < this.accounts.length; i++) {
            this.showAccountRow(this.accounts[i]);
        }
    }
}

/**
 * Add an account row to the accounts list.
 * Avatar will start loading asynchronously, whee!
 *
 * @param StatusNet.Account acct
 */
StatusNet.SettingsView.prototype.showAccountRow = function(acct) {
    // todo: avatar
    // todo: better formatting
    // todo: secure state
    var title = acct.username + '@' + acct.getHost();
    StatusNet.debug('adding row: ' + title);
    var row = {title: title,
               acct: acct};
    this.table.appendRow(row);
}

/**
 * Start a timeout to try updating the account if the user stops
 * typing after a couple seconds.
 */
StatusNet.SettingsView.prototype.startUpdateTimeout = function() {
    // Push back the timeout if we're still typing...
    /*
    this.cancelUpdateTimeout();

    var that = this;
    this.updateTimeout = window.setTimeout(function() { that.updateNewAccount() }, 2000);
    */
}

/**
 * Cancel the account update timeout if it's been started.
 */
StatusNet.SettingsView.prototype.cancelUpdateTimeout = function() {
    /*
    if (this.updateTimeout != null) {
        window.clearTimeout(this.updateTimeout);
        this.updateTimeout = null;
    }
    */
}

/**
 * Validate input and see if we can make it work yet
 */
StatusNet.SettingsView.prototype.updateNewAccount = function() {
    var that = this;
    this.cancelUpdateTimeout();
    this.discoverNewAccount(function(acct) {
        if (acct.equals(that.workAcct)) {
            // No change.
            StatusNet.debug("No change!");
            this.fields.status.text = "No change.";
        } else {
            this.fields.status.text = "Testing login...";

            StatusNet.debug("New acct");
            that.workAcct = acct;
            //$("#new-save").attr("disabled", "disabled");
            //$("#new-avatar").attr("src", "images/icon_processing.gif");
    
            that.workAcct.fetchUrl('account/verify_credentials.xml', function(status, xml) {
                this.fields.status.text = "Login confirmed.";
                that.xml = xml;
                that.workAcct.avatar = $("user profile_image_url", xml).text();
                StatusNet.debug(that.workAcct.avatar);
                //$("#new-avatar").attr("src", that.workAcct.avatar);
                //$("#new-save").removeAttr("disabled");
                
                // get site specific configuration info
                that.workAcct.fetchUrl('statusnet/config.xml', function(status, xml) {
                    StatusNet.debug("Loaded statusnet/config.xml");
                    that.workAcct.textLimit = $(xml).find('site > textlimit:first').text();
                    that.workAcct.siteLogo = $(xml).find('site > logo:first').text();
                }, function(status) {
                    StatusNet.debug("Couldn't load statusnet/config.xml for site."); 
                });

            }, function(status) {
                this.fields.status.text = "Bad nickname or password.";
                StatusNet.debug("We failed to load account info");
                //$("#new-avatar").attr("src", "images/default-avatar-stream.png");
            });
        }
    }, function() {
        this.fields.status.text = "Could not verify site.";
        StatusNet.debug("Bogus acct");
        that.workAcct = null;
        //$("#new-save").attr("disabled", "disabled");
        //$("#new-avatar").attr("src", "images/default-avatar-stream.png");
    });
}

/**
 * Build an account object from the info in our form, if possible.
 * We won't yet know for sure whether it's valid, however...
 *
 * @param onSuccess function(StatusNet.Account acct)
 * @param onError function()
 */
StatusNet.SettingsView.prototype.discoverNewAccount = function(onSuccess, onError) {
    var username = this.fields['username'].value;
    var password = this.fields['password'].value;
    var site = this.fields['site'].value;

    if (this.workAcct != null &&
        username == this.lastUsername &&
        password == this.lastPassword &&
        site == this.lastSite) {

        onSuccess(this.workAcct);
        return;
    }
    this.lastUsername = username;
    this.lastPassword = password;
    this.lastSite = site;
    if (username == '' || password == '' || site == '') {
        onError();
        return;
    }

    if (site.substr(0, 7) == 'http://' || site.substr(0, 8) == 'https://') {
        var url = site;
        if (url.substr(url.length - 1, 1) != '/') {
            url += '/';
        }
        onSuccess(new StatusNet.Account(username, password, url));
    } else if (site == 'twitter.com') {
        // Special case Twitter...
        // but it probably ain't super great as we do SN-specific stuff!
        var url = 'https://twitter.com/';
        onSuccess(new StatusNet.Account(username, password, url));
    } else {
        // Try RSD discovery!
        this.fields.status.text = "Finding secure server...";
        StatusNet.RSD.discoverTwitterApi('https://' + site + '/rsd.xml', function(apiroot) {
            onSuccess(new StatusNet.Account(username, password, apiroot));
        }, function() {
            this.fields.status.text = "Finding non-secured server...";
            StatusNet.RSD.discoverTwitterApi('http://' + site + '/rsd.xml', function(apiroot) {
                onSuccess(new StatusNet.Account(username, password, apiroot));
            }, function() {
                // nothin' :(
                onError();
            });
        });
    }
}

StatusNet.SettingsView.prototype.saveNewAccount = function() {
    this.workAcct.ensure(StatusNet.getDB());
    this.showAccountRow(this.workAcct);

    this.hideAddAccount();
}
