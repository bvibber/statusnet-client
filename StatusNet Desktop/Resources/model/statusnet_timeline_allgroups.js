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
 * Constructor for all groups list model
 */
StatusNet.TimelineAllGroups = function(client) {
    StatusNet.Timeline.call(this, client);

    StatusNet.debug("TimelineAllGroups constructor");

    this._groups = [];

    this.groupAdded = new StatusNet.Event(this);

    // @todo handle more than 100 groups ... alpha paging?
    this._url = 'statusnet/groups/list_all.xml?count=100';

};

// Make StatusNet.TimelineAllGroups inherit Timeline's prototype
StatusNet.TimelineAllGroups.prototype = heir(StatusNet.Timeline.prototype);

StatusNet.TimelineAllGroups.prototype.addGroup = function(groupXml) {

    // parse group
    StatusNet.debug("Parse group");

    var group = {};

    group.id = $(groupXml).find('id').text();
	group.url = $(groupXml).find('url').text();
    group.nickname = $(groupXml).find('nickname').text();
    group.fullname = $(groupXml).find('fullname').text();
    group.member = $(groupXml).find('member').text();
    group.blocked = $(groupXml).find('blocked').text();
    group.member_cnt = $(groupXml).find('member_count').text();
    group.original_logo = $(groupXml).find('original_logo').text();
    group.stream_logo = $(groupXml).find('stream_logo').text();
    group.mini_logo = $(groupXml).find('mini_logo').text();
    group.homepage = $(groupXml).find('homepage').text();
    group.description = $(groupXml).find('description').text();
    group.location = $(groupXml).find('location').text();
    group.created = $(groupXml).find('created').text();
    group.modified = $(groupXml).find('modified').text();

    this._groups.unshift(group);

    this.groupAdded.notify({group: group});
};

StatusNet.TimelineAllGroups.prototype.update = function(onFinish) {

    StatusNet.debug("TimelineAllGroups.update()");

    this.updateStart.notify();

    var that = this;

    this.account.apiGet(this.getUrl(),

        function(status, data) {

            var groups = [];

            $(data).find('groups > group').each(function() {
                StatusNet.debug('TimelineAllGroups.update: found group.');
                groups.push(this);
            });

            groups.reverse();

            for (var i = 0; i < groups.length; i++) {
                that.addGroup(groups[i]);
            }

            that.updateFinished.notify({group_count: groups.length});

            if (onFinish) {
                onFinish(groups.length);
            }
            that.finishedFetch(groups.length);
        },
        function(client, msg) {
            StatusNet.debug("Something went wrong retrieving groups: " + msg);
            StatusNet.Infobar.flashMessage("Couldn't get groups: " + msg);
        }
    );

};

/**
 * Don't cache groups list
 */
StatusNet.TimelineAllGroups.prototype.cacheable = function() {
    return false;
};

/**
 * Accessor for groups
 *
 * @return Array an array of groups
 */
StatusNet.TimelineAllGroups.prototype.getGroups = function() {
    return this._groups;
};

/**
 * Do anything that needs doing after retrieving timeline data.
 */
StatusNet.TimelineAllGroups.prototype.finishedFetch = function(notice_count) {
    if (this._groups.length === 0) {
        this.client.getActiveView().showEmptyTimeline();
    }
};
