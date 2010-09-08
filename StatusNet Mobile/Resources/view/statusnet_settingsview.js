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

    var db = StatusNet.getDB();
    this.accounts = [];
    this.workAcct = null;
    this.updateTimeout = null;
    this.lastUsername = '';
    this.lastPassword = '';
    this.lastSite = '';
    this.client = client;
    this.rows = [];

    this.onClose = new StatusNet.Event();
};

/**
 * Initialize the account settings view...
 * Creates a table view listing all configured accounts.
 */
StatusNet.SettingsView.prototype.init = function() {
    StatusNet.debug('SettingsView.init');
    var view = this;

    var window = this.window = Titanium.UI.createWindow({
        title: 'Accounts',
        navBarHidden: true
    });
    window.addEventListener('close', function() {
        view.onClose.notify();
    });

    // Stack the toolbar above the table view; this'll make our animation awesomer.
    // Set up our table view...
    this.table = Titanium.UI.createTableView({
        editable: true,
        top: 44, //this.navbar.height
        zIndex: 100
    });
    this.window.add(this.table);

    // @fixme drop the duped title if we can figure out why it doesn't come through
    this.navbar = StatusNet.Platform.createNavBar(this.window, 'Accounts');

    this.table.addEventListener('click', function(event) {
        // Selected an account

        if (event.rowData.acct == "add-stub") {
            // Special case!
            view.showAddAccount();
            return;
        }

        // hack -- on Android, we don't seem to get the original object back
        // but only have its properties, so all the methods are missing.
        var x = event.rowData.acct;
        var acct = StatusNet.Account.getById(x.id);

        StatusNet.debug('Attempting to select account: ' + acct.username + '@' + acct.getHost());
        acct.setDefault(StatusNet.getDB());
        StatusNet.debug('Saved!');

        // Start closing the current window...
        view.closeWindow();

        StatusNet.debug('Switching to timeline...');
        view.client.initAccountView(acct);
    });
    this.table.addEventListener('delete', function(event) {
        // deleted a row
        var acct = event.rowData.acct;
        StatusNet.debug('Attempting to delete account: ' + acct.username + '@' + acct.getHost());
        acct.deleteAccount();

        view.rows = view.rows.splice(event.rowData.index, 1);

    });

    // And a cancel for account selection.
    // @fixme don't show this if we're running on first view!
    var cancel = Titanium.UI.createButton({
        title: 'Cancel'
    });
    cancel.addEventListener('click', function() {
        view.closeWindow();
    });
    this.navbar.setLeftNavButton(cancel);

    if (StatusNet.Platform.isApple()) {
        // @fixme perhaps just use the native thingy here?
        // Create-account button
        var create = Titanium.UI.createButton({
            title: '+'
        });
        create.addEventListener('click', function() {
            if (view.table.editing) {
                view.table.editing = false;
                view.navbar.setLeftNavButton(edit);
            }
            // @fixme need a better way to close-modal-and-open-other-modal smoothly
            //window.close();
            //setTimeout(function() {
                view.showAddAccount();
            //}, 500);
        });

        // Edit/done buttons for the table view...
        var edit = Titanium.UI.createButton({
            title: 'Edit'
        });
        var done = Titanium.UI.createButton({
            title: 'Done'
        });
        edit.addEventListener('click', function() {
            view.navbar.setRightNavButton(done);
            view.table.editing = true;
        });
        done.addEventListener('click', function() {
            view.navbar.setRightNavButton(edit);
            view.table.editing = false;
        });

        // ...and plop them onto the tab header.
        this.navbar.setRightNavButton(edit);
    }

    // Now let's fill out the table!
    view.showAccounts();

    if (this.accounts.length > 0) {
        // We do the slide-up animation manually rather than
        // doing this as a modal, since that confuses things
        // when we open another modal later.
        this.open();
    } else {
        // Leave the main accounts window hidden until later...
        this.showAddAccount();
    }
};

/**
 * Open the add-new-account modal dialog
 */
StatusNet.SettingsView.prototype.showAddAccount = function() {
    var view = this;
    var window = Titanium.UI.createWindow({
        title: "Add Account",
        backgroundColor: StatusNet.Platform.dialogBackground(),
        navBarHidden: true // hack for iphone for now
    });

    var doClose = function() {
        // Hide keyboard...
        for (var i in view.fields) {
            if (view.fields.hasOwnProperty(i)) {
                var field = view.fields[i];
                if (typeof field.blur == 'function') {
                    field.blur();
                }
            }
        }
        StatusNet.Platform.animatedClose(window);
        view.fields = null;
    };
    // @fixme drop the duped title if we can figure out why it doesn't come through
    var navbar = StatusNet.Platform.createNavBar(window, 'Add Account');

    window.addEventListener('close', function() {
        StatusNet.debug("WTF: closing new dialog...");

        StatusNet.debug("WTF: updating accounts list...");
        // Update the views in the list
        view.showAccounts();

        StatusNet.debug("WTF: (re)opening accounts list window...");
        // if the main accounts view wasn't already open...
        view.window.open();

        StatusNet.debug("WTF: done?");
    });
    var cancel = Titanium.UI.createButton({
        title: "Cancel"
    });
    cancel.addEventListener('click', function() {
        doClose();
    });

    var save = Titanium.UI.createButton({
        title: "Save"
    });
    save.addEventListener('click', function() {
        StatusNet.debug('clicked save');
        save.enabled = false;
        view.verifyAccount(function() {
            StatusNet.debug('save click: updated');
            if (view.workAcct != null) {
                // @fixme separate the 'update state' and 'save' actions better
                view.saveNewAccount();
                doClose();
            }
        },
        function() {
            StatusNet.debug("Could not verify account.");
            save.enabled = true;
        });
    });

    navbar.setLeftNavButton(cancel);
    navbar.setRightNavButton(save);

    var workArea = Titanium.UI.createView({
        top: navbar.height,
        left: 0,
        right: 0,
        bottom: 0,
        layout: 'vertical'
    });
    window.add(workArea);

    this.fields = {};
    var commonProps = {
        left: 8,
        right: 8,
        height: StatusNet.Platform.isAndroid() ? 'auto' : 32, // argghhhhh auto doesn't work on iphone
        borderStyle: Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
        autocapitalization: Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
        autocorrect: false
    };
    var fields = {
        site: {
            label: "Server",
            props: {
                hintText: "example.status.net",
                returnKeyType:Titanium.UI.RETURNKEY_NEXT,
                keyboardType: Titanium.UI.KEYBOARD_URL
            }
        },
        username: {
            label: "Username",
            props: {
                hintText: "user",
                returnKeyType: Titanium.UI.RETURNKEY_NEXT,
                keyboardType: Titanium.UI.KEYBOARD_EMAIL
            }
        },
        password: {
            label: "Password",
            props: {
                hintText: "Required",
                passwordMask:true,
                keyboardType: Titanium.UI.KEYBOARD_EMAIL, // we need to specify *this* or the autocorrect setting doesn't get set on the actual field for Android?!
                returnKeyType:Titanium.UI.RETURNKEY_DONE
            }
        }
    };
    for (var i in fields) {
        if (fields.hasOwnProperty(i)) {
            var field = fields[i];
            var props = {};
            var slurp = function(source) {
                for (var j in source) {
                    if (source.hasOwnProperty(j)) {
                        props[j] = source[j];
                    }
                }
            };
            slurp(commonProps);
            slurp(field.props);

            var label = Titanium.UI.createLabel({
                left: 8,
                right: 8,
                height: 'auto',
                text: field.label
            });
            workArea.add(label);

            var text = Titanium.UI.createTextField(props);
            workArea.add(text);

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
        save.fireEvent('click', {});
    });

    this.fields.status = Titanium.UI.createLabel({
        text: "",
        left: 8,
        right: 8,
        height: StatusNet.Platform.isAndroid() ? 'auto' : 32
    });
    workArea.add(this.fields.status);

    StatusNet.Platform.setInitialFocus(window, this.fields.site);
    StatusNet.Platform.animatedOpen(window);
};

/**
 * @fixme really should separate this a bit more to model/view?
 */
StatusNet.SettingsView.prototype.showAccounts = function() {
    StatusNet.debug('SettingsView.showAccounts');

    this.accounts = StatusNet.Account.listAll(StatusNet.getDB());
    this.rows = [];
    for (var i = 0; i < this.accounts.length; i++) {
        this.addAccountRow(this.accounts[i]);
    }

    // Stick an 'add account' item at the top of the list, similar to
    // the default Android browser's bookmarks list.
    var row = Titanium.UI.createTableViewRow({
        height: 64,
        editable: false,
        acct: "add-stub"
    });

    var variant = '';
    if (StatusNet.Platform.isAndroid()) {
        if (StatusNet.Platform.dpi == 240) {
            variant = '-android-high';
        } else {
            variant = '-android-medium';
        }
    }
    var avatar = Titanium.UI.createImageView({
        image: 'images/settings/add-account' + variant + '.png',
        top: 8,
        left: 8,
        width: 48,
        height: 48,
        canScale: true, // for Android
        enableZoomControls: false // for Android
    });
    row.add(avatar);

    var label = Titanium.UI.createLabel({
        text: 'Add account...',
        left: 80,
        top: 0,
        bottom: 0,
        right: 0,
        font: {
            fontSize: 18
        }
    });
    row.add(label);
    this.rows.push(row);

    this.table.setData(this.rows);
};

/**
 * Add an account row to the accounts list.
 * Avatar will start loading asynchronously, whee!
 *
 * @param StatusNet.Account acct
 */
StatusNet.SettingsView.prototype.addAccountRow = function(acct) {
    // todo: avatar
    // todo: better formatting
    // todo: secure state
    StatusNet.debug('show account row: ' + acct);
    var title = acct.username + '@' + acct.getHost();
    StatusNet.debug('adding row: ' + title);

    var row = Titanium.UI.createTableViewRow({
        acct: acct,
        height: 64
    });

    if (acct.avatar) {
        var avatar = Titanium.UI.createImageView({
            top: 0,
            left: 0,
            width: 56,
            height: 56,
            canScale: true, // for Android
            enableZoomControls: false // for Android
        });
        row.add(avatar);
        if (StatusNet.Platform.isAndroid()) {
            StatusNet.AvatarCache.lookupAvatar(acct.avatar, function(path) {
                avatar.image = path;
            }, function(url) {
                avatar.image = url;
            });
        } else {
            // https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/1680-ios-regression-imageview-loaded-from-local-file-no-longer-scales-in-current-git-build
            avatar.image = acct.avatar;
        }
    }

    if (acct.siteLogo) {
        var logo = Titanium.UI.createImageView({
            top: 40,
            left: 40,
            width: 24,
            height: 24,
            canScale: true, // for Android
            enableZoomControls: false // for Android
        });
        row.add(logo);
        if (StatusNet.Platform.isAndroid()) {
            StatusNet.AvatarCache.lookupAvatar(acct.siteLogo, function(path) {
                logo.image = path;
            }, function(url) {
                logo.image = url;
            });
        } else {
            // https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/1680-ios-regression-imageview-loaded-from-local-file-no-longer-scales-in-current-git-build
            logo.image = acct.siteLogo;
        }
    }

    var label = Titanium.UI.createLabel({
        text: title,
        left: 80,
        top: 0,
        bottom: 0,
        right: 0,
        font: {
            fontWeight: acct.is_default ? 'bold' : 'normal',
            fontSize: 18
        },
        minimumFontSize: 8
    });
    row.add(label);

    if (StatusNet.Platform.isAndroid()) {
        var that = this;

        // There's no native tableview editing system on Android.
        // Set up a long-click handler to give a delete option.
        StatusNet.Platform.setupLongClick(row, function() {
            var dialog = Titanium.UI.createOptionDialog({
                destructive: 0,
                cancel: 1,
                options: ['Delete account', 'Cancel'],
                title: title + ' options'
            });
            dialog.addEventListener('click', function(event) {
                if (event.index == 0) {
                    StatusNet.debug('Attempting to delete account: ' + acct.username + '@' + acct.getHost());
                    acct.deleteAccount();
                    that.showAccounts();
                } else {
                    StatusNet.debug('Account delete canceled.');
                }
            });
            dialog.show();
        });
    }

    this.rows.push(row);
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
StatusNet.SettingsView.prototype.verifyAccount = function(onSuccess, onError) {
    var that = this;
    this.discoverNewAccount(function(acct) {
        StatusNet.debug("Discovered... found: " + acct);

        that.workAcct = acct;
        that.fields.status.text = "Testing login...";

        acct.apiGet('account/verify_credentials.xml', function(status, xml) {
            that.fields.status.text = "Login confirmed.";

            that.workAcct.avatar = $(xml).find('user > profile_image_url').text();

            // get site specific configuration info
            that.workAcct.apiGet('statusnet/config.xml', function(status, xml) {
                that.workAcct.textLimit = $(xml).find('site > textlimit').text();
                that.workAcct.siteLogo = $(xml).find('site > logo').text();

                // finally call our success
                onSuccess();

            }, function(status, msg) {
                that.fields.status.text = "No site config; bad server version?";
                StatusNet.debug("Failed to load site config: HTTP response " +
                    status + ": " + msg);
                onError();
            });

        }, function(status, msg) {
            if (status == 401) {
                // Bad auth
                that.fields.status.text = "Bad nickname or password.";
            } else {
                that.fields.status.text = "HTTP error " + status;
            }
            StatusNet.debug("We failed to load account info: HTTP response " +
                status + ": " + msg);
            onError();
        });
    }, function() {
        that.fields.status.text = "Could not verify site.";
        StatusNet.debug("Bogus acct");
        that.workAcct = null;
        onError();
        //$("#new-save").attr("disabled", "disabled");
        //$("#new-avatar").attr("src", "images/default-avatar-stream.png");
    });
};

/**
 * Build an account object from the info in our form, if possible.
 * We won't yet know for sure whether it's valid, however...
 *
 * @param onSuccess function(StatusNet.Account acct)
 * @param onError function()
 */
StatusNet.SettingsView.prototype.discoverNewAccount = function(onSuccess, onError) {
    var username = this.fields.username.value;
    var password = this.fields.password.value;
    var site = this.fields.site.value;

    if (username == '' || password == '' || site == '') {
        onError();
        return;
    }

    var that = this;
    var url;

    var foundAPI = function(apiroot) {
        that.fields.status.text = "Found " + apiroot;
        onSuccess(new StatusNet.Account(username, password, apiroot));
    };

    if (site.substr(0, 7) == 'http://' || site.substr(0, 8) == 'https://') {
        url = site;
        if (url.substr(url.length - 4, 4) == '/api') {
            url = url + '/';
        }
        if (url.substr(url.length - 5, 5) == '/api/') {
            // Looks like we've been given an API base URL... use it!
            onSuccess(new StatusNet.Account(username, password, url));
        } else {
            // Not sure what we've got, so try discovery...
            StatusNet.RSD.discover(url, function(rsd) {
                StatusNet.RSD.discoverTwitterApi(rsd, foundAPI, onError);
            }, onError);
        }
    } else if (site == 'twitter.com') {
        // Special case Twitter...
        // but it probably ain't super great as we do SN-specific stuff!
        url = 'https://twitter.com/';
        onSuccess(new StatusNet.Account(username, password, url));
    } else {
        // Looks like a bare hostname. Try its root page as HTTPS and HTTP...
        // Try RSD discovery!
        this.fields.status.text = "Finding secure server...";
        var rsd = 'https://' + site + '/rsd.xml';
        StatusNet.RSD.discoverTwitterApi(rsd, foundAPI, function() {
            that.fields.status.text = "Finding non-secured server...";
            var rsd = 'http://' + site + '/rsd.xml';
            StatusNet.RSD.discoverTwitterApi(rsd, foundAPI, onError);
        });
    }
};

StatusNet.SettingsView.prototype.saveNewAccount = function() {
    var id = this.workAcct.ensure(StatusNet.getDB());
    this.workAcct.id = id;
    StatusNet.debug("Saved new account with id " + id);
    this.addAccountRow(this.workAcct);
};

StatusNet.SettingsView.prototype.open = function() {
    StatusNet.Platform.animatedOpen(this.window, 'down', this.table);
}

StatusNet.SettingsView.prototype.closeWindow = function() {
    StatusNet.Platform.animatedClose(this.window, 'down', this.table);
}

StatusNet.SettingsView.prototype.close = function() {
    // Close down shared state; not needed here atm.
}