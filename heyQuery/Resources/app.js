// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

var win1 = Titanium.UI.createWindow({  
    title:'heyQuery test cases',
    backgroundColor:'#fff'
});

var tableView = Titanium.UI.createTableView();
win1.add(tableView);

var tab1 = Titanium.UI.createTab({
    title:'heyQuery test cases'
});

var tabGroup = Titanium.UI.createTabGroup();
tabGroup.add(tab1);

// open tab group
win1.open();



Titanium.API.debug('this is a debug statement');
Titanium.API.error('this is an error statement');
Titanium.API.warn('this is a warn statement');
Titanium.API.info('this is an info statement');


Titanium.include('heyQuery.js');
Titanium.API.info('we lived past heyQuery.js load');


var StatusNet = {};

StatusNet.parseString = function(str) {
    if (typeof Titanium.XML != "undefined") {
        return Titanium.XML.parseString(str);
    } else {
        return (new DOMParser()).parseFromString(str, "text/xml");
    }
};

Titanium.include('atom_parser.js');
Titanium.API.info('we lived past atom_parser.js load');

/*

// object identity fail
var bit = Sizzle.hacks.documentElement(document);
Titanium.API.info(bit);
for (var i in bit) {
    Titanium.API.info(i + ': ' + bit[i]);
}

var bit2 = Sizzle.hacks.documentElement(document);
Titanium.API.info(bit2);
for (var i in bit2) {
    Titanium.API.info(i + ': ' + bit2[i]);
}

Titanium.API.info('bit == bit2 ' + (bit == bit2));
Titanium.API.info('bit === bit2 ' + (bit === bit2));
Titanium.API.info('bit.toString() == bit2.toString() ' + (bit.toString() == bit2.toString()));

*/

/*
// confirmed the cause of getelementbyid bug -- bad xpath expression building in the obj-c code

var document = Titanium.XML.parseString('<stub><a id="a"></a> <b id="b"></b></stub>');
var a = document.getElementById('a');
var ax = document.getElementById("'a'");
var axp = document.evaluate('//*[@id=a]');
var axpx = document.evaluate("//*[@id='a']");
Titanium.API.info('a: ' + a);
Titanium.API.info('ax: ' + ax);
if (ax) { Titanium.API.info('ax.length: ' + ax.length); } // it's also returning a node list instead of a node
Titanium.API.info('axp: ' + axp);
Titanium.API.info('axpx: ' + axpx);
*/

Titanium.include('tests/test-shim.js');
Titanium.API.info('we lived past test-shim load');

Titanium.include('tests/data/testinit.js');
Titanium.API.info('we lived past testinit.js load');

Titanium.include('tests/selector.js');
Titanium.API.info('we lived past selector.js load');

Titanium.include('tests/atom.js');
Titanium.API.info('we lived past selector.js load');

Titanium.API.info('We are DONE!');
