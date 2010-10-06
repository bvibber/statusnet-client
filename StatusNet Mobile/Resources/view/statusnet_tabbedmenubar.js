/**
 * StatusNet Mobile
 *
 * Copyright 2010 StatusNet, Inc.
 * Based in part on Tweetanium
 * Copyright 2008-2009 Kevin Whinnery and Appcelerator, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

StatusNet.TabbedMenuBar = function() {

    this.tabs = [];
    this.selectedTab = 0;
    this.tabGroup = null;

    // For icon-wrapping purposes, plan to fit within the smallest available
    // screen dimension; when the screen rotates we might flip from landscape
    // to portrait and don't want to be surprised.
    // @fixme recheck this dynamically when changing orientation
    this.width = Math.min(Titanium.Platform.displayCaps.platformWidth,
                          Titanium.Platform.displayCaps.platformHeight);
    this.height = 49;

    this.overFlowTabs = [];
    this.overFlowTable = null;

    this.tabView = Titanium.UI.createView({
        height: this.height,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundImage: 'images/bg/tab_bg.png'
    });

    if (StatusNet.Platform.dpi >= 240) {
        // Sammy's hack for higher Android resolution;
	// Be real nice to get runtime orientation in here too!

        this.tabView = Titanium.UI.createView({
            height: this.height,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundImage: 'images/bg/tab_bg240.png'
        });
    }
};

StatusNet.createTabbedBar = function(tabInfo, win, initialSelection) {

    var tb = new StatusNet.TabbedMenuBar();
    var tab;
    var i = 0;

    for (tab in tabInfo) {
        if (tabInfo.hasOwnProperty(tab)) {
            if (i < 4) {
                var minitab = tb.createMiniTab({
                    index: i,
                    deselectedImage: tabInfo[tab].deselectedImage,
                    selectedImage: tabInfo[tab].selectedImage,
                    name: tabInfo[tab].name
                });
                tb.tabs.push(minitab);
            } else {
                StatusNet.debug("Pushing " + tabInfo[tab].name + " to overflow table");

                var row = Ti.UI.createTableViewRow({
                    title: tabInfo[tab].name,
                    leftImage: tabInfo[tab].deselectedImage
                });

                tb.overFlowTabs.push(row);
            }
            i++;
        }
    }

    var moretab = tb.createMiniTab({
        index: 4,
        deselectedImage: 'images/tabs/new/more.png',
        selectedImage: 'images/tabs/new/more_on.png',
        name: 'more'
    });
    tb.tabs.push(moretab);
    win.add(tb.tabView);

    if (initialSelection) {
        tb.highlightTab(initialSelection);
    }

    return tb;
};

StatusNet.TabbedMenuBar.prototype.setSelectedTab = function(index) {
    this.selectedTab = index;

    var moretab = this.tabs[4];

    this.highlightTab(index);

    if (index === 4) {
        StatusNet.debug("MORE MORE MORE!");
        moretab.image = moretab.selectedImage;
        this.showOverFlowWindow();
    } else {

        var that = this;

        StatusNet.debug("Tab selection - index = " + index + " name = " + this.tabs[index].name);
        Titanium.App.fireEvent('StatusNet_tabSelected', {
            index: index,
            tabName: that.tabs[index].name
        });
    }
};

StatusNet.TabbedMenuBar.prototype.showOverFlowWindow = function() {

    var overFlowWin = Titanium.UI.createWindow(
        {
            title: "More",
            navBarHidden: true
        }
    );

    var navbar = StatusNet.Platform.createNavBar(overFlowWin);

    var cancelButton = Titanium.UI.createButton({
        title: "Cancel"
    });

    cancelButton.addEventListener('click', function() {
        StatusNet.Platform.animatedClose(overFlowWin);
    });

    navbar.setLeftNavButton(cancelButton);

    this.overFlowTable = Titanium.UI.createTableView({data: this.overFlowTabs, top: navbar.height});

    overFlowWin.add(this.overFlowTable);

    this.overFlowTable.addEventListener('click', function(event) {
        Titanium.App.fireEvent('StatusNet_tabSelected', {
            index: -1,
            tabName: event.rowData.title
        });
        StatusNet.Platform.animatedClose(overFlowWin);
    });

    StatusNet.Platform.animatedOpen(overFlowWin);

};

StatusNet.TabbedMenuBar.prototype.highlightTab = function(index) {
    for (var i = 0; i < 5; i++) {
        var minitab = this.tabs[i]
        if (i === index) {
            minitab.image = minitab.selectedImage;
        } else {
            minitab.image = minitab.deselectedImage;
        }
    }
};

StatusNet.TabbedMenuBar.prototype.createMiniTab = function(args) {

    StatusNet.debug("Going for tab # " + args.index);

    var cellSize = 48; // touch target size in logical coords
    var iconSize = 30; // icon size in logical coords
    var padding = (cellSize - iconSize) / 2; // spacing on each side of icon

    var space = (this.width - 200) / 6;
    var left = args.index * (40 + space);

    var selectedImage = args.selectedImage;
    var deselectedImage = args.deselectedImage;
    if (StatusNet.Platform.dpi == 240) {
        // Hack for high-resolution Android systems;
        // for now manually load the 320-dpi images
        // for iPhone 4 and let them scale down to fit,
        // looks nicer than scaling up the 160-dpi
        // default icons!
        selectedImage = selectedImage.replace(/\./, '240.');
        deselectedImage = deselectedImage.replace(/\./, '240.');
    }

    var minitab = Ti.UI.createImageView({
        image: deselectedImage,
        left: Math.round(left + space),
        top: padding,
        height: 30,
        width: 30,
        canScale: true,
        enableZoomControls: false // for Android
    });
    this.tabView.add(minitab);

    minitab.index = args.index;
    minitab.name = args.name;
    minitab.deselectedImage = deselectedImage;
    minitab.selectedImage = selectedImage;

    // Make a larger touch target over and around the icon
    // so it's easier to hit it with our fat hu-man fingers.
    //
    // Using a label instead of generic View due to bug on Android:
    // https://appcelerator.lighthouseapp.com/projects/32238/tickets/1625-events-attached-to-a-view-not-working-in-android
    var touchTarget = Ti.UI.createButton({
        left: Math.round(left + space) - padding,
        top: 0,
        height: cellSize,
        width: cellSize,
        title: minitab.name,
        //opacity: 0.1
        style: Ti.UI.iPhone.SystemButtonStyle.PLAIN,
        color: 'rgba(0,0,0,0)',
        backgroundColor: 'rgba(0,0,0,0)',
        selectedColor: 'rgba(0,0,0,0)'
    });

    var glowy = new StatusNet.Glowy(this.tabView, touchTarget,
                                    touchTarget.left + cellSize / 2, cellSize / 2);

    var that = this;
    touchTarget.addEventListener('click', function() {
        that.setSelectedTab(args.index);
    });

    this.tabView.add(touchTarget);
    return minitab;
};



StatusNet.Glowy = function(parent, target) {
    this.parent = parent;
    this.target = target;
    this.width = 64;
    this.height = 64;
    this.live = false;
    this.fade = null;
    this.view = Titanium.UI.createView({
       left: 0,
       top: 0,
       width: this.width,
       height: this.height,
       backgroundImage: 'images/fx/glow.png'
    });

    var that = this;
    target.addEventListener('touchstart', function() {
        that.show();
    });
    target.addEventListener('touchend', function() {
        that.hide();
    });
    target.addEventListener('touchcancel', function() {
        that.hide();
    });
}

StatusNet.Glowy.prototype.show = function() {
    if (!this.live) {
        this.live = true;
        if (this.fade) {
            clearTimeout(this.fade);
        }
        var center = this.target.center;
        if (center) {
            this.view.left = center.x - this.width / 2;
            this.view.top = center.y - this.height / 2;
            this.parent.add(this.view);
        } else {
            // https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/1775-tiuiview-center-property-not-implemented-on-android-no-warning-in-documentation
            StatusNet.error("Can't show glowy touch effect because View.center is missing; need patch for Titanium bug #1775")
        }
    }
}

StatusNet.Glowy.prototype.hide = function() {
    if (this.live && !this.fade) {
        var that = this;
        setTimeout(function() {
            that.parent.remove(that.view);
            that.live = false;
            that.fade = null;
        }, 250);
    }
}
