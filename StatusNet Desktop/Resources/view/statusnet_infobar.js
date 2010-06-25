/**
 * View class for the info bar
 */
StatusNet.Infobar = function() {
    StatusNet.debug("StatusNet.Infobar()");
}

/**
 * Flash an informational message to the user
 */
StatusNet.Infobar.flashMessage = function(msg) {

    $('#infobar').text(msg);
    $('#infobar').fadeIn("slow");

    setTimeout(
        function() {
            $("#infobar").fadeOut("slow",
                function () {
                    $("#infobar").hide();
                }
            );
        },
        3000
    );
}

