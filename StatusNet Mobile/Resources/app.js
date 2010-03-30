// StatusNet

// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

var label = Titanium.UI.createLabel({
	color:'#999',
	text:'StatusNet Mobile',
	font:{fontSize:20,fontFamily:'Helvetica Neue'},
	textAlign:'center',
	width:'auto'
});

var win = Titanium.UI.createWindow();
var webview = Titanium.UI.createWebView({url: 'index.html'});
win.add(label);
win.add(webview);
win.open();



