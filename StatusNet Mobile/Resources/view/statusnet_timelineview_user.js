/**
 * StatusNet Mobile
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
 * Constructor for user's timeline
 */
StatusNet.TimelineViewUser = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "{name}'s profile on {site}";
};

// Make StatusNet.TimelineViewUser inherit TimelineView's prototype
StatusNet.TimelineViewUser.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Render the HTML display of a user timeline
 *
 */
StatusNet.TimelineViewUser.prototype.show = function () {
    this.showHeader();
    var notices = this.client.timeline.getNotices();

    // clear old notices
    // @todo be a little nicer; no need to clear if we just changed one thing
    //Titanium.App.fireEvent('updateTimeline', {html: '<p>Loading...</p>'});
    this.clearTimelineView();

    if (notices.length > 0) {
    StatusNet.debug("TimelineViewUser.show GGG: " + notices.length + " notice(s)");
        for (i = 0; i < notices.length; i++) {
            this.appendUserTimelineNotice(notices[i]);
        }
    }

    this.hideSpinner();
};

StatusNet.TimelineView.prototype.appendUserTimelineNotice = function(notice) {
    var user = this.client.getActiveTimeline().getUser();
    Titanium.App.fireEvent('StatusNet_appendUserTimelineNotice', {notice: notice, user: user});
}

/**
 * Show profile information header for this user
 */
StatusNet.TimelineViewUser.prototype.showProfileInfo = function () {
    StatusNet.debug("showProfileInfo()");

    var user = this.client.timeline.user;

    // @todo HTTP fetch here to get follower count, etc.

    $('#profile_info').remove();

    var html = [];

    html.push('<div id="profile_info">');
    html.push('<img src="' + user.avatarMedium + '"/>');
    html.push(user.fullName);
    html.push(' (@' + user.username + ')');
    html.push('</div>');

    $('#header').append(html.join(''));

};

/**
 * Override the header to show name of the user associated with
 * this timeline
 */
StatusNet.TimelineViewUser.prototype.showHeader = function () {

    StatusNet.debug("TimelineViewUser.showHeader()");

    var username = null;

    if (this.client.timeline.user) {
        StatusNet.debug("TimelineViewUser.showHeader() - found a user for the timeline!");
        username = this.client.timeline.user.username;
    } else {
        StatusNet.debug("TimelineViewUser.showHeader() - No user for timeline, falling back to account username");
        username = this.client.timeline.account.username;
    }

    StatusNet.debug("TimelineViewUser.showHeader() - username = " + username);

    var title = this.title.replace("{name}", username)
                          .replace("{site}", this.client.account.getHost());

    var that = this;

    // Show extended profile data after asynchronous load of api/users/show.xml
    this.client.timeline.getExtendedInfo(
        that.showProfileInfo,
        that.client.timeline.authorId
    );
};

StatusNet.TimelineViewUser.prototype.showProfileInfo = function (user, extended, client, authorId) {
    StatusNet.debug("StatusNet.TimelineViewUser.prototype.showProfileInfo called");
    Titanium.App.fireEvent(
        'StatusNet_showProfile',
        {user: user, extended: extended, authorId: authorId}
    );
};
