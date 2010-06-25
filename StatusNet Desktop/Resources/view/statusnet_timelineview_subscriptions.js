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
StatusNet.TimelineViewSubscriptions = function(client) {    
    StatusNet.TimelineView.call(this, client);
    this.title = "{name}'s subscriptions on {site}";
    
    StatusNet.debug("TimelineViewSubscriptions constructor");
    
    this.timeline = client.getActiveTimeline();
    
    var that = this;
    
    this.timeline.userAdded.attach(
        function(args) {
            if (args) {
                that.showNewUser(args.user);
            } else {
                StatusNet.debug("userAdded event with no args!");
            }
        }
    );    
}

// Make StatusNet.TimelineViewSubscriptions inherit TimelineView's prototype
StatusNet.TimelineViewSubscriptions.prototype = heir(StatusNet.TimelineView.prototype);

StatusNet.TimelineViewSubscriptions.prototype.show = function() {

    StatusNet.debug("StatusNet.TimelineViewSubscriptions.show() - getting users");

    var users = this.timeline.getUsers();

    $('#notices').empty();

    if (users.length > 0) {

        StatusNet.debug("showing user");
        var html = [];

        for (i = 0; i < users.length; i++) {
            html.push(this.renderUser(users[i]));
        }

        $('#notices').append(html.join(''));
    }
    
    var that = this;
    
    $('#notices > div#profile_panel').each(function() {
        that.enableProfileControls(this);
    });

    $('div#profile_panel a').attr('rel', 'external');

    StatusNet.debug("StatusNet.TimelineViewSubscriptions.show() - finished showing notices");
}

StatusNet.TimelineViewSubscriptions.prototype.showNewUser = function(user) {
    StatusNet.debug("prepending user " + user.id);
    $('#notices').prepend(this.renderUser(user));
    var notice = $('#notices > div#profile_panel:first').get(0);
    $('#notices > div#profile_panel:first').hide();
    $('#notices > div#profile_panel:first').fadeIn("slow");
}

/**
 * Override the header to show name of the user associated with
 * this timeline
 */
StatusNet.TimelineViewSubscriptions.prototype.showHeader = function () {

    StatusNet.debug("TimelineViewSubscriptions.showHeader()");

    var username = null;

    if (this.client.timeline.user) {
        StatusNet.debug("TimelineViewSubscriptions.showHeader() - found a user for the timeline!");
        username = this.client.timeline.user.username;
    } else {
        StatusNet.debug("TimelineViewSubscriptions.showHeader() - No user for timeline, falling back to account username");
        username = this.client.timeline.account.username;
    }

    StatusNet.debug("TimelineViewSubscriptions.showHeader() - username = " + username);

    var title = this.title.replace("{name}", username)
                          .replace("{site}", this.client.account.getHost());

    StatusNet.debug("TimelineViewSubscriptions.showHeader() - setting title to: " + title);

    $("#header").html("<h1></h1>");
    $("#header h1").text(title);
}

/**
 * Put together the HTML for a single notice for a User profile timeline
 *
 * @param object notice the notice
 */
StatusNet.TimelineViewSubscriptions.prototype.renderUser = function(user) {

    var html = [];

    html.push('<div id="profile_panel">');
    html.push('<img src="' + user.avatar + '"/>');
    html.push('<h2>@' + user.username + '</h2>');
    html.push('<dl class="profile_list" name="' + user.id + ',' + user.username + '">');

    html.push('<dt>Name</dt>');
    html.push('<dd class="name">');
    if (user.fullname) {
        html.push(user.fullname);
    } else {
        html.push(user.username);
    }
    html.push('</dd>');
    html.push('<dt>User ID</dt>');
    html.push('<dd class="id">' + user.id + '</dd>');

    if (user.location) {
        html.push('<dt>Location</dt>');
        html.push('<dd class="location">' + user.location + '</dd>');
    }

    if (user.homepage) {
        html.push('<dt>Homepage</dt>');
        html.push('<dd><a rel="external" href="' + user.homepage + '">' + user.homepage + '</a></dd>');
    }

    if (user.bio) {
        html.push('<dt>Bio</dt>');
        html.push('<dd class="bio">' + user.bio + '</dd>');
    }

    html.push('</dl>');

    html.push('<dl class="profile_statistics">');
    html.push('<dt>Subscribers</dt>');
    html.push('<dd>' + user.followers_cnt + '</dd>');
    html.push('<dt>Subscriptions</dt>');
    html.push('<dd>' + user.friends_cnt + '</dd>');
    html.push('<dt>Notices</dt>');
    html.push('<dd>' + user.statuses_cnt + '</dd>');
    html.push('<dt>Favorites</dt>');
    html.push('<dd>' + user.favorites_cnt + '</dd>');
    html.push('</dl>')

    html.push('<div id="profile_action_links"');

    if (user.following === "true") {
        html.push('<a href="#" class="profile_unsubscribe">Unsubscribe</a>');
    }

    html.push('<a href="#" class="profile_direct_message">Direct Message</a>');
    html.push('</div>');
    
    html.push('</div>')

    return html.join('');
}

/**
 * Show this if the timeline is empty
 */
StatusNet.TimelineViewSubscriptions.prototype.showEmptyTimeline = function() {
    $('#notices').append('<div id="empty_timeline">No subscriptions yet.</div>');
}

StatusNet.TimelineViewSubscriptions.prototype.enableProfileControls = function(profileXml) {

    StatusNet.debug("enableProfileControls()");
        
    var nameAttr = $(profileXml).find('dl.profile_list').attr('name');
    var result = nameAttr.split(",");
    
    var id = result[0];
    var username = result[1];
    
    StatusNet.debug("nameAtrr = " + nameAttr + ", id = " + id + ", name = " + username);
    
    var that = this;
    
    $('a.profile_unsubscribe:first', profileXml).bind('click', function(event) {
        that.client.unsubscribe(id, this);
    });

    $('a.profile_direct_message', profileXml).bind('click', function(event) {
        that.client.directMessageDialog(username);
    });
}
