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

    this.account = _account;

    this.init();

    this._timeline = "friends_timeline"; // which timeline are we currently showing?

    this.view = new StatusNet.TimelineViewFriends(this);
    this.timeline =  new StatusNet.TimelineFriends(this);

    this.timeline.update();

}

/**
 * Switch the view to a specified timeline
 *
 * @param String timeline   the timeline to show
 */
StatusNet.Client.prototype.switchTimeline = function(timeline) {

    Titanium.API.debug("StatusNet.Client.prototype.switchTimeline()");

    switch (timeline) {

        case 'public':
            this._timeline = 'public';
            this.view = new StatusNet.TimelineViewPublic(this);
            this.timeline = new StatusNet.TimelinePublic(this);
            break;
        case 'user':
            this._timeline = 'user';
            this.view = new StatusNet.TimelineViewUser(this);
            this.timeline = new StatusNet.TimelineUser(this);
            break;
        case "friends":
            this._timeline = 'friends';
            this.view = new StatusNet.TimelineViewFriends(this);
            this.timeline = new StatusNet.TimelineFriends(this);
            break;
        case 'mentions':
            this._timeline = 'mentions';
            this.view = new StatusNet.TimelineViewMentions(this);
            this.timeline = new StatusNet.TimelineMentions(this);
            break;
        case 'favorites':
            this._timeline = 'favorites';
            this.view = new StatusNet.TimelineViewFavorites(this);
            this.timeline = new StatusNet.TimelineFavorites(this);
            break;
        default:
            throw new Exception("Gah wrong timeline");
    }

    StatusNet.Sidebar.setSelectedTimeline(timeline);
    this.timeline.update();

}

/**
 * Reload timeline notices
 */
StatusNet.Client.prototype.refresh = function() {
    this.timeline.update();
}

/**
 * General initialization stuff
 */
StatusNet.Client.prototype.init = function() {

    that = this;

    this.server = this.account.apiroot.substr(0, this.account.apiroot.length - 4); // hack for now

    // Add event handlers for buttons

    $('#public_img').bind('click', function() { that.switchTimeline('public') });
    $('#friends_img').bind('click', function() { that.switchTimeline('friends') });
    $('#user_img').bind('click', function() { that.switchTimeline('user') });
    $('#mentions_img').bind('click', function() { that.switchTimeline('mentions') });
    $('#favorites_img').bind('click', function() { that.switchTimeline('favorites') });

    // until we have private message timelines working
    var inbox = this.server + this.account.username + '/inbox';
    $('ul.nav li#nav_timeline_inbox > a').attr('href', inbox);

    // until we have built-in search working
    var search = this.server + 'search/notice';
    $('ul.nav li#nav_timeline_search > a').attr('href', search);

    // post a new notice
    $('#update_button').bind('click', function() { that.postNotice(); });

    // refresh timeline when window is clicked
    $("#content").bind('click', function() { that.refresh(); });

    // make links open in an external browser window
    $('a[rel=external]').live('click', function() {
        Titanium.Desktop.openURL($(this).attr('href'));
        return false;
    });

}

/**
 * Post a notice
 */
StatusNet.Client.prototype.postNotice = function()
{
    var url = 'statuses/update.json';

    var noticeText = $('#notice_textarea').val();

    var params = { status: noticeText,
                   source: 'StatusNet Desktop'
                 };

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            Titanium.API.debug(data);
            Titanium.API.debug(data.user);

            var status = {};

            status.noticeId = data.id;
            status.avatar = data.user.profile_image_url;
            status.date = data.created_at;
            status.desc = data.text;
            status.author = data.user.screen_name;
            status.link = that.account.server + '/' + data.user.screen_name;

            that.timeline.addStatus(status, true);
            that.view.show();

            //$('#statuses > div.notice:first').before(data.text);
        },
        function(xhr, status, thrown) {
            Titanium.API.debug(
                XMLHttpRequest.status +
                ' - ' +
                XMLHttpRequest.responseText
            );

            alert('Couldn\'t post notice - ' + XMLHttpRequest.status);
        }
    );

}

/**
 * View class for managing the sidebar
 *
 */
StatusNet.Sidebar = function(client) {
    Titanium.API.debug("StatusNet.sidebar()");
    this.client = client;
}

/**
 * Class method to higlight the icon associated with the selected timeline
 *
 * @param String timeline   the timeline to highlight
 */
StatusNet.Sidebar.setSelectedTimeline = function(timeline) {

    switch(timeline) {
        case 'friends':
            $('#friends_img').attr('src', '/images/blue/Chat.png');
            $('#mentions_img').attr('src', '/images/At.png');
            $('#favorites_img').attr('src', '/images/star.png');
            break;
        case 'mentions':
            $('#friends_img').attr('src', '/images/Chat.png');
            $('#mentions_img').attr('src', '/images/blue/At.png');
            $('#favorites_img').attr('src', '/images/star.png');
            break;
        case 'favorites':
            $('#friends_img').attr('src', '/images/Chat.png');
            $('#mentions_img').attr('src', '/images/At.png');
            $('#favorites_img').attr('src', '/images/blue/star.png');
            break;
        default:
            $('#friends_img').attr('src', '/images/Chat.png');
            $('#mentions_img').attr('src', '/images/At.png');
            $('#favorites_img').attr('src', '/images/star.png');

            // @todo Do something for public and user...

            Titanium.API.debug("I don\'t know how to highlight this timeline.");
            break;
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
 * Add a notice to the Timeline if it's not already in it.
 */
StatusNet.Timeline.prototype.addStatus = function(status, prepend) {

    // dedupe here?
    for (i = 0; i < this._statuses.length; i++) {
        if (this._statuses[i].noticeId === status.noticeId) {
            Titanium.API.debug("skipping duplicate notice: " + status.noticeId);
            return;
        }
    }

    if (prepend) {
        this._statuses.unshift(status);
    } else {
        this._statuses.push(status);
    }
}

/**
 * Update the timeline.  Does a fetch of the Atom feed for the appropriate
 * timeline and notifies the view the model has changed.
 */
StatusNet.Timeline.prototype.update = function() {

    var that = this;  // Provide inner helper with outer function's context

    this.account.fetchUrl(this.url,

        function(status, data) {

            Titanium.API.debug('Fetching ' + that.url);

            $(data).find('feed > entry').each(function() {

                var status = {};

                // note: attribute selectors seem to have problems with [media:width=48]
                var avatar = 'about:blank';
                $(this).find('link[rel=avatar]').each(function(i, el) {
                    if ($(el).attr('media:width') == '48') {
                        status.avatar = $(el).attr('href');
                    }
                });

                // Pull notice ID from permalink
                var idRegexp = /(\d)+$/;
                var permalink = $(this).find('id').text();
                result = permalink.match(idRegexp);

                if (result) {
                    status.noticeId = result[0];
                }

                status.date = $(this).find('published').text();
                status.desc = $(this).find('content').text();
                status.author = $(this).find('author name').text();
                status.link = $(this).find('author uri').text();

                that.addStatus(status, false);

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

        var html = new Array();

        for (i = 0; i < statuses.length; i++) {
            html.push('<div class="notice">');
            html.push('   <div class="avatar"><a href="' + statuses[i].link + '"><img src="' + statuses[i].avatar + '"/></a></div>');
            html.push('   <div><a class="author" href="' + statuses[i].link + '">' + statuses[i].author + '</a><br/>');
            html.push('   <small class="date">' + statuses[i].date + '</small></div>');
            html.push('   <div class="content">'+ statuses[i].desc +'<br/></div>');
            html.push('</div>');
            html.push('<div class="clear"></div>');
        }

        $('#statuses').empty();
        $('#statuses').append(html.join(''));
        $('.notice a').attr('rel', 'external');
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

    // set window title here?

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

/**
 * Constructor for mentions timeline model
 */
StatusNet.TimelineMentions = function(client) {
    StatusNet.Timeline.call(this, client);

    this.url = 'statuses/mentions.atom';

}

// Make StatusNet.TimelineMentions inherit Timeline's prototype
StatusNet.TimelineMentions.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for a view for mentions timeline
 */
StatusNet.TimelineViewMentions = function(client) {
    StatusNet.TimelineView.call(this, client);
}

// Make StatusNet.TimelineViewMentions inherit TimelineView's prototype
StatusNet.TimelineViewMentions.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Constructor for public timeline model
 */
StatusNet.TimelinePublic = function(client) {
    StatusNet.Timeline.call(this, client);

    this.url = 'statuses/public_timeline.atom';

}

// Make StatusNet.TimelinePublic inherit Timeline's prototype
StatusNet.TimelinePublic.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for a view for public timeline
 */
StatusNet.TimelineViewPublic = function(client) {
    StatusNet.TimelineView.call(this, client);
}

// Make StatusNet.TimelineViewPublic inherit TimelineView's prototype
StatusNet.TimelineViewPublic.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Constructor for user timeline model
 */
StatusNet.TimelineUser = function(client) {
    StatusNet.Timeline.call(this, client);

    this.url = 'statuses/user_timeline.atom';

}

// Make StatusNet.TimelineUser inherit Timeline's prototype
StatusNet.TimelineUser.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for user's timeline
 */
StatusNet.TimelineViewUser = function(client) {
    StatusNet.TimelineView.call(this, client);
}

// Make StatusNet.TimelineViewUser inherit TimelineView's prototype
StatusNet.TimelineViewUser.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Constructor for favorites timeline model
 */
StatusNet.TimelineFavorites = function(client) {
    StatusNet.Timeline.call(this, client);

    this.url = 'favorites.atom';

}

// Make StatusNet.TimelineFavorites inherit Timeline's prototype
StatusNet.TimelineFavorites.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for a view for favorites timeline
 */
StatusNet.TimelineViewFavorites = function(client) {
    StatusNet.TimelineView.call(this, client);
}

// Make StatusNet.TimelineViewFavorites inherit TimelineView's prototype
StatusNet.TimelineViewFavorites.prototype = heir(StatusNet.TimelineView.prototype);

