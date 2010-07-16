// Some of my own helper functions...
function debugFormat(o) {
    var t = typeof o;
    if (o === null) {
        return 'null';
    } else if (t == 'undefined') {
        return t;
    } else if (t == 'number' || t == 'boolean') {
        return o;
    } else if (t == 'string') {
        return '"' + o.replace('"', '\\"') + '"';
    } else if (o instanceof Array) { 
        out = [];
        for (var i=0; i < o.length; i++) {
            out.push(debugFormat(o[i]));
        }
        return '[' + out.join(', ') + ']';
    } else if (o.nodeType == 1) {
        return '<' + o.tagName +
            (o.getAttribute('id') ? (' id="' + o.getAttribute('id') + '"') : '') +
            '>';
    } else {
        return t + ': ' + o;
    }
}

function readFile(fn) {
    var blob = Ti.Filesystem.getFile(fn).read();
    var str = blob.text;
    return str;
}
function readXmlFile(fn) {
    var xml = readFile(fn);
    var dom = Ti.XML.parseString(xml);
    return dom;
}


// stubs for QUnit bits
function module(name) {}
function test(name, callback) {
    Titanium.API.info("Test section: " + name);
    callback();
}
function expect(n) {
}

function reset() {}
function start() {}
function stop() {}

function equals(testee, expected, desc) {
    if (testee === expected) {
        Titanium.API.info("OK: " + desc);
        tableView.appendRow({
            title: desc,
            color: "#080"
        });
    } else {
        var msg = desc + " got " +
            debugFormat(testee) + ", expected " +
            debugFormat(expected);
        Titanium.API.error("FAIL: " + msg);
        tableView.appendRow({
            title: msg,
            color: "#e00"
        });
    }
}

function same(testee, expected, desc) {
    if (QUnit_equiv(testee, expected)) {
        Titanium.API.info('OK: ' + desc);
        tableView.appendRow({
            title: desc,
            color: "#080"
        });
    } else {
        var msg = desc + " got " +
            debugFormat(testee) + ", expected exact match to " +
            debugFormat(expected);
        Titanium.API.error("FAIL: " + msg);
        tableView.appendRow({
            title: msg,
            color: "#e00"
        });
    }
}

function ok(condition, desc) {
    if (condition) {
        Titanium.API.info("OK: " + desc);
        tableView.appendRow({
            title: desc,
            color: "#080"
        });
    } else {
        Titanium.API.error("FAIL: " + desc);
        tableView.appendRow({
            title: desc,
            color: "#e00"
        });
    }
}
