 var bwsServiceUrl = "http://localhost:3232/bws/api";


 // Wrapping in nv.addGraph allows for '0 timeout render', stores rendered charts in nv.graphs, and may do more in the future... it's NOT required

 function refresh(cb) {
   var from = document.getElementById('from').value;
   var to = document.getElementById('to').value;
   var network = document.getElementById('network').value || "testnet";

   if (!from) {
     alert('Must specify FROM (YYYY-MM-DD)');
     return;
   }

   if (!to) {
     alert('Must specify TO (YYYY-MM-DD)');
     return;
   }

   var chart;
   console.log('nv.graphs.length ', nv.graphs.length);

   processData(from, to, network, function(data) {
     //LINE -------------------------

     if (nv.graphs.length > 0) {
       console.log('updating a graph');
       d3.select('.nvd3-svg').remove();
     }

     console.log('adding a graph');
     nv.addGraph(function() {
       chart = nv.models.lineChart()
         .options({
           transitionDuration: 300,
           useInteractiveGuideline: true
         });
       chart.xAxis
         .axisLabel("Date ")
         .tickFormat(function(d) {
           return d3.time.format('%b %d')(new Date(d));
         })
         .staggerLabels(true);
       chart.yAxis
         .axisLabel('Quantity')
         .tickFormat(d3.format(''));

       d3.select('#chart1').append('svg')
         .datum(data)
         .call(chart);
       nv.utils.windowResize(chart.update);
       return chart;
     })
   });
 };


 function retrieveData(from, to, cb) {
   var xmlhttp;
   if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
     xmlhttp = new XMLHttpRequest();
   } else { // code for IE6, IE5
     xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
   }
   xmlhttp.onreadystatechange = function() {
     if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
       cb(null, xmlhttp.responseText);
     } else if (xmlhttp.readyState == 4 && xmlhttp.status != 200) {
       console.log('http status ', xmlhttp.status);
       cb('No data');
     }
   }
   var url = bwsServiceUrl + '/v1/stats/' + from + "/" + to
   xmlhttp.open("GET", url, true);
   xmlhttp.send();
 };

 function parseDate(item) {
   var dateString = item;
   var year = dateString.substring(0, 4);
   var month = dateString.substring(4, 6);
   var day = dateString.substring(6, 8);
   var date = new Date(year, month - 1, day);
   return date;
 };

 function processData(from, to, network, cb) {

   console.log('processData');

   retrieveData(from, to, function(err, data) {
     if (err) {
       console.log('err on retrieveData', err);
       cb([]);
     }
     var serie1 = [];
     var serie2 = [];
     var obj = JSON.parse(data);

     var myData = obj[network];

     for (var item in myData) {
       console.log('item ', item);
       console.log('item DATE ', parseDate(item));
       serie1.push({
         x: parseDate(item),
         y: obj[network][item].totalNewWallets
       });
       serie2.push({
         x: parseDate(item),
         y: obj[network][item].totalTx
       });
     }

     cb([{
       values: serie1,
       key: "New Wallets ",
       color: "#667711"
     }, {
       values: serie2,
       key: "Transactions ",
       color: "#110011"
     }]);
   });
 };
