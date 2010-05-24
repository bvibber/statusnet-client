// StatusNet

var sources = ['statusnet.js',

               'model/statusnet_account.js',
               'model/statusnet_timeline.js',
               'model/statusnet_timeline_user.js',
               'model/statusnet_rsd.js',
               'model/statusnet_timeline_friends.js',

               'view/statusnet_newnoticeview.js',
               'view/statusnet_sidebar.js',
               'view/statusnet_timelineview.js',
               'view/statusnet_timelineview_user.js',
               'view/statusnet_settingsview.js'];

for (var i = 0; i < sources.length; i++) {
    Titanium.include(sources[i]);
}

// Initialize database
StatusNet.getDB();

// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

StatusNet.initTabs();
