var document = readXmlFile('tests/data/index.html');

module("selector");

test("element", function() {
	Titanium.API.debug('qqq');
	expect(19);
	reset();
	Titanium.API.debug('qqq2');

    var x = jQuery("*");
    Titanium.API.debug('hey! ' + x);

	ok( jQuery("*").size() >= 30, "Select all" ); // ok it's dying in here.
	Titanium.API.debug('qqq3');
	var all = jQuery("*"), good = true;
	Titanium.API.debug('qqq4');
	Titanium.API.debug(all);
	for ( var i = 0; i < all.length; i++ )
		if ( all[i].nodeType == 8 )
			good = false;
	Titanium.API.debug('qqq5');
	ok( good, "Select all elements, no comment nodes" );
	t( "Element Selector", "p", ["firstp","ap","sndp","en","sap","first"] );
	t( "Element Selector", "body", ["body"] );
	t( "Element Selector", "html", ["html"] ); // fails on iPhone... possibly need to be checking the doc rather than the doc element
	t( "Parent Element", "div p", ["firstp","ap","sndp","en","sap","first"] );
	equals( jQuery("param", "#object1").length, 2, "Object/param as context" );

	/*
	// These run, but fail because they return dupes which we can't filter out yet.
	same( jQuery("p", document.getElementsByTagName("div")).get(), q("firstp","ap","sndp","en","sap","first"), "Finding elements with a context." );
	same( jQuery("p", "div").get(), q("firstp","ap","sndp","en","sap","first"), "Finding elements with a context." );
	same( jQuery("p", jQuery("div")).get(), q("firstp","ap","sndp","en","sap","first"), "Finding elements with a context." );
	same( jQuery("div").find("p").get(), q("firstp","ap","sndp","en","sap","first"), "Finding elements with a context." );
	*/

	same( jQuery("#form").find("select").get(), q("select1","select2","select3"), "Finding selects with a context." );
	
    // something goes wrong in here sometimes
	//ok( jQuery("#length").length, '&lt;input name="length"&gt; cannot be found under IE, see #945' );
	//ok( jQuery("#lengthtest input").length, '&lt;input name="length"&gt; cannot be found under IE, see #945' );

    /*
	// these are disabled as noted above -- unique checks fail right now
	// Check for unique-ness and sort order
	same( jQuery("*").get(), jQuery("*, *").get(), "Check for duplicates: *, *" );
	same( jQuery("p").get(), jQuery("p, div p").get(), "Check for duplicates: p, div p" );

	t( "Checking sort order", "h2, h1", ["qunit-header", "qunit-banner", "qunit-userAgent"] );
	t( "Checking sort order", "h2:first, h1:first", ["qunit-header", "qunit-banner"] );
	t( "Checking sort order", "p, p a", ["firstp", "simon1", "ap", "google", "groups", "anchor1", "mark", "sndp", "en", "yahoo", "sap", "anchor2", "simon", "first"] );
	*/

});

//if ( location.protocol != "file:" ) {
	test("XML Document Selectors", function() {
		expect(7);
		//stop();
		//jQuery.get("data/with_fries.xml", function(xml) {
		var xml = readXmlFile('tests/data/with_fries.xml');
			equals( jQuery("foo_bar", xml).length, 1, "Element Selector with underscore" );
			equals( jQuery(".component", xml).length, 1, "Class selector" );
			equals( jQuery("[class*=component]", xml).length, 1, "Attribute selector for class" );
			equals( jQuery("property[name=prop2]", xml).length, 1, "Attribute selector with name" );
			equals( jQuery("[name=prop2]", xml).length, 1, "Attribute selector with name" );
			equals( jQuery("#seite1", xml).length, 1, "Attribute selector with ID" );
			equals( jQuery("component#seite1", xml).length, 1, "Attribute selector with ID" );
			//start();
		//});
	});
//}

test("broken", function() {
	expect(8);
	function broken(name, selector) {
		try {
			jQuery(selector);
			ok( false, name + ": " + selector );
		} catch(e){
			ok(  typeof e === "string" && e.indexOf("Syntax error") >= 0,
				name + ": " + selector );
		}
	}
	
	broken( "Broken Selector", "[", [] );
	broken( "Broken Selector", "(", [] );
	broken( "Broken Selector", "{", [] );
	broken( "Broken Selector", "<", [] ); // fails due to crummy html detection
	broken( "Broken Selector", "()", [] );
	broken( "Broken Selector", "<>", [] ); // fails due to crummy html detection
	broken( "Broken Selector", "{}", [] );
	broken( "Doesn't exist", ":visble", [] );
});

test("id", function() {
	expect(28);
	t( "ID Selector", "#body", ["body"] );
	t( "ID Selector w/ Element", "body#body", ["body"] );
	t( "ID Selector w/ Element", "ul#first", [] );
	t( "ID selector with existing ID descendant", "#firstp #simon1", ["simon1"] );
	//t( "ID selector with non-existant descendant", "#firstp #foobar", [] ); // crashes
    /*
    // Something is unhappy with these and crashes on iphone
	t( "ID selector using UTF8", "#台北Táiběi", ["台北Táiběi"] );
	t( "Multiple ID selectors using UTF8", "#台北Táiběi, #台北", ["台北Táiběi","台北"] );
	t( "Descendant ID selector using UTF8", "div #台北", ["台北"] );
	t( "Child ID selector using UTF8", "form > #台北", ["台北"] );
	*/
	
	t( "Escaped ID", "#foo\\:bar", ["foo:bar"] );
	t( "Escaped ID", "#test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );
	t( "Descendant escaped ID", "div #foo\\:bar", ["foo:bar"] );
	t( "Descendant escaped ID", "div #test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );
	t( "Child escaped ID", "form > #foo\\:bar", ["foo:bar"] );
	t( "Child escaped ID", "form > #test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );
	
	t( "ID Selector, child ID present", "#form > #radio1", ["radio1"] ); // bug #267
	//t( "ID Selector, not an ancestor ID", "#form #first", [] ); // crashes
	t( "ID Selector, not a child ID", "#form > #option1a", [] ); // returns #option1a when it shouldn't
	
	t( "All Children of ID", "#foo > *", ["sndp", "en", "sap"] ); // returns lots of elements it shouldn't
	t( "All Children of ID with no children", "#firstUL > *", [] );  // returns lots of elements it shouldn't // @fail crashing on android
	
	/*
	// appendTo etc not implemented
	var a = jQuery('<div><a name="tName1">tName1 A</a><a name="tName2">tName2 A</a><div id="tName1">tName1 Div</div></div>').appendTo('#main');
	equals( jQuery("#tName1")[0].id, 'tName1', "ID selector with same value for a name attribute" );
	equals( jQuery("#tName2").length, 0, "ID selector non-existing but name attribute on an A tag" );
	a.remove();
	*/

	t( "ID Selector on Form with an input that has a name of 'id'", "#lengthtest", ["lengthtest"] );
	
	//t( "ID selector with non-existant ancestor", "#asdfasdf #foobar", [] ); // bug #986 // crashes

	same( jQuery("body").find("div#form").get(), [], "ID selector within the context of another element" );

	t( "Underscore ID", "#types_all", ["types_all"] );
	t( "Dash ID", "#fx-queue", ["fx-queue"] );

	t( "ID with weird characters in it", "#name\\+value", ["name+value"] );
});

test("class", function() {
	expect(22);
	t( "Class Selector", ".blog", ["mark","simon"] );
	t( "Class Selector", ".GROUPS", ["groups"] );
	t( "Class Selector", ".blog.link", ["simon"] );
	t( "Class Selector w/ Element", "a.blog", ["mark","simon"] );
	t( "Parent Class Selector", "p .blog", ["mark","simon"] );

	same( jQuery(".blog", document.getElementsByTagName("p")).get(), q("mark", "simon"), "Finding elements with a context." );
	same( jQuery(".blog", "p").get(), q("mark", "simon"), "Finding elements with a context." );
	same( jQuery(".blog", jQuery("p")).get(), q("mark", "simon"), "Finding elements with a context." );
	same( jQuery("p").find(".blog").get(), q("mark", "simon"), "Finding elements with a context." );
	
	t( "Class selector using UTF8", ".台北Táiběi", ["utf8class1"] );
	t( "Class selector using UTF8", ".台北", ["utf8class1","utf8class2"] );
	t( "Class selector using UTF8", ".台北Táiběi.台北", ["utf8class1"] );
	t( "Class selector using UTF8", ".台北Táiběi, .台北", ["utf8class1","utf8class2"] ); // fails due to our bad duplicate filtering
	t( "Descendant class selector using UTF8", "div .台北Táiběi", ["utf8class1"] );
	t( "Child class selector using UTF8", "form > .台北Táiběi", ["utf8class1"] );

	t( "Escaped Class", ".foo\\:bar", ["foo:bar"] );
	t( "Escaped Class", ".test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );
	t( "Descendant scaped Class", "div .foo\\:bar", ["foo:bar"] );
	t( "Descendant scaped Class", "div .test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );
	t( "Child escaped Class", "form > .foo\\:bar", ["foo:bar"] );
	t( "Child escaped Class", "form > .test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );

//	var div = document.createElement("div");
//  div.innerHTML = "<div class='test e'></div><div class='test'></div>";
    var doc = Ti.XML.parseString("<div><div class='test e'></div><div class='test'></div></div>");
    var div = Sizzle.hacks.documentElement(doc);
	same( jQuery(".e", div).get(), [ div.firstChild ], "Finding a second class." );

	//div.lastChild.className = "e";
	div.lastChild.setAttribute('class', 'e'); // this is an XML DOM; no special className property

	same( jQuery(".e", div).get(), [ div.firstChild, div.lastChild ], "Finding a modified class." ); // fails... change not reflected or a comparison problem?
});

test("name", function() {
	expect(14);

	t( "Name selector", "input[name=action]", ["text1"] );
	t( "Name selector with single quotes", "input[name='action']", ["text1"] );
	t( "Name selector with double quotes", 'input[name="action"]', ["text1"] );

	t( "Name selector non-input", "[name=test]", ["length", "fx-queue"] );
	t( "Name selector non-input", "[name=div]", ["fadein"] );
	t( "Name selector non-input", "*[name=iframe]", ["iframe"] );

	t( "Name selector for grouped input", "input[name='types[]']", ["types_all", "types_anime", "types_movie"] )

	same( jQuery("#form").find("input[name=action]").get(), q("text1"), "Name selector within the context of another element" );
	same( jQuery("#form").find("input[name='foo[bar]']").get(), q("hidden2"), "Name selector for grouped form element within the context of another element" );

	/*
	// append not implemented
	var a = jQuery('<div><a id="tName1ID" name="tName1">tName1 A</a><a id="tName2ID" name="tName2">tName2 A</a><div id="tName1">tName1 Div</div></div>').appendTo('#main').children();

	equals( a.length, 3, "Make sure the right number of elements were inserted." );
	equals( a[1].id, "tName2ID", "Make sure the right number of elements were inserted." );

	t( "Find elements that have similar IDs", "[name=tName1]", ["tName1ID"] );
	t( "Find elements that have similar IDs", "[name=tName2]", ["tName2ID"] );
	t( "Find elements that have similar IDs", "#tName2ID", ["tName2ID"] );

	a.remove();
	*/
});

test("multiple", function() {
	expect(4);
	
	t( "Comma Support", "h2, p", ["qunit-banner","qunit-userAgent","firstp","ap","sndp","en","sap","first"]);
	t( "Comma Support", "h2 , p", ["qunit-banner","qunit-userAgent","firstp","ap","sndp","en","sap","first"]);
	t( "Comma Support", "h2 , p", ["qunit-banner","qunit-userAgent","firstp","ap","sndp","en","sap","first"]);
	t( "Comma Support", "h2,p", ["qunit-banner","qunit-userAgent","firstp","ap","sndp","en","sap","first"]);
});

test("child and adjacent", function() {
	expect(27);
	t( "Child", "p > a", ["simon1","google","groups","mark","yahoo","simon"] );
	t( "Child", "p> a", ["simon1","google","groups","mark","yahoo","simon"] );
	t( "Child", "p >a", ["simon1","google","groups","mark","yahoo","simon"] );
	t( "Child", "p>a", ["simon1","google","groups","mark","yahoo","simon"] );
	t( "Child w/ Class", "p > a.blog", ["mark","simon"] );
	t( "All Children", "code > *", ["anchor1","anchor2"] );
	//t( "All Grandchildren", "p > * > *", ["anchor1","anchor2"] ); // crashes?
	/*
	// adjacents dying on android...
	t( "Adjacent", "a + a", ["groups"] ); // @fail returns too many on iphone... null-pointer on android.
	t( "Adjacent", "a +a", ["groups"] ); // @fail returns too many
	t( "Adjacent", "a+ a", ["groups"] ); // @fail returns too many
	t( "Adjacent", "a+a", ["groups"] ); // @fail returns too many
	t( "Adjacent", "p + p", ["ap","en","sap"] );
	t( "Adjacent", "p#firstp + p", ["ap"] ); // @fail returns too many
	t( "Adjacent", "p[lang=en] + p", ["sap"] ); // @fail returns too many
	t( "Adjacent", "a.GROUPS + code + a", ["mark"] ); // @fail returns too many
	t( "Comma, Child, and Adjacent", "a + a, code > a", ["groups","anchor1","anchor2"] ); // @fail returns too many
	*/
	/*
	// 100% cpu crunch
	t( "Element Preceded By", "p ~ div", ["foo", "moretests","tabindex-tests", "liveHandlerOrder", "siblingTest"] ); // @fail crash
	t( "Element Preceded By", "#first ~ div", ["moretests","tabindex-tests", "liveHandlerOrder", "siblingTest"] );
	t( "Element Preceded By", "#groups ~ a", ["mark"] );
	t( "Element Preceded By", "#length ~ input", ["idTest"] );
	t( "Element Preceded By", "#siblingfirst ~ em", ["siblingnext"] );
	*/

	t( "Verify deep class selector", "div.blah > p > a", [] ); // @fail got stuff but shouldn't

	t( "No element deep selector", "div.foo > span > a", [] ); // @fail got stuff but shouldn't

	same( jQuery("> :first", Sizzle.hacks.getElementById(document, "nothiddendiv")).get(), q("nothiddendivchild"), "Verify child context positional selctor" ); // @fail empty return
	same( jQuery("> :eq(0)", Sizzle.hacks.getElementById(document, "nothiddendiv")).get(), q("nothiddendivchild"), "Verify child context positional selctor" ); // @fail empty return
	same( jQuery("> *:first", Sizzle.hacks.getElementById(document, "nothiddendiv")).get(), q("nothiddendivchild"), "Verify child context positional selctor" ); // @fail empty return

	t( "Non-existant ancestors", ".fototab > .thumbnails > a", [] ); // @fail got stuff but shouldn't
});

test("attributes", function() {
	expect(34);
	t( "Attribute Exists", "a[title]", ["google"] );
	t( "Attribute Exists", "*[title]", ["google"] );
	t( "Attribute Exists", "[title]", ["google"] );
	t( "Attribute Exists", "a[ title ]", ["google"] );
	
	t( "Attribute Equals", "a[rel='bookmark']", ["simon1"] );
	t( "Attribute Equals", 'a[rel="bookmark"]', ["simon1"] );
	t( "Attribute Equals", "a[rel=bookmark]", ["simon1"] );
	t( "Attribute Equals", "a[href='http://www.google.com/']", ["google"] );
	t( "Attribute Equals", "a[ rel = 'bookmark' ]", ["simon1"] );

    // this crashes on iphone?!
	//Sizzle.hacks.getElementById(document, "anchor2").href = "#2";
	//t( "href Attribute", "p a[href^=#]", ["anchor2"] );
	//t( "href Attribute", "p a[href*=#]", ["simon1", "anchor2"] );

	t( "for Attribute", "form label[for]", ["label-for"] );
	t( "for Attribute in form", "#form [for=action]", ["label-for"] );

	t( "Attribute containing []", "input[name^='foo[']", ["hidden2"] );
	t( "Attribute containing []", "input[name^='foo[bar]']", ["hidden2"] );
	t( "Attribute containing []", "input[name*='[bar]']", ["hidden2"] );
	t( "Attribute containing []", "input[name$='bar]']", ["hidden2"] );
	t( "Attribute containing []", "input[name$='[bar]']", ["hidden2"] );
	t( "Attribute containing []", "input[name$='foo[bar]']", ["hidden2"] );
	t( "Attribute containing []", "input[name*='foo[bar]']", ["hidden2"] );
	
	// crashing on iphone?
	//t( "Multiple Attribute Equals", "#form input[type='radio'], #form input[type='hidden']", ["radio1", "radio2", "hidden1"] );
	//t( "Multiple Attribute Equals", "#form input[type='radio'], #form input[type=\"hidden\"]", ["radio1", "radio2", "hidden1"] );
	//t( "Multiple Attribute Equals", "#form input[type='radio'], #form input[type=hidden]", ["radio1", "radio2", "hidden1"] );
	
	t( "Attribute selector using UTF8", "span[lang=中文]", ["台北"] );
	
	t( "Attribute Begins With", "a[href ^= 'http://www']", ["google","yahoo"] );
	t( "Attribute Ends With", "a[href $= 'org/']", ["mark"] );
	t( "Attribute Contains", "a[href *= 'google']", ["google","groups"] );
	//t( "Attribute Is Not Equal", "#ap a[hreflang!='en']", ["google","groups","anchor1"] ); // crashes?

	// these seem crashy...
	//t("Empty values", "#select1 option[value='']", ["option1a"]);
	//t("Empty values", "#select1 option[value!='']", ["option1b","option1c","option1d"]);
	
	// these seem crashy...
	//t("Select options via :selected", "#select1 option:selected", ["option1a"] );
	//t("Select options via :selected", "#select2 option:selected", ["option2d"] );
	//t("Select options via :selected", "#select3 option:selected", ["option3b", "option3c"] );
	
	//t( "Grouped Form Elements", "input[name='foo[bar]']", ["hidden2"] );
});
