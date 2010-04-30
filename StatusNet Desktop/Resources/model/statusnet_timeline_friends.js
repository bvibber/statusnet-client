/**
 * Constructor for friends timeline model
 */
StatusNet.TimelineFriends = function(client) {
    StatusNet.Timeline.call(this, client);

	this.timeline_name = 'friends_timeline';

    // set window title here?

    this._url = 'statuses/friends_timeline.atom';

}

// Make StatusNet.TimelineFriends inherit Timeline's prototype
StatusNet.TimelineFriends.prototype = heir(StatusNet.Timeline.prototype);

StatusNet.TimelineFriends.prototype.getUrl = function() {

    // @fixme use the current account instead of the default
    var ac = StatusNet.Account.getDefault(this.db);

    var sql = 'SELECT last_timeline_id FROM account'
    + ' WHERE username = \'' + ac.username + '\''
    + ' AND apiroot = \'' + ac.apiroot + '\'';

    rs = this.db.execute(sql);

    var lastId = 0;

    if (rs.isValidRow()) {
        lastId = rs.fieldByName('last_timeline_id');
    }

    StatusNet.debug("lastId = " + lastId);

    if (lastId > 0) {
        return this._url + '?since_id=' + lastId;
    } else {
        return this._url;
    }
}

StatusNet.TimelineFriends.prototype.finishedFetch = function() {
    StatusNet.Timeline.prototype.finishedFetch.call(this);

    if (this._notices.length > 0) {

        lastId = this._notices[0].id;

        StatusNet.debug("Updating last_timeline_id to " + lastId);

        // @fixme use the current account instead of the default
        var ac = StatusNet.Account.getDefault(this.db);

        var sql = 'UPDATE account SET last_timeline_id = ' + lastId
            + ' WHERE username = \'' + ac.username + '\''
            + ' AND apiroot = \'' + ac.apiroot + '\'';

        this.db.execute(sql);
    }
}
