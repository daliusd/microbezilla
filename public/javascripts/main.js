$(document).ready(function() {
  if (g_email === '') {
    $('#logout').hide();
  }
  else {
    $('#login').hide();
  }

  document.querySelector("#login").addEventListener("click", function() {
    navigator.id.request();
  }, false);

  document.querySelector("#logout").addEventListener("click", function() {
    navigator.id.logout();
  }, false);

  navigator.id.watch({
    onlogin: function(assertion) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/persona/verify", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.addEventListener("loadend", function(e) {
        var data = JSON.parse(this.responseText);
        if (data && data.status === "okay") {
          $('#login').hide();
          $('#logout').show();
          console.log("You have been logged in as: " + data.email);
        }
      }, false);

      xhr.send(JSON.stringify({
        assertion: assertion
      }));
    },
    onlogout: function() {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/persona/logout", true);
      xhr.addEventListener("loadend", function(e) {
        $('#login').show();
        $('#logout').hide();
        console.log("You have been logged out");
      });
      xhr.send();
    }
  });
})
