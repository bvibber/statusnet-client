/**
 * Constructor for a group timeline
 */
StatusNet.TimelineViewGroup = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "The {name} group on {site}";
}

// Make StatusNet.TimelineViewGroup inherit TimelineView's prototype
StatusNet.TimelineViewGroup.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Show profile information header for this group
 */
StatusNet.TimelineViewGroup.prototype.showGroupInfo = function() {

    var timeline = this.client.getActiveTimeline();
    var group = timeline.group;

    StatusNet.debug("showGroupInfo()");

    $('#profile_info').remove();

    var html = [];

    html.push('<div id="profile_panel">');
    html.push('<img src="' + group.avatarLarge + '"/>');
    html.push('<h2>!' + group.username + '</h2>');
    html.push('<dl class="profile_list">');

    html.push('<dt>Name</dt>');
    html.push('<dd class="name">');
    if (group.fullname) {
        html.push(group.fullname);
    } else {
        html.push(group.username);
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

    if (group.bio) {
        html.push('<dt>Bio</dt>');
        html.push('<dd class="bio">' + group.bio + '</dd>');
    }

    html.push('</dl>');

    html.push('<div id="profile_action_links"');

    if (group.member === "false" && group.blocked !== "true") {
        html.push('<a href="#" class="group_join">Join</a>');
    } else {
        html.push('<a href="#" class="group_leave">Leave</a>');
    }

    html.push('</div');

    html.push('</div>');
    $('#header').append(html.join(''));
    StatusNet.debug("finished showing group info...");

    var that = this;

    $('a.group_join').bind('click', function(event) {
        that.client.joinGroup(group.id, this);
    });

    $('a.group_leave').bind('click', function(event) {
        that.client.leaveGroup(group.id, this);
    });
}

/**
 * Override the header to show name of the group associated with
 * this timeline
 */
StatusNet.TimelineViewGroup.prototype.showHeader = function () {

    StatusNet.debug("TimelineViewGroup.showHeader()");

    var timeline = this.client.getActiveTimeline();
    var groupName = timeline.group.username;

    StatusNet.debug("TimelineViewGroup.showHeader() - group = " + groupName);

    var title = this.title.replace("{name}", groupName)
                          .replace("{site}", this.client.account.getHost());

    StatusNet.debug("TimelineViewGroup.showHeader() - setting title to: " + title);

    $("#header").html("<h1></h1>");
    $("#header h1").text(title);

    this.showGroupInfo();
}


