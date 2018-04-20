var socket = io.connect();

$(document).ready(function() {

	//add season recipes
	socket.emit('seasonal', function(recipes){
      // display a newly-arrived message
			$("#main-dishes-list").empty();
			for(var i=0; i<recipes.length; i++){
				var title = recipes[i].title;
				console.log(title);
				var image = recipes[i].image;
				var id = recipes[i].id;
				var imageURL = "https://spoonacular.com/recipeImages/"+id+"-240x150.jpg";
	      var li = "<li id='resultItem'> <div id='resultImage'> <img src="+imageURL+"> </div> <div id='resultTitle'> <p>" + title + "</p> </div> </li>";
	    	$('#main-dishes-list').append(li);
      }
  });

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

	var form = document.getElementById('form');
	if(form){
		console.log("hello");
		form.addEventListener('submit', submitHandler, false);
	}
});


function submitHandler(e) {
  e.preventDefault();
  //get the value of the search
  var query = $('#search_box').val();

  $.post("/search/" + query,function(response){
    window.location.assign('/search/'+ query);
  });

}
