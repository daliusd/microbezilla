var g_last_entry_date;
var g_user;

$(document).ready(function() {
  $('#logout').hide();

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
          g_user = data.email;
          showNewEntryForm();
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
        g_user = '';
        hideNewEntryForm();
        console.log("You have been logged out");
      });
      xhr.send();
    }
  });

  g_last_entry_date = Math.floor(Date.now()) / 1000;
  loadEntries();
})

function showNewEntryForm() {
  var box = $("<div id='newentryform'/>").addClass('box');

  box.append($('<textarea placeholder="Text" id="text"/>'));
  var preview_button = $('<button>Preview</button>');
  box.append($(preview_button));
  var create_button = $('<button>Create</button>');
  box.append($(create_button));
  box.append($('<div id="message"/>'));
  $("#entries").prepend(box);

  preview_button.click(
      function() {
        $.ajax({
          type: 'POST',
          url: '/entries',
          dataType: 'json',
          data: {
            'preview': true,
            'text': $('#text').val()
          },
          success: function(data) {
            $("#message").text('Preview created.');
            $('#newpreview').remove();
            data['email'] = g_user.slice(0, g_user.indexOf('@'));
            $('#newentryform').after(createEntryBox(data, true));
          },
          error: function() {
            $("#message").text('Preview failed.');
          }
        });
      });

  create_button.click(
      function() {
        $.ajax({
          type: 'POST',
          url: '/entries',
          cache: false,
          dataType: 'json',
          data: {'text': $('#text').val()},
          success: function(data) {
            $("#message").text('Entry created.');
            $('#newpreview').remove();
            $('#newentryform').after(createEntryBox(data, false));
          },
          error: function() {
            $("#message").text('Failed to create entry.');
          }
        });
      });
}

function createEntryBox(data, preview) {
  var box = $('<div class="box"/>');

  if (preview) {
    box.addClass('preview');
    box.attr('id', 'newpreview');
  }
  else {
    box.attr('id', 'entry'+data['id']);
  }

  var img = $('<img class="avatar"/>');
  img.attr('src', 'http://www.gravatar.com/avatar/' + data['md5'] + '?s=64');
  box.append(img);
  box.append('<strong>'+data['email']+'</strong>:<br/>');
  box.append(data['text_rendered']);

  return box;
}

function hideNewEntryForm() {
  $('#newentryform').remove();
  $('#newpreview').remove();
}

function loadEntries() {
  $.ajax({
    type: 'GET',
    url: '/entries',
    dataType: 'json',
    data: {'date': g_last_entry_date},
    cache: false,
    success: function(data) {
      var entries = data['entries'];
      for (var i = 0; i < entries.length; i++) {
        $('#entries').append(createEntryBox(entries[i], false));
      }
    },
    error: function() {
    }
  });
}

