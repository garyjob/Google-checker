/**
 * Module dependencies.
 */
var http = require('http');
var fs = require('fs');
var redis = require('redis');
var CONFIG = JSON.parse(fs.readFileSync('config.js').toString());//Configuration files 
var statusOK = true; //relationship status with server
var startTimeStamp = 0;//time between intervals and response
var os = require('os');
var ethernetInterfaces = os.networkInterfaces();

var Gcm =  function(){

}

/* Server Instantiations */
Gcm.prototype.redisClient = redis.createClient(CONFIG.redisPort, CONFIG.redisHost);
Gcm.prototype.redisClient.on('error', function(error) {
  console.log("Redis Client error : "+error);
})

/** 
 * This function makes a call to Google to check if this instance is being throttled 
 * or if this instance is being is being served a captcha
 **/
Gcm.prototype.callGoogle = function(){

  var d = new Date();
  startTimeStamp = d.getTime();

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

          /* calculates how many milliseconds Google took to respond to request */
          var d1 = new Date();
          currentInterval = d1.getTime() - startTimeStamp;
          console.log("Milliseconds for response number : "+(currentInterval/1000)+" seconds.");

          /**
           *  Google server is taking too long to respond to our request, set and kill test 
           **/
           if(currentInterval > CONFIG.timeToLive){
             begForAQuickDeath("Google is took too long to respond : "+(currentInterval/1000)+" seconds");
           }

        }); //End body finished loading

      } // End : got a valid response from the server

      /* if recaptcha has been served by Google for robot detection */
      if(res.statusCode==302 && /sorry/i.test(res.headers.location)){
        begForAQuickDeath("Opps, Google banned us.");
      }

  }).on('error', function(e) {
      console.log("Got error: " + e.message);
  });
}

function begForAQuickDeath(errorOutput){
  console.log("Begging for a quick death now");
  console.log(ethernetInterfaces);
  Gcm.prototype.redisClient.lpush("serverStatus", ethernetInterfaces);
  console.log(errorOutput);
}

module.exports = Gcm;
if(!module.parent) {
  var gcm =  new Gcm();
}
