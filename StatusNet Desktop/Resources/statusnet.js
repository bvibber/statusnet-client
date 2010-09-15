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
/** StatusNet Namespace -- maybe we should just use SN? */
function StatusNet() {};

/**
 * Live database connection for local storage, if opened.
 * Most callers should rather use getDB().
 * @access private
 */
StatusNet.db = null;
StatusNet.settingsDialog = null; // used to ensure we have a singleton settings dialog

/**
 * Abstracted debug interface; for Desktop version calls Titanium's debug func.
 * @param string msg
 * @return void
 */
StatusNet.debug = function(msg) {
    Titanium.API.debug(msg);
};

StatusNet.error = function(msg) {
    Titanium.API.error(msg);
};

StatusNet.info = function(msg) {
    Titanium.API.info(msg);
};

/**
 * Lazy-open our local storage database.
 * @fixme move table definitions to shared code
 * @return database object
 */
StatusNet.getDB = function() {

    if (this.db === null) {

        var separator = Titanium.Filesystem.getSeparator();
        var dbFile = Titanium.Filesystem.getFile(
            Titanium.Filesystem.getApplicationDataDirectory() +
            separator +
            "statusnet.db"
        );

        StatusNet.debug(
            "Application data directory = "
            + Titanium.Filesystem.getApplicationDataDirectory()
        );

        this.db = Titanium.Database.openFile(dbFile);

        var sql = 'CREATE TABLE IF NOT EXISTS account (' +
            'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
            'username TEXT NOT NULL, ' +
            'password TEXT NOT NULL, ' +
            'apiroot TEXT NOT NULL, ' +
            'is_default INTEGER DEFAULT 0, ' +
            'profile_image_url TEXT, ' +
            'text_limit INTEGER DEFAULT 0, ' +
            'site_logo TEXT, ' +
            'UNIQUE (username, apiroot)' +
            ')';

        this.db.execute(sql);

        sql = 'CREATE TABLE IF NOT EXISTS entry (' +
            'notice_id INTEGER NOT NULL, ' +
            'atom_entry TEXT NOT NULL, ' +
            'PRIMARY KEY (notice_id)' +
            ')';

        this.db.execute(sql);

        sql = 'CREATE TABLE IF NOT EXISTS notice_entry (' +
            'notice_id INTEGER NOT NULL REFERENCES entry (notice_id), ' +
            'account_id INTEGER NOT NULL, ' +
            'timeline TEXT NOT NULL, ' +
            'timestamp INTEGER NOT NULL, ' +
            'PRIMARY KEY (notice_id, timeline, account_id)' +
            ')';

        this.db.execute(sql);

        sql = 'CREATE TABLE IF NOT EXISTS search_history (' +
            'searchterm TEXT NOT NULL' +
            ')';

        this.db.execute(sql);
    }

    return this.db;
};

/**
 * Abstract away completely gratuitous differences between database result
 * classes in Titanium Desktop and Mobile. Sigh.
 *
 * @param Titaniu.Database.ResultSet rs
 * @return int
 */
StatusNet.rowCount = function(rs) {
    return rs.rowCount();
};


/**
 * Show settings dialog
 */
StatusNet.showSettings = function() {
    // open a new settings dialog only if one isn't already open
    if (StatusNet.settingsDialog === null) {
        StatusNet.settingsDialog = Titanium.UI.getCurrentWindow().createWindow({
            url: 'app://settings.html',
            title: 'Settings',
            width: 400,
            height: 500});

        StatusNet.settingsDialog.addEventListener(
            'close',
            function() {
                StatusNet.settingsDialog = null;
            }, false
        );
        StatusNet.settingsDialog.open();
    } else {
        StatusNet.info("Settings dialog already open.");
    }
};

/**
 * Utility function to create a prototype for the subclass
 * that inherits from the prototype of the superclass.
 */
function heir(p) {
    function f(){}
    f.prototype = p;
    return new f();
};

/**
 * Utility function to validate a URL
 *
 * @todo This isn't all that great - only looks for http(s)
 *
 * @param String url the URL to validate
 *
 * @return boolean return value
 */
StatusNet.validUrl = function(url) {
    var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(url);
};

/**
 * Utility JQuery function to control the selection in an input.
 * Useful for positioning the carat.
 */
$.fn.selectRange = function(start, end) {
    return this.each(function() {
        if (this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(start, end);
        } else if (this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};

StatusNet.Event = function(sender) {
    StatusNet.debug("registering new event");
    this._sender = sender;
    StatusNet.debug("sender = " + sender);
    this._listeners = [];
};

StatusNet.Event.prototype.attach = function(listener) {
    StatusNet.debug("Attaching event listener");
    this._listeners.push(listener);
};

StatusNet.Event.prototype.notify = function(args) {
    if (args) {
        StatusNet.debug("Notify called with arg: " + Titanium.JSON.stringify(args));
    }
    for (var i = 0; i < this._listeners.length; i++) {
        this._listeners[i].call(this._sender, args);
    }
};

// str manip stolen from humane.js
StatusNet.strtotime = function(date_str) {
	var time = ('' + date_str).replace(/-/g,"/").replace(/[TZ]/g," ");
	return new Date(time).getTime();
}

StatusNet.Platform = {};

/**
 * Check the most appropriate size to fetch avatars for inline use
 * @return number
 */
StatusNet.Platform.avatarSize = function() {
    // @fixme someday sane high-res displays will exist, we should check
    return 48;
}

StatusNet.Platform.nativeNotifications = function() {

    // Snow Lep has notifications
    if (Titanium.Platform.name === "Darwin") {

        // XXX: @byosko says notifications don't work on 10.6.3, Should
        // we return false in that case?
        if (Titanium.Platform.version.substr(0, 4) === "10.6") {
            return true;
        } else {
            return false;
        }
    // We don't know whether the given Linux desktop supports it or not. 
    // XXX: Can we come up with some kind of check here? 
    } else if (Titanium.Platform.name === "Linux") {
        return false;
    } else if (Titanium.Platform.name === "Windows NT") {
        // XXX: Pretty brain-dead check for whether Snarl is installed.
        // but better than nothing.
        var snarl = Titanium.Filesystem.getFile("c:", "Program Files", "full phat", "Snarl", "snarl.exe");
        if (snarl) {
            return snarl.exist();
        } else {
            return false;
        }
    }

    // Must be some unknown platform from outer space
    StatusNet.debug("Name = " + Titanium.Platform.name);
    StatusNet.debug("Architecture = " + Titanium.Platform.architecture);
    StatusNet.debug("OS type = " + Titanium.Platform.ostype);
    StatusNet.debug("Version = " + Titanium.Platform.version);

    return false;
};

StatusNet.Platform.isMobile = function() {
    return false;
};

/**
 * Wrapper for platform-specific XML parser.
 *
 * @param string str
 * @return DOMDocument
 */
StatusNet.Platform.parseXml = function(str) {
    return (new DOMParser()).parseFromString(str, "text/xml");
};

/**
 * Wrapper for platform-specific XML output.
 *
 * @param DOMNode node
 * @return string
 */
StatusNet.Platform.serializeXml = function(node) {
    return (new XMLSerializer()).serializeToString(node);
};

/**
 * Wrapper for platform-specific Base-64 encoding.
 * Mysteriously this is in a different module on
 * Titanium Desktop and Titanium Mobile... and
 * has a different name too! Seriously?
 */
StatusNet.Platform.base64encode = function(data) {
    return Titanium.Codec.encodeBase64(data);
};

StatusNet.showNetworkError = function(status, xml, text, prefix) {
    var msg;
    if (xml != null && typeof xml == "object") {
        msg = $(xml).find('error').text();
    } else if (status == "exception") {
        msg = text;
    } else if (status == 401) {
        msg = 'Authorization error. If your password has changed, remove and recreate the account.';
    } else if (status == 0) {
        msg = 'Unknown network error.';
    } else if (status) {
        msg = 'HTTP ' + status + ' error.';
    } else {
        msg = "Unknown error: " + text;
    }
    StatusNet.error(prefix + msg);
    StatusNet.Infobar.flashMessage(prefix + msg);
};
