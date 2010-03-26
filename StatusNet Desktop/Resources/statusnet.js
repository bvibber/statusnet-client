function StatusNetClient(_username,_password,_apiroot) {
  this.username  = _username;
  this.password  = _password;
  this.apiroot   = _apiroot;
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
    $.ajax({
      method:"GET",
      url: "http://identi.ca/rss",
      dataType:"text",
      success:function(data) {
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
      error: function(xhr) {
        $("#nav img").hide();
        //Hrm, should probably do something here...
      }
    });
  };
}
