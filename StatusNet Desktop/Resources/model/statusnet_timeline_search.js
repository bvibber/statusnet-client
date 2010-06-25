/**
 * Constructor for search timeline model
 */
StatusNet.TimelineSearch = function(client) {
    StatusNet.Timeline.call(this, client);

    StatusNet.debug("TimelineSearch constructor");

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
    //var base = StatusNet.Timeline.prototype.getUrl.call(this);
    return this._url + '?q=' + encodeURIComponent(this.searchTerm());
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
    that = this;

    this.update(function() {
        that.client.view.showHeader();
        that.client.view.show();
    });
}

/**
 * Override updates for search: don't search if we have nothing,
 * and clear out the previous results rather than trying to
 * combine them.
 */
StatusNet.TimelineSearch.prototype.update = function(onFinish) {
    this._notices = [];

    StatusNet.debug("TimelineSearch.update()");

    if (this.searchTerm() == '') {
        // nothing to search for!
        this.finishedFetch()
    } else {
        StatusNet.Timeline.prototype.update.call(this);
    }

    if (onFinish) {
        onFinish();
    }
}

/**
 * Add a notice to the Timeline if it's not already in it.
 *
 * XXX: Override so search timelines do not get cached. Not
 * sure how else to handle at the moment since atom entries in
 * search timelines are different than they are in other timelines.
 * We may need a special cache facility just for search atom
 * entries. --Z
 *
 * @param DOM     entry    the Atom entry form of the notice
 * @param boolean prepend  whether to add it to the beginning of end of
 *                         the timeline's notices array
 *
 */
StatusNet.TimelineSearch.prototype.addNotice = function(entry, prepend) {

    var notice = StatusNet.AtomParser.noticeFromEntry(entry);

    // dedupe here?
    for (i = 0; i < this._notices.length; i++) {
        if (this._notices[i].id === notices.id) {
            StatusNet.debug("skipping duplicate notice: " + notice.id);
            return;
        }
    }

    if (prepend) {
        this._notices.unshift(notice);
        this.client.view.showNewNotice(notice);
    } else {
        this._notices.push(notice);
    }

}

/**
 * Don't cache search results yet
 */
StatusNet.TimelineSearch.prototype.cacheable = function() {
    return false;
}
