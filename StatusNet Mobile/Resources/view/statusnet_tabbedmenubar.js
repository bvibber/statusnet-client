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
    this.height = 49;
    this.overFlowTabs = [];
    this.overFlowTable = null;

    this.tabView = Titanium.UI.createView({
        height: 49,
        bottom: 0,
        width: "auto",
        borderRadius: 10
    });
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
                tb.tabView.add(minitab);
            } else {
                StatusNet.debug("Pushing " + tabInfo[tab].name + " to overflow table");

                var row = Ti.UI.createTableViewRow({
                    title: tabInfo[tab].name
                });

                tb.overFlowTabs.push(row);
            }
            i++;
        }
    }

    var moretab = tb.createMiniTab({
        index: 4,
        deselectedImage: 'images/tabs/more.png',
        selectedImage: 'images/greenbox.png',
        name: 'more'
    });
    tb.tabs.push(moretab);
    tb.tabView.add(moretab);
    win.add(tb.tabView);

    if (initialSelection) {
        tb.highlightTab(initialSelection);
    }

    return tb;
};

StatusNet.TabbedMenuBar.prototype.setSelectedTab = function(index) {
    this.selectedTab = index;

    var moretab = this.tabs[4];

    if (index === 4) {
        StatusNet.debug("MORE MORE MORE!");
        moretab.image = moretab.selectedImage;

        var overFlowWin = Titanium.UI.createWindow(
            {
                title: "More",
                modal: true,
                navBarHidden: true
            }
        );

        this.navbar = StatusNet.Platform.createNavBar(overFlowWin);

        var cancelButton = Titanium.UI.createButton({
            title: "Cancel"
        });

        cancelButton.addEventListener('click', function() {
            overFlowWin.close();
        });

        this.navbar.setLeftNavButton(cancelButton);

        this.overFlowTable = Titanium.UI.createTableView({data: this.overFlowTabs, top: 44});

        overFlowWin.add(this.overFlowTable);

        this.overFlowTable.addEventListener('click', function(event) {
            Titanium.App.fireEvent('StatusNet_tabSelected', {
                index: -1,
                tabName: event.rowData.title
            });
            overFlowWin.close();
        });

        overFlowWin.open();

    } else {
        moretab.image = moretab.deselectedImage;
    }

    this.highlightTab(index);

    var that = this;

    StatusNet.debug("Tab selection - index = " + index + " name = " + this.tabs[index].name);
    Titanium.App.fireEvent('StatusNet_tabSelected', {
        index: index,
        tabName: that.tabs[index].name
    });

};

StatusNet.TabbedMenuBar.prototype.highlightTab = function(index) {
    for (var i = 0; i < 4; i++) {
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

    var minitab = Ti.UI.createImageView({
        image:args.deselectedImage,
        left: args.index * 40, // XXX calculate this better
        height: 40,
        width: 40,
        backgroundColor: '#7F7F7F'
    });

    minitab.index = args.index;
    minitab.name = args.name;
    minitab.deselectedImage = args.deselectedImage;
    minitab.selectedImage = args.selectedImage;

    var that = this;

    minitab.addEventListener('click', function()
    {
        that.setSelectedTab(args.index);
    });

    return minitab;
};
