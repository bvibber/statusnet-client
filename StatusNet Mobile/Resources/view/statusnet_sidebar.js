/**
 * View class for managing the sidebar
 *
 */
StatusNet.Sidebar = function(client) {
    StatusNet.debug("StatusNet.sidebar()");
    this.client = client;
}

/**
 * Class method to higlight the icon associated with the selected timeline
 *
 * @param String timeline   the timeline to highlight
 */
StatusNet.Sidebar.setSelectedTimeline = function(timeline) {
    // no-op: the tab bar manages itself
}
