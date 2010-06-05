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
    this.db = StatusNet.getDB();

    this._notices = new Array();

    StatusNet.debug("StatusNet.Timeline constructor");
}

/**
 * Add a notice (Atom entry) to the cache
 *
 * @param string timeline_name  name of the timeline
 * @param int    noticeId       ID of the notice
 * @param DOM    entry          XML Atom entry for the notice
 */
StatusNet.Timeline.prototype.encacheNotice = function(noticeId, entry) {

    StatusNet.debug("Timeline.encacheNotice() - encaching notice:" + noticeId + ", timeline= " + this.timeline_name + ", account=" + this.client.account.id);

    rc = this.db.execute(
        "INSERT OR REPLACE INTO entry (notice_id, atom_entry) VALUES (?, ?)",
        noticeId,
        (new XMLSerializer()).serializeToString(entry)
    );

    rc = this.db.execute(
        "INSERT OR REPLACE INTO notice_entry (account_id, notice_id, timeline) VALUES (?, ?, ?)",
        this.client.account.id,
        noticeId,
        this.timeline_name
    );

    // @todo Check for an error condition -- how?
}

/**
 * Remove a notice (Atom entry) from the cache (all timelines)
 *
 * @param int noticeId  the ID of the notice to decache
 */
StatusNet.Timeline.prototype.decacheNotice = function(noticeId) {

    StatusNet.debug("Timeline.decacheNotice() - decaching notice:" + noticeId + ", timeline= " + this.timeline_name + ", account=" + this.client.account.id);

    rc = this.db.execute(
        "DELETE FROM notice_entry WHERE account_id = ? AND notice_id = ?",
            this.client.account.id,
            noticeId);

    rc = this.db.execute(
        "DELETE FROM entry WHERE notice_id = ?",
        noticeId
    );

    // @todo Check for an error condition -- how?
}

/**
 * Refresh the cache for a single notice (Atom entry)
 *
 * @param int noticeId  the Id of the notice to refresh
 */
StatusNet.Timeline.prototype.refreshNotice = function(noticeId) {

    StatusNet.debug('Timeline.refreshNotice() - refreshing notice ' + noticeId);

    var noticeUrl = this._url + '?max_id=' + noticeId + '&count=1';

    var that = this;

    this.account.fetchUrl(noticeUrl,
        function(status, data) {
            StatusNet.debug('Fetched ' + that.noticeUrl);

            var entry = $(data).find('feed > entry:first').get(0);

            if (entry) {
                that.encacheNotice(noticeId, entry);
                StatusNet.debug('Timeline.refreshNotice(): found an entry.');
            }

        },
        function(client, msg) {
            StatusNet.debug("Something went wrong refreshing notice " + noticeId + ": " + msg);
            alert("Could not refresh notice " + noticeId +": " + msg);
        }
    );
}

/**
 * Add a notice to the Timeline if it's not already in it. Also
 * adds it to the notice cache.
 *
 * @param DOM     entry    the Atom entry form of the notice
 * @param boolean prepend  whether to add it to the beginning of end of
 * @param boolean notify   whether to show a system notification
 *
 */
StatusNet.Timeline.prototype.addNotice = function(entry, prepend, notify) {

    var notice = StatusNet.AtomParser.noticeFromEntry(entry);

    // Dedupe here?
    for (i = 0; i < this._notices.length; i++) {
        if (this._notices[i].id === notices.id) {
            StatusNet.debug("skipping duplicate notice: " + notice.id);
            return;
        }
    }

    if (notice.id !== undefined) {
        StatusNet.debug("encached notice: " + notice.id);
        this.encacheNotice(notice.id, entry);
    }

    if (prepend) {
        this._notices.unshift(notice);
        this.client.view.showNewNotice(notice);
    } else {
        this._notices.push(notice);
    }

    if (notify) {
        this.client.view.showNotification(notice);
    }
}

/**
 * Update the timeline.  Does a fetch of the Atom feed for the appropriate
 * timeline and notifies the view the model has changed.
 */
StatusNet.Timeline.prototype.update = function(onFinish, notifications) {

    StatusNet.debug("udpate() onFinish = " + onFinish + " notifications = " + notifications);

    this.client.view.showSpinner();

    var that = this;

    this.account.fetchUrl(this.getUrl(),

        function(status, data) {

            that.client.view.hideSpinner();

            StatusNet.debug('Fetched ' + that.getUrl());
            StatusNet.debug('HTTP client returned: ' + data);

            var entries = [];

            $(data).find('feed > entry').each(function() {
                StatusNet.debug('Timeline.update: found an entry.');
                entries.push(this);
            });

            entries.reverse(); // keep correct notice order

            for (var i = 0; i < entries.length; i++) {
                that.addNotice(entries[i], true, notifications);
            }

            if (entries.length > 0 && notifications) {
                that.client.newNoticesSound.play();
            }

            // use events instead? Observer?
            if (onFinish) {
                onFinish();
            }
            that.finishedFetch()
        },
        function(client, msg) {
            StatusNet.debug("Something went wrong retrieving timeline: " + msg);
            alert("Couldn't get timeline: " + msg);
        }
    );

}

/**
 * Get the URL for the Atom feed of this timeline
 */
StatusNet.Timeline.prototype.getUrl = function() {

    // @fixme use the current account instead of the default
    var ac = StatusNet.Account.getDefault(this.db);

    var sql = 'SELECT MAX (notice_id) AS last_id FROM notice_entry WHERE account_id = ? AND timeline = ?';
    rs = this.db.execute(sql, ac.id, this.timeline_name);

    StatusNet.debug("account = " + ac.id + ", timeline_name = " + this.timeline_name);

    var lastId = 0;

    if (rs.isValidRow()) {
        lastId = rs.fieldByName('last_id');
    }

    StatusNet.debug("lastId = " + lastId);

    if (lastId > 0) {
        return this._url + '?since_id=' + lastId;
    } else {
        return this._url;
    }
}

/**
 * Do anything that needs doing after retrieving timeline data.
 * Typically displaying the timeline.
 */
StatusNet.Timeline.prototype.finishedFetch = function() {

    if (this._notices.length === 0) {
        $('#notices').append('<div id="empty_timeline">No notices in this timeline yet.</div>');
    }

    this.client.view.hideSpinner();
}

/**
 * Accessor for notices
 *
 * @return Array an array of notices
 */
StatusNet.Timeline.prototype.getNotices = function() {

    var rs = this.db.execute(
        "SELECT * from notice_entry JOIN entry ON notice_entry.notice_id = entry.notice_id "
        + "WHERE notice_entry.account_id = ? AND notice_entry.timeline = ? ORDER BY notice_entry.notice_id",
        this.account.id,
        this.timeline_name
    );

    while (rs.isValidRow()) {
        xmlEntry = rs.fieldByName('atom_entry');
        entry = (new DOMParser()).parseFromString(xmlEntry, "text/xml");
        var notice = StatusNet.AtomParser.noticeFromEntry(entry);
        this._notices.unshift(notice);
        rs.next();
    }
    rs.close();

    return this._notices;
}

/**
 * Constructor for mentions timeline model
 */
StatusNet.TimelineMentions = function(client) {
    StatusNet.Timeline.call(this, client);

    this.timeline_name = 'mentions';

    this._url = 'statuses/mentions.atom';

}

// Make StatusNet.TimelineMentions inherit Timeline's prototype
StatusNet.TimelineMentions.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for public timeline model
 */
StatusNet.TimelinePublic = function(client) {
    StatusNet.Timeline.call(this, client);

    this.timeline_name = 'public';

    this._url = 'statuses/public_timeline.atom';

}

// Make StatusNet.TimelinePublic inherit Timeline's prototype
StatusNet.TimelinePublic.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for favorites timeline model
 */
StatusNet.TimelineFavorites = function(client) {
    StatusNet.Timeline.call(this, client);

    this.timeline_name = 'favorites';

    this._url = 'favorites.atom';

}

// Make StatusNet.TimelineFavorites inherit Timeline's prototype
StatusNet.TimelineFavorites.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for search timeline model
 */
StatusNet.TimelineSearch = function(client) {
    StatusNet.Timeline.call(this, client);

    this.timeline_name = 'search';

    this._url = 'search.atom';

    this._searchTerm = this.lastQuery();
}

// Make StatusNet.TimelineSearch inherit Timeline's prototype
StatusNet.TimelineSearch.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Override the fetch URL to include search params
 */
StatusNet.TimelineSearch.prototype.getUrl = function() {
    var base = StatusNet.Timeline.prototype.getUrl.call(this);
    return base + '?q=' + encodeURIComponent(this.searchTerm());
}

StatusNet.TimelineSearch.prototype.searchTerm = function() {
    return this._searchTerm;
}

/**
 * Get the last-used search term, if any.
 * @return string
 */
StatusNet.TimelineSearch.prototype.lastQuery = function() {
    var db = StatusNet.getDB();
    var row = db.execute("select searchterm from search_history limit 1");
    if (row.isValidRow()) {
        return row.fieldByName('searchterm');
    } else {
        return "";
    }
}

/**
 * Store the search term in our history.
 * @param q query
 */
StatusNet.TimelineSearch.prototype.storeQuery = function(q) {
    this._searchTerm = q;
    var db = StatusNet.getDB();
    db.execute('delete from search_history');
    db.execute('insert into search_history (searchterm) values (?)',
               q);
}

/**
 * Store the search term in our history and update the timeline
 * @param q query
 */
StatusNet.TimelineSearch.prototype.updateSearch = function(q) {
    this.storeQuery(q);
    this.client.view.showSpinner();
    this.update();
}

/**
 * Override updates for search: don't search if we have nothing,
 * and clear out the previous results rather than trying to
 * combine them.
 */
StatusNet.TimelineSearch.prototype.update = function() {
    this._notices = [];
    if (this.searchTerm() == '') {
        // nothing to search for!
        this.finishedFetch()
    } else {
        StatusNet.Timeline.prototype.update.call(this);
    }
}

