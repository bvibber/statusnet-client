function StatusNet() {
}

/**
 * Live database connection for local storage, if opened.
 * Most callers should rather use getDB().
 * @access private
 */
StatusNet.db = null;

/**
 * Lazy-open our local storage database.
 * @return database object
 */
StatusNet.getDB = function() {
    if (this.db === null) {

        var separator = Titanium.Filesystem.getSeparator();
        var dbFile = Titanium.Filesystem.getFile(Titanium.Filesystem.getResourcesDirectory() + separator + "statusnet.db");
        this.db = Titanium.Database.openFile(dbFile);
        this.db.execute("CREATE TABLE IF NOT EXISTS account (username varchar(255), password varchar(255), apiroot varchar(255), is_default integer default 0, PRIMARY KEY (username, apiroot))");
     }
     return this.db;
}

/**
 * Account info management constructor.
 * 
 * @param string _username
 * @param string _password
 * @param string _apiroot API base URL, eg 'http://identi.ca/api'
 * @return StatusNetAccount object
 */
function StatusNetAccount(_username, _password, _apiroot) {

    Titanium.API.debug('in StatusNetAccount()');

    this.username = _username;
    this.password = _password;
    this.apiroot  = _apiroot;

	/**
	 * Make sure we've recorded account credentials to the local database.
	 * If not already done, saves them.
	 * 
	 * @return boolean success
	 */
    this.ensure = function(db) {

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

	/**
	 * Start an asynchronous, authenticated API call.
	 * Currently only supports GET requests; any needed parameters
	 * must be in the method, as part of the path or query string.
	 * 
	 * @param string method URL fragment, appended to API root to create final URL.
	 * @param callable onSuccess callback function called after successful HTTP fetch: function(status, data)
	 * @param callable onError callback function called if there's a low-level HTTP error: function(status, thrown)
	 */
     this.fetchUrl = function(method, onSuccess, onError) {

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
}

/**
 * Load up the default account's credentials from the local database,
 * if any.
 * 
 * @return mixed StatusNetAccount object or null
 */
StatusNetAccount.getDefault = function(db) {

    Titanium.API.debug('in StatusNetAccount.getDefault()');

    row = db.execute('select * from account where is_default = 1');

    if (row.isValidRow()) {
        Titanium.API.debug('found an account');
        return new StatusNetAccount(row.fieldByName("username"), row.fieldByName("password"), row.fieldByName("apiroot"));
    } else {
        return null;
    }
}

/**
 * Constructor for UI controller for login dialog.
 * 
 * @param callback _onSuccess: function (StatusNetAccount account)
 * @return LoginDialog object
 */
function LoginDialog(_onSuccess) {
    this._onSuccess = _onSuccess;

	/**
	 * Build the login dialog in our HTML view.
	 * 
	 * After a successful login, the dialog is hidden, the avatar
	 * in the sidebar is updated to match the account and control
	 * transfers to the callback function provided to our constructor.
	 * 
	 * @return void
	 */
    this.show = function() {
        $("#content").append("<form id='loginform' method='GET'><br />Username: <input id='username' type='text' /><br />Password: <input id='password' type='password' /><br />API root: <input id='apiroot' type='text' /><br /><input type='button' name='Login' id='loginbutton' value='Login'/></form>");
        succfunc = this._onSuccess;
        $("#loginbutton").click(function() {

            var rootstr = $("#apiroot").val();
            var apiroot;

            lastchar = rootstr.charAt(rootstr.length - 1);
            if (lastchar === '/') {
                apiroot = rootstr;
            } else {
                apiroot = rootstr + '/';
            }

            var account = new StatusNetAccount($("#username").val(),
                                               $("#password").val(),
                                               apiroot);
            //alert("Got account: " + account.username + ", " + account.password + ", " + account.apiroot);

            account.fetchUrl('account/verify_credentials.xml',
                function(status, data) {
                    $("#loginform").hide();
                    alert("Successful login");

                    // Update the avatar in the sidebar
                    account.avatar = $(data).find('profile_image_url').text();
                    $('#nav_timeline_profile a > img').attr("src", account.avatar);

                    succfunc(account);
                },
                function(status, error) { alert("Got an error!"); });
            return false;
        });

    }
    
}

/**
 * Constructor for UI manager class for the client.
 *
 * @param StatusNetAccount _account
 * @return StatusNetClient object
 */
function StatusNetClient(_account) {
    this.account  = _account;
    this._timeline = "friends_timeline"; // which timeline are we currently showing?

    var server = this.account.apiroot.substr(0, this.account.apiroot.length - 4); // hack for now

    var profile = server + this.account.username;
    $('ul.nav li#nav_timeline_profile > a').attr('href', profile);

    var personal = server + this.account.username + '/all';
    $('ul.nav li#nav_timeline_personal > a').attr('href', personal);

    var replies = server + this.account.username + '/replies';
    $('ul.nav li#nav_timeline_replies > a').attr('href', replies);

    var public_timeline = server;
    $('ul.nav li#nav_timeline_public > a').attr('href', public_timeline);

	/**
	 * Clear the current notice list, then start reloading it.
	 * 
	 * @fixme May be best not to clear the old notices until
	 *        the async load is complete.
	 */
    this.refresh = function() {

        $('ul.notices').remove();

        switch (this._timeline) {
            case "friends_timeline":
                this.getFriendsTimeline();
                break;
            default:
                throw new Exception("Gah wrong timeline");
        }
    }

	/**
	 * Start an asynchronous loading of the friends timeline.
	 * Upon successful completion, the notice list is filled
	 * out with notices from the timeline.
	 */
    this.getFriendsTimeline = function() {

        Titanium.API.debug("in getFriendsTimeline()");

        $('address').addClass('processing');

        this.account.fetchUrl('statuses/friends_timeline.atom',
            function(status, data) {

            $('address').removeClass('processing');
            $('#nav_timeline_public').addClass('current');

            var html = [];

            Titanium.API.debug('Fetching friends_timline.atom');

            $(data).find('feed > entry').each(function() {
                var avatar = $(this).find('link[rel=avatar][media:width=48]').attr('href');
                var date = $(this).find('published').text();
                var desc = $(this).find('content').text();
                var author = $(this).find('author name').text();
                var link = $(this).find('author uri').text();


                html.push('<div style="margin:5px 0 10px 0;padding:5px;-webkit-border-radius:5px;background-color:#f2f2f2;">');
                html.push('   <div style="float:right;margin:5px 0 5px 10px;"><a href="'+link+'"><img height="48px" width="48px" src="'+avatar+'"/></a></div>');
                html.push('   <div><a style="font-size:14px;color:#000;text-decoration:none;font-weight:bold;" href="'+link+'">' + author + '</a><br/>');
                html.push('   <small style="font-size:0.8em;">' + date + '</small></div>');
                html.push('   <div style="margin-top:3px">'+desc +'<br/></div>');
                html.push('</div>');
                html.push('<div style="clear:both;"></div>');
            });

            $('#content').append(html.join(''));
            $('#content a').attr('rel', 'external');
		},
		function(status, thrown) {
			//Hrm, should probably do something here...
		});

	};

}
