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
 * View class for managing the sidebar
 */
StatusNet.Sidebar = function(client) {

    this.client = client;
    this.config = StatusNet.Config.getConfig();

    // handlers for sidebar image buttons

    $('#public_img').bind('click', function() { client.switchTimeline('public'); });
    $('#friends_img').bind('click', function() { client.switchTimeline('friends'); });
    $('#user_img').bind('click', function() { client.switchTimeline('user'); });
    $('#mentions_img').bind('click', function() { client.switchTimeline('mentions'); });
    $('#favorites_img').bind('click', function() { client.switchTimeline('favorites'); });
    $('#inbox_img').bind('click', function() { client.switchTimeline('inbox'); });
    $('#allgroups_img').bind('click', function() { client.switchTimeline('allgroups'); });
    $('#search_img').bind('click', function() { client.switchTimeline('search'); });
    $('#settings_img').bind('click', function() { StatusNet.showSettings(); });

    this.theme = StatusNet.Theme.getTheme();
    this.siteLogo = this.getSiteLogo();

    // set site logo the first time the sidebar is displayed
    $('#public_img').attr("src", this.siteLogo);

    this.userImage = this.getUserImage();

    // set user timeline img
    $('#user_img').attr("src", this.userImage);

    this.images = this.getNavBarImages();
};

StatusNet.Sidebar.prototype.getSiteLogo = function() {

    // check for override in config first
    var siteLogo = this.config.getSiteLogo();

    // then check the account
    if (!siteLogo) {
        var account = this.client.getActiveAccount();
        siteLogo = account.siteLogo;
    }

    // finally fall back to the default
    if (!siteLogo) {
        siteLogo = this.theme.getDefaultSiteLogo();
    }

    return siteLogo;
};

StatusNet.Sidebar.prototype.getUserImage = function() {

    // check for override in config first
    var userImage = this.config.getUserImage();

    // then check the account
    if (!userImage) {
        var account = this.client.getActiveAccount();
        userImage = account.avatar;
    }

    // finally fall back to the default
    if (!userImage) {
        userImage = this.theme.getImage("default-avatar-stream.png");
    }

    return userImage;
};

StatusNet.Sidebar.prototype.getNavBarImages = function() {

    // @todo better generic names for these images and a way to
    // override via config file
    var theme = this.theme;

    var images = [
        {
            "id": "#public_img",
            "timeline": "public",
            "deselected": this.siteLogo,
            "selected": this.siteLogo,
            "selected_class": "opaque"
        },
        {
            "id": "#user_img",
            "timeline": "user",
            "deselected": this.userImage,
            "selected": this.userImage,
            "selected_class": "opaque"
        },
        {
            "id": "#friends_img",
            "timeline": "friends",
            "deselected": theme.getImage("chat.png"),
            "selected": theme.getImage("blue/chat.png")
        },
        {
            "id": "#mentions_img",
            "timeline": 'mentions',
            "deselected": theme.getImage("at.png"),
            "selected": theme.getImage("blue/at.png")
        },
        {
            "id": "favorites_img",
            "timeline": "favorites",
            "deselected": theme.getImage("star.png"),
            "selected": theme.getImage("blue/star.ping")
        },
        {
            "id": "inbox_img",
            "timeline": "inbox",
            "deselected": theme.getImage("mail.png"),
            "selected": theme.getImage("blue/mail.png")
        },
        {
            "id": "#allgroups_img",
            "timeline": "allgroups",
            "deselected": theme.getImage("users.png"),
            "selected": theme.getImage("blue/users.png")
        },
        {
            "id": "#search_img",
            "timeline": "search",
            "deselected": theme.getImage("magnifier.png"),
            "selected": theme.getImage("blue/magnifier.png")
        },
        {
            "id": "settings_img",
            "timeline": "settings",
            "deselected": theme.getImage("settings.png"),
            "selected": theme.getImage("settings.png")
        }
    ];

    return images;
};

/**
 * Class method to higlight the icon associated with the selected timeline
 *
 * @param String timeline   the timeline to highlight
 */
StatusNet.Sidebar.prototype.setSelectedTimeline = function(timeline) {
    for (var i = 0; i < this.images.length; i++) {
        var image = this.images[i]
        if (image["timeline"] === timeline) {
            $(image["id"]).attr("src", image["selected"]);
            if (image["selected_class"]) {
                $(image["id"]).addClass(image["selected_class"]);
            }
            if (image["deselected_class"]) {
                $(image["id"]).removeClass(image["deselected_class"]);
            }
        } else {
            $(image["id"]).attr("src", image["deselected"]);
            if (image["selected_class"]) {
                $(image["id"]).removeClass(image["selected_class"]);
            }
            if (image["deselected_class"]) {
                $(image["id"]).addClass(image["deselected_class"]);
            }
        }
    }
};
