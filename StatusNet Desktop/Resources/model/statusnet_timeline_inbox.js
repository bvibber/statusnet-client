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
 * Constructor for inbox timeline model
 */
StatusNet.TimelineInbox = function(client) {

    if (client) {
        StatusNet.debug('StatusNet.TimelineInbox - client is defined');
    } else {
        StatusNet.debug('StatusNet.TimelineInbox - client is NOT defined');
    }

    StatusNet.Timeline.call(this, client);

    this.timeline_name = 'inbox';

    this._url = 'direct_messages.atom';

};

// Make StatusNet.TimelineInbox inherit Timeline's prototype
StatusNet.TimelineInbox.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Don't cache this timeline (yet)
 */
StatusNet.TimelineInbox.prototype.cacheable = function() {
    return false;
};

/**
 * Whether to automatically reload
 */
StatusNet.TimelineInbox.prototype.autoRefresh = function() {
	return false;
};

/**
 * Add a notice to the Timeline if it's not already in it. Also
 * adds it to the notice cache.
 *
 * @param DOM     entry    the Atom entry form of the notice
 * @param boolean prepend  whether to add it to the beginning of end of
 *
 */
StatusNet.TimelineInbox.prototype.addNotice = function(entry, prepend, notifications) {
StatusNet.debug('TimelineInbox.addNotice enter:');

    var notice = StatusNet.AtomParser.noticeFromDMEntry(entry);

    // Dedupe here?
    for (i = 0; i < this._notices.length; i++) {
        if (this._notices[i].id === notice.id) {
            StatusNet.debug("TimelineInbox.addNotice - skipping duplicate notice: " + notice.id);
            return;
        }
    }

    if (notice.id !== undefined) {
        if (this.cacheable()) {
            StatusNet.debug("TimelineInbox.addNotice - encached notice: " + notice.id);
            this.encacheNotice(notice.id, entry);
        }
    }

    StatusNet.debug("TimelineInbox.addNotice - finished encaching notice");

    if (prepend) {
        this._notices.unshift(notice);
        this.noticeAdded.notify({notice: notice, notifications: notifications});
    } else {
        this._notices.push(notice);
    }
StatusNet.debug('TimelineInbox.addNotice DONE.');
};




