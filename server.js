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

app.get('/profile', function(request, response) {
	response.render('html/profile.html');
});

io.sockets.on('connection', function(socket){

	//on the "seasonal" request
  socket.on('seasonal', function(callback){
    var recipes = [];
    unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/search?query=green&number=10&offset=0&type=main+course")
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

  //on the "recipe" request
  socket.on('recipe', function(query, callback){
    var recipes = [];
    unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/search?query=" + query + "&number=10&offset=0")
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
	//for a complex search, with filters
	socket.on('complexRecipe', function(time,cost,diet,fat,calories,sugar, callback){
    var recipes = [];
		var recipesComplex = [];
		var count = 0;
		//search all recipes
    unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/search?query=" + queryGLOBAL + "&number=10&offset=0")
    .header("X-Mashape-Key", "srR1VDlqPwmshtUfctOKfHO58pAGp1cnRU5jsnSwGg5VkQABWn")
    .header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
    .end(function (result) {
      for(var i=0; i<result.body.results.length; i++){
        var recipeID = result.body.results[i].id;
        recipes.push(recipeID);
      }
			//get each recipes information, and delete it from list based on filters
			for(var j=0; j<recipes.length; j++){
				var recipeID = recipes[j];
				unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/"+ recipeID +"/information?includeNutrition=true")
				.header("X-Mashape-Key", "srR1VDlqPwmshtUfctOKfHO58pAGp1cnRU5jsnSwGg5VkQABWn")
				.header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
				.end(function (result) {
					var recipe = {
	          id: result.body.id,
	          title: result.body.title,
	          image: result.body.image,
						minutes: result.body.readyInMinutes,
	        }
					recipesComplex.push(recipe);
					//if. readyInMinutes > time && time != "null" pop it
					if (parseInt(result.body.readyInMinutes) > parseInt(time)) {
						recipesComplex.pop();
					}
					//if else. pricePerServing > cost && cost != "null" pop it
					else if (parseInt(result.body.pricePerServing) > parseInt(cost)) {
						recipesComplex.pop();
					}
					//if else. diet == false && diet != "null" pop it
					else if (result.body.vegetarian == false && diet == 'vegetarian') {
						recipesComplex.pop();
					}
					else if (result.body.vegean == false && diet == 'vegan') {
						recipesComplex.pop();
					}
					//if else. fat < nutrition.nutrients[1].amount, pop it
					else if (fat != "" && result.body.nutrition.nutrients[1].amount > fat) {
						recipesComplex.pop();
					}
					//if else. calories < nutrition.nutrients[0]..amount, pop it
					else if (calories != "" && result.body.nutrition.nutrients[0].amount > calories) {
						recipesComplex.pop();
					}
					//if else. sugar < nutrition.nutrients[4]..amount, pop it
					else if (sugar != "" && result.body.nutrition.nutrients[4].amount > sugar) {
						recipesComplex.pop();
					}

					if(count == recipes.length-1){
						callback(recipesComplex);
					}
					count++;
				});
			}
    });
  });

});

app.get('/recipe/:id', function(request, response) {

	unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/" + request.params.id +"/information")
	.header("X-Mashape-Key", "srR1VDlqPwmshtUfctOKfHO58pAGp1cnRU5jsnSwGg5VkQABWn")
	.header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
	.end(function (result) {

	  response.render('html/inside-recipe.html', {id: request.params.id, RecipeName: result.body.title, Img: result.body.image, Min: result.body.readyInMinutes, Diff: 'Easy', TotIng: result.body.extendedIngredients.length , Serv: result.body.servings});

	});

});

app.get('/recipe-info/:id', function(request, response) {

	unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/" + request.params.id +"/information")
	.header("X-Mashape-Key", "srR1VDlqPwmshtUfctOKfHO58pAGp1cnRU5jsnSwGg5VkQABWn")
	.header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
	.end(function (result) {

		var ingredients = result.body.extendedIngredients;
		var instructions = result.body.analyzedInstructions;

		response.json([ingredients, instructions]);
	});
});

app.get('/', function(request, response) {
	response.render('html/specialdishes.html');
});

app.post('/', function(request, response) {
	var protocol = request.protocol;
	var host = request.get('host');
	var newURL = protocol + '://' + host + '/';
	response.redirect(newURL);
});

app.post('/search/:query', function(request, response) {
	var q = request.params.query;
	var protocol = request.protocol;
	var host = request.get('host');
	queryGLOBAL = q;
	var newURL = protocol + '://' + host + '/search/' + q;
	response.redirect(newURL);
});

app.post('/profile', function(request, response) {
	var protocol = request.protocol;
	var host = request.get('host');
	var newURL = protocol + '://' + host + '/profile';
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
