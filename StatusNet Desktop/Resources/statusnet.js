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

        StatusNet.debug("app dir = " + Titanium.Filesystem.getApplicationDataDirectory());

        this.db = Titanium.Database.openFile(dbFile);
        this.db.execute("CREATE TABLE IF NOT EXISTS account (username varchar(255), password varchar(255), apiroot varchar(255), is_default integer default 0, last_timeline_id integer, profile_image_url varchar(255), PRIMARY KEY (username, apiroot))");
     }
     return this.db;
}


/**
 * Show settings dialog
 * @fixme make sure it's a singleton!
 */
StatusNet.showSettings = function() {
    var win = Titanium.UI.getCurrentWindow().createWindow({
        url: 'app:///settings.html',
        title: 'Settings'});
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

