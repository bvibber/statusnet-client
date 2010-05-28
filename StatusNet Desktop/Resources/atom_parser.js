/**
 * Atom parsing class that understands some Activity Streams data
 */
StatusNet.AtomParser = function() {}

/**
 * Class method for generating a notice from an Atom entry
 *
 * @param DOM entry the Atom entry representing the notice
 */
StatusNet.AtomParser.noticeFromEntry = function(entry) {

    var notice = {};

    // note: attribute selectors seem to have problems with [media:width=48]
    $(entry).find('link[rel=avatar]').each(function(i, el) {
        if ($(el).attr('media:width') == '48') {
            notice.avatar = $(el).attr('href');
        }
    });

    notice.id = $(entry).find('[nodeName=statusnet:notice_info]:first').attr('local_id');
    notice.source = $(entry).find('[nodeName=statusnet:notice_info]:first').attr('source');
    notice.favorite = $(entry).find('[nodeName=statusnet:notice_info]:first').attr('favorite');
    notice.repeat_of = $(entry).find('[nodeName=statusnet:notice_info]:first').attr('repeat_of');
    notice.published = $(entry).find('published').text();
    var updated = $(entry).find('updated').text();

    // knock off the millisecs to make the date string work with humane.js
    notice.updated = updated.substring(0, 19);

    notice.content = $(entry).find('content').text();

    notice.author = $(entry).find('author name').text();
    notice.authorUri = $(entry).find('author uri').text();

    var idRegexp = /(\d)+$/;

    result = notice.authorUri.match(idRegexp);
    if (result) {
        notice.authorId = result[0];
    }

    notice.link = $(entry).find('author uri').text();

    var geoPoint = $(entry).find("[nodeName=georss:point]:first").text();

    if (geoPoint) {
        var gArray = geoPoint.split(' ');
        notice.lat = gArray[0];
        notice.lon = gArray[1];
    }

    notice.contextLink = $(entry).find('link[rel=ostatus:conversation]:first').attr('href');
    notice.inReplyToLink = $(entry).find("[nodeName=thr:in-reply-to]:first").attr('ref');

    if (notice.inReplyToLink) {
        result = notice.inReplyToLink.match(idRegexp);
        if (result) {
            notice.inReplyToId = result[0]; // Could be useful
        }
    }

    // @todo ostatus:attention ?

    // @todo category / tags / groups ?

    return notice;
}

/**
 * Class method for generating an author object from an
 * activity:subject.
 *
 * @param DOM subject the Atom feed's activity subject element
 */
StatusNet.AtomParser.userFromSubject = function(subject) {

    var author = {};

    author.username = $(subject).find('[nodeName=poco:preferredUsername]').text();
    author.fullName = $(subject).find('title').text();
    author.link = $(subject).find('id').text();

    var idRegexp = /(\d)+$/;
    result = author.link.match(idRegexp);
    if (result) {
        author.id = result[0];
    }

    StatusNet.debug("AtomParser.userFromSubject() - name: " + author.username + ", id: " + author.id);

    var geoPoint = $(subject).find("[nodeName=georss:point]:first").text();

    if (geoPoint) {
        var gArray = geoPoint.split(' ');
        author.lat = gArray[0];
        author.lon = gArray[1];
    }

    author.location = $(subject).find("[nodeName=poco:address] > [nodeName=poco:formatted]:first").text();

    // @todo: this homepage parse is sketchy. If we add other URLs we will need to update
    author.homepage = $(subject).find("[nodeName=poco:urls] > [nodeName=poco:value]:first").text();
    author.bio = $(subject).find('[nodeName=poco:note]').text();

    // note: attribute selectors seem to have problems with [media:width=48]
    $(subject).find('link[rel=avatar]').each(function(i, el) {
        var width = $(el).attr('media:width');
        switch(width) {

            // XXX: Shoulw we parse out the original (real big) avatar?

            case '24':
                author.avatarSmall = $(el).attr('href');
                break;
            case '48':
                author.avatarMedium = $(el).attr('href');
                break;
            case '96':
                author.avatarLarge = $(el).attr('href');
                break;
        }
    });

    StatusNet.debug(author.username + " small avatar: " + author.avatarSmall);
    StatusNet.debug(author.username + " medium avatar: " + author.avatarMedium);
    StatusNet.debug(author.username + " large avatar: " + author.avatarLarge);

    return author;
}
