var g_last_entry_date;
var g_loading = false;
var g_user;
var g_md5;

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
          g_md5 = CryptoJS.MD5(g_user);
          updateEntries();
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
        g_md5 = '';
        hideNewEntryForm();
        updateEntries();
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
            $('#newentryform').after(createEntryBox(data, 'newpreview'));
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
            data['fdate'] = (new Date()).toUTCString();
            $('#newentryform').after(createEntryBox(data, null));
          },
          error: function() {
            $("#message").text('Failed to create entry.');
          }
        });
      });
}

function createActions(id) {
    var actions = $("<p class='actions'/>");
    actions.append(' ');
    actions.append($("<a/>").text('Edit').click(edit_entry(id)));
    actions.append(' ');
    actions.append($("<a/>").text('Delete').click(delete_entry(id)));
    return actions;
}

function createEntryBox(data, preview) {
  var box = $('<div class="box"/>');

  if (preview) {
    box.addClass('preview');
    box.attr('id', preview);
  }
  else {
    box.attr('id', 'entry'+data['id']);
  }
  box.data('id', data['id']);
  box.data('md5', data['md5']);

  var img = $('<img class="avatar"/>');
  img.attr('src', 'http://www.gravatar.com/avatar/' + data['md5'] + '?s=64');
  box.append(img);
  box.append('<strong>'+data['email']+'</strong> (' + (preview ? ' - ' : data.fdate) + '):<br/>');
  box.append(data['text_rendered']);

  if (g_md5 == data.md5) {
    box.append(createActions(data.id));
  }

  return box;
}

function hideNewEntryForm() {
  $('#newentryform').remove();
  $('#newpreview').remove();
}

function loadEntries() {
  if (g_loading)
      return;
  g_loading = true;

  $.ajax({
    type: 'GET',
    url: '/entries',
    dataType: 'json',
    data: {'date': g_last_entry_date},
    cache: false,
    success: function(data) {
      var entries = data['entries'];
      for (var i = 0; i < entries.length; i++) {
        $('#entries').append(createEntryBox(entries[i], null));
      }
      if (entries.length > 0) {
        g_last_entry_date = entries[entries.length-1].date;
        console.log(g_last_entry_date);
      }
        g_loading = false;
    },
    error: function() {
        g_loading = false;
    }
  });
}

function updateEntries() {
  var entries = $('#entries > div.box');
  for (var i = 0; i < entries.length; i++) {
    var entry = $(entries[i]);
    if (entry.data('md5') == g_md5) {
      entry.append(createActions(entry.data('id')));
    }
    else {
      entry.children('p.actions').remove();
    }
  }
}

function edit_entry(entry_id) {
  return function() {
    $.ajax({
      type: 'GET',
      url: '/entries/' + entry_id,
      cache: false,
      success: function(data) {
        var box = $("<div/>").addClass('box');
        box.attr('id', 'entry_' + entry_id + '_box');
        box.append($('<textarea placeholder="Text"/>').attr('id', 'entry_' + entry_id + '_text').val(data.text));
        var preview_button = $('<button>Preview</button>');
        box.append($(preview_button));
        var update_button = $('<button>Update</button>');
        box.append($(update_button));
        box.append($('<div/>').attr('id', 'entry_' + entry_id + '_message'));
        box.append($('<div/>').attr('id', 'entry_' + entry_id + '_preview'));
        $("#entry"+entry_id).append(box);

        preview_button.click(
          function() {
            $.ajax({
              type: 'POST',
              url: '/entries',
              cache: false,
              dataType: 'json',
              data: {
                'preview': true,
                'text': $("#entry_" + entry_id + "_text").val()
              },
              success: function(data) {
                $("#entry_" + entry_id + "_message").text('Preview created.');
                $("#entry_" + entry_id + "_preview").remove();
                data['email'] = g_user.slice(0, g_user.indexOf('@'));
                $("#entry_" + entry_id + "_box").after(createEntryBox(data, "entry_" + entry_id + "_preview"));
              },
              error: function() {
                $("#entry_" + entry_id + "_preview").remove();
                $("#entry_" + entry_id + "_message").text('Preview failed.');
              }
            });
          });

        update_button.click(
            function() {
              $.ajax({
                type: 'PUT',
                url: '/entries/' + entry_id,
                cache: false,
                dataType: 'json',
                data: {'text': $("#entry_" + entry_id + "_text").val()},
                success: function(data) {
                  $("#entry" + entry_id).replaceWith(createEntryBox(data, null));
                },
                error: function() {
                  $("#entry_" + entry_id + "_message").text('Failed to update entry.');
                }
              });
            });
      },
      error: {
      }
    });
  }
}

function delete_entry(entry_id) {
  return function() {
    $.ajax({
      type: 'DELETE',
      url: '/entries/' + entry_id,
      success: function(data) {
        $("#entry" + entry_id).remove();
      }
    });
  }
}

function getDocHeight() {
  var D = document;
  return Math.max(
      Math.max(D.body.scrollHeight, D.documentElement.scrollHeight),
      Math.max(D.body.offsetHeight, D.documentElement.offsetHeight),
      Math.max(D.body.clientHeight, D.documentElement.clientHeight)
      );
}

$(window).scroll(function() {
  if($(window).scrollTop() + $(window).height()+20 >= getDocHeight()) {
    loadEntries();
  }
});
