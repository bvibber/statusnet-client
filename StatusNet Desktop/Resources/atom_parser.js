StatusNet.AtomParser = function() {
}

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