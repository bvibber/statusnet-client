/**
 * StatusNet Mobile
 *
 * Copyright 2010 StatusNet, Inc.
 * Based in part on Tweetanium
 * Copyright 2008-2009 Kevin Whinnery and Appcelerator, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
StatusNet.SettingsView = function(client) {
    this.client = client;

    var db = StatusNet.getDB();
    this.accounts = StatusNet.Account.listAll(db);
    this.workAcct = null;
    this.updateTimeout = null;
    this.lastUsername = '';
    this.lastPassword = '';
    this.lastSite = '';
};

StatusNet.SettingsView.prototype.init = function() {
    StatusNet.debug('SettingsView.init');
    var view = this;
    var client = this.client;
    var android = (Titanium.Platform.osname == "android");

    // Set up our table view...
    this.table = Titanium.UI.createTableView({
        editable: true
    });
    this.table.addEventListener('click', function(event) {
        StatusNet.debug('Got a click event on the table view.');
        // Selected an account
        StatusNet.debug('QQQ: event: ' + event);
        StatusNet.debug('QQQ: event.rowData: ' + event.rowData);
        StatusNet.debug('QQQ: event.rowData.acct: ' + event.rowData.acct);

        if (event.rowData.acct == "add-stub") {
            // Special case!
            view.showAddAccount();
            return;
        }

        StatusNet.debug('QQQ: event.rowData.acct.id: ' + event.rowData.acct.id);

        //var acct = event.rowData.acct;
        var x = event.rowData.acct;
        //var acct = new StatusNet.Account(x.username, x.password, x.apiroot);
        var acct = StatusNet.Account.getById(x.id);

        // hack -- on Android, we don't seem to get the original object back
        // but only have its properties, so all the methods are missing.
        StatusNet.debug('QQQ: acct.username: ' + acct.username);
        StatusNet.debug('QQQ: acct.ensure: ' + acct.ensure);
        StatusNet.debug('QQQ: acct.getHost: ' + acct.getHost);
        StatusNet.debug('QQQ: acct.getHost(): ' + acct.getHost());
        StatusNet.debug('Attempting to select account: ' + acct.username + '@' + acct.getHost());
        acct.setDefault(StatusNet.getDB());
        StatusNet.debug('Saved!');
        StatusNet.debug('QQQ: client: ' + client);
        StatusNet.debug('QQQ: client.initAccountView: ' + client.initAccountView);
        client.initAccountView(acct);
        StatusNet.debug('Switched to timeline.');
    });
    this.table.addEventListener('delete', function(event) {
        // deleted a row
        var acct = event.rowData.acct;
        StatusNet.debug('Attempting to delete account: ' + acct.username + '@' + acct.getHost());
        acct.deleteAccount();
        cancel.title = 'Done';
    });
    this.window.add(this.table);

    if (android) {
        // Stick an 'add account' item at the top of the list, similar to
        // the default Android browser's bookmarks list.
        var row = Titanium.UI.createTableViewRow({
            title: 'Add account...',
            height: 'auto',
            acct: "add-stub"
        });
        /*
        // The tableview seems to get this click before the row does, so bumping the code up.
        row.addEventListener('click', function() {
            StatusNet.debug('clicked the add account thingy');
            view.showAddAccount();
        });
        */
        this.table.appendRow(row);

        // @fixme -- add a way to remove items!
    } else {
        // Create-account button
        var create = Titanium.UI.createButton({
            title: '+'
        });
        create.addEventListener('click', function() {
            if (view.table.editing) {
                view.table.editing = false;
                view.window.setLeftNavButton(edit);
            }
            view.showAddAccount();
        });
    
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

        // ...and plop them onto the tab header.
        this.window.setLeftNavButton(edit);
        this.window.setRightNavButton(create);
    }

    // Now let's fill out the table!
    this.showAccounts();
};

/**
 * Open the add-new-account modal dialog
 */
StatusNet.SettingsView.prototype.showAddAccount = function() {
    var android = (Titanium.Platform.osname == "android");

    var view = this;
    var window = Titanium.UI.createWindow({
        title: "Add Account",
        backgroundColor: (android ? "black" : "#bbbfcc"),
        layout: 'vertical'
    });

    var cancel = Titanium.UI.createButton({
        title: "Cancel"
    });
    cancel.addEventListener('click', function() {
        StatusNet.debug('clicked cancel');
        window.close();
        this.fields = null;
    });

    var save = Titanium.UI.createButton({
        title: "Save",
        width: 'auto',
        height: 'auto'
    });
    save.addEventListener('click', function() {
        StatusNet.debug('clicked save');
        view.updateNewAccount();
        StatusNet.debug('save click: updated');
        if (view.workAcct != null) {
            // @fixme separate the 'update state' and 'save' actions better
            view.saveNewAccount();
            StatusNet.debug('save click: saved');
            window.close();
            StatusNet.debug('hide: closed');
            view.fields = null;
            StatusNet.debug('hide: killed fields');
        }
    });
    if (android) {
        // Android has no navigation area on tab header
        var label = Titanium.UI.createLabel({
            text: "Add Account",
            width: 'auto',
            height: 'auto',
            font: {fontSize: '30'}
        });
        window.add(label);
        // Add the buttons at the bottom later...
    } else {
        window.setLeftNavButton(cancel);
        window.setRightNavButton(save);
    }

    this.fields = {};
    var fields = {site: {props: {
                    hintText: "Server",
                    returnKeyType:Titanium.UI.RETURNKEY_NEXT,
                    keyboardType: Titanium.UI.KEYBOARD_URL,
                    autocorrect: false
                  }},
                  username: {props: {
                    hintText: "Username",
                    returnKeyType:Titanium.UI.RETURNKEY_NEXT,
                    autocorrect: false
                  }},
                  password: {props: {
                    hintText: "Password",
                    passwordMask:true,
                    returnKeyType:Titanium.UI.RETURNKEY_DONE
                  }}};
    for (var i in fields) {
        if (fields.hasOwnProperty(i)) {
            var props = {
                left: 8,
                right: 8,
                height: android ? 'auto' : 32, // argghhhhh auto doesn't work on iphone
                borderStyle: Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
            };
            for (var j in fields[i].props) {
                if (fields[i].props.hasOwnProperty(j)) {
                    props[j] = fields[i].props[j];
                }
            }
            var text = Titanium.UI.createTextField(props);
            window.add(text);

            this.fields[i] = text;
        }
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
        height: android ? 'auto' : 32
    });
    window.add(this.fields.status);

    if (android) {
        var xview = Titanium.UI.createView();
        // For some reason, horizontal layout appears to be missing. :P
        save.left = 10;
        save.width = 100;
        cancel.width = 100;
        cancel.left = 120;
        xview.add(save);
        xview.add(cancel);
        window.add(xview);
    }

    window.open({
        modal: true
    });
};

/**
 * @fixme really should separate this a bit more to model/view?
 */
StatusNet.SettingsView.prototype.showAccounts = function() {
    StatusNet.debug('SettingsView.showAccounts');
    var android = (Titanium.Platform.osname == "android");

    if (this.accounts.length == 0) {
        this.showAddAccount();
    } else {
        for (var i = 0; i < this.accounts.length; i++) {
            this.showAccountRow(this.accounts[i]);
        }
        // crappy temp hack -- single row is hidden on android
        if (android && this.accounts.length == 1) {
            this.table.appendRow({});
        }
    }
};

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
    StatusNet.debug('show account row: ' + acct);
    var title = acct.username + '@' + acct.getHost();
    StatusNet.debug('adding row: ' + title);

    // Note -- if I add *two* rows it works on Android with 'auto'. Sighhhhhh
    var row = {title: title,
               acct: acct,
               height: 'auto'};
    this.table.appendRow(row);
    StatusNet.debug('show account row done.');
};

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
};

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
};

/**
 * Validate input and see if we can make it work yet
 */
StatusNet.SettingsView.prototype.updateNewAccount = function() {
    var that = this;
    StatusNet.debug('yadda 1');
    this.cancelUpdateTimeout();
    StatusNet.debug('yadda 2');
    this.discoverNewAccount(function(acct) {
        StatusNet.debug('yadda 3');
        StatusNet.debug("Discovered... found: " + acct);
        StatusNet.debug("Previous was: " + that.workAcct);
        if (acct.equals(that.workAcct)) {
            StatusNet.debug('yadda 4');
            // No change.
            StatusNet.debug("No change!");
            that.fields.status.text = "No change.";
        } else {
            StatusNet.debug('yadda 5');
            StatusNet.debug("New acct");
            that.fields.status.text = "Testing login...";

            that.workAcct = acct;
            //$("#new-save").attr("disabled", "disabled");
            //$("#new-avatar").attr("src", "images/icon_processing.gif");

            that.workAcct.apiGet('account/verify_credentials.xml', function(status, xml) {
                StatusNet.debug("got xml: " + xml);

                that.fields.status.text = "Login confirmed.";
                that.xml = xml;

                that.workAcct.avatar  = $(xml).find('user > profile_image_url').text();

                /*
                // @fixme replace avatar update code for mobile...
                StatusNet.debug(that.workAcct.avatar);
                */
                //$("#new-avatar").attr("src", that.workAcct.avatar);
                //$("#new-save").removeAttr("disabled");

                // get site specific configuration info
                that.workAcct.apiGet('statusnet/config.xml', function(status, xml) {
                    StatusNet.debug("Loaded statusnet/config.xml");
                    that.workAcct.textLimit = $(xml).find('site > textlimit').text();
                    that.workAcct.siteLogo = $(xml).find('site > logo').text();
                }, function(status) {
                    StatusNet.debug("Couldn't load statusnet/config.xml for site.");
                });

            }, function(status) {
                that.fields.status.text = "Bad nickname or password.";
                StatusNet.debug("We failed to load account info");
                //$("#new-avatar").attr("src", "images/default-avatar-stream.png");
            });
        }
    }, function() {
        StatusNet.debug('yadda 99');
        that.fields.status.text = "Could not verify site.";
        StatusNet.debug("Bogus acct");
        that.workAcct = null;
        //$("#new-save").attr("disabled", "disabled");
        //$("#new-avatar").attr("src", "images/default-avatar-stream.png");
    });
    StatusNet.debug("yadda: the end");
};

/**
 * Build an account object from the info in our form, if possible.
 * We won't yet know for sure whether it's valid, however...
 *
 * @param onSuccess function(StatusNet.Account acct)
 * @param onError function()
 */
StatusNet.SettingsView.prototype.discoverNewAccount = function(onSuccess, onError) {
    StatusNet.debug('bizbax 1');
    var username = this.fields.username.value;
    var password = this.fields.password.value;
    var site = this.fields.site.value;
    StatusNet.debug('bizbax 2');

    if (this.workAcct != null &&
        username == this.lastUsername &&
        password == this.lastPassword &&
        site == this.lastSite) {
        StatusNet.debug('bizbax 3');

        onSuccess(this.workAcct);
        StatusNet.debug('bizbax 4');
        return;
    }
    StatusNet.debug('bizbax 5');
    this.lastUsername = username;
    this.lastPassword = password;
    this.lastSite = site;
    if (username == '' || password == '' || site == '') {
        StatusNet.debug('bizbax 6');
        onError();
        StatusNet.debug('bizbax 7');
        return;
    }

    StatusNet.debug('bizbax 8');

    var url;

    if (site.substr(0, 7) == 'http://' || site.substr(0, 8) == 'https://') {
        StatusNet.debug('bizbax 9');
        url = site;
        if (url.substr(url.length - 1, 1) != '/') {
            url += '/';
        }
        onSuccess(new StatusNet.Account(username, password, url));
    } else if (site == 'twitter.com') {
        StatusNet.debug('bizbax 10');
        // Special case Twitter...
        // but it probably ain't super great as we do SN-specific stuff!
        url = 'https://twitter.com/';
        onSuccess(new StatusNet.Account(username, password, url));
    } else {
        StatusNet.debug('bizbax 11');
        // Try RSD discovery!
        this.fields.status.text = "Finding secure server...";
        StatusNet.RSD.discoverTwitterApi('https://' + site + '/rsd.xml', function(apiroot) {
            StatusNet.debug('bizbax 12');
            onSuccess(new StatusNet.Account(username, password, apiroot));
        }, function() {
            StatusNet.debug('bizbax 13');
            this.fields.status.text = "Finding non-secured server...";
            StatusNet.RSD.discoverTwitterApi('http://' + site + '/rsd.xml', function(apiroot) {
                StatusNet.debug('bizbax 14');
                onSuccess(new StatusNet.Account(username, password, apiroot));
            }, function() {
                // nothin' :(
                StatusNet.debug('bizbax 15');
                onError();
            });
        });
        StatusNet.debug('bizbax 16');
    }
    StatusNet.debug('bizbax 99');
};

StatusNet.SettingsView.prototype.saveNewAccount = function() {
    this.workAcct.ensure(StatusNet.getDB());
    this.showAccountRow(this.workAcct);
};
