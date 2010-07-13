var win = Ti.UI.createWindow();

var label = Ti.UI.createLabel({
	text: "Hello World",
	top: 10
});
win.add(label);

var tableView = Ti.UI.createTableView({
	data: [
		{ leftImage: "KS_nav_ui.png", title: "Window 1" },
		{ leftImage: "KS_nav_views.png", title: "Window 2" }
	],
	rowHeight: 50,
	top: 50
});

function openWindow1() {
	var window1 = Ti.UI.createWindow({
		backgroundColor: 'red',
		url: "window1.js"
	});
	window1.open();
}

function openWindow2() {
	var window2 = Ti.UI.createWindow({
		backgroundColor: 'blue',
		url: "window2.js"	
	});
	window2.open();
}

tableView.addEventListener("click", function(e) {
	if (e.index == 0) {
		openWindow1();
	} else if (e.index == 1) {
		openWindow2();
	}
});

win.add(tableView);
win.open()
