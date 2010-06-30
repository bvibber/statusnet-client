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
 * Constructor for a view for inbox timeline
 */
StatusNet.TimelineViewInbox = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "Inbox for {name} on {site}";
}

// Make StatusNet.TimelineViewInbox inherit TimelineView's prototype
StatusNet.TimelineViewInbox.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Put together the HTML for a single notice for a User profile timeline
 *
 * @param object notice the notice
 */
StatusNet.TimelineViewInbox.prototype.renderNotice = function(notice) {

    var html = [];

    var avatar = notice.avatar;
    var author = notice.author;

    // XXX: Argh! There must be a better way
    var authorUri = this.client.server + notice.nickname;

    html.push('<div class="notice" name="notice-' + notice.id +'">');
    html.push('   <div class="avatar"><a href="' + notice.authorUri + '"><img src="' + avatar + '"/></a></div>');
    html.push('   <div><a class="author" name="author" href="' +  notice.authorUri + '">' + author + '</a>');
    html.push('   <div class="content">'+ notice.content +'</div>');
    html.push('   </div><div class="date_link"><a href="' + notice.link + '" rel="external" title="View this message in browser">' + humane_date(notice.updated) + '</a></div>');
    html.push('<div class="notice_links"><a href="#" class="notice_reply">Reply</a>');
    html.push('</div></div>');
    html.push('<div class="clear"></div>');

    return html.join('');
}

StatusNet.TimelineViewInbox.prototype.enableNoticeControls = function(noticeDom) {

    var noticeAuthor = $(noticeDom).find('a.author').text();
    var uri = $(noticeDom).find('div a.author').attr('href');

    var that = this;

    // Direct message reply
    $(noticeDom).find('a.notice_reply').bind('click', function(event) {
        that.client.directMessageDialog(noticeAuthor);
    });

}
