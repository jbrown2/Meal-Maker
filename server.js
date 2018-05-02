var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var expressValidator = require('express-validator');
var cookieParser = require('cookie-parser');
var db = require('./js/database.js');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var multer = require('multer');

const saltRounds = 10;

var engines = require('consolidate');
app.engine('html', engines.hogan);
var path = require('path');
var fs = require('fs');
app.set('views', __dirname);
app.set('view engine', 'html');
app.use(express.static(__dirname));

var unirest = require('unirest');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(expressValidator());

app.use(cookieParser());

app.use(session({
	secret: 'oiashdfbnjnjkjsdaoffgjngb',
	resave: false,
	saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(function (username, password, done) {
	// console.log(username);
	// console.log(password);
	// get password hash corresponding to entered username
	db.connection.query('SELECT id, password FROM user WHERE username = ?', [username], function(err, results) {
		if (err) done(err);
		// if no results are found, user does not exist in database
		if (results.length === 0) {
			done(null, false);
		} else {
			// console.log(results[0].password.toString())
			const hash = results[0].password.toString();

			bcrypt.compare(password, hash, function(err, response) {
				if (response) {
					return done(null, {user_id: results[0].id})
				} else {
					return done(null, false);
				}
			});
		}
	});
}));

var queryGLOBAL = "";

app.use(function(req, res, next) {
	res.locals.isAuthenticated = req.isAuthenticated();
	res.locals.notAuthenticated = !req.isAuthenticated();
	next();
})

app.get('/', function(request, response) {
// 	console.log('home page');
// 	console.log(request.user);
// 	console.log(request.isAuthenticated());

 	  response.status(200).type('html');
 	  if(request.isAuthenticated()){
 	  	response.render('html/specialdishes.html', {profile: request.user.user_id});
 	  }else {
 	  	response.render('html/specialdishes.html');
 	  }
	
});

app.get('/search/:query', function(request, response) {
	console.log(request.isAuthenticated());
	console.log("hoorar");
		  if(request.isAuthenticated()){
	response.render('html/search.html', {query: queryGLOBAL, profile: request.user.user_id});
} else {
	response.render('html/search.html', {query: queryGLOBAL});
}
});

app.get('/login', function(req, res) {
	res.render('html/login.html');
})

// handles a login request
app.post('/login', passport.authenticate('local', 
	{

	successRedirect: '/',
	failureRedirect: '/login',
	successFlash: true
}));

app.get('/logout', function(req, res) {
	req.logout();
	req.session.destroy();
	res.redirect('/');
});

app.get('/register', function(req, res) {
	// console.log("hi");
	res.render('html/register.html');
});

// handles a registration request
app.post('/register', function(req, res) {
	// validate user input
	/*
	req.checkBody('username', 'Email cannot be empty.').notEmpty();

	const errors = req.validationrrors();

	if (errors) {
		console.log(`errors: , ${JSON.stringify(errors)}`);
	}*/
	console.log('registering user');
	// var user = req.body.username;
	var pass = req.body.password;

	// console.log(user);
	// console.log(pass);

		// hash plaintext password
		bcrypt.hash(pass, saltRounds, function(err, hash) {
			db.connection.query('INSERT INTO user (username, password) VALUES (?, ?)', [user, hash], function(err, results) {
				if (err) console.log(err);
				db.connection.query('SELECT LAST_INSERT_ID() as user_id', function(error, results) {
					const user_id = results[0];
					// console.log(results[0]);
					req.login(results[0], function(err) {
						res.redirect('/');
					});
				});
			});
		});

});

passport.serializeUser(function(user_id, done) {
	done(null, user_id);
});

passport.deserializeUser(function(user_id, done) {
	done(null, user_id);
})

app.get('/profile', authenticationMiddleware(), function(request, response) {

	db.connection.query('SELECT username from user WHERE id = ?', [request.user.user_id], function(err, results) {
		if (err) throw(err);
		// if no results are found, user does not exist in database)

		
		
		response.render('html/profile.html',{user: results[0].username, profile: request.user.user_id}  );
});
});

function authenticationMiddleware() {
	return (req, res, next) => {
		// console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

		if (req.isAuthenticated()) return next();

		res.redirect('/');
	}
}

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

		if(req.isAuthenticated()){
			 response.render('html/inside-recipe.html', {id: request.params.id, RecipeName: result.body.title, Img: result.body.image, Min: result.body.readyInMinutes, Diff: 'Easy', TotIng: result.body.extendedIngredients.length , Serv: result.body.servings, profile: request.user.user_id});

			}else {
				 response.render('html/inside-recipe.html', {id: request.params.id, RecipeName: result.body.title, Img: result.body.image, Min: result.body.readyInMinutes, Diff: 'Easy', TotIng: result.body.extendedIngredients.length , Serv: result.body.servings});

			}
	 
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


 var profile_storage = multer.diskStorage({
     destination: function(req, file, callback) {
         callback(null, "./data/profile_images");
     },
     filename: function(req, file, callback) {
     	var name = req.user.user_id;
     
         callback(null, name + ".png");
     }
 });
var uploadprofile = multer({
     storage: profile_storage
 }).array("imgUploader", 3); //Field name and max count

app.get("/uploadprofile", function(req, res) {
     res.sendFile(__dirname + "html/profile.html");
 });
 app.post("/uploadprofile", function(req, res) {
     uploadprofile(req, res, function(err) {
         if (err) {
             return res.end("Something went wrong! Press back in your browser!");
         }
         res.redirect('/profile');
     });
 });


var cover_storage = multer.diskStorage({
     destination: function(req, file, callback) {
         callback(null, "./data/cover_photos");
     },
     filename: function(req, file, callback) {
     	var name = req.user.user_id;
     
         callback(null, name + ".png");
     }
 });
var uploadcover = multer({
     storage: cover_storage
 }).array("imgUploader", 3); //Field name and max count

app.get("/uploadcover", function(req, res) {

     res.sendFile(__dirname + "html/profile.html");
 });
 app.post("/uploadcover", function(req, res) {
     uploadcover(req, res, function(err) {
         if (err) {
             return res.end("Something went wrong! Press back in your browser!");
         }
         res.redirect('/profile');
     });
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

server.listen(8081, function(error, response) {
	if(error) {
		console.log('Error: ' + error);
	}
	else {
		console.log('Server listening on Port ' + this.address().port);
	}
});
