/**
 * StatusNet Desktop
 *
 * Copyright 2010 StatusNet, Inc.
 * Based in part on Tweetanium
 * Copyright 2008-2009 Kevin Whinnery and Appcelerator, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Constructor for search timeline model
 */
StatusNet.TimelineSearch = function(client) {
    StatusNet.Timeline.call(this, client);

    StatusNet.debug("TimelineSearch constructor");

    this.timeline_name = 'search';

    this._url = 'search.atom';

    this._searchTerm = this.lastQuery();
};

// Make StatusNet.TimelineSearch inherit Timeline's prototype
StatusNet.TimelineSearch.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Override the fetch URL to include search params
 */
StatusNet.TimelineSearch.prototype.getUrl = function() {
    //var base = StatusNet.Timeline.prototype.getUrl.call(this);
    return this._url + '?q=' + encodeURIComponent(this.searchTerm());
};

StatusNet.TimelineSearch.prototype.searchTerm = function() {
    return this._searchTerm;
};

/**
 * Get the last-used search term, if any.
 * @return string
 */
StatusNet.TimelineSearch.prototype.lastQuery = function() {
    var db = StatusNet.getDB();
    var row = db.execute("select searchterm from search_history limit 1");
    if (row.isValidRow()) {
        var searchterm = row.fieldByName('searchterm');
        row.close();
        return searchterm;
    } else {
        return "";
    }
};

/**
 * Store the search term in our history.
 * @param q query
 */
StatusNet.TimelineSearch.prototype.storeQuery = function(q) {
    this._searchTerm = q;
    var db = StatusNet.getDB();
    var rs = db.execute('delete from search_history');
    rs = db.execute('insert into search_history (searchterm) values (?)',
               q);
    rs.close();
};

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
};

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
        this.finishedFetch();
    } else {
        StatusNet.Timeline.prototype.update.call(this);
    }

    if (onFinish) {
        onFinish();
    }
};

/**
 * Don't cache search results yet
 */
StatusNet.TimelineSearch.prototype.cacheable = function() {
    return false;
};

/**
 * Whether to automatically reload
 */
StatusNet.TimelineSearch.prototype.autoRefresh = function() {
	return false;
};

