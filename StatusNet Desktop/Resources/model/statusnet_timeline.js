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

    this._statuses = new Array();

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
StatusNet.Timeline.prototype.addStatus = function(status, entry, prepend) {

    // dedupe here?
    for (i = 0; i < this._statuses.length; i++) {
        if (this._statuses[i].noticeId === status.noticeId) {
            StatusNet.debug("skipping duplicate notice: " + status.noticeId);
            return;
        }
    }

    this.encacheNotice(this.timeline_name, status.noticeId, entry);

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

    var that = this;

    this.account.fetchUrl(this.getUrl(),

        function(status, data) {

            StatusNet.debug('Fetched ' + that.url);
            StatusNet.debug('HTTP client returned: ' + data);

            $(data).find('feed > entry').each(function() {
                StatusNet.debug('Timeline.update: found an entry.');
                var status = StatusNet.AtomParser.statusFromEntry(this);

                // XXX: Quick hack to get rid of broken imgs in profile timeline
                // We need to specialize StatusNet.TimelineUser to grab the avatar
                // URL from the activity:subject or author. And probably move Atom
                // parsing to its own class
                if (!status.avatar) {
                    status.avatar = that.account.avatar;
                }

                that.addStatus(status, this, false);
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

StatusNet.Timeline.prototype.getUrl = function() {
    return this._url;
}

StatusNet.Timeline.prototype.finishedFetch = function() {
    this.view.show();
}

/**
 * Accessor for statuses
 *
 * @return Array an array of statuses
 */
StatusNet.Timeline.prototype.getStatuses = function() {

    var rs = this.db.execute(
        "SELECT * from notice_cache WHERE account_id = ? AND timeline = ? ORDER BY notice_id",
        this.account.id,
        this.timeline_name
    );

    while (rs.isValidRow()) {
        xmlEntry = rs.fieldByName('atom_entry');
        entry = (new DOMParser()).parseFromString(xmlEntry, "text/xml");
        var status = StatusNet.AtomParser.statusFromEntry(entry);
        this._statuses.unshift(status);
        rs.next();
    }
    rs.close();

    return this._statuses;
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
 * Constructor for user timeline model
 */
StatusNet.TimelineUser = function(client) {
    StatusNet.Timeline.call(this, client);

    this.timeline_name = 'user';

    this._url = 'statuses/user_timeline.atom';

}

// Make StatusNet.TimelineUser inherit Timeline's prototype
StatusNet.TimelineUser.prototype = heir(StatusNet.Timeline.prototype);

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
    this._statuses = [];
    if (this.searchTerm() == '') {
		// nothing to search for!
		this.finishedFetch()
	} else {
		StatusNet.Timeline.prototype.update.call(this);
	}
}
