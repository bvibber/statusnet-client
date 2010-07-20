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
 * Render the HTML display of a given timeline
 *
 */
StatusNet.TimelineViewUser.prototype.show = function () {

    var notices = this.client.timeline.getNotices();

    $('#notices').empty();

    var userAvatar = this.client.timeline.user.avatarMedium;
    var author = this.client.timeline.user.username;

    if (notices.length > 0) {

        var html = [];

        for (i = 0; i < notices.length; i++) {
            html.push('<div class="notice">');
            html.push('   <div class="avatar"><a href="' + notices[i].link + '"><img src="' + userAvatar + '"/></a></div>');
            html.push('   <div><a class="author" href="' + notices[i].link + '">' + author + '</a><br/>');
            //html.push('   <small class="date">' + humane_date(notices[i].updated) + '</small></div>');
            html.push('   <small class="date">' + notices[i].updated + '</small></div>');
            html.push('   <div class="content">'+ notices[i].content +'<br/></div>');
            if (notices[i].contextLink && notices[i].inReplyToLink) {
                html.push(
                    '   <div class="context"><a class="context" href="' +
                    notices[i].contextLink +'">in context</a><br/></div>'
                );
            }
            html.push('</div>');
            html.push('<div class="clear"></div>');
        }

        $('#notices').append(html.join(''));
        $('.notice a').attr('rel', 'external');
    } else {
        $('#notices').append('<div id="empty_timeline">No notices in this timeline yet.</div>');
    }

    this.hideSpinner();
    this.showHeader();
    this.showProfileInfo();

};

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

    var username = null;

    if (this.client.timeline.user) {
        username = this.client.timeline.user.username;
    } else {
        username = this.client.timeline.account.username;
    }

	var title = this.title.replace("{name}", username)
						  .replace("{site}", this.client.account.getHost());
    $("#header").html("<h1></h1>");
    $("#header h1").text(title);

};

