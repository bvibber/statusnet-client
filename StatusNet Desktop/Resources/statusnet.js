function StatusNet() {
}

StatusNet.db = null;
StatusNet.getDB = function() {
     if (this.db == null) {
          dbFile = Titanium.Filesystem.getFile(Titanium.Filesystem.getResourcesDirectory()+"\\statusnet.db");
          this.db = Titanium.Database.openFile(dbFile);
          this.db.execute("CREATE TABLE IF NOT EXISTS account (username varchar(255), password varchar(255), apiroot varchar(255), is_default integer default 0, PRIMARY KEY (username, apiroot))");
     }
     return this.db;
}

function StatusNetAccount(_username, _password, _apiroot) {
     this.username = _username;
     this.password = _password;
     this.apiroot  = _apiroot;

     this.ensure = function() {
          var rs = db.execute("select * from account where username = '" + this.username + "' and apiroot = '" + this.apiroot + "'");
          if (rs.rowCount() == 0) {
               db.execute("INSERT INTO account (username, password, apiroot, is_default) " +
                          "VALUES ('"+this.username+"', '"+this.password+"', '"+this.apiroot+"', 1)");
          }
          return true;
     }

     this.fetchUrl = function(method, onSuccess, onError) {
          $.ajax({ url: this.apiroot + method,
                    username: this.username,
                    password: this.password,
                    success: function(data, status, xhr) {
                         onSuccess(status, data);
                    },
               error: function(xhr, status, thrown) {
                    onError(status, thrown);
               }
          });
     }
}

StatusNetAccount.getDefault = function(db) {
     var rs = db.execute("select * from account where is_default = 1");
     if (rs.rowCount() > 0) {
          rs.next();
          return new StatusNetAccount(rs.fieldByName("username"),
                                      rs.fieldByName("password"),
                                      rs.fieldByName("apiroot"));
     } else {
          return null;
     }
}

function LoginDialog(_onSuccess) {
     this._onSuccess = _onSuccess;

     this.show = function() {
          $("#body").append("<form id='loginform' method='GET'><br />Username: <input id='username' type='text' /><br />Password: <input id='password' type='password' /><br />API root: <input id='apiroot' type='text' /><br /><input type='button' name='Login' id='loginbutton' value='Login'/></form>");
          succfunc = this._onSuccess;
          $("#loginbutton").click(function() {
               var account = new StatusNetAccount($("#username").val(),
                                                  $("#password").val(),
                                                  $("#apiroot").val());
               alert("Got account: " + account.username + ", " + account.password + ", " + account.apiroot);
               account.fetchUrl('account/verify_credentials.xml',
                                function(status, data) { $("#loginform").hide(); alert("Successful login"); succfunc(account); },
                                function(status, error) { alert("Got an error!"); });
               return false;
          });
     }
}

function StatusNetClient(_account) {
  this.account  = _account;
  this._timeline = "friends_timeline"; // which timeline are we currently showing?

  this.refresh = function() {
       switch (this._timeline) {
       case "friends_timeline":
            this.getFriendsTimeline();
            break;
       default:
            throw new Exception("Gah wrong timeline");
       }
  }

  this.getFriendsTimeline = function() {
       $("#nav img").show();
       this.account.fetchUrl('statuses/friends_timeline.rss',
                             function(status, data) {
                                  $("#nav img").hide();
                                  $("#tweets").html("");
                                  var xmlDoc;
                                  try {
                                       xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
                                       xmlDoc.async="false";
                                       xmlDoc.loadXML(data);
                                  }
                                  catch(e) {
                                       parser=new DOMParser();
                                       xmlDoc=parser.parseFromString(data,"text/xml");
                                  }

                                  $(xmlDoc).find("item").each(function() {
                                       var image = $(this).find("[nodeName=statusnet:postIcon]").attr("rdf:resource");
                                       var date = $(this).find("[nodeName=dc:date]").text();
                                       var desc = $(this).find("[nodeName=content:encoded]").text();
                                       var author = $(this).find("[nodeName=dc:creator]").text();
                                       var link = $(this).find("link").text();
                                       var idx = link.indexOf('statuses');
                                       link = link.substring(0,idx);

                                       var html = [];

                                       html.push('<div style="margin:5px 0 10px 0;padding:5px;-webkit-border-radius:5px;background-color:#f2f2f2;">');
                                       html.push('   <div style="float:right;margin:5px 0 5px 10px;"><a href="'+link+'"><img height="48px" width="48px" src="'+image+'"/></a></div>');
                                       html.push('   <div><a style="font-size:14px;color:#000;text-decoration:none;font-weight:bold;" href="'+link+'">' + author + '</a><br/>');
                                       html.push('   <small style="font-size:0.8em;">' + date + '</small></div>');
                                       html.push('   <div style="margin-top:3px">'+desc +'<br/></div>');
                                       html.push('</div>');
                                       html.push('<div style="clear:both;"></div>');
                                       $('#tweets').append(html.join(''));
                                       $('#tweets a').addClass('external');
                                  });
                             },
                             function(status, thrown) {
                                  $("#nav img").hide();
                                  //Hrm, should probably do something here...
                             });
  };

}
