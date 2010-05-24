// StatusNet

Titanium.include('statusnet.js');

// Initialize database
StatusNet.getDB();

// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

StatusNet.initTabs();
