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
/** StatusNet Namespace -- maybe we should just use SN? */
function StatusNet() {};

/**
 * Live database connection for local storage, if opened.
 * Most callers should rather use getDB().
 * @access private
 */
StatusNet.db = null;

/**
 * Abstracted debug interface; for Desktop version calls Titanium's debug func.
 * @param string msg
 * @return void
 */
StatusNet.debug = function(msg) {
    Titanium.API.debug(msg);
};

/**
 * Lazy-open our local storage database.
 * @fixme move table definitions to shared code
 * @return database object
 */
StatusNet.getDB = function() {

    if (this.db === null) {

        this.db = Titanium.Database.open('statusnet');

        var sql = 'CREATE TABLE IF NOT EXISTS account ('
            + 'id INTEGER PRIMARY KEY AUTOINCREMENT, '
            + 'username TEXT NOT NULL, '
            + 'password TEXT NOT NULL, '
            + 'apiroot TEXT NOT NULL, '
            + 'is_default INTEGER DEFAULT 0, '
            + 'profile_image_url TEXT, '
            + 'text_limit INTEGER DEFAULT 0, '
            + 'site_logo TEXT, '
            + 'UNIQUE (username, apiroot)'
            + ')';

        this.db.execute(sql);

        sql = 'CREATE TABLE IF NOT EXISTS entry ('
            + 'notice_id INTEGER NOT NULL, '
            + 'atom_entry TEXT NOT NULL, '
            + 'PRIMARY KEY (notice_id)'
            + ')';

        this.db.execute(sql);

        sql = 'CREATE TABLE IF NOT EXISTS notice_entry ('
            + 'notice_id INTEGER NOT NULL REFERENCES entry (notice_id), '
            + 'account_id INTEGER NOT NULL, '
            + 'timeline TEXT NOT NULL, '
            + 'timestamp INTEGER NOT NULL, '
            + 'PRIMARY KEY (notice_id, timeline, account_id)'
            + ')';

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
    return rs.rowCount;
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

StatusNet.Event = function(sender) {
    StatusNet.debug("registering new event");
    this._sender = sender;
    StatusNet.debug("sender = " + sender);
    this._listeners = [];
}

StatusNet.Event.prototype.attach = function(listener) {
    StatusNet.debug("Attaching event listener");
    this._listeners.push(listener);
}

StatusNet.Event.prototype.notify = function(args) {
    if (args) {
        // no JSON on mobile
        //StatusNet.debug("Notify called with arg: " + Titanium.JSON.stringify(args));
        StatusNet.debug("Notify called with arg: " + args);
    }
    for (var i = 0; i < this._listeners.length; i++) {
        this._listeners[i].call(this._sender, args);
    }
}

/**
 * Wrapper functions wooo
 */
StatusNet.Platform = {
    /**
     * Check the most appropriate size to fetch avatars for inline use
     * @return number
     */
    avatarSize: function() {
        if (StatusNet.Platform.dpi >= 240) {
            return 96;
        } else {
            return 48;
        }
    },

    dpi: Titanium.Platform.displayCaps.dpi,

    isApple: function() {
        return Titanium.Platform.osname == "iphone" || Titanium.Platform.osname == "ipad";
    },

    isAndroid: function() {
        return Titanium.Platform.osname == "android";
    },

    /**
     * Returns an appropriate background color for dialog box-style screens
     * on the current platform.
     *
     * @return string
     */
    dialogBackground: function() {
        if (this.isAndroid()) {
            // Android dialogs are mostly white-on-black
            return "black";
        } else if (this.isApple()) {
            // iOS likes a light gray-bluish BG
            return "#bbbfcc";
        }
        return "#eee"; // ???
    }
};
StatusNet.Platform.hasNavBar = StatusNet.Platform.isApple;
StatusNet.Platform.hasMenu = StatusNet.Platform.isAndroid;

StatusNet.Platform.createNavBar = function(window) {

    var navbar;
/*
    if (StatusNet.Platform.hasNavBar()) {
        // Native navigation bar!
        navbar = {
            height: 0,
            setLeftNavButton: function(button) {
                window.setLeftNavButton(button);
            },
            setRightNavButton: function(button) {
                window.setRightNavButton(button);
            }
        };
        return navbar;
    } else {
*/
        // Emulated!
        var height = 44;
        var view = Titanium.UI.createView({
            top: 0,
            left: 0,
            right: 0,
            height: height,
            //backgroundColor: "#bbbfcc" // ?!
            backgroundImage: "images/bg/navbar.png"
        });
        window.add(view);

        var label = Titanium.UI.createLabel({
            text: window.title,
            font: {fontSize: height / 2, fontWeight: 'bold'},
            textAlign: 'center',
            top: 4,
            bottom: 4,
            color: 'white'
        });
        view.add(label);

        navbar = {
            _view: view,
            _label: label,
            _left: null,
            _right: null,
            height: height,
            setLeftNavButton: function(button) {
                if (navbar._left) {
                    navbar._view.remove(navbar._left);
                }
                if (button) {
                    button.left = 4;
                    button.top = 4;
                    button.bottom = 4;
                    button.width = 75;
                    navbar._view.add(button);
                }
                navbar._left = button;
            },
            setRightNavButton: function(button) {
                if (navbar._right) {
                    navbar._view.remove(navbar._right);
                }
                if (button) {
                    button.right = 4;
                    button.top = 4;
                    button.bottom = 4;
                    button.width = 50;
                    navbar._view.add(button);
                }
                navbar._right = button;
            }
        };

        return navbar;
 //   }
};

/**
 * Wrapper for platform-specific XML parser.
 *
 * @param string str
 * @return DOMDocument
 */
StatusNet.Platform.parseXml = function(str) {
    return Titanium.XML.parseString(str);
}

// Custom patch for feature request...
// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1452-need-way-to-serialize-dom-trees-back-to-xml-on-mobile-save-xml-output
if (typeof Titanium.XML.serializeToString == "function") {
    /**
     * Wrapper for platform-specific XML output.
     *
     * @param DOMNode node
     * @return string
     */
    StatusNet.Platform.serializeXml = Titanium.XML.serializeToString;
}
