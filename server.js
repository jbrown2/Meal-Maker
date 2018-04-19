var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

var engines = require('consolidate');
app.engine('html', engines.hogan);
var path = require('path');
app.set('views', __dirname);
app.set('view engine', 'html');
app.use(express.static(__dirname));

var unirest = require('unirest');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

var queryGLOBAL = "";

app.get('/search/:query', function(request, response) {
	response.render('html/search.html', {query: queryGLOBAL});
});

io.sockets.on('connection', function(socket){

  //on the "recipe" request
  socket.on('recipe', function(query, callback){
    var recipes = [];
    unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/search?query=" + query + "&number=5&offset=0")
    .header("X-Mashape-Key", "srR1VDlqPwmshtUfctOKfHO58pAGp1cnRU5jsnSwGg5VkQABWn")
    .header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
    .end(function (result) {
      for(var i=0; i<result.body.results.length; i++){
        var recipe = {
          id: result.body.results[i].id,
          title: result.body.results[i].title,
          image: result.body.results[i].image,
          minutes: result.body.results[i].readyInMinutes,
        }
        recipes.push(recipe);
      }
      callback(recipes);
    });
  });

});

app.get('/', function(request, response) {
	response.render('html/specialdishes.html');
});

app.post('/search/:query', function(request, response) {
	var q = request.params.query;
	var protocol = request.protocol;
	var host = request.get('host');
	queryGLOBAL = q;
	var newURL = protocol + '://' + host + '/search/' + q;
	response.redirect(newURL);
});

server.listen(8080, function(error, response) {
	if(error) {
		console.log('Error: ' + error);
	}
	else {
		console.log('Server listening on Port ' + this.address().port);
	}
});
