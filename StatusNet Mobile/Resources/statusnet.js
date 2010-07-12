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
 * Show settings dialog
 * @fixme make sure it's a singleton!
 */
StatusNet.showSettings = function() {
    client.setActiveTab('settings');
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
        StatusNet.debug("Notify called with arg: " + Titanium.JSON.stringify(args));
    }
    for (var i = 0; i < this._listeners.length; i++) {
        this._listeners[i].call(this._sender, args);
    }
}

