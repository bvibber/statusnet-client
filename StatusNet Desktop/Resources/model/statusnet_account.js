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
}

/**
 * Load up the default account's credentials from the local database,
 * if any.
 *
 * @return mixed StatusNet.Account object or null
 */
StatusNet.Account.getDefault = function(db) {

    StatusNet.debug('in StatusNet.Account.getDefault()');

    row = db.execute('select * from account where is_default = 1');

    if (row.isValidRow()) {
        StatusNet.debug('found an account');
        var acct = StatusNet.Account.fromRow(row);
        $('ul.nav li#nav_timeline_profile > img').attr('src', acct.avatar);
        row.close();
        return acct;
    } else {
        StatusNet.debug('did not find an account');
        return null;
    }
}

/**
 * Set this account as the default.
 */
StatusNet.Account.prototype.setDefault = function(db) {
    db.execute("update account set is_default=0 where is_default=1");
    db.execute("update account set is_default=1 where username=? and apiroot=?",
               this.username, this.apiroot);
}

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

    ac.avatar = row.fieldByName("profile_image_url");
    StatusNet.debug("Account.fromRow - Avatar now = " + ac.avatar);

    return ac;
}

/**
 * Load up all configured accounts from the database, if any.
 *
 * @return array of StatusNet.Account objects
 */
StatusNet.Account.listAll = function(db) {

    var accounts = [];

    result = db.execute('select * from account');
    while (result.isValidRow()) {
        accounts[accounts.length] = StatusNet.Account.fromRow(result);
        result.next();
    }
    result.close();
    return accounts;
}

/**
 * Start an asynchronous, authenticated API call.
 * Currently only supports GET requests; any needed parameters
 * must be in the method, as part of the path or query string.
 *
 * @param string method URL fragment, appended to API root to create final URL.
 * @param callable onSuccess callback function called after successful HTTP fetch: function(status, data)
 * @param callable onError callback function called if there's a low-level HTTP error: function(status, thrown)
 */
StatusNet.Account.prototype.fetchUrl = function(method, onSuccess, onError) {

    StatusNet.debug('in fetchUrl');

    var client = Titanium.Network.createHTTPClient();

    client.onload = function() {
        if (this.status == 200) {

            // @fixme Argh. responseXML is unimplemented in Titanium 1.2.1 So we have
            // to use this work-around.
            var responseXML = (new DOMParser()).parseFromString(this.responseText, "text/xml");

            onSuccess(this.status, responseXML);
        } else {
            onError(client, "HTTP status: " + this.status);
        }
    };

    client.onerror = function(e) {
        onError(client, "Error: " + e.error);
    }

    client.setBasicCredentials(this.username, this.password);

    // @fixme Hack to work around bug in the Titanium Desktop 1.2.1
    // onload will not fire unless there a function assigned to
    // onreadystatechange.
    client.onreadystatechange = function() {
        // NOP
    };

    client.open("GET", this.apiroot + method);
    client.send();
}

StatusNet.Account.prototype.postUrl = function(method, data, onSuccess, onError) {

    StatusNet.debug('in postUrl');

    var client = Titanium.Network.createHTTPClient();

    client.onload = function() {
        if (this.status == 200) {
            var json = JSON.parse(this.responseText)
            onSuccess(this.status, json);
        } else {
            onError(client, 'HTTP status: ' + this.status);
        }
    };

    client.onerror = function(e) {
        onError(client, "Error: " + e.error);
    }

    client.setBasicCredentials(this.username, this.password);

    // @fixme Hack to work around bug in the Titanium Desktop 1.2.1
    // onload will not fire unless there a function assigned to
    // onreadystatechange.
    client.onreadystatechange = function() {
        // NOP
    };

    client.open("POST", this.apiroot + method);
    client.send(data);
}

/**
 * Make sure we've recorded account credentials to the local database.
 * If not already done, saves them.
 *
 * @return boolean success
 * @fixme escape values going into SQL!
 */
StatusNet.Account.prototype.ensure = function(db, data) {

    StatusNet.debug('in Account.ensure');

    var avatarUrl = $(data).find('profile_image_url').text();

    var rs = db.execute("select * from account where username = '" + this.username + "' and apiroot = '" + this.apiroot + "'");

    if (rs.rowCount() === 0) {

        rs = db.execute("INSERT INTO account (username, password, apiroot, is_default, profile_image_url) " +
            "VALUES ('"+this.username+"', '"+this.password+"', '"+this.apiroot+"', 0, '" + avatarUrl + "')");

        StatusNet.debug('inserted ' + db.rowsAffected + 'rows');

    }

    return true;
}
