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

    // Pull notice ID from permalink
    var idRegexp = /(\d)+$/;
    notice.permalink = $(entry).find('id').text();

    result = notice.permalink.match(idRegexp);
    if (result) {
        notice.id = result[0]; // XXX: not sure we need this anymore
    }

    notice.published = $(entry).find('published').text();
    notice.updated = $(entry).find('updated').text();
    notice.content = $(entry).find('content').text();
    notice.author = $(entry).find('author name').text();

    notice.authorId = $(entry).find('[nodeName=activity:actor] > id').text();

    notice.link = $(entry).find('author uri').text();

    var geoPoint = $(entry).find("[nodeName=georss:point]:first").text();

    if (geoPoint) {
        var gArray = geoPoint.split(' ');
        notice.lat = gArray[0];
        notice.lon = gArray[1];

        StatusNet.debug(
            "Notice geo-location: lat = "
            + notice.lat
            + " lon = "
            + notice.lon
        );
    }

    notice.contextLink = $(entry).find('link[rel=ostatus:conversation]:first').attr('href');
    StatusNet.debug("contextLink: " + notice.contextLink);

    notice.inReplyToLink = $(entry).find("[nodeName=thr:in-reply-to]:first").attr('ref');

    if (notice.inReplyToLink) {
        result = notice.inReplyToLink.match(idRegexp);
        if (result) {
            notice.inReplyToId = result[0]; // Could be useful
        }
        StatusNet.debug("inReplyToLink: " + notice.inReplyToLink);
        StatusNet.debug("inReplyToid  : " + notice.inReplyToId)
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

    StatusNet.debug(author.username + " full name: " + author.fullName)

    author.link = $(subject).find('id').text();

    StatusNet.debug(author.username + " profile link: " + author.link);

    var geoPoint = $(subject).find("[nodeName=georss:point]:first").text();

    if (geoPoint) {
        var gArray = geoPoint.split(' ');
        author.lat = gArray[0];
        author.lon = gArray[1];

        StatusNet.debug(author.username
            + " geo-location: lat = "
            + author.lat
            + " lon = "
            + author.lon
        );
    }

    author.location = $(subject).find("[nodeName=poco:address] > [nodeName=poco:formatted]:first").text();

    StatusNet.debug(author.username + " location: " + author.location);

    // @todo: this homepage parse is sketchy. If we add other URLs we will need to update
    author.homepage = $(subject).find("[nodeName=poco:urls] > [nodeName=poco:value]:first").text();

    StatusNet.debug(author.username + " homepage: " + author.homepage);

    author.bio = $(subject).find('[nodeName=poco:note]').text();

    StatusNet.debug(author.username + " bio: " + author.bio);

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
