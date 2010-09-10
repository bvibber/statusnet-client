/**
 * StatusNet Desktop
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

StatusNet.SettingsView = function() {
    var db = StatusNet.getDB();
    this.accounts = StatusNet.Account.listAll(db);
    this.workAcct = null;
    this.updateTimeout = null;
    this.lastUsername = '';
    this.lastPassword = '';
    this.lastSite = '';
};

StatusNet.SettingsView.prototype.init = function() {

    // set theme
    this.theme = StatusNet.Theme.getTheme();
    this.config = StatusNet.Config.getConfig();

    $("link#display").attr("href", this.theme.getDisplayStylesheet());
    $("link#settings").attr("href", this.theme.getSettingsStylesheet());

    // Add in a theme specific stylesheet if any
    var themeCss = this.theme.getThemeStylesheet();
    if (themeCss) {
        $('<link id="theme" rel="stylesheet" href="' + themeCss +
            '" type="text/css" charset="utf-8">').insertAfter($("link#display"));
    }

    this.initAccountsTab();
    this.initMiscTab();

    // tabbed menu stuff
    $(".tab_content").hide();
    $("ul.tabs li:first").addClass("active").show();
    $(".tab_content:first").show();
    $("ul.tabs li").click(function() {
        $("ul.tabs li").removeClass("active");
        $(this).addClass("active");
        $(".tab_content").hide();
        var activeTab = $(this).find("a").attr("href");
        $(activeTab).fadeIn();
        return false;
    });
};

StatusNet.SettingsView.prototype.initAccountsTab = function() {
    $("#new-account").hide();

    this.showAccounts();

    var that = this;
    $("tr.add").click(function() {
        that.showAddAccount();
        return false;
    });
    $("#new-username").change(function() {
        if (that.formComplete()) {
            that.updateNewAccount();
        }
    }).keydown(function() {
        that.startUpdateTimeout();
    });
    $("#new-password").change(function() {
        if (that.formComplete()) {
            that.updateNewAccount();
        }
    }).keydown(function() {
        that.startUpdateTimeout();
    });
    $("#new-site").change(function() {
        if (that.formComplete()) {
            that.updateNewAccount();
        }
    }).keydown(function() {
        that.startUpdateTimeout();
    });
    $("#new-save").click(function() {
        that.saveNewAccount();
    });
    $("#new-cancel").click(function() {
        that.hideAddAccount();
    });
};

StatusNet.SettingsView.prototype.initMiscTab = function() {

    var $playSoundsChk = $('input[name=play_sounds_cbox]');
    var $newNoticesSndChk = $('input[name=newnotices_sound_cbox]');
    var $postNoticeSndChk = $('input[name=postnotice_sound_cbox]');

    if (!this.config.getSetting("sounds_off")) {
        $playSoundsChk.attr("checked", "true");
    } else {
        $newNoticesSndChk.attr("disabled", "true");
        $postNoticeSndChk.attr("disabled", "true");
    }

    $playSoundsChk.click(
        function() {
            if ($playSoundsChk.attr("checked")) {
                $newNoticesSndChk.removeAttr("disabled");
                $postNoticeSndChk.removeAttr("disabled");
            } else {
                $newNoticesSndChk.attr("disabled", "true");
                $postNoticeSndChk.attr("disabled", "true");
            }
        });

    if (!this.config.getSetting("newnotices_sound_off")) {
        $newNoticesSndChk.attr("checked", "true");
    }

    if (!this.config.getSetting("postnotice_sound_off")) {
        $postNoticeSndChk.attr("checked", "true");
    }

    var that = this;

    $('input#misc-save').click(function() {
        that.saveMiscSettings(
            function() {
                alert("Settings saved.");
            },
            function(msg) {
                alert("Coudn't save settings! " + msg);
            })
        });
};

StatusNet.SettingsView.prototype.saveMiscSettings = function(onSuccess, onError) {

    try {

        if ($('input[name=play_sounds_cbox]').attr('checked')) {
            this.config.saveSetting('sounds_off', false);
        } else {
            this.config.saveSetting('sounds_off', true);
        }

        if ($('input[name=newnotices_sound_cbox]').attr('checked')) {
            this.config.saveSetting("newnotices_sound_off", false);
        } else {
            this.config.saveSetting("newnotices_sound_off", true);
        }

        if ($('input[name=postnotice_sound_cbox]').attr('checked')) {
            this.config.saveSetting("postnotice_sound_off", false);
        } else {
            this.config.saveSetting("postnotice_sound_off", true);
        }

    } catch(e) {
        onError(e);
    }

    onSuccess();
};

StatusNet.SettingsView.prototype.formComplete = function() {

    var username = $("#new-username").val();
    var password = $("#new-password").val();
    var site = $("#new-site").val();

    if (username != "" && password != "" && site != "") {
        return true;
    } else {
        return false
    }
};

StatusNet.SettingsView.prototype.showAddAccount = function() {
    this.resetNewAccount();
    $("#new-account").show();
    $("#new-username").focus();
};

StatusNet.SettingsView.prototype.hideAddAccount = function() {
    $("#new-account").hide();
    this.resetNewAccount();
};

/**
 * @fixme really should separate this a bit more to model/view?
 */
StatusNet.SettingsView.prototype.showAccounts = function() {

    var me = Titanium.UI.getCurrentWindow();

    if (this.accounts.length == 0) {
        $("#status").text("No accounts set up -- time to add one!");
        this.showAddAccount();
        me.setCloseable(false);
    } else {
        for (var i = 0; i < this.accounts.length; i++) {
            this.showAccountRow(this.accounts[i]);
        }
        me.setCloseable(true);
    }
};

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
    img_icon.src = this.theme.getImage("icon_processing.gif");
    td_icon.appendChild(img_icon);
    tr.appendChild(td_icon);

    var td_name = document.createElement('td');
    $(td_name).addClass('name').text(acct.username);
    tr.appendChild(td_name);

    var td_site = document.createElement('td');
    $(td_site).addClass('site').html(this.prettySiteName(acct));
    tr.appendChild(td_site);

    var td_remove = document.createElement('td');
    $(td_remove).addClass('remove').html("<a href='#' title='Delete account'></a>");
    tr.appendChild(td_remove);

    var list = $('#accountlist tbody')[0];
    list.appendChild(tr);

    $(tr).click(function() {
        acct.setDefault(StatusNet.getDB());
        var me = Titanium.UI.getCurrentWindow();
        me.getParent().setURL("app://index.html");
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

    acct.apiGet('account/verify_credentials.xml', function(status, xml) {
        var avatar = $("user profile_image_url", xml).text();
        StatusNet.debug(avatar);
        img_icon.src = avatar;
    }, function(status) {
        StatusNet.debug("We failed to load account info");
    });
};

/**
 * @param StatusNet.Account acct
 * @return string HTML fragment with prettified name
 */
StatusNet.SettingsView.prototype.prettySiteName = function(acct) {
    var html = $("<span></span>").text(acct.getHost())
                                 .attr("title", acct.apiroot)
                                 .addClass(acct.isSecure() ? 'https' : 'http');
    return $("<div></div>").append(html).html(); // @fixme ok this is lame
};

/**
 * Start a timeout to try updating the account if the user stops
 * typing after a couple seconds.
 */
StatusNet.SettingsView.prototype.startUpdateTimeout = function() {
    // Push back the timeout if we're still typing...
    this.cancelUpdateTimeout();

    var that = this;
    this.updateTimeout = window.setTimeout(function() {
        if (that.formComplete()) {
            that.updateNewAccount();
        }
    }, 2000);
};

/**
 * Cancel the account update timeout if it's been started.
 */
StatusNet.SettingsView.prototype.cancelUpdateTimeout = function() {
    if (this.updateTimeout != null) {
        window.clearTimeout(this.updateTimeout);
        this.updateTimeout = null;
    }
};

/**
 * Determine wether the version of StatusNet will work with this client
 * Currently hard-coded to check for 0.9.3 or above
 */
StatusNet.SettingsView.prototype.validVersion = function(version)
{
    var nums = version.split('.');
    var major = parseInt(nums[0]);
    var minor = parseInt(nums[1]);
    var rev = 0;

    if (nums.length > 2) {
        rev = parseInt(nums[2]);
    }

    if (major < 1) {
        if (minor < 9) {
            return false;
        } else {
            if (rev < 3) {
                return false;
            }
        }
    }

    return true;
};

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
            $("#new-status").text("Testing login...");

            StatusNet.debug("New acct");
            that.workAcct = acct;
            $("#new-save").attr("disabled", "disabled");
            $("#new-avatar").attr("src", that.theme.getImage("icon_processing.gif"));

            that.workAcct.apiGet('account/verify_credentials.xml', function(status, xml) {
                $("#new-status").text("Login confirmed.");
                that.xml = xml;
                that.workAcct.avatar = $("user profile_image_url", xml).text();
                StatusNet.debug(that.workAcct.avatar);
                $("#new-avatar").attr("src", that.workAcct.avatar);

                StatusNet.debug("Loading statusnet/version.xml");

                $("#new-status").text("Checking StatusNet version...");

                that.workAcct.apiGet('statusnet/version.xml',
                    function(status, xml) {
                        var version = $(xml).find('version').text();

                        StatusNet.debug("StatusNet version = " + version);

                        if (that.validVersion(version) === false) {
                            $("#new-status").text("StatusNet must be version 0.9.3 or later!");
                            return;
                        }

                        $("#new-status").text("Getting StatusNet configuration...");

                        // get site specific configuration info
                        that.workAcct.apiGet('statusnet/config.xml',
                            function(status, xml) {
                                StatusNet.debug("Loaded statusnet/config.xml");
                                that.workAcct.textLimit = $(xml).find('config > site > textlimit').text();
                                that.workAcct.siteLogo = $(xml).find('config > site > logo').text();

                                $("#new-status").text("Account verified.");

                                // Okay, now you can save
                                $("#new-save").removeAttr("disabled");

                                if (!StatusNet.validUrl(that.workAcct.siteLogo)) {
                                    StatusNet.debug("Couldn't get site logo!");
                                    that.workAcct.siteLogo = '';
                                }
                            }, function(status, xml) {
                                $("#new-status").text("Couldn't load site configuration info.");
                                StatusNet.debug("Couldn't load statusnet/config.xml for site: " + status);
                                $("#new-avatar").attr("src", that.theme.getDefaultUserImage());
                            }
                        );

                    }, function(status, xml) {
                        $("#new-status").text("Error checking version.");
                        StatusNet.debug("Couldn't load statusnet/version.xml for site: " + status);
                        $("#new-avatar").attr("src", that.theme.getDefaultUserImage());
                    });
                },
                function(status, xml) {
                    $("#new-status").text("Bad nickname or password.");
                    StatusNet.debug("We failed to load account info: " + status);
                    $("#new-avatar").attr("src", that.theme.getDefaultUserImage());
                }
            );

        }
    }, function() {
        $("#new-status").text("Could not verify site.");
        StatusNet.debug("Bogus acct");
        that.workAcct = null;
        $("#new-save").attr("disabled", "disabled");
        $("#new-avatar").attr("src", that.theme.getDefaultUserImage());

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
        onSuccess(new StatusNet.Account(username, password, url));
    } else {
        // Try RSD discovery!
        $("#new-status").text("Finding secure server...");
        StatusNet.RSD.discoverTwitterApi('https://' + site + '/rsd.xml', function(apiroot) {
            onSuccess(new StatusNet.Account(username, password, apiroot));
        }, function() {
            $("#new-status").text("Finding non-secured server...");
            StatusNet.RSD.discoverTwitterApi('http://' + site + '/rsd.xml', function(apiroot) {
                onSuccess(new StatusNet.Account(username, password, apiroot));
            }, function() {
                // nothin' :(
                onError();
            });
        });
    }
};

StatusNet.SettingsView.prototype.saveNewAccount = function() {
    this.workAcct.ensure(StatusNet.getDB());
    this.showAccountRow(this.workAcct);

    this.hideAddAccount();
};

StatusNet.SettingsView.prototype.resetNewAccount = function() {
    this.workAcct = null;
    $("#new-username").val("");
    $("#new-password").val("");
    $("#new-site").val("");
    $("#new-avatar").attr("src", this.theme.getDefaultUserImage());
    $("#new-save").attr("disabled", "disabled");
};
