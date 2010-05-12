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

StatusNet.Timeline.prototype.encacheNotice = function(timeline_name, noticeId, entry) {

    rc = this.db.execute(
            "INSERT OR IGNORE INTO notice_cache (account_id, notice_id, timeline, atom_entry) VALUES (?, ?, ?, ?)",
                this.client.account.id,
                noticeId,
                this.timeline_name,
                (new XMLSerializer()).serializeToString(entry));
}

/**
 * Add a notice to the Timeline if it's not already in it.
 */
StatusNet.Timeline.prototype.addNotice = function(notice, entry, prepend) {

    // dedupe here?
    for (i = 0; i < this._notices.length; i++) {
        if (this._notices[i].id === notices.id) {
            StatusNet.debug("skipping duplicate notice: " + notice.id);
            return;
        }
    }

    if (notice.id !== undefined) {
        StatusNet.debug("encached notice: " + notice.id);
        this.encacheNotice(this.timeline_name, notice.id, entry);
    }

    if (prepend) {
        this._notices.unshift(notice);
    } else {
        this._notices.push(notice);
    }
}

/**
 * Update the timeline.  Does a fetch of the Atom feed for the appropriate
 * timeline and notifies the view the model has changed.
 */
StatusNet.Timeline.prototype.update = function() {

    var that = this;

    this.account.fetchUrl(this.getUrl(),

        function(status, data) {

            StatusNet.debug('Fetched ' + that.url);
            StatusNet.debug('HTTP client returned: ' + data);

            $(data).find('feed > entry').each(function() {
                StatusNet.debug('Timeline.update: found an entry.');

                var notice = StatusNet.AtomParser.noticeFromEntry(this);

                that.addNotice(notice, this, false);
            });

            // use events instead? Observer?
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
    return this._url;
}

/**
 * Do anything that needs doing after retrieving timeline data.
 * Typically displaying the timeline.
 */
StatusNet.Timeline.prototype.finishedFetch = function() {
    this.view.show();
}

/**
 * Accessor for notices
 *
 * @return Array an array of notices
 */
StatusNet.Timeline.prototype.getNotices = function() {

    var rs = this.db.execute(
        "SELECT * from notice_cache WHERE account_id = ? AND timeline = ?",
        this.account.id,
        this.timeline_name
    );

    while (rs.isValidRow()) {
        xmlEntry = rs.fieldByName('atom_entry');
        entry = (new DOMParser()).parseFromString(xmlEntry, "text/xml");
        var notice = StatusNet.AtomParser.noticeFromEntry(entry);
        this._notices.push(notice);
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
 * Constructor for inbox timeline model
 */
StatusNet.TimelineInbox = function(client) {
    StatusNet.Timeline.call(this, client);

    this.timeline_name = 'inbox';

    this._url = 'direct_messages.atom';

}

// Make StatusNet.TimelineInbox inherit Timeline's prototype
StatusNet.TimelineInbox.prototype = heir(StatusNet.Timeline.prototype);


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

