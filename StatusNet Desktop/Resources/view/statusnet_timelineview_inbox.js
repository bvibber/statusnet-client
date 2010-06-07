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

    html.push('<div class="notice" name="notice-' + notice.id +'">');
    html.push('   <div class="avatar"><a href="' + notice.authorUri + '"><img src="' + avatar + '"/></a></div>');
    html.push('   <div><a class="author" name="author" href="' +  notice.authorUri + '">' + author + '</a><br/>');
    html.push('   <div class="content">'+ notice.content +'<br/></div>');
    html.push('   <small class="date"><a href="' + notice.link + '" rel="external">' + humane_date(notice.updated) + '</a></small></div>');
    html.push('<a href="#" class="notice_reply">Reply</a>');
    html.push('</div>');
    html.push('<div class="clear"></div>');

    return html.join('');
}

StatusNet.TimelineViewInbox.prototype.enableNoticeControls = function(noticeDom) {

    var noticeAuthor = $(noticeDom).find('a.author').text();
    var uri = $(noticeDom).find('div a.author').attr('href');

    var that = this;

    // Reply
    $(noticeDom).find('a.notice_reply').bind('click', function(event) {
        alert("Direct Message");
    });

}
