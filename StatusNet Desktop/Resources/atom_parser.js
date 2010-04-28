StatusNet.AtomParser = function() {
}

StatusNet.AtomParser.statusFromEntry = function(entry) {
    
    var status = {};

    // note: attribute selectors seem to have problems with [media:width=48]
    var avatar = 'about:blank';
    $(entry).find('link[rel=avatar]').each(function(i, el) {
        if ($(el).attr('media:width') == '48') {
            status.avatar = $(el).attr('href');
        }
    });

    // Pull status ID from permalink
    var idRegexp = /(\d)+$/;
    var permalink = $(entry).find('id').text();
    result = permalink.match(idRegexp);

    if (result) {
        status.noticeId = result[0];
    }

    status.date = $(entry).find('published').text();
    status.desc = $(entry).find('content').text();
    status.author = $(entry).find('author name').text();
    status.link = $(entry).find('author uri').text();
    
    return status;
}