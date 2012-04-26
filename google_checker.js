/**
 * Module dependencies.
 */
var express = require('express');
var http = require('http');
var fs = require('fs');
var redis = require('redis');
var CONFIG = JSON.parse(fs.readFileSync('config.js').toString());//Configuration files 
var statusOK = true; //relationship status with server
var timePing = 0; //number of times subject server was ping
var lastTimePing = -1;//
var timeResponse = 0; //number of times subject server responded
var intervals = [];//time between intervals and response
var lastBody = "Not assigned"; //The latest body from Google

/* Server Instantiations */
var app = module.exports = express.createServer();

//var redisClient = redis.createClient(CONFIG.redisPort, CONFIG.redisHost);
//redisClient.on('error', function(error) {
//  console.log("Redis Client error : "+error);
//})

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.cookieParser());  
  app.use(express.methodOverride());
  app.use(express.errorHandler());
  app.use(express.static(__dirname + '/public'));  
  app.use(app.router);
  app.use(function(req, res, next) {
    var ejsFile = path.basename(req.url, path.extname(req.url)) + '.ejs';
    fs.stat(app.set('views') + path.dirname(req.url) + '/' + ejsFile, function(err, result) {
      if (!err) {
        res.render(ejsFile);
      } else {
        // throw new Error('keyboard cat!');
      var variants = getDefaultLiteral('privacy');
      res.render('error', { 
          error: "Page not available"});

      }
    });
  });
});

// Routes
app.get('/', function(req, res){
  res.render('index',{}); 
});

app.get('/status.json', function(req, res){
  res.send(
   '{"statusOK":"'+statusOK+'"}'
  );
})

app.get('/lastBody', function(req, res){
  res.send(lastBody);
});

app.error(function(err, req, res, next) {
  res.render('error', {error: err});
});

app.listen(7777);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

/** 
 * This function makes a call to Google to check if this instance is being throttled 
 * or if this instance is being is being served a captcha
 **/
function callGoogle(){
  
  if( timePing % 100 == 0 )
      console.log("call Google "+(timePing)+" times ");

  var d = new Date();
  intervals[timePing] = d.getTime(); 
  timePing++;


  var options = {
    host: 'www.google.com',
    port: 80,
    path: '/search?sclient=psy-ab&hl=en&site=&source=hp&q=Midget'+d.getTime(),
    method: 'GET'
  };

  http.get(options, function(res) {
      if(res.statusCode==200){ // Got a valid response from the server
        
        /* a holder for all the chunks coming in from this request */
        var body = "";
        res.on('data', function(chunk) { //Data is ready
          body += chunk;
        });
        
        /* when the loading of the body is finished*/
        res.on('end', function() {
          /* keeps a records of the last most document body from Google */
          lastBody = body;

          /* calculates how many milliseconds Google took to respond to request */
          var d1 = new Date();
          currentInterval = d1.getTime() - intervals[timeResponse];  
          console.log("Milliseconds for response number "+timeResponse+" : "+(currentInterval/1000)+" seconds.");

          /**
           *  Google server is taking too long to respond to our request, set and kill test 
           **/
           if(currentInterval > CONFIG.timeToLive){
             begForAQuickDeath("Health status check ended at last call "+(timePing-1)+
                               ". Google is taking too long to respond : "+(currentInterval/1000)+" seconds");
             statusOK = false;
             lastTimePing = timePing;
           }

           /* proceeding to output this iteration */
           timeResponse++;
      
           /* outputting the very last body to see what we are getting from Google */
           //if( timeResponse == lastTimePing )
           // console.log(body);

        }); //End body finished loading

      } // End : got a valid response from the server

      /* if recaptcha has been served by Google for robot detection */
      if(res.statusCode==302 && /sorry/i.test(res.headers.location)){
        timeResponse++;
        statusOK = false;
        begForAQuickDeath("Incoming notification number "+timeResponse+" : Opps, Google banned us after " + (timePing-1)+" responses \r\n");
        lastTimePing = timePing;
      }

  }).on('error', function(e) {
      console.log("Got error: " + e.message);
  });
}

function begForAQuickDeath(errorOutput){
  //redisClient.hmset("serverDown", {"ip address" : "my ip address", "port number" : "my port"});
  clearInterval(test);
  console.log(errorOutput);
}

/* Call the interval for sweeping google */
var test = setInterval(function(){
  //for(x=0; x <1000; x++){
    callGoogle();
  //}
},CONFIG.timeFrame);

