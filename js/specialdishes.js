var socket = io.connect();

$(document).ready(function() {
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
