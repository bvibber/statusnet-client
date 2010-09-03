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
 * Constructor for base timeline model class
 *
 * @param StatusNet.Client       client the controller
 * @param StatusNet.TimelineView view   the view
 */
StatusNet.Timeline = function(client) {

    this.client = client;
    this.account = this.client.account;
    this.db = StatusNet.getDB();

    this._notices = [];

    this.noticeAdded = new StatusNet.Event(this);
    this.updateStart = new StatusNet.Event(this);
    this.updateFinished = new StatusNet.Event(this);
};

/**
 * Add a notice (Atom entry) to the cache
 *
 * @param string timeline_name  name of the timeline
 * @param int    noticeId       ID of the notice
 * @param DOM    entry          XML Atom entry for the notice
 */
StatusNet.Timeline.prototype.encacheNotice = function(noticeId, entry) {
    var xml;
    if (typeof entry == "string") {
        xml = entry;
    } else {
        if (typeof StatusNet.Platform.serializeXml != "function") {
            StatusNet.debug("Timeline.encacheNotice() skipped - no XML serializer");
            return;
        }

        StatusNet.debug("Timeline.encacheNotice() - encaching notice:" + noticeId + ", timeline= " + this.timeline_name + ", account=" + this.client.account.id);

        // We need to add in the namespaces, so the XML parser doesn't blow up on when
        // reparsing cached entries.
        var spaces = {
            "": "http://www.w3.org/2005/Atom",
            thr: "http://purl.org/syndication/thread/1.0",
            georss: "http://www.georss.org/georss",
            activity: "http://activitystrea.ms/spec/1.0/",
            media: "http://purl.org/syndication/atommedia",
            poco: "http://portablecontacts.net/spec/1.0",
            ostatus: "http://ostatus.org/schema/1.0",
            statusnet: "http://status.net/schema/api/1/"
        };
        for (var ns in spaces) {
            if (spaces.hasOwnProperty(ns)) {
                var attr = (ns == "") ? 'xmlns' : ('xmlns:' + ns);
                entry.setAttribute(attr, spaces[ns]);
            }
        }
        xml = StatusNet.Platform.serializeXml(entry);
    }

    // As a hack workaround for running on stock iPhone builds where
    // setAttribute() doesn't work. This won't prevent error messages
    // spewing on the console during serialization above.
    xml = xml.replace('<entry>', '<entry ' +
        'xmlns="http://www.w3.org/2005/Atom" ' +
        'xmlns:thr="http://purl.org/syndication/thread/1.0" ' +
        'xmlns:georss="http://www.georss.org/georss" ' +
        'xmlns:activity="http://activitystrea.ms/spec/1.0/" ' +
        'xmlns:media="http://purl.org/syndication/atommedia" ' +
        'xmlns:poco="http://portablecontacts.net/spec/1.0" ' +
        'xmlns:ostatus="http://ostatus.org/schema/1.0" ' +
        'xmlns:statusnet="http://status.net/schema/api/1/">');

    try {
        rc = this.db.execute(
            "INSERT OR REPLACE INTO entry (notice_id, atom_entry) VALUES (?, ?)",
            noticeId,
            xml
        );

        rc = this.db.execute(
            "INSERT OR REPLACE INTO notice_entry (account_id, notice_id, timeline, timestamp) VALUES (?, ?, ?, ?)",
            this.client.account.id,
            noticeId,
            this.timeline_name,
            Date.now()
        );
    } catch (e) {
        StatusNet.debug("encacheNotice - Oh no, I couldn't cache the entry: " + e);
    }
};

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
};

/**
 * Refresh the cache for a single notice (Atom entry)
 *
 * @param int noticeId  the Id of the notice to refresh
 */
StatusNet.Timeline.prototype.refreshNotice = function(noticeId) {

    StatusNet.debug('Timeline.refreshNotice() - refreshing notice ' + noticeId);

    // XXX: For now, always take this from the public timeline
    var noticeUrl = 'statuses/friends_timeline.atom' + '?max_id=' + noticeId + '&count=1';

    var that = this;

    this.account.apiGet(noticeUrl,
        function(status, data) {
            StatusNet.debug('Fetched ' + that.noticeUrl);

            //var entry = $(data).find('feed > entry:first').get(0); // feed > entry:first doesn't work on Titanium Mobile right now
            var entry = $(data).find('entry:first').get(0);

            if (entry && that.cacheable()) {
                that.encacheNotice(noticeId, entry);
                StatusNet.debug('Timeline.refreshNotice(): found an entry.');
            }

        },
        function(client, msg) {
            StatusNet.debug("Something went wrong refreshing notice " + noticeId + ": " + msg);
            StatusNet.Infobar.flashMessage("Could not refresh notice " + noticeId +": " + msg);
        }
    );
};

/**
 * Add a notice to the Timeline if it's not already in it. Also
 * adds it to the notice cache, and notifies the view to display it.
 *
 * @param object  notice              the parsed form of the notice as a dict
 *
 */
StatusNet.Timeline.prototype.addNotice = function(notice) {
    StatusNet.debug('Timeline.addNotice enter:');
    if (notice === null || typeof notice !== "object") {
        throw "Invalid notice passed to addNotice.";
    }

    // Dedupe here?
    for (i = 0; i < this._notices.length; i++) {
        if (this._notices[i].id === notice.id) {
            StatusNet.debug("skipping duplicate notice: " + notice.id);
            return;
        }
    }

    if (notice.id !== undefined && notice.xmlString !== undefined) {
        if (this.cacheable()) {
            StatusNet.debug("encached notice: " + notice.id);
            this.encacheNotice(notice.id, notice.xmlString);
        }
    }

    StatusNet.debug("addNotice - finished encaching notice");

    this._notices.push(notice);
    this.noticeAdded.notify({notice: notice});

    StatusNet.debug('Timeline.addNotice DONE.');
};

/**
 * Update the timeline.  Does a fetch of the Atom feed for the appropriate
 * timeline and notifies the view the model has changed.
 */
StatusNet.Timeline.prototype.update = function(onFinish, notifications) {
    StatusNet.debug('Timeline.update ENTERED');

    this.updateStart.notify();

    StatusNet.debug('Timeline.update called updateStart.notify');

    var that = this;

    this.account.apiGet(this.getUrl(),

        function(status, data, responseText) {
            StatusNet.debug('Timeline.update GOT DATA:');

            var entries = [];
            var entryCount = 0;

            var onEntry = function(notice) {
                // notice
                StatusNet.debug('Got notice: ' + notice);
                StatusNet.debug('Got notice.id: ' + notice.id);
                that.addNotice(notice);
                entryCount++;
            };
            var onSuccess = function() {
                // success!
                StatusNet.debug('Timeline.update success!');
                that.updateFinished.notify({notice_count: entryCount});

                if (onFinish) {
                    onFinish(entryCount);
                }
                StatusNet.debug('Timeline.update calling finishedFetch...');
                that.finishedFetch(entryCount);
                StatusNet.debug('Timeline.update DONE.');
            };
            var onFailure = function(msg) {
                // if parse failure
                StatusNet.debug("Something went wrong retrieving timeline: " + msg);
                StatusNet.Infobar.flashMessage("Couldn't get timeline: " + msg);
                that.updateFinished.notify();
            };

            // @todo Background processing for Desktop
            if (StatusNet.Platform.isMobile()) {
                StatusNet.AtomParser.backgroundParse(responseText, onEntry, onSuccess, onFailure);
            } else {
                StatusNet.debug("gonna parse this");
                StatusNet.AtomParser.parse(responseText, onEntry, onSuccess, onFailure);
            }
        },
        function(client, msg) {
            StatusNet.debug("Something went wrong retrieving timeline: " + msg);
            StatusNet.Infobar.flashMessage("Couldn't update timeline: " + msg);
            that.updateFinished.notify();
        }
    );
    StatusNet.debug('Timeline.update EXITED: waiting for data return.');

};

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

    rs.close();

    StatusNet.debug("lastId = " + lastId);

    if (lastId > 0) {
        return this._url + '?since_id=' + lastId;
    } else {
        return this._url;
    }
};

/**
 * Trim the notice cache for this timeline.  Hard limit of 200 notices per
 * timeline, and trim anything older than 72 hours.
 *
 * @todo Don't trim the cache if we're offline.
 */
StatusNet.Timeline.prototype.trimNotices = function() {

    // Remove notices older than 72 hours from cache
    // @todo Make cache window configurable and tune the defaults

    // NOTE: I'm using integer timestamps because Titanium seems to blow up when
    // using SQLite's date functions :(

    var now = new Date();
    var cutoff = new Date();
    cutoff.setTime(now.getTime() - (86400 * 3 * 1000));

    StatusNet.debug(
        "Clearing out old cache entries for timeline " +
        this.timeline_name +
        " (NOW = " +
        now.getTime() +
        ", CUTOFF = " +
        cutoff.getTime() +
        ")"
    );

    try {
        StatusNet.debug("trimNotices A");
        var rs = this.db.execute(
            "DELETE FROM entry WHERE notice_id IN " +
            "(SELECT notice_id FROM notice_entry WHERE timestamp < ? AND timeline = ? AND account_id = ?)",
            cutoff.getTime(),
            this.timeline_name,
            this.account.id
        );
        StatusNet.debug("trimNotices B");

        rs = this.db.execute(
            'DELETE FROM notice_entry WHERE timestamp < ? AND timeline = ? AND account_id = ?',
            cutoff.getTime(),
            this.timeline_name,
            this.account.id
        );
        StatusNet.debug("trimNotices C");

        // Also keep an absolute maximum of 200 notices per timeline

        rs = this.db.execute(
            "SELECT count(*) FROM notice_entry WHERE timeline = ? AND account_id = ?",
            this.timeline_name,
            this.account.id
        );
        StatusNet.debug("trimNotices D");

        if (rs.isValidRow()) {
        StatusNet.debug("trimNotices E1");

            var count = rs.fieldByName("count(*)");
            rs.close();
            StatusNet.debug("COUNT = " + count);

        StatusNet.debug("trimNotices E2");
            if (count > 200) {
        StatusNet.debug("trimNotices E2A");

                var diff = (count - 200);

                StatusNet.debug("Row count for " + this.timeline_name + " = " + count + ", overflow = " + diff);

                var sql = "DELETE FROM entry WHERE notice_id IN " +
                    "(SELECT notice_id FROM notice_entry WHERE timeline = ? AND account_id = ? ORDER BY timestamp ASC LIMIT ?)";

                rs = this.db.execute(sql,
                    this.timeline_name,
                    this.account.id,
                    diff
                );

                rs = this.db.execute(
                    "DELETE FROM notice_entry WHERE notice_id IN " +
                    "(SELECT notice_id FROM notice_entry WHERE timeline = ? AND account_id = ? ORDER BY timestamp ASC LIMIT ?)",
                    this.timeline_name,
                    this.account.id,
                    diff
                );
        StatusNet.debug("trimNotices E2Z");
            }
        }
    } catch (e) {
        StatusNet.debug("Caught Exception doing notice trim: " + e);
    }
    StatusNet.debug("trimNotices DONE");
};
/**
 * Whether to cache this timeline - may be overrided by timelines
 * we can't or don't want to cache ATM
 */
StatusNet.Timeline.prototype.cacheable = function() {
    return true;
};

/**
 * Do anything that needs doing after retrieving timeline data.
 */
StatusNet.Timeline.prototype.finishedFetch = function(notice_count) {

    if (this._notices.length === 0) {
        StatusNet.debug("Show empty timeline msg");
        this.client.getActiveView().showEmptyTimeline();
    }

    if (this.cacheable()) {
        this.trimNotices();
    }

    StatusNet.AvatarCache.trimAvatarCache();
};

StatusNet.Timeline.prototype.getNotices = function() {
    return this._notices;
};

/**
 * Loads and triggers display of cached notices on this timeline.
 * Accessor for notices
 *
 * @return Array an array of notices
 */
StatusNet.Timeline.prototype.loadCachedNotices = function() {
    var that = this;

    StatusNet.debug("Account ID = " + this.account.id);
    StatusNet.debug("Timeline name = " + this.timeline_name);
    var count = 20;

    var sql = "SELECT * FROM notice_entry JOIN entry ON notice_entry.notice_id = entry.notice_id " +
        "WHERE notice_entry.account_id = ? AND notice_entry.timeline = ? " +
        "ORDER BY notice_entry.notice_id DESC " +
        "LIMIT " + count;

    StatusNet.debug("Timeline.getNotices A");

    var rs = this.db.execute(sql,
        this.account.id,
        this.timeline_name
    );

    StatusNet.debug("Timeline.getNotices B");

    while (rs.isValidRow()) {
        StatusNet.debug("Timeline.getNotices B1");
        StatusNet.debug("Valid row found");
        xmlEntry = rs.fieldByName('atom_entry');

        // @todo Add background parsing to Desktop
        if (StatusNet.Platform.isMobile()) {
            StatusNet.AtomParser.backgroundParse(xmlEntry, function(notice) {
                that.addNotice(notice);
            });
        } else {
            StatusNet.AtomParser.parse(xmlEntry, function(notice) {
                that.addNotice(notice);
            });
        }

        rs.next();
    }
    StatusNet.debug("Timeline.getNotices C");
    rs.close();
    StatusNet.debug("Timeline.getNotices D");

    StatusNet.debug('Timeline.getNotices out: ' + this._notices.length + ' items.');
    return this._notices;
};

/**
 * Whether to automatically reload
 */
StatusNet.Timeline.prototype.autoRefresh = function() {
    return true;
};

/**
 * Constructor for mentions timeline model
 */
StatusNet.TimelineMentions = function(client) {
    StatusNet.Timeline.call(this, client);

    this.timeline_name = 'mentions';

    this._url = 'statuses/mentions.atom';

};

// Make StatusNet.TimelineMentions inherit Timeline's prototype
StatusNet.TimelineMentions.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for public timeline model
 */
StatusNet.TimelinePublic = function(client) {
    StatusNet.Timeline.call(this, client);

    this.timeline_name = 'public';

    this._url = 'statuses/public_timeline.atom';

};

// Make StatusNet.TimelinePublic inherit Timeline's prototype
StatusNet.TimelinePublic.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for favorites timeline model
 */
StatusNet.TimelineFavorites = function(client) {
    StatusNet.Timeline.call(this, client);

    this.timeline_name = 'favorites';

    this._url = 'favorites.atom';

};

// Make StatusNet.TimelineFavorites inherit Timeline's prototype
StatusNet.TimelineFavorites.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for tag timeline model
 */
StatusNet.TimelineTag = function(client, tag) {
    StatusNet.Timeline.call(this, client);

    StatusNet.debug("TimelineTag constructor - tag = " + tag);

    this._url = 'statusnet/tags/timeline/' + tag + '.atom';

    this.tag = tag;
    this.timeline_name = 'tag-' + this.tag;

    StatusNet.debug("TimelineTag constructor - timeline name: " + this.timeline_name);

    StatusNet.debug("Tag timeline URL = " + this._url);
};

// Make StatusNet.TimelineTag inherit Timeline's prototype
StatusNet.TimelineTag.prototype = heir(StatusNet.Timeline.prototype);

// XXX: Turns out StatusNet's TAG timeline doesn't respect the since_id so
// until we fix it, I'm going to disable caching of tag timelines --Z
StatusNet.TimelineTag.prototype.cacheable = function() {
    return false;
};
