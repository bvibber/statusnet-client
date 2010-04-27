$LAB
    .script("statusnet.js").wait()
    .script("model/statusnet_account.js")
    .script("view/statusnet_settingsview.js")
    .script("statusnet_client.js")
    .wait(function(){
    
    var sv = new StatusNet.SettingsView();
    sv.init();
});
