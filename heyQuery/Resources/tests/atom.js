module("atom");

function is_numeric(s) {
    return /^[0-9]+$/.test(s);
}

function is_boolean(s) {
    return /^(true|false)$/.test(s);
}

test("home", function() {
	expect(3);
	reset();

    var data = readXmlFile('tests/data/atom-home.xml');

    equals($(data).find('feed > entry:first').length, 1, "First entry in feed"); // @fail -- get no results
    equals($(data).find('entry:first').length, 1, "First entry in feed -- hack");
    equals($(data).find('feed > entry').length, 3, "All entries in feed");

    //var expected = ['generator', 'id', 'title', 'subtitle', 'logo', 'updated', 'link', 'link', 'entry', 'entry', 'entry'];
    //var found = [];
    $(data).find('feed > entry').each(function(i, el) {
        ok(el === this, "Each should set 'this' to found element...");
        //found.push(this.name);
    });
    //equals(found, expected, 'Each setting "this" to found elements');

});


test("users", function() {
	expect(6);
	reset();

    var data = readXmlFile('tests/data/users.xml');
    var checks = ['followers_count',
                  'friends_count',
                  'statuses_count',
                  'favourites_count'];
    for (var i = 0; i < checks.length; i++) {
        var key = checks[i];
        var num = $(data).find(key).text();
        ok(is_numeric(num), "Extended user info: " + key);
    }

    var checks = ['following',
                  'notifications'];
    for (var i = 0; i < checks.length; i++) {
        var key = checks[i];
        var num = $(data).find(key).text();
        ok(is_boolean(num), "Extended user info: " + key);
    }
});


test("rsd", function() {
	expect(1);
	reset();
    var xml = readXmlFile('tests/data/rsd.xml');
    var apiroot = $("api[name='Twitter']", xml).attr("apiLink");
    ok(/^http:/.test(apiroot), "RSD Twitter API fetch");
});


test("parser", function() {
    var data = readXmlFile('tests/data/atom-home.xml');
    var entry = $(data).find('feed > entry')[0];
    var notice = StatusNet.AtomParser.noticeFromEntry(entry);

    equals(notice.avatar, "http://lazarus.local/mublog/theme/default/default-avatar-stream.png", "avatar");
    equals(notice.id, "794", "local id");
    equals(notice.source, "web", "notice source"); // @fail
    equals(notice.favorite, "false", "non-favorited notice"); // @fail
    equals(notice.repeated, "false", "non-repeated notice"); // @fail
    equals(notice.repeat_of, undefined, "non-repeated_of notice");
    equals(notice.published, "2010-06-23T20:09:01+00:00", "published");
    equals(notice.updated, "2010-06-23T20:09:01", "updated"); // not too sure this is right, but that's what we're currently doing.
    equals(notice.title, "POSTS ARE FUN", "title"); //??
    //equals(notice.atomSource...?
    equals(notice.content, "POSTS ARE FUN", "content"); // note: i don't think we're checking the type!
    equals(notice.author, "aposter", "author");
    equals(notice.authorUri, "http://lazarus.local/mublog/user/129", "author URI");
    equals(notice.fullname, "aposter", "full name");
    equals(notice.authorId, "129", "author ID");
    equals(notice.link, "http://lazarus.local/mublog/notice/794", "link");
    equals(notice.lat, undefined, "lat");
    equals(notice.lon, undefined, "lon");
    equals(notice.contextLink, "http://lazarus.local/mublog/conversation/100793", "context link");
    equals(notice.inReplyToLink, undefined, "reply-to link - no reply");
    equals(notice.inReplyToId, undefined, "no reply-to id");
});
