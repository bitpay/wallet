 var bwsServiceUrl = "http://localhost:3232/bws/api";


 // Wrapping in nv.addGraph allows for '0 timeout render', stores rendered charts in nv.graphs, and may do more in the future... it's NOT required

 function initialize() {
   var today = moment();
   var lastMonth = moment().subtract(1, 'month');
   document.getElementById('from').value = lastMonth.format('YYYY-MM-DD');
   document.getElementById('to').value = today.format('YYYY-MM-DD');
 }

 function updateTotals(data) {
   document.getElementById('totalTx').innerHTML = data.tx || 0;
   document.getElementById('totalNewWallets').innerHTML = data.newWallets || 0;;
   document.getElementById('totalAmount').innerHTML = data.amount || 0;;
 };

 function refresh(cb) {
   var from = document.getElementById('from').value;
   var to = document.getElementById('to').value;
   var network = document.getElementById('network').value || "livenet";

   if (!from) {
     alert('Must specify FROM (YYYY-MM-DD)');
     return;
   }

   if (!to) {
     alert('Must specify TO (YYYY-MM-DD)');
     return;
   }

   var chart;
   processData(from, to, network, function(data, totals) {
     if (nv.graphs.length > 0) {
       d3.select('.nvd3-svg').remove();
     }
     updateTotals(totals);

     nv.addGraph(function() {
       chart = nv.models.multiChart()
         .options({
           transitionDuration: 300,
         });
       chart.xAxis
         .axisLabel("Date ")
         .tickFormat(function(d) {
           return d3.time.format('%b %d')(new Date(d));
         })
         .staggerLabels(true);
       chart.yAxis1
         .axisLabel('Quantity')
       chart.yAxis2
         .axisLabel('Amount')
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

 function parseDate(dateString) {
   var year = dateString.substring(0, 4);
   var month = dateString.substring(4, 6);
   var day = dateString.substring(6, 8);
   var date = new Date(year, month - 1, day);
   return date;
 };

 function processData(from, to, network, cb) {

   var totals = {
     newWallets: 0,
     tx: 0,
     amount: 0
   };

   retrieveData(from, to, function(err, data) {
     if (err) {
       console.log('err on retrieveData', err);
       cb([]);
     }
     var serie1 = [];
     var serie2 = [];
     var serie3 = [];
     var obj = JSON.parse(data);

     var myData = obj[network];

     for (var item in myData) {
       serie1.push({
         x: parseDate(item),
         y: obj[network][item].totalNewWallets
       });
       serie2.push({
         x: parseDate(item),
         y: obj[network][item].totalTx
       });
       serie3.push({
         x: parseDate(item),
         y: obj[network][item].totalAmount
       });

       totals.newWallets += obj[network][item].totalNewWallets;
       totals.tx += obj[network][item].totalTx;
       totals.amount += obj[network][item].totalAmount;

     }

     cb([{
       values: serie1,
       key: "New Wallets",
       color: "red",
       yAxis: 1,
       type: "line"
     }, {
       values: serie2,
       key: "Transactions",
       color: "blue",
       yAxis: 1,
       type: "line"
     }, {
       values: serie3,
       key: "Amount",
       color: "green",
       yAxis: 2,
       type: "line"
     }], totals);
   });
 };
