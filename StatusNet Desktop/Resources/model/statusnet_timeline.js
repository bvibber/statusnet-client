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
    var xml = StatusNet.Platform.serializeXml(entry);

    // As a hack workaround for running on stock iPhone builds where
    // setAttribute() doesn't work. This won't prevent error messages
    // spewing on the console during serialization above.
    var nsXml = xml.replace('<entry>', '<entry ' +
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
            nsXml
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
 * adds it to the notice cache.
 *
 * @param DOM     entry              the Atom entry form of the notice
 * @param boolean prepend            whether to add it to the beginning of end of
 *
 */
StatusNet.Timeline.prototype.addNotice = function(entry, prepend, notifications) {
StatusNet.debug('Timeline.addNotice enter:');
    var notice = StatusNet.AtomParser.noticeFromEntry(entry);

    // Dedupe here?
    for (i = 0; i < this._notices.length; i++) {
        if (this._notices[i].id === notice.id) {
            StatusNet.debug("skipping duplicate notice: " + notice.id);
            return;
        }
    }

    if (notice.id !== undefined) {
        if (this.cacheable()) {
            StatusNet.debug("encached notice: " + notice.id);
            this.encacheNotice(notice.id, entry);
        }
    }

    StatusNet.debug("addNotice - finished encaching notice");

    if (prepend) {
        this._notices.unshift(notice);
        this.noticeAdded.notify({notice: notice, notifications: notifications});
    } else {
        this._notices.push(notice);
    }
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

        function(status, data) {
            StatusNet.debug('Timeline.update GOT DATA:');

            var entries = [];

            $(data).find('feed > entry').each(function() {
                StatusNet.debug('Timeline.update: found an entry: ' + this);
                entries.push(this);
            });
            StatusNet.debug('Timeline.update finished entry push loop.');

            entries.reverse(); // keep correct notice order

            StatusNet.debug('Timeline.update starting addNotice loop:');
            for (var i = 0; i < entries.length; i++) {
                StatusNet.debug('Timeline.update starting addNotice loop ' + i);
                that.addNotice(entries[i], true, notifications);
            }
            StatusNet.debug('Timeline.update finished addNotice loop.');

            that.updateFinished.notify({notice_count: entries.length});

            if (onFinish) {
                onFinish(entries.length);
            }
            StatusNet.debug('Timeline.update calling finishedFetch...');
            that.finishedFetch(entries.length);
            StatusNet.debug('Timeline.update DONE.');
        },
        function(client, msg) {
            StatusNet.debug("Something went wrong retrieving timeline: " + msg);
            StatusNet.Infobar.flashMessage("Couldn't get timeline: " + msg);
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
    StatusNet.debug("trimNotices DONE");
};

/**
 * Clean up the avatar cache
 */
StatusNet.Timeline.prototype.trimAvatarCache = function() {

    var MAX_AVATARS = 200; // @todo Make this configurable

    var rdir = Titanium.Filesystem.getResourcesDirectory();
    var separator = Titanium.Filesystem.getSeparator();
    var cacheDir = Titanium.Filesystem.getFile(rdir + separator + 'avatar_cache');
    var dirList = cacheDir.getDirectoryListing();

    var avatars = [];

    if (dirList) {
        StatusNet.debug("timrAvatarCache - avatar cache directory has " + dirList.length + " files");
        for (i = 0; i < dirList.length; i++) {
            var avatar = {
                "filename": dirList[i].toString(),
                "timestamp": Titanium.Filesystem.getFile(dirList[i]).modificationTimestamp()
            };
            avatars.push(avatar);
        }

        // sort by timestamp - ascending
        avatars.sort(function(a, b) {
            return a.timestamp - b.timestamp;
        });

        if (dirList.length > MAX_AVATARS) {
            var overflow = dirList.length - MAX_AVATARS;
            StatusNet.debug("trimAvatarCache - avatar cache has " + overflow + " too many avatars, trimming...");

            for (i = 0; i < overflow; i++) {
                if (Titanium.Filesystem.getFile(avatars[i].filename).deleteFile()) {
                    StatusNet.debug("TrimAvatarCache - deleted " + avatars[i].filename);
                } else {
                    StatusNet.debug("TrimAvatarCache - couldn't delete " + avatars[i].filename);
                }
            }
            StatusNet.debug("TrimAvatarCache - done trimming avatars.")
        }
    }
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

    this.trimAvatarCache();
};

/**
 * Accessor for notices
 *
 * @return Array an array of notices
 */
StatusNet.Timeline.prototype.getNotices = function() {

    StatusNet.debug("Account ID = " + this.account.id);
    StatusNet.debug("Timeline name = " + this.timeline_name);

    var sql = "SELECT * FROM notice_entry JOIN entry ON notice_entry.notice_id = entry.notice_id " +
        "WHERE notice_entry.account_id = ? AND notice_entry.timeline = ? ORDER BY notice_entry.notice_id";

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
        entry = StatusNet.Platform.parseXml(xmlEntry);
        var notice = StatusNet.AtomParser.noticeFromEntry(entry);
        this._notices.unshift(notice);
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
}

/**
 * Lookup avatar in our avatar cache.
 *
 */
StatusNet.Timeline.prototype.lookupAvatar = function(url, onHit, onMiss) {

    var hash;

    if (typeof Titanium.Codec == "undefined") {
        // mobile
        hash = Titanium.Utils.md5HexDigest(url);
    } else {
        // desktop
        hash = Titanium.Codec.digestToHex(Titanium.Codec.SHA1, url);
    }

    StatusNet.debug('Avatar hash for ' + url + " == " + hash);

    var dot = url.lastIndexOf(".");

    if (dot == -1 ) {
        // ooh weird, no extension
        return url;
    }

    var extension = url.substr(dot, url.length);
    var resourcesDir = Titanium.Filesystem.getResourcesDirectory();
    var separator = Titanium.Filesystem.getSeparator();
    var cacheDirname = resourcesDir + separator + 'avatar_cache';

    var cacheDir = Titanium.Filesystem.getFile(cacheDirname);

    if (!cacheDir.exists()) {
        StatusNet.debug("lookupAvatar - avatar_cache directory doesn't exist");
        cacheDir.createDirectory();
    } else {
        StatusNet.debug("lookupAvatar - avatar_cache directory already exists");
    }

    var filename = hash + extension;
    var filepath = cacheDir + separator + filename;

    StatusNet.debug("lookupAvatar - filepath = " + filepath);

    var relativePath = 'avatar_cache/' + filename; // for use in webview

    var avatarFile = Titanium.Filesystem.getFile(filepath);

    StatusNet.debug('lookupAvatar - looking up avatar: ' + filepath);
    if (avatarFile.isFile()) {
        StatusNet.debug("lookupAvatar - Yay, avatar cache hit");
        if (onHit) {
            onHit(relativePath);
        }
        return relativePath;
    } else {

        StatusNet.debug("lookupAvatar - Avatar cache miss, fetching avatar from web");

        StatusNet.HttpClient.fetchFile(
            url,
            filepath,
            function() {
                StatusNet.debug("lookupAvatar - fetched avatar: " + url);
                if (onHit) {
                    onHit(relativePath);
                    return relativePath;
                }
            },
            function(code, e) {
                StatusNet.debug("lookupAvatar - couldn't fetch: " + url);
                StatusNet.debug("lookupAvatar - code: " + code + ", exception: " + e);
            }
        );

        if (onMiss) {
            onMiss(url)
        }

        return false;
    }
}

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
