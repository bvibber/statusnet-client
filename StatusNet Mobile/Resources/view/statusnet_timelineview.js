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
 * Base class for Timeline view
 *
 * @param StatusNet.Client client  The controller
 */
StatusNet.TimelineView = function(client) {
    StatusNet.debug("in StatusNet.TimelineView");
    this.client = client;
    this.title = "Timeline on {site}";

    StatusNet.debug("TimelineView constructor");
    // XXX: Woah, it doesn't work to pass the timeline into the constructor!
    if (client) {
        this.timeline = client.timeline;
    }

    var that = this;

    // Attach event listeners

    StatusNet.debug("TimelineView constructor - attaching events");

    this.timeline.updateStart.attach(
        function() {
            StatusNet.debug("TimelineView got updateStart event!");
            that.showSpinner();
            StatusNet.debug("TimelineView updateStart DONE");
        }
    );

    StatusNet.debug("TimelineView constructor - finished attaching updateStart");

    this.timeline.updateFinished.attach(
        function(args) {
            StatusNet.debug("TimelineView got updateFinished event!");
            that.hideSpinner();
            StatusNet.debug("TimelineView showing:");
            that.show();

			StatusNet.debug("TimelineView checking for total number of notices")
		    var notices = that.client.timeline.getNotices();
			if (notices.length == 0) {
				StatusNet.debug("TimelineView: no notices found");
	        	that.table.appendRow({title: 'No notices in this timeline yet.'});
			}
			StatusNet.debug("TimelineView - there are " + notices.length + " notices in timeline");
            StatusNet.debug("TimelineView updateFinished DONE");
        }
    );

    this.timeline.noticeAdded.attach(
        function(args) {
            StatusNet.debug("TimelineView got noticeAdded event!");
            if (args) {
                StatusNet.debug("FIXME: implement TimelineView.showNewNotice");
                //that.showNewNotice(args.notice);
            } else {
                StatusNet.debug("noticeAdded event with no args!");
            }
            StatusNet.debug("TimelineView noticeAdded DONE");
        }
    );

};

/**
 * Additional initialization stuff that can't be done in the constructor
 */
StatusNet.TimelineView.prototype.init = function() {
	StatusNet.debug("TimelineView init");

	StatusNet.debug("TimelineView: adding adding activity indicator -- spinner");

	this.act = Titanium.UI.createActivityIndicator();
	this.act.style = Titanium.UI.iPhone.ActivityIndicatorStyle.PLAIN;
	this.act.font = {fontFamily:'Helvetica Neue', fontSize:15,fontWeight:'bold'};
	this.act.color = 'white';
	this.act.message = 'Loading...';

	StatusNet.debug("TimelineView: Finished adding activity indicator");
};

/**
 * Render the HTML display of a given timeline
 *
 */
StatusNet.TimelineView.prototype.show = function() {
    StatusNet.debug("TimelineView.show");
    var that = this;

    if (!this.table) {
        StatusNet.debug("TimelineView.show creating navbar...");
        var navbar = StatusNet.Platform.createNavBar(this.window);

        var updateButton = Titanium.UI.createButton({
            title: "New" // @fixme use the system compose icon
        });
        updateButton.addEventListener('click', function() {
            that.client.newNoticeDialog();
        });
        navbar.setRightNavButton(updateButton);

        StatusNet.debug("TimelineView.show creating table webview...");
        this.table = Titanium.UI.createWebView({
            top: navbar.height,
            left: 0,
            right: 0,
            bottom: 0,
            scalesPageToFit: false,
            url: "timeline.html"
        });

        Ti.App.addEventListener('sn_ready', function(event) {
            StatusNet.debug('YAY GOT sn_ready EVENT! ' + event);
        });

        Ti.App.addEventListener('sn_external', function(event) {
            StatusNet.debug('YAY sn_external event!');
            StatusNet.debug('event: ' + event.url);
            // Open external links in system default browser...
            // Note: on iPhone this will launch Safari and may cause us to close.
            Titanium.Platform.openURL(event.url);
        });
        this.window.add(this.table);
    }

    StatusNet.debug("TimelineView.show C");
    var notices = this.client.timeline.getNotices();
    StatusNet.debug("TimelineView.show D");

    // clear old notices
    // @todo be a little nicer; no need to clear if we just changed one thing
    StatusNet.debug("TimelineView.show E");
    //this.table.setData([]);
    StatusNet.debug("TimelineView.show F");

    var html = this.htmlHeader();
    if (notices.length > 0) {
    StatusNet.debug("TimelineView.show G: " + notices.length + " notice(s)");

        for (i = 0; i < notices.length; i++) {
            html += this.renderNotice(notices[i]);
        }

        /*
        var that = this;

        $('#notices div.notice').each(function() {
            that.enableNoticeControls(this);
        });
        */
    StatusNet.debug("TimelineView.show G-done");

    }
    
    html += this.htmlFooter();
    StatusNet.debug('HTML IS: ' + html);
    //this.table.html = html;
    //this.table.evalJS("document.getElementById('timeline').innerHTML = " + Titanium.JSON.sringify(html));
    StatusNet.debug("TimelineView.show FIRING TIMELINE EVENT");
    Titanium.App.fireEvent('updateTimeline', {html: html});
    StatusNet.debug("TimelineView.show FIRED TIMELINE EVENT");

    StatusNet.debug("TimelineView.show H");
    this.hideSpinner();
    StatusNet.debug("TimelineView.show done");
};


StatusNet.TimelineView.prototype.htmlHeader = function(notice) {
    return '';
    return '<html>' +
           '<head>' +
           '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">' +
           '<body>';
}

StatusNet.TimelineView.prototype.htmlFooter = function(notice) {
    return '';
    return '<script>' +
           'Titanium.App.addEventListener("timeline", function(event) {' +
           '  Titanium.API.info("hello: " + event);' +
           '});' +
           '$("a").click(function(event) {' +
           '  Titanium.API.info("hello: " + this.href);' +
           '  Titanium.App.fireEvent("sn_external", {wtf: "hey", url: this.href});' +
           '  return false;' +
           '});' +
           '</script>';
}

/**
 * Put together the HTML for a single notice
 *
 * @param object notice the notice
 */
StatusNet.TimelineView.prototype.renderNotice = function(notice) {

    var html = [];
    var avatar = notice.avatar;
    var author = notice.author;
    var authorId = notice.authorId

    var classes = ['notice'];

    if (notice.favorite === "true") {
        classes.push('notice-favorite');
    }

    if (notice.repeated === "true") {
        classes.push('notice-repeated');
    }

    if (notice.repeat_of) {
        classes.push('notice-repeat');
    }

    html.push('<div class="' + classes.join(" ") + '" name="notice-' + notice.id +'">');
    html.push('<div class="avatar"><a href="' + notice.authorUri + '" rel="external"><img src="' + avatar + '"/></a>');
    html.push('</div>');
    html.push('<div><a class="author" name="author-' + authorId + '" href="' + notice.authorUri + '" rel="external">' + author + '</a>');
    html.push('<div class="content">'+ notice.content +'</div>');
    //html.push('</div><div class="date_link"><a href="' + notice.link + '" rel="external" title="View this notice in browser">' + humane_date(notice.updated) + '</a></div>');
    html.push('</div><div class="date_link"><a href="' + notice.link + '" rel="external" title="View this notice in browser">' + notice.updated + '</a></div>');
    if (notice.source) {
        html.push('<div class="notice_source"><span class="notice_source_inner">from ' + notice.source + '</span></div>');
    }
    if (notice.contextLink && notice.inReplyToLink) {
        html.push(
            '<div class="context_link"><a rel="external" title="View this conversation in browser" href="'
            + notice.contextLink +'">in context</a></div>'
        );
    }
    html.push('<div class="notice_links"><a href="#" class="notice_reply">Reply</a>');

    if (notice.favorite === "true") {
        html.push(' <a href="#" class="notice_unfave">Unfave</a>');
    } else {
        html.push(' <a href="#" class="notice_fave">Fave</a>')
    }

    if (author === this.client.account.username) {
        html.push(' <a href="#" class="notice_delete">Delete</a>')
    } else {
        if (notice.repeated === "false") {
            html.push(' <a href="#" class="notice_repeat">Repeat</a>');
        }
    }

    html.push('</div></div>');
    html.push('<div class="clear"></div>');

    return html.join('');
}
/**
 * @param string html
 * @return string plaintext
 * @access private
 */
StatusNet.TimelineView.prototype.stripHtml = function(html) {
    var src = '<div>' + html + '</div>';
    StatusNet.debug('STRIP src: ' + src);
    //var dom = Titanium.XML.parseString(src);
    //StatusNet.debug('STRIP dom: ' + dom);
    var txt = $(src).text();
    StatusNet.debug('STRIP txt: ' + txt);
    return txt;
}


StatusNet.TimelineView.prototype.notifyNewNotice = function(notice) {
    StatusNet.debug('Stubbed TimelineView.notifyNewNotice');
/*
    if (!StatusNet.nativeNotifications()) {
        return;
    }

    if (this.client.account.username === notice.author) {
        return;
    }

    var msg;

    if (notice.atomSource) {
        msg = "New notice from " + notice.atomSource;
    } else {
        msg = "New notice from " + notice.author;
    }

    var notification = Titanium.Notification.createNotification(Titanium.UI.getMainWindow());
    notification.setTitle(msg);
    notification.setMessage(notice.title);

    notification.setIcon("app://logo.png");
    notification.setDelay(5000);
    notification.setCallback(function () {
    // @todo Bring the app window back to focus / on top
        StatusNet.debug("i've been clicked");
    });
    notification.show();
*/
}

/**
 * Determines whether the notice is local (by permalink)
 *
 * @param String uri the uri of the notice
 *
 * @return boolean value
 */
StatusNet.TimelineView.prototype.localAuthor = function(uri) {

    if (uri.substring(0, this.client.server.length) === this.client.server) {
        return true;
    }
    return false;
};

StatusNet.TimelineView.prototype.enableNoticeControls = function(noticeDom) {
    var name = $(noticeDom).attr('name');
    var noticeId = name.substring(7); // notice-

    name = $(noticeDom).find('a.author').attr('name');
    var authorId = name.substring(7); // author-

    var noticeAuthor = $(noticeDom).find('a.author').text();

    StatusNet.debug("authorId = " + authorId + " author name = " + noticeAuthor + " noticeId = " + noticeId);

    var uri = $(noticeDom).find('div a.author').attr('href');

    var that = this;

    // Override links to external web view of the notice timelines
    // with click event handlers to display timelines within the client
    if (this.localAuthor(uri)) {

        $(noticeDom).find('div a.author').attr('href', "#");
        $(noticeDom).find('div a.author').bind('click', function(event) {
            StatusNet.debug("Switching timeline to user " + authorId);
            that.client.switchUserTimeline(authorId);
        });

        $(noticeDom).find('div.avatar a').attr('href', "#");
        $(noticeDom).find('div.avatar').bind('click', function(event) {
            StatusNet.debug("Switching timeline to user " + authorId);
            that.client.switchUserTimeline(authorId);
        });
    }

    $(noticeDom).find('a.notice_reply').bind('click', function(event) {
        that.client.newNoticeDialog(noticeId, noticeAuthor);
    });

    // Override external web links to local users in-content
    $(noticeDom).find('div.content span.vcard a').each(function() {
        var href = $(this).attr('href');
        if (that.localAuthor(href)) {
            $(this).attr('href', '#');
            $(this).click(function() {
                var idRegexp = /(\d)+$/;
                result = href.match(idRegexp);
                if (result) {
                    that.client.switchUserTimeline(result[0]);
                }
            });
        }
    });

};

/**
 * Set up anything that should go in the header section...
 */
StatusNet.TimelineView.prototype.showHeader = function () {
    var title = this.title.replace("{name}", this.client.account.username)
                           .replace("{site}", this.client.account.getHost());
    //$("#header").html("<h1></h1>");
    //$("#header h1").text(title);
};

/**
 * Show wait cursor
 */
StatusNet.TimelineView.prototype.showSpinner = function() {
    StatusNet.debug("showSpinner");
	this.window.setToolbar([this.act],{animated:true});
	this.act.show();
};

/**
 * Hide wait cursor
 */
StatusNet.TimelineView.prototype.hideSpinner = function() {
    StatusNet.debug("hideSpinner");
	this.act.hide();
	this.window.setToolbar(null,{animated:true});
};

/**
 * Constructor for a view for a friends timeline
 */
StatusNet.TimelineViewFriends = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "{name} and friends on {site}";
    this.tab = 'friends';
};

// Make StatusNet.TimelineViewFriends inherit TimelineView's prototype
StatusNet.TimelineViewFriends.prototype = heir(StatusNet.TimelineView.prototype);


/**
 * Constructor for a view for mentions timeline
 */
StatusNet.TimelineViewMentions = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "{name} and friends on {site}";
    this.tab = 'mentions';
};

// Make StatusNet.TimelineViewMentions inherit TimelineView's prototype
StatusNet.TimelineViewMentions.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Constructor for a view for public timeline
 */
StatusNet.TimelineViewPublic = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "Public timeline on {site}";
    this.tab = 'public';
};

// Make StatusNet.TimelineViewPublic inherit TimelineView's prototype
StatusNet.TimelineViewPublic.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Constructor for a view for favorites timeline
 */
StatusNet.TimelineViewFavorites = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "{name}'s favorite notices on {site}";
    this.tab = 'favorites';
};

// Make StatusNet.TimelineViewFavorites inherit TimelineView's prototype
StatusNet.TimelineViewFavorites.prototype = heir(StatusNet.TimelineView.prototype);


/**
 * Constructor for a view for inbox timeline
 */
StatusNet.TimelineViewInbox = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "Inbox for {name} on {site}";
    this.tab = 'inbox';
};

// Make StatusNet.TimelineViewInbox inherit TimelineView's prototype
StatusNet.TimelineViewInbox.prototype = heir(StatusNet.TimelineView.prototype);


/**
 * Constructor for a view for search timeline
 * @fixme this guy'll need an input box!
 */
StatusNet.TimelineViewSearch = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "Text search on {site}";
    this.tab = 'search';
};

// Make StatusNet.TimelineViewSearch inherit TimelineView's prototype
StatusNet.TimelineViewSearch.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Set up the search box.
 */
StatusNet.TimelineViewSearch.prototype.showHeader = function () {
    StatusNet.TimelineView.prototype.showHeader.call(this);
    /*
    $("#header").append('<div id="search-box">' +
                        '<label for="search">Search:</label> ' +
                        '<input id="search">' +
                        '</div>');
    var timeline = this.client.timeline;
    var q = timeline.searchTerm();
    $("#search").val(q)
                .change(function() {
        timeline.updateSearch($(this).val());
    });
    */
};
