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

        this.db = Titanium.Database.open('statusnet');

        var sql = 'CREATE TABLE IF NOT EXISTS account ('
            + 'id INTEGER PRIMARY KEY AUTOINCREMENT, '
            + 'username TEXT NOT NULL, '
            + 'password TEXT NOT NULL, '
            + 'apiroot TEXT NOT NULL, '
            + 'is_default INTEGER DEFAULT 0, '
            + 'last_timeline_id INTEGER, '
            + 'profile_image_url TEXT, '
            + 'text_limit INTEGER DEFAULT 0, '
            + 'site_logo TEXT, '
            + 'UNIQUE (username, apiroot)'
            + ')';

        this.db.execute(sql);

        sql = 'CREATE TABLE IF NOT EXISTS notice_cache ('
            + 'notice_id INTEGER, '
            + 'account_id INTEGER, '
            + 'timeline TEXT NOT NULL, '
            + 'atom_entry TEXT NOT NULL, '
            + 'PRIMARY KEY (notice_id, account_id)'
            + ')';

        this.db.execute(sql);

        sql = 'CREATE TABLE IF NOT EXISTS search_history ('
            + 'searchterm TEXT NOT NULL'
            + ')';

        this.db.execute(sql);
    }

    return this.db;
};

/**
 * Abstract away completely gratuitous differences between database result
 * classes in Titanium Desktop and Mobile. Sigh.
 *
 * @param Titaniu.Database.ResultSet rs
 * @return int
 */
StatusNet.rowCount = function(rs) {
    return rs.rowCount;
}

/**
 * Show settings dialog
 * @fixme make sure it's a singleton!
 */
StatusNet.showSettings = function() {
    client.setActiveTab('settings');
};

/**
 * Utility function to create a prototype for the subclass
 * that inherits from the prototype of the superclass.
 */
function heir(p) {
    function f(){}
    f.prototype = p;
    return new f();
};
