function StatusNet() {
}

StatusNet.db = null;

initPanel = function() {

    Titanium.API.debug('in initPanel');
    $('.nav').hide();

    $('address').click(function() {
        if ($('#aside_primary').hasClass('open') === true) {
            $('#aside_primary').removeClass('open');
            $('.nav').hide();
        }
        else {
            $('#aside_primary').addClass('open');
            $('.nav').show();
        }
    });
}


StatusNet.getDB = function() {
    if (this.db === null) {

        var separator = Titanium.Filesystem.getSeparator();
        var dbFile = Titanium.Filesystem.getFile(Titanium.Filesystem.getResourcesDirectory() + separator + "statusnet.db");
        this.db = Titanium.Database.openFile(dbFile);
        rs = this.db.execute("CREATE TABLE IF NOT EXISTS account (username varchar(255), password varchar(255), apiroot varchar(255), is_default integer default 0, PRIMARY KEY (username, apiroot))");
        rs.close();
     }
     return this.db;
}

function StatusNetAccount(_username, _password, _apiroot) {

    Titanium.API.debug('in StatusNetAccount()');

    this.username = _username;
    this.password = _password;
    this.apiroot  = _apiroot;

    this.ensure = function(db) {

        Titanium.API.debug('in ensure()');

        var rs = db.execute("select * from account where username = '" + this.username + "' and apiroot = '" + this.apiroot + "'");

        if (rs.rowCount() === 0) {
            Titanium.API.debug('account table is empty');

            rs = db.execute("INSERT INTO account (username, password, apiroot, is_default) " +
                "VALUES ('"+this.username+"', '"+this.password+"', '"+this.apiroot+"', 1)");

            Titanium.API.debug('inserted ' + db.rowsAffected + 'rows');

            rs.close();

          }

          return true;
     }

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

function LoginDialog(_onSuccess) {
    this._onSuccess = _onSuccess;

    this.show = function() {
        $("#content").append("<form id='loginform' method='GET'><br />Username: <input id='username' type='text' /><br />Password: <input id='password' type='password' /><br />API root: <input id='apiroot' type='text' /><br /><input type='button' name='Login' id='loginbutton' value='Login'/></form>");
        succfunc = this._onSuccess;
        $("#loginbutton").click(function() {
            var account = new StatusNetAccount($("#username").val(),
                                               $("#password").val(),
                                               $("#apiroot").val());
            //alert("Got account: " + account.username + ", " + account.password + ", " + account.apiroot);

            account.fetchUrl('account/verify_credentials.xml',
                             function(status, data) { $("#loginform").hide(); alert("Successful login"); succfunc(account); },
                             function(status, error) { alert("Got an error!"); });
            return false;
        });
    }
}

function StatusNetClient(_account) {
    this.account  = _account;
    this._timeline = "friends_timeline"; // which timeline are we currently showing?

    this.refresh = function() {
        switch (this._timeline) {
            case "friends_timeline":
                this.getFriendsTimeline();
                break;
            default:
                throw new Exception("Gah wrong timeline");
        }
    }

    this.getFriendsTimeline = function() {

        Titanium.API.debug("in getFriendsTimeline()");

        $("#nav img").show();

        $('address').addClass('processing');

        this.account.fetchUrl('statuses/friends_timeline.atom',
            function(status, data) {

            $('address').removeClass('processing');
            $('#nav_timeline_public').addClass('current');

            var html = [];

            Titanium.API.debug('Fetching friends_timline.atom');

            $("#nav img").hide();

            html.push('<ul class="notices">');

            $(data).find('feed > entry').each(function() {
                var avatar = $(this).find('link[rel=avatar][media:width=48]').attr('href');
                var date = $(this).find('published').text();
                var desc = $(this).find('content').text();
                var author = $(this).find('author name').text();
                var link = $(this).find('author uri').text();

                html.push('<li class="notice">');
                html.push('    <div class="entry-title">');
                html.push('        <span class="author vcard"><a class="url" href="'+link+'">'+'<img class="photo" height="48px" width="48px" src="'+avatar+'"/>'+' '+author+'</a></span>');
                html.push('        <p class="entry-content">'+desc+'</p>');
                html.push('    </div>');

                html.push('    <div class="entry-content">');
                html.push('        <abbr>'+date+'</abbr>');
                html.push('    </div>');
                html.push('</li>');
            });

            html.push('</ul>');

            $('#content').append(html.join(''));
            $('#content a').attr('rel', 'external');
    },

    function(status, thrown) {
        $("#nav img").hide();
        //Hrm, should probably do something here...
    });

  };

}
