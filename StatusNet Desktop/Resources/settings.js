$LAB
    .script("statusnet.js").wait()
    .script("model/statusnet_account.js")
    .script("model/statusnet_rsd.js")
    .script("view/statusnet_settingsview.js")
    .script("statusnet_client.js")
    .wait(function(){
    
    $(function() {
        var sv = new StatusNet.SettingsView();
        sv.init();
    });
});
