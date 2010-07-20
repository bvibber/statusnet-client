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

StatusNet.TimelineViewAllGroups = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "Groups on {site}";

    StatusNet.debug("TimelineViewAllGroups constructor");

    this.timeline = client.getActiveTimeline();

    var that = this;

    this.timeline.groupAdded.attach(
        function(args) {
            if (args) {
                that.showNewGroup(args.group);
            } else {
                StatusNet.debug("groupAdded event with no args!");
            }
        }
    );
}

// Make StatusNet.TimelineViewAllGroups inherit TimelineView's prototype
StatusNet.TimelineViewAllGroups.prototype = heir(StatusNet.TimelineView.prototype);

StatusNet.TimelineViewAllGroups.prototype.show = function() {

    StatusNet.debug("StatusNet.TimelineViewAllGroups.show() - getting groups");

    var groups = this.timeline.getGroups();

    $('#notices').empty();

    if (groups.length > 0) {

        StatusNet.debug("showing group");
        var html = [];

        for (i = 0; i < groups.length; i++) {
            html.push(this.renderGroup(groups[i]));
        }

        $('#notices').append(html.join(''));
    }

	var that = this;

    $('#notices > div#profile_panel').each(function() {
        that.enableGroupControls(this);
    });

    StatusNet.debug("StatusNet.TimelineViewAllGroups.show() - finished showing groups");
}

StatusNet.TimelineViewAllGroups.prototype.showNewGroup = function(group) {
    StatusNet.debug("prepending group " + group.id);
    $('#notices').prepend(this.renderGroup(group));
	this.enableGroupControls($('#notices > div#profile_panel:first').get(0));
    $('#notices > div#profile_panel:first').hide();
    $('#notices > div#profile_panel:first').fadeIn("slow");
}

/**
 * Put together HTML for a group
 *
 * @param object group  the group
 */
StatusNet.TimelineViewAllGroups.prototype.renderGroup = function(group) {

    StatusNet.debug("renderGroup()");

    var html = [];

    html.push('<div id="profile_panel">');

	if (group.stream_logo) {
    	html.push('<a href="#" class="timeline_link"><img src="' + group.stream_logo + '"/></a>');
	} else {
		html.push('<a href="#" class="timeline_link"><img src="images/default-avatar-stream.png"/></a>');
	}

    html.push('<div id="profile_action_links"');

    if (group.member === "false" && group.blocked !== "true") {
        html.push('<a href="#" class="group_join">Join</a>');
    } else {
        html.push('<a href="#" class="group_leave">Leave</a>');
    }

    html.push('</div');

    html.push('<h2><a href="#" class="timeline_link">!' + group.nickname + '</h2></a>');
    html.push('<dl class="profile_list" name="' + group.id + ',' + group.nickname + '">');

    html.push('<dt>Name</dt>');
    html.push('<dd class="name">');
    if (group.fullname) {
        html.push(group.fullname);
    } else {
        html.push(group.nickname);
    }

    html.push('</dd>');

    if (group.location) {
        html.push('<dt>Location</dt>');
        html.push('<dd class="location">' + group.location + '</dd>');
    }

    if (group.homepage) {
        html.push('<dt>Homepage</dt>');
        html.push('<dd><a rel="external" href="' + group.homepage + '">' + group.homepage + '</a></dd>');
    }

    if (group.description) {
        html.push('<dt>Bio</dt>');
        html.push('<dd class="bio">' + group.description + '</dd>');
    }

    html.push('</dl>');

    html.push('<dl class="profile_statistics">');
    html.push('<dt>Members</dt>');
    html.push('<dd>' + group.member_cnt + '</dd>');
    html.push('</dl>')

    html.push('</div>');

    return html.join('');
};

/**
 * Show this if the timeline is empty
 */
StatusNet.TimelineViewAllGroups.prototype.showEmptyTimeline = function() {
    $('#notices').empty();
    $('#notices').append('<div id="empty_timeline">No groups yet.</div>');
}

StatusNet.TimelineViewAllGroups.prototype.enableGroupControls = function(profileXml) {

    var nameAttr = $(profileXml).find('dl.profile_list').attr('name');
    var result = nameAttr.split(",");

    var id = result[0];
    var groupname = result[1];

    StatusNet.debug("nameAtrr = " + nameAttr + ", id = " + id + ", name = " + groupname);

    var that = this;

	$('a.timeline_link', profileXml).bind('click', function(event) {
		that.client.showGroupTimeline(id);
	});

    $('a.group_join', profileXml).bind('click', function(event) {
        that.client.joinGroup(id, this);
    });

    $('a.group_leave', profileXml).bind('click', function(event) {
        that.client.leaveGroup(id, this);
    });
}
