// StatusNet

// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

/*
var label = Titanium.UI.createLabel({
	color:'#999',
	text:'StatusNet Mobile',
	font:{fontSize:20,fontFamily:'Helvetica Neue'},
	textAlign:'center',
	width:'auto'
});
*/

//var win = Titanium.UI.createWindow();
//win.open();


// Home tab -- account setup
var homeWindow = Titanium.UI.createWindow({
    url:'home.js'
});
var homeTab = Titanium.UI.createTab({
    icon:'images/tabs/home.png',
    title:'Home',
    window:homeWindow
});

// Home tab -- account setup
var friendsWindow = Titanium.UI.createWindow({
    url:'home.js'
});
var friendsTab = Titanium.UI.createTab({
    icon:'images/tabs/home.png',
    title:'Friends',
    window:homeWindow
});

var repliesWindow = Titanium.UI.createWindow({
    url:'home.js'
});
var repliesTab = Titanium.UI.createTab({
    icon:'images/tabs/home.png',
    title:'Replies',
    window:repliesWindow
});



var tabGroup = Titanium.UI.createTabGroup();
tabGroup.addTab(homeTab);
tabGroup.addTab(friendsTab);
tabGroup.addTab(repliesTab);
tabGroup.setActiveTab(1);
tabGroup.open();
