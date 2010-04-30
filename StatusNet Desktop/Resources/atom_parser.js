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
    var permalink = $(entry).find('id').text();
    result = permalink.match(idRegexp);

    if (result) {
        notice.noticeId = result[0];
    }

    notice.date = $(entry).find('published').text();
    notice.desc = $(entry).find('content').text();
    notice.author = $(entry).find('author name').text();
    notice.link = $(entry).find('author uri').text();

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

    if (geoPoint !== "") {
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
