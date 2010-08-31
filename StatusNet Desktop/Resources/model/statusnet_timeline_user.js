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

    if (!this.authorId) {
        StatusNet.debug("TimelineUser constructor - no authorId");
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

    if (!this.authorId) {
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

    if (!authorId) {
        url = 'users/show.xml';
    } else {
        url = 'users/show/' + authorId + ".xml";
    }

    var that = this;

    this.client.account.apiGet(url,
        function(status, data) {
            StatusNet.debug(status);
            //StatusNet.debug((new XMLSerializer()).serializeToString(data));

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
 * Update the timeline.  Does a fetch of the Atom feed for the appropriate
 * timeline and notifies the view the model has changed.
 */
StatusNet.TimelineUser.prototype.update = function(onFinish, notifications) {
    StatusNet.debug('Timeline.update ENTERED');

    this.updateStart.notify();

    StatusNet.debug('Timeline.update called updateStart.notify');

    var that = this;

    this.account.apiGet(this.getUrl(),

        function(status, data, responseText) {
            StatusNet.debug('Timeline.update GOT DATA:');

            // @todo How we get author info will need to change when we
            // update output to match the latest Activity Streams spec
            var subject = $(data).find("feed > [nodeName=activity:subject]");
            that.user = StatusNet.AtomParser.userFromSubject(subject);

            var entries = [];
            var entryCount = 0;

            var onEntry = function(notice, skipCache) {
                // notice
                StatusNet.debug('Got notice: ' + notice);
                StatusNet.debug('Got notice.id: ' + notice.id);
                that.addNotice(notice, true, notifications, skipCache);
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
 * Don't cache user timelines yet
 */
StatusNet.TimelineUser.prototype.cacheable = function() {
    return false;
};

StatusNet.TimelineUser.prototype.getUser = function() {
    return this.user;
};

/**
 * Whether to automatically reload
 */
StatusNet.TimelineUser.prototype.autoRefresh = function() {
	return false;
};
