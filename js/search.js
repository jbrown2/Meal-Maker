var socket = io.connect();

$(document).ready(function() {


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
});


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

function searchRecipes(query){
	socket.emit('recipe', query, function(recipes){
      // display a newly-arrived message
			$("#resultList").empty();
			for(var i=0; i<recipes.length; i++){
				var title = recipes[i].title;
				var image = recipes[i].image;
				var id = recipes[i].id;
				console.log(title);
				var imageURL = "https://spoonacular.com/recipeImages/"+id+"-240x150.jpg";
	      var li = "<li id='resultItem'> <div id='resultImage'> <img src="+imageURL+"> </div> <div id='resultTitle'> <p>" + title + "</p> </div> </li>";
	    	$('#resultList').append(li);
      }
  });
}
