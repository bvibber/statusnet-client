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
 * Constructor for user timeline model
 */
StatusNet.TimelineUser = function(client, authorId) {
    StatusNet.Timeline.call(this, client);

    StatusNet.debug("TimelineUser constructor - authorId = " + authorId);

    this.authorId = authorId;

    if (this.authorId === null) {
        StatusNet.debug("TimelineUser constructor - authorId was null");
        this.timeline_name = 'user';
    } else {
        this.timeline_name = 'user-' + authorId;
    }

    StatusNet.debug("TimelineUser constructor - timeline name: " + this.timeline_name);

    this._url = 'statuses/user_timeline.atom';

    this.user = null;
    this.extended = null;
};

// Make StatusNet.TimelineUser inherit Timeline's prototype
StatusNet.TimelineUser.prototype = heir(StatusNet.Timeline.prototype);

StatusNet.TimelineUser.prototype.getUrl = function() {

    var base = StatusNet.Timeline.prototype.getUrl.call(this);

    StatusNet.debug("BASE = " + base);

    StatusNet.debug("TimelineUser.getUrl() this.authorId = " + this.authorId);

    if (this.authorId === null) {
        return base;
    } else {
        var qRegexp = /atom\?/;
        result = base.match(qRegexp);
        if (result) {
            return base + "&user_id=" + this.authorId;
        } else {
            return base + "?user_id=" + this.authorId;
        }
    }
};

StatusNet.TimelineUser.prototype.getExtendedInfo = function(onFinish, authorId) {

    this.client.getActiveView().showSpinner();

    var url = null;

    if (authorId === null) {
        url = 'users/show.xml';
    } else {
        url = 'users/show/' + authorId + ".xml";
    }

    var that = this;

    this.client.account.apiGet(url,
        function(status, data) {
            StatusNet.debug(status);
            StatusNet.debug((new XMLSerializer()).serializeToString(data));

            var extended = {};
            extended.followers_cnt = $(data).find('followers_count').text();
            extended.friends_cnt = $(data).find('friends_count').text();
            extended.statuses_cnt = $(data).find('statuses_count').text();
            extended.favorites_cnt = $(data).find('favourites_count').text();
            extended.following = $(data).find('following').text();
            extended.blocking = $(data).find('[nodeName=statusnet:blocking]').text();

            extended.notifications = $(data).find('notifications').text();
            that.extended = extended;

            that.client.getActiveView().hideSpinner();

            if (onFinish) {
                onFinish(that.user, extended, that.client, authorId);
            }

        },
        function(client, msg) {
            StatusNet.debug('Could not get extended user info: ' + msg);
            StatusNet.Infobar.flashMessage('Could not get extended user info: ' + msg);
        }
    );
};

/**
 * Add a notice to the Timeline if it's not already in it.
 *
 * XXX: Override so user timelines do not get cached. Not
 * sure how else to handle at the moment since atom entries in
 * user timelines are different than they are in other timelines.
 * We may need a special cache facility just for user atom
 * entries. --Z
 *
 * @param DOM     entry             the Atom entry form of the notice
 * @param boolean prepend           whether to add it to the beginning of end of
 *                                  the timeline's notices array
 */
StatusNet.TimelineUser.prototype.addNotice = function(entry, prepend) {

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
        this.noticeAdded.notify({notice: notice});
    } else {
        this._notices.push(notice);
    }

};

/**
 * Update the timeline.  Does a fetch of the Atom feed for the appropriate
 * timeline and notifies the view the model has changed.
 */
StatusNet.TimelineUser.prototype.update = function(onFinish) {

    StatusNet.debug("TimelineUser.update()");

    this.updateStart.notify();

    var that = this;

    this.account.apiGet(this.getUrl(),

        function(status, data) {

            StatusNet.debug('Fetched ' + that.getUrl());
            StatusNet.debug('HTTP client returned: ' + data);

            // @todo How we get author info will need to change when we
            // update output to match the latest Activity Streams spec
            var subject = $(data).find("feed > [nodeName=activity:subject]:first");
            that.user = StatusNet.AtomParser.userFromSubject(subject);

            var entries = [];

            $(data).find('feed > entry').each(function() {
                StatusNet.debug('TimelineUser.update: found an entry.');
                entries.push(this);
            });

            entries.reverse(); // keep correct notice order

            for (var i = 0; i < entries.length; i++) {
                that.addNotice(entries[i], true);
            }

            that.updateFinished.notify({notice_count: entries.length});

            if (onFinish) {
                onFinish(entries.length);
            }
            that.finishedFetch(entries.length);
        },
        function(client, msg) {
            StatusNet.debug("Something went wrong retrieving user timeline: " + msg);
            StatusNet.Infobar.flashMessage("Couldn't get user timeline: " + msg);
            that.updateFinished.notify();
        }
    );

};

/**
 * Don't cache user timelines yet
 */
StatusNet.TimelineUser.prototype.cacheable = function() {
    return false;
};

/**
 * Whether to automatically reload
 */
StatusNet.TimelineUser.prototype.autoRefresh = function() {
	return false;
};
