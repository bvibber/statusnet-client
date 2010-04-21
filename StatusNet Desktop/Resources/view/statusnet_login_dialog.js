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
