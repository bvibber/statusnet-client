/**
 * Account info management constructor.
 *
 * @param string username
 * @param string password
 * @param string apiroot API base URL, eg 'http://identi.ca/api'
 * @return StatusNet.Account object
 */
StatusNet.Account = function(username, password, apiroot) {

    Titanium.API.debug('in StatusNet.Account()');

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

    Titanium.API.debug('in StatusNet.Account.getDefault()');

    row = db.execute('select * from account where is_default = 1');

    if (row.isValidRow()) {
        Titanium.API.debug('found an account');
        return new StatusNet.Account(
            row.fieldByName("username"),
            row.fieldByName("password"),
            row.fieldByName("apiroot")
        );
    } else {
        Titanium.API.debug('did not find an account');
        return null;
    }
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

     Titanium.API.debug('in fetchUrl()');

     $.ajax({ url: this.apiroot + method,
         username: this.username,
         password: this.password,
         success: function(data, status, xhr) {
             onSuccess(status, data);
         },
         error: function(xhr, status, thrown) {
             onError(status, thrown);
         }
    });

}

StatusNet.Account.prototype.postUrl = function(method, data, onSuccess, onError) {

    Titanium.API.debug('in postUrl()');

     $.ajax({ url: this.apiroot + method,
         username: this.username,
         password: this.password,
         type: 'POST',
         data: data,
         dataType: 'json',
         success: function(data, status, xhr) {
             onSuccess(status, data);
         },
         error: function(xhr, status, thrown) {
             onError(xhr, status, thrown);
         }
    });
}

/**
 * Make sure we've recorded account credentials to the local database.
 * If not already done, saves them.
 *
 * @return boolean success
 * @fixme escape values going into SQL!
 */
StatusNet.Account.prototype.ensure = function(db) {

    Titanium.API.debug('in ensure()');

    var rs = db.execute("select * from account where username = '" + this.username + "' and apiroot = '" + this.apiroot + "'");

    if (rs.rowCount() === 0) {
        Titanium.API.debug('account table is empty');

        rs = db.execute("INSERT INTO account (username, password, apiroot, is_default) " +
            "VALUES ('"+this.username+"', '"+this.password+"', '"+this.apiroot+"', 1)");

        Titanium.API.debug('inserted ' + db.rowsAffected + 'rows');

      }

      return true;
 }
