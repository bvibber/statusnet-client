// StatusNet

// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

// For now let's stick with the same tabs we have on the desktop sidebar
var tabNames = ['public',
                'personal',
                'profile',
                'replies',
                'favorites',
                'inbox',
                'search',
                'settings'];
var tabs = {};
var windows = {};
var tabGroup = Titanium.UI.createTabGroup();

for (var i = 0; i < tabNames.length; i++) {
    var tab = tabNames[i];
    windows[tab] = Titanium.UI.createWindow({
        url: tab + '.js'
    });
    tabs[tab] = Titanium.UI.createTab({
        icon: 'images/tabs/' + tab + '.png',
        title: tab,
        window: windows[tab]
    });
    tabGroup.addTab(tabs[tab]);
}

tabGroup.setActiveTab(1);
tabGroup.open();
