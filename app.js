var express=require("express");
var http=require("http");

var app=express();

var port = process.env.PORT || 3000;
app.set("port", port);
app.use(express.static(__dirname));

app.listen(port, function(){
  console.log("Listening at: http://localhost:" + port);
});
