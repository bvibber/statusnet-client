/** StatusNet Namespace -- maybe we should just use SN? */
function StatusNet() {}

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
}

/**
 * Lazy-open our local storage database.
 * @fixme move table definitions to shared code
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

        StatusNet.debug(
            "Application data directory = "
            + Titanium.Filesystem.getApplicationDataDirectory()
        );

        this.db = Titanium.Database.openFile(dbFile);

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

        sql = 'CREATE TABLE IF NOT EXISTS search_history ('
            + 'searchterm TEXT NOT NULL'
            + ')';

        this.db.execute(sql);
    }

    return this.db;
}

/**
 * Abstract away completely gratuitous differences between database result
 * classes in Titanium Desktop and Mobile. Sigh.
 *
 * @param Titaniu.Database.ResultSet rs
 * @return int
 */
StatusNet.rowCount = function(rs) {
    return rs.rowCount();
}


/**
 * Show settings dialog
 * @fixme make sure it's a singleton!
 */
StatusNet.showSettings = function() {
    var win = Titanium.UI.getCurrentWindow().createWindow({
        url: 'app:///settings.html',
        title: 'Settings',
        width: 400,
        height: 500});
    win.open();
}

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
 * Utility function to validate a URL
 *
 * @todo This isn't all that great - only looks for http(s)
 *
 * @param String url the URL to validate
 *
 * @return boolean return value
 */
StatusNet.validUrl = function(url) {
    var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(url);
}

/**
 * Utility JQuery function to control the selection in an input.
 * Useful for positioning the carat.
 */
$.fn.selectRange = function(start, end) {
    return this.each(function() {
        if (this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(start, end);
        } else if (this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
}

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

StatusNet.nativeNotifications = function() {

    // Snow Lep has notifications
    if (Titanium.Platform.name === "Darwin") {
        if (Titanium.Platform.version.substr(0, 4) === "10.6") {
            return true;
        }
    }

    StatusNet.debug("Name = " + Titanium.Platform.name);
    StatusNet.debug("Architecture = " + Titanium.Platform.architecture);
    StatusNet.debug("OS type = " + Titanium.Platform.ostype);
    StatusNet.debug("Version = " + Titanium.Platform.version);

    return false;
}
