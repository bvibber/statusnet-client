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

/**
 * Account info management constructor.
 *
 * @param string username
 * @param string password
 * @param string apiroot API base URL, eg 'http://identi.ca/api'
 * @return StatusNet.Account object
 */
StatusNet.Account = function(username, password, apiroot) {

    StatusNet.debug('in StatusNet.Account()');

    this.username = username;
    this.password = password;
    this.apiroot  = apiroot;
};

/**
 * Load up the default account's credentials from the local database,
 * if any.
 *
 * @return mixed StatusNet.Account object or null
 */
StatusNet.Account.getDefault = function(db) {

    StatusNet.debug('in StatusNet.Account.getDefault()');

    try {
        var row = db.execute('select * from account where is_default = 1');

        if (row.isValidRow()) {
            StatusNet.debug('found an account');
            var acct = StatusNet.Account.fromRow(row);
            // @FIXME UI-specific code needs to be moved!
            if (typeof Titanium.Desktop != "undefined") {
                $('ul.nav li#nav_timeline_profile > img').attr('src', acct.avatar);
            }
            row.close();
            return acct;
        } else {
            StatusNet.debug('did not find an account');
            return null;
        }
    } catch (e) {
        StatusNet.debug('Exception getting account: ' + e);
        return null;
    }
};

/**
 * Load up the a given account's full data by id.
 *
 * @return mixed StatusNet.Account object or null
 */
StatusNet.Account.getById = function(id) {
    var db = StatusNet.getDB();
    try {
        var row = db.execute('select * from account where id=?', id);

        if (row.isValidRow()) {
            StatusNet.debug('found an account for id ' + id);
            var acct = StatusNet.Account.fromRow(row);
            // @FIXME UI-specific code needs to be moved!
            if (typeof Titanium.Desktop != "undefined") {
                $('ul.nav li#nav_timeline_profile > img').attr('src', acct.avatar);
            }
            row.close();
            return acct;
        } else {
            StatusNet.debug('did not find an account for id ' + i);
            return null;
        }
    } catch (e) {
        StatusNet.debug('Exception getting account for id ' + id + ': ' + e);
        return null;
    }
};

/**
 * Set this account as the default.
 */
StatusNet.Account.prototype.setDefault = function(db) {
    try {
        db.execute("update account set is_default=0 where is_default=1");
        db.execute("update account set is_default=1 where username=? and apiroot=?",
            this.username, this.apiroot);
    } catch (e) {
        StatusNet.debug("Exception setting default account: " + e);
    }
};

/**
 * Load an Account object from a database row w/ info
 * @param Titanium.Database.ResultSet row
 * @return StatusNet.Account object
 */
StatusNet.Account.fromRow = function(row) {

    var ac = new StatusNet.Account(
        row.fieldByName("username"),
        row.fieldByName("password"),
        row.fieldByName("apiroot")
    );

    ac.id = row.fieldByName("id");
    ac.avatar = row.fieldByName("profile_image_url");
    ac.textLimit = row.fieldByName('text_limit');
    ac.siteLogo = row.fieldByName('site_logo');

    return ac;
};

/**
 * Load up all configured accounts from the database, if any.
 *
 * @return array of StatusNet.Account objects
 */
StatusNet.Account.listAll = function(db) {

    try {
        var accounts = [];

        result = db.execute('select * from account');
        while (result.isValidRow()) {
            accounts[accounts.length] = StatusNet.Account.fromRow(result);
            result.next();
        }
        result.close();
        return accounts;
    } catch (e) {
        StatusNet.debug("Exception setting getting accounts: " + e);
        return null;
    }
};

/**
 * Start an asynchronous, web call. If username and password are provided,
 * use HTTP Basic Auth.  If the data argument is supplied the request will
 * be a POST, otherwise it will be a GET. Any needed parameters for GET
 * must be in the url, as part of the path or query string.
 *
 * @param string   url         the URL
 * @param callable onSuccess   callback function called after successful HTTP fetch: function(status, response)
 * @param callable onError     callback function called if there's an HTTP error: function(status, response)
 * @param String   data        any POST data
 * @param String   username    optional username for HTTP Basic Auth
 * @param String   password    optional password for HTTP Basic Auth
 */
StatusNet.Account.webRequest = function(url, onSuccess, onError, data, username, password) {

    StatusNet.debug("in webRequest");

    try {

        var client = Titanium.Network.createHTTPClient();

        if (Titanium.Network.online == false) {
           StatusNet.debug("No internet.");
           onError(client, "No Internet connection!");
           return;
        }

        client.onload = function() {

            StatusNet.debug("webRequest: in onload, before parse " + this.status);

            StatusNet.debug(Titanium.version);

            var responseXML;
            if (this.responseXML == null) {
                if (typeof DOMParser != "undefined") {
                    // Titanium Desktop 1.0 doesn't fill out responseXML.
                    // We'll use WebKit's XML parser...
                    responseXML = (new DOMParser()).parseFromString(this.responseText, "text/xml");
                } else {
                    // Titanium Mobile 1.3 doesn't fill out responseXML on Android.
                    // We'll use Titanium's XML parser...
                    responseXML = Titanium.XML.parseString(this.responseText);
                }
            } else {
                responseXML = this.responseXML;
            }

            StatusNet.debug("webRequest: after parse, before onSuccess");

            if (this.status == 200) {
                StatusNet.debug("webRequest: calling onSuccess");
                onSuccess(this.status, responseXML);

                StatusNet.debug("webRequest: after onSuccess");

            } else {
                StatusNet.debug("webRequest: calling onError");

                onError(this.status, responseXML);
            }
            StatusNet.debug("webRequest: done with onload.");
        };

        // @fixme Hack to work around bug in the Titanium Desktop 1.2.1
        // onload will not fire unless there a function assigned to
        // onreadystatechange.
        client.onreadystatechange = function() {
            // NOP
        };

        if (data) {
            StatusNet.debug("HTTP POST to: " + url);
            client.open("POST", url);
        } else {
            StatusNet.debug("HTTP GET to: " + url);
            client.open("GET", url);
        }

        if (username && password) {
            // @fixme Desktop vs Mobile auth differences HTTPClient hack
            //
            // Titanium Mobile 1.3.0 seems to lack the ability to do HTTP basic auth
            // on its HTTPClient implementation. The setBasicCredentials method
            // claims to exist (typeof client.setBasicCredentials == 'function') however
            // calling it triggers an "invalid method 'setBasicCredentials:'" error.
            // The method is also not listed in the documentation for Mobile, nor do I see
            // it in the source code for the proxy object.
            //
            // Moreover, the Titanium.Utils namespace, which contains the base 64 utility
            // functions, isn't present on Desktop. So for now, we'll check for that and
            // use the manual way assuming it's mobile. Seriously, can't the core libs be
            // synchronized better?
            StatusNet.debug("webRequest: Titanium.Utils is: " + typeof Titanium.Utils);
            StatusNet.debug("webRequest: client.setBasicCredentials is: " + typeof client.setBasicCredentials);
            if (typeof Titanium.Utils == "undefined") {
                client.setBasicCredentials(username, password);
            } else {
                // @fixme Desktop vs Mobile auth differences HTTPClient hack
                // setRequestHeader must be called between open() and send()
                var auth = 'Basic ' + Titanium.Utils.base64encode(username + ':' + password);
                StatusNet.debug("webRequest: Authorization: " + auth);
                client.setRequestHeader('Authorization', auth);
            }
        }

        if (data) {
            client.send(data);
        } else {
            client.send();
        }

    } catch (e) {
        StatusNet.debug('webRequest: HTTP client exception: ' + e);
        onError(client, e);
    }
};

/**
 * HTTP GET an API resource using the crendials for this account
 *
 * @param String   method    API method to call -- will be appended to the API root
 * @param callable onSuccess callback function called after successful HTTP fetch: function(status, response)
 * @param callable onError   callback function called if there's an HTTP error: function(status, response)
 *
 */
StatusNet.Account.prototype.apiGet = function(method, onSuccess, onError) {
    StatusNet.Account.webRequest(this.apiroot + method, onSuccess, onError, null, this.username, this.password);
};

/**
 * HTTP POST to an API resource using the crendials for this account
 *
 * @param String   method    API method to call -- will be appended to the API root
 * @param String   data      POST data
 * @param callable onSuccess callback function called after successful HTTP fetch: function(status, response)
 * @param callable onError   callback function called if there's an HTTP error: function(status, response)
 *
 */
StatusNet.Account.prototype.apiPost = function(method, data, onSuccess, onError) {
    StatusNet.Account.webRequest(this.apiroot + method, onSuccess, onError, data, this.username, this.password);
};

/**
 * Make sure we've recorded account credentials to the local database.
 * If not already done, saves them.
 *
 * @return boolean success
 */
StatusNet.Account.prototype.ensure = function(db) {

    StatusNet.debug('in Account.ensure');

    StatusNet.debug("Avatar = " + this.avatar);
    StatusNet.debug("textLimit = " + this.textLimit);
    StatusNet.debug("siteLogo = " + this.siteLogo);

    try {
        var rs = db.execute("select * from account where username=? " +
                            "and apiroot=?",
                            this.username, this.apiroot);

        if (StatusNet.rowCount(rs) === 0) {

            rs = db.execute("INSERT INTO account " +
                            "(username, password, apiroot, is_default, profile_image_url, text_limit, site_logo) " +
                            "VALUES (?, ?, ?, 0, ?, ?, ?)",
                            this.username,
                            this.password,
                            this.apiroot,
                            this.avatar,
                            this.textLimit,
                            this.siteLogo);

            StatusNet.debug('inserted ' + db.rowsAffected + 'rows');

        }

        return true;
    } catch (e) {
        StatusNet.debug('ensure() - Exception saving credentials: ' + e);
        return false;
    }
};

/**
 * Is this the same?
 *
 * @param mixed other a StatusNet.Account or null
 * @return boolean
 */
StatusNet.Account.prototype.equals = function(other) {
    if (other == null || typeof other != "object") {
        return false;
    }
    return (typeof other == "object" &&
            this.username == other.username &&
            this.password == other.password &&
            this.apiroot == other.apiroot);
};

/**
 * Remove this account from the database, should it exist!
 * If we removed the default account, we'll set the first next available
 * account as the new default.
 */
StatusNet.Account.prototype.deleteAccount = function() {

    try {
        var db = StatusNet.getDB();

        StatusNet.debug("deleting...");
        db.execute("delete from account where username=? and apiroot=?",
                   this.username, this.apiroot);
        StatusNet.debug("deleted.");

        StatusNet.debug("checking default...");
        if (StatusNet.Account.getDefault(db) == null) {
            StatusNet.debug("setting new default...");
            // Set the first one we find as default if we removed the default...
            var row = db.execute("select * from account limit 1");
            if (row.isValidRow()) {
                var acct = StatusNet.Account.fromRow(row);
                acct.setDefault();
            }
            StatusNet.debug("new default set!");
        }
        StatusNet.debug("done deleting!");
    } catch (e) {
        StatusNet.debug('Exception deleting account: ' + e);
    }
};

/**
 * Get an attractive description of the hostname
 * @return string
 */
StatusNet.Account.prototype.getHost = function() {
    var matches = this.apiroot.match(/^(http|https):\/\/([^\/]+)/);
    if (matches) {
        return matches[2];
    } else {
        // hmmm
        return this.apiroot;
    }
};

/**
 * Is this account set up with a secure connection?
 * @return boolean
 */
StatusNet.Account.prototype.isSecure = function() {
    return (this.apiroot.match(/^https:/));
};
