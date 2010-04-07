/** StatusNet Namespace -- maybe we should just use SN? */
function StatusNet() {}

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
        var dbFile = Titanium.Filesystem.getFile(
            Titanium.Filesystem.getApplicationDataDirectory() +
            separator +
            "statusnet.db"
        );

        Titanium.API.debug("app dir = " + Titanium.Filesystem.getApplicationDataDirectory());

        this.db = Titanium.Database.openFile(dbFile);
        this.db.execute("CREATE TABLE IF NOT EXISTS account (username varchar(255), password varchar(255), apiroot varchar(255), is_default integer default 0, PRIMARY KEY (username, apiroot))");
     }
     return this.db;
}

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

/**
 * Constructor for UI controller for login dialog.
 *
 * @param callback _onSuccess: function (StatusNet.Account account)
 * @return LoginDialog object
 */
StatusNet.LoginDialog = function(_onSuccess) {
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
        var self = this;
        $("#loginform").submit(function() {
            self.onSubmit();
        });
        $("#loginbutton").click(function() {
            self.onSubmit();
        });
    }

    /**
     * Handle login form processing.
     *
     * Credentials are checked asynchronously; on success we'll
     * hide the dialog and open up a friends timeline view.
     */
    this.onSubmit = function() {
        var rootstr = $("#apiroot").val();
        var apiroot;

        lastchar = rootstr.charAt(rootstr.length - 1);
        if (lastchar === '/') {
            apiroot = rootstr;
        } else {
            apiroot = rootstr + '/';
        }

        var account = new StatusNet.Account($("#username").val(),
                                           $("#password").val(),
                                           apiroot);
        //alert("Got account: " + account.username + ", " + account.password + ", " + account.apiroot);

        var succfunc = this._onSuccess;
        account.fetchUrl('account/verify_credentials.xml',
            function(status, data) {
                $("#loginform").hide();
                Titanium.API.debug("Successful login");

                // Update the avatar in the sidebar
                account.avatar = $(data).find('profile_image_url').text();
                $('#nav_timeline_profile a > img').attr("src", account.avatar);

                succfunc(account);
            },
            function(status, error) { alert("Got an error!"); });
        return false;
    }
}

/**
 * Constructor for UI manager class for the client.
 *
 * @param StatusNet.Account _account
 * @return StatusNet.Client object
 */
StatusNet.Client = function(_account) {
    this.account  = _account;
    this._timeline = "friends_timeline"; // which timeline are we currently showing?

    this.timeline = null;

    this.view = new StatusNet.TimelineViewFriends(this);
    this.timeline = new StatusNet.TimelineFriends(this);

    this.timeline.update();

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
                this.timeline.update();
                break;
            default:
                throw new Exception("Gah wrong timeline");
        }
    }

}

/**
 * Constructor for base timeline model class
 *
 * @param StatusNet.Client       client the controller
 * @param StatusNet.TimelineView view   the view
 */
StatusNet.Timeline = function(client, view) {

    this.client = client;
    this.view = this.client.view;
    this.account = this.client.account;

    this._statuses = new Array();

    Titanium.API.debug("StatusNet.Timeline constructor");
}

/**
 * Update the timeline.  Does a fetch of the Atom feed for the appropriate
 * timeline and notifies the view the model has changed.
 */
StatusNet.Timeline.prototype.update = function() {

    var that = this;  // Provide inner helper with outer function's context

    this.account.fetchUrl(this.url,

        function(status, data) {

            Titanium.API.debug('Fetching ' + this.url);

            $(data).find('feed > entry').each(function() {

                var status = {};

                // note: attribute selectors seem to have problems with [media:width=48]
                var avatar = 'about:blank';
                $(this).find('link[rel=avatar]').each(function(i, el) {
                    if ($(el).attr('media:width') == '48') {
                        status.avatar = $(el).attr('href');
                    }
                });
                Titanium.API.debug(status.avatar);
                status.date = $(this).find('published').text();
                status.desc = $(this).find('content').text();
                status.author = $(this).find('author name').text();
                status.link = $(this).find('author uri').text();

                Titanium.API.debug("got status");

                that._statuses.push(status);

            });

            // use events instead? Observer?
            that.view.show();
        },
        function(status, thrown) {
            Titanium.API.debug("Someting went wrong retreiving timeline.");
            alert("Couldn't get timeline.");
        }
    );

}

/**
 * Accessor for statuses
 *
 * @return Array an array of statuses
 */
StatusNet.Timeline.prototype.getStatuses = function() {
    return this._statuses;
}

/**
 * Base class for Timeline view
 *
 * @param StatusNet.Client client  The controller
 */
StatusNet.TimelineView = function(client) {
    Titanium.API.debug("in StatusNet.TimelineView");
    this.client = client;
}

/**
 * Render the HTML display of a given timeline
 *
 */
StatusNet.TimelineView.prototype.show = function () {

    var statuses = this.client.timeline.getStatuses();

    if (statuses) {

        var html = [];

        for (i = 0; i < statuses.length; i++) {
            html.push('<div class="notice">');
            html.push('   <div class="avatar"><a href="' + statuses[i].link + '"><img src="' + statuses[i].avatar + '"/></a></div>');
            html.push('   <div><a class="author" href="' + statuses[i].link + '">' + statuses[i].author + '</a><br/>');
            html.push('   <small class="date">' + statuses[i].date + '</small></div>');
            html.push('   <div class="content">'+ statuses[i].desc +'<br/></div>');
            html.push('</div>');
            html.push('<div class="clear"></div>');
        }

        $('#content').append(html.join(''));
        $('#content a').attr('rel', 'external');
    }

}

/* ------------------- Subclasses ------------------- */

/**
 * Utility function to create a prototype for the subclass
 * that inherits from the prototype of the superclass.
 */
function heir(p) {
    function f(){}
    f.prototype = p;
    return new f();
}

/**
 * Constructor for friends timeline model
 */
StatusNet.TimelineFriends = function(client) {
    StatusNet.Timeline.call(this, client);

    this.url = 'statuses/friends_timeline.atom';

}

// Make StatusNet.TimelineFriends inherit Timeline's prototype
StatusNet.TimelineFriends.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for a view for a friends timeline
 */
StatusNet.TimelineViewFriends = function(client) {
    StatusNet.TimelineView.call(this, client);
}

// Make StatusNet.TimelineViewFriends inherit TimelineView's prototype
StatusNet.TimelineViewFriends.prototype = heir(StatusNet.TimelineView.prototype);



