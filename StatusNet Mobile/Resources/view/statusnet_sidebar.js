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

    switch(timeline) {
        case 'friends':
            $('#friends_img').attr('src', '/images/blue/chat.png');
            $('#mentions_img').attr('src', '/images/at.png');
            $('#favorites_img').attr('src', '/images/star.png');
            break;
        case 'mentions':
            $('#friends_img').attr('src', '/images/chat.png');
            $('#mentions_img').attr('src', '/images/blue/at.png');
            $('#favorites_img').attr('src', '/images/star.png');
            break;
        case 'favorites':
            $('#friends_img').attr('src', '/images/chat.png');
            $('#mentions_img').attr('src', '/images/at.png');
            $('#favorites_img').attr('src', '/images/blue/star.png');
            break;
        default:
            $('#friends_img').attr('src', '/images/chat.png');
            $('#mentions_img').attr('src', '/images/at.png');
            $('#favorites_img').attr('src', '/images/star.png');

            // @todo Do something for public and user...

            StatusNet.debug("I don\'t know how to highlight this timeline.");
            break;
    }

}
