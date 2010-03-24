function TwitterClient(_username,_password) {
  this.username = _username;
  this.password = _password;

  this.getAppceleratorTweets = function() {
    $("#nav img").show();
    $.ajax({
      method:"GET",
      url: "http://search.twitter.com/search.rss?q=%22appcelerator%22+OR+%22appcelerator+titanium%22+OR+%40titanium+OR+%40appcelerator+OR+%23titanium+OR+%23appcelerator&rpp=30",
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

        $(xmlDoc).find("rss channel item").each(function() {
          var image = $(this).find("[nodeName=google:image_link]").text();

          var date = $(this).find("pubDate").text();
          var parts = date.split(' ');
          date = parts[2] + ' ' + parts[1] + ' ' + parts[3] + ' ' + convertDate(parts[4].substring(0,5));

          var desc = $(this).find("description").text();

          var author = $(this).find("author").text();
          var parts = author.split('(');
          author = parts[1].substring(0,parts[1].length-1);

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

function convertDate(str) {
  var parts = str.split(':');
  var hour = parseInt(parts[0]);
  var minutes = parts[1];
  var ampm = 'am';
  if (hour > 12)
  {
    hour = hour - 12;
    ampm = 'pm';
  }
  else if (hour == 0)
  {
    hour = 12;
  }
  return hour + ":" + minutes + ampm;
}
