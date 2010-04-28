StatusNet.SettingsView = function() {
    var db = StatusNet.getDB();
    this.accounts = StatusNet.Account.listAll(db);
    this.workAcct = null;
    this.updateTimeout = null;
    this.lastUsername = '';
    this.lastPassword = '';
    this.lastSite = '';
}
StatusNet.SettingsView.prototype.init = function() {
    $("#new-account").hide();

    this.showAccounts();

    var that = this;
    $("tr.add").click(function() {
        that.showAddAccount();
        return false;
    });
    $("#new-username").change(function() {
        that.updateNewAccount();
    }).keydown(function() {
        that.startUpdateTimeout();
    });
    $("#new-password").change(function() {
        that.updateNewAccount();
    }).keydown(function() {
        that.startUpdateTimeout();
    });
    $("#new-site").change(function() {
        that.updateNewAccount();
    }).keydown(function() {
        that.startUpdateTimeout();
    });
    $("#new-save").click(function() {
        that.saveNewAccount();
    });
    $("#new-cancel").click(function() {
        that.hideAddAccount();
    });
}

StatusNet.SettingsView.prototype.showAddAccount = function() {
    this.resetNewAccount();
    $("#new-account").show();
    $("#new-username").focus();
}

StatusNet.SettingsView.prototype.hideAddAccount = function() {
    $("#new-account").hide();
    this.resetNewAccount();
}

/**
 * @fixme really should separate this a bit more to model/view?
 */
StatusNet.SettingsView.prototype.showAccounts = function() {
    if (this.accounts.length == 0) {
        $("#status").text("No accounts set up -- time to add one!");
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
    $(td_site).addClass('site').html(this.prettySiteName(acct.apiroot));
    tr.appendChild(td_site);

    var td_remove = document.createElement('td');
    $(td_remove).addClass('remove').html("<a href='#' title='Delete account'></a>");
    tr.appendChild(td_remove);

    var list = $('#accountlist tbody')[0];
    list.appendChild(tr);

    $(tr).click(function() {
        acct.setDefault(StatusNet.getDB());
        var me = Titanium.UI.getCurrentWindow();
        me.getParent().setURL("app:///index.html");
        me.close();
    });
    $("a", td_remove).click(function() {
        if (confirm("Are you sure you want to delete the account " +
                    acct.username +
                    " on " +
                   acct.apiroot +
                   " ?")) {
            acct.deleteAccount();
            list.removeChild(tr);
        }
        return false;
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
 * @param string apiroot
 * @return string HTML fragment with prettified name
 */
StatusNet.SettingsView.prototype.prettySiteName = function(apiroot) {
    var matches = apiroot.match(/^(http|https):\/\/([^\/]+)/);
    if (matches) {
        var protocol = matches[1];
        var host = matches[2];
        var html = $("<span></span>").text(host)
                                     .attr("title", apiroot)
                                     .addClass(protocol);
        return $("<div></div>").append(html).html(); // @fixme ok this is lame
    } else {
        // hmmm
        return apiroot;
    }
}

/**
 * Start a timeout to try updating the account if the user stops
 * typing after a couple seconds.
 */
StatusNet.SettingsView.prototype.startUpdateTimeout = function() {
    // Push back the timeout if we're still typing...
    this.cancelUpdateTimeout();

    var that = this;
    this.updateTimeout = window.setTimeout(function() { that.updateNewAccount() }, 2000);
}

/**
 * Cancel the account update timeout if it's been started.
 */
StatusNet.SettingsView.prototype.cancelUpdateTimeout = function() {
    if (this.updateTimeout != null) {
        window.clearTimeout(this.updateTimeout);
        this.updateTimeout = null;
    }
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
        } else {
            StatusNet.debug("New acct");
            that.workAcct = acct;
            $("#new-save").attr("disabled", "disabled");
            $("#new-avatar").attr("src", "images/icon_processing.gif");
    
            that.workAcct.fetchUrl('account/verify_credentials.xml', function(status, xml) {
                that.xml = xml;
                var avatar = $("user profile_image_url", xml).text();
                StatusNet.debug(avatar);
                $("#new-avatar").attr("src", avatar);
                $("#new-save").removeAttr("disabled");
            }, function(status) {
                StatusNet.debug("We failed to load account info");
                $("#new-avatar").attr("src", "images/default-avatar-stream.png");
            });
        }
    }, function() {
        StatusNet.debug("Bogus acct");
        that.workAcct = null;
        $("#new-save").attr("disabled", "disabled");
        $("#new-avatar").attr("src", "images/default-avatar-stream.png");
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
    var username = $("#new-username").val();
    var password = $("#new-password").val();
    var site = $("#new-site").val();

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
    } else {
        // Try RSD discovery!
        StatusNet.RSD.discoverTwitterApi('https://' + site + '/rsd.xml', function(apiroot) {
            onSuccess(new StatusNet.Account(username, password, apiroot));
        }, function() {
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
    this.workAcct.ensure(StatusNet.getDB(), this.xml);
    this.showAccountRow(this.workAcct);

    this.hideAddAccount();
}

StatusNet.SettingsView.prototype.resetNewAccount = function() {
    this.workAcct = null;
    $("#new-username").val("");
    $("#new-password").val("");
    $("#new-site").val("");
    $("#new-avatar").attr("src", "images/default-avatar-stream.png");
    $("#new-save").attr("disabled", "disabled");
}
