var socket = io.connect();

$(document).ready(function() {

	//if user clicks the profile includeNutrition
	$("#profileIcon").click(function(){
		$.post("/profile",function(response){
	    window.location.assign('/profile');
	  });
	})

	//if user clicks on "mealmaker"
	$("#logo").click(function(){
		$.post("/",function(response){
	    window.location.assign('/');
	  });
	})


	var pathname = window.location.pathname; // Returns path only
	var url = window.location.href;     // Returns full URL
	var query = "";
	if(pathname.length > 7 ){
		var i;
		for (i = 8; i < pathname.length; i++) {
    	query = query + pathname[i];
		}
		searchRecipes(query);
	}

	var form = document.getElementById('form');
	form.addEventListener('submit', submitHandler, false);

	var filters = document.getElementById('filters');
	filters.addEventListener('submit', filterHandler, false);
});

function filterHandler(e){
	e.preventDefault();
	var time = document.getElementById('dropdownTime').value;
	var cost = document.getElementById('dropdownMoney').value;
	var diet = document.getElementById('dropdownDiet').value;

	var fat = document.getElementById('fatFilter').value;
	var calories = document.getElementById('caloriesFilter').value;
	var sugar = document.getElementById('sugarFilter').value;

	complexSearch(time, cost, diet, fat, calories, sugar);

}


function submitHandler(e) {
  e.preventDefault();
	var query = $('#search_box').val();

	searchRecipes(query);
	$.post("/search/" + query,function(response){
    window.location.assign('/search/'+ query);
  });
	location.reload();
	//history.pushState(null, '', '/search/'+query);

}

function complexSearch(time, cost, diet, fat, calories, sugar){
	socket.emit('complexRecipe', time,cost,diet,fat,calories,sugar, function(recipes){
      // display a newly-arrived message
			$("#resultList").empty();
			for(var i=0; i<recipes.length; i++){
				var title = recipes[i].title;
				var image = recipes[i].image;
				var id = recipes[i].id;
				var time = recipes[i].minutes;
				var imageURL = "https://spoonacular.com/recipeImages/"+id+"-240x150.jpg";
				var li = "<li id='" + id + "' class='resultItem' onclick='gotoRecipe(" + id + ")'> <div id='resultImage'> <img src="+imageURL+"> </div> <div class='resultTitle'> <p>" + title + "</p> </div>";
				li += "<div class='prepTime'><p>" + time + " minutes</p></div></li>"
	    	$('#resultList').append(li);
      }
  });
}

//basic search
function searchRecipes(query){
	socket.emit('recipe', query, function(recipes){
      // display a newly-arrived message
			$("#resultList").empty();
			for(var i=0; i<recipes.length; i++){
				var title = recipes[i].title;
				var image = recipes[i].image;
				var id = recipes[i].id;
				var time = recipes[i].minutes;
				var imageURL = "https://spoonacular.com/recipeImages/"+id+"-240x150.jpg";
				var li = "<li id='" + id + "' class='resultItem' onclick='gotoRecipe(" + id + ")'> <div id='resultImage'> <img src="+imageURL+"> </div> <div class='resultTitle'> <p>" + title + "</p> </div>";
				li += "<div class='prepTime'><p>" + time + " minutes</p></div></li>"
	    	$('#resultList').append(li);
      }
  });
}

function gotoRecipe(recipe) {
	window.location.assign('/recipe/' + recipe);

}
