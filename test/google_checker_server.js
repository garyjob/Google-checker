/**
 * Module dependencies.
 */
var express = require('express');
var app = module.exports = express.createServer();

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

/* The default response scenario */
app.get('/', function(req, res){
  console.log("rendered introduction page.");
  res.render('index'); 
});

/* Scenario when it took to long to return the message */
app.get('/tooSlow', function(req, res){
  console.log("Loading extremely slow page");
  setTimeout(function(){
    res.send('this is a slow loading page.'); 
  }, 4000)
});

/* When the capture is served */ 
app.get('/recaptcha', function(req, res){
  console.log("loading page with captcha");
  res.send('This is a page that has the capture <recaptcha>'); 
});

app.error(function(err, req, res, next) {
  res.render('error', {error: err});
});

app.listen(8000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);


