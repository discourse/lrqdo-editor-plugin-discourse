(function() {
  $(function() {

    var cleanedMarkdown, editorBody, editorTitle;
    var $defaultEditor = $('#reply-control');
    var $markdownSwitch = $('#editor input[name=markdown]');
    var $submitButton = $('#editor .btn-primary');
    var TCMention = require("medium-editor-autocomplete").TCMention;
    var appEvents = Discourse.__container__.lookup('app-events:main');

    var resetEditor = function() {
      cleanedMarkdown = undefined;

      $markdownSwitch.bootstrapSwitch({
        inverse: true,
        offText: '&nbsp;',
        onText: '&nbsp;'
      }).on('switchChange.bootstrapSwitch', function(event, state) {
        if (state)
          hideEditor(true);
      }).bootstrapSwitch('state', false);

      if (editorTitle) {
        editorTitle.destroy();
      }

      if (editorBody) {
        editorBody.resetContent();
        editorBody.destroy();
      }

      $('#editor select').off('change');

      editorTitle = new MediumEditor('h1.editable', {
        toolbar: false,
        disableReturn: true,
        disableDoubleReturn: true,
        keyboardCommands: false,
        placeholder: {
          text: 'Donner un titre'
        }
      });

      if ($('#reply-title').length > 0) {
        messagePlaceholder = 'et commencer votre message ici (taper " : " pour les émojis :D)';
        $('h1.editable').show();
      } else {
        messagePlaceholder = 'Taper votre message ici';
        $('h1.editable').hide();
      }

      editorTitle.subscribe('editableInput', function (event, editable) {
        var title = $(editable).text();
        if (title.length > Discourse.SiteSettings.max_topic_title_length) {
          editorTitle.setContent(title.substring(0, Discourse.SiteSettings.max_topic_title_length));
        } else {
          $("#reply-title").val(title);
          validateForm();
        }
      });

      editorBody = new MediumEditor('textarea.editable', {
        extensions: {
          markdown: new MeMarkdown(function(markdown) {
            cleanedMarkdown = markdown
            .split('<div class="medium-insert-buttons"')[0]
            .replace(/<figure contenteditable="false">/g, '')
            .replace(/<\/figure>/g, '');
            validateForm();
          }),
          mention: new TCMention({
            renderPanelContent: function (panelEl, currentMentionText, selectMentionCallback) {
              $.ajax({url: '/users/search/users.json?term=' + currentMentionText.substring(1) + '&topic_id=&include_groups=true'})
              .done(function(response) {
                if (response.users.slice(0, 5).length > 0) {
                  $(panelEl).html('<div class="dropdown-menu"></div>');
                  response.users.forEach(function(user) {
                    $(panelEl).find('> div').append("<a href='' class='dropdown-item' data-medium-value=" + user.username + "><div class='dropdown-item-content'>" + user.username + " <small>" + user.name + "</small></div></a>");
                  });
                  $(panelEl).find('> div a').on('click', function(event) {
                    event.preventDefault();
                    selectMentionCallback('@' + $(this).attr('data-medium-value'));
                  });
                } else {
                  $(panelEl).html('');
                }
              });
            },
            activeTriggerList: ["@"]
          }),
          emoji: new TCMention({
            renderPanelContent: function (panelEl, currentMentionText, selectMentionCallback) {
              $.ajax({url: '/emojis/search.json?term=' + currentMentionText.substring(1) + '&topic_id=&include_groups=true'})
              .done(function(response) {
                if (response.emojis.length > 0) {
                  $(panelEl).html('<div class="dropdown-menu"></div>');
                  response.emojis.forEach(function(emoji) {
                    $(panelEl).find('> div').append("<a href='' class='dropdown-item' data-medium-value=" + emoji.url + "><div class='dropdown-item-content'><img src='" + emoji.url + "' width='30' height='30' /> " + emoji.name + "</div></a>");
                  });
                  $(panelEl).find('> div a').on('click', function(event) {
                    event.preventDefault();
                    selectMentionCallback('<img src=' + $(this).attr('data-medium-value') + ' width="30" height="30" />');
                  });
                } else {
                  $(panelEl).html('');
                }
              });
            },
            activeTriggerList: [":"],
            tagName: 'span',
            htmlNode: true
          })
        },
        toolbar: {
          buttons: [
            {
            name: 'bold',
            action: 'bold',
            aria: 'bold',
            tagNames: ['b', 'strong'],
            contentDefault: '<b>G</b>'
          }, 'italic', {
            name: 'strikethrough',
            action: 'strikethrough',
            aria: 'strike through',
            tagNames: ['s', 'strike'],
            contentDefault: '<i class="fa fa-strikethrough"></i>'
          }, 'h2', 'h3', {
            name: 'unorderedlist',
            action: 'insertunorderedlist',
            aria: 'unordered list',
            tagNames: ['ul'],
            contentDefault: '<i class="fa fa-list-ul"></i>'
          }, {
            name: 'orderedlist',
            action: 'insertorderedlist',
            aria: 'ordered list',
            tagNames: ['ol'],
            contentDefault: '<i class="fa fa-list-ol"></i>'
          }, 'quote', {
            name: 'anchor',
            action: 'createlink',
            aria: 'link',
            tagNames: ['a'],
            contentDefault: '<i class="fa fa-link"></i>'
          }
          ]
        },
        placeholder: {
          text: messagePlaceholder
        }
      });
      $('textarea.editable').mediumInsert({
        editor: editorBody,
        addons: {
          images: {
            deleteScript: null,
            fileUploadOptions: {
              url: '/uploads-editor.json'
            },
            acceptFileTypes: /(.|\/)(gif|jpe?g|png)$/i,
            captions: false
          }
        }
      });

      editorBody.subscribe('editableInput', function (event, editable) {
        var body = $(editable).text();
        // -5000 just to be sure with the editors conversion
        var maxPostLength = Discourse.SiteSettings.max_post_length - 5000;
        if (body.length > maxPostLength)
          editorBody.setContent(body.substring(0, maxPostLength));
      });
    }

    var showEditor = function() {
      if(!$('#editor').hasClass('visible')) {
        setTimeout(function() {
          if($('#editor').hasClass('visible')) {
            $('#main-outlet').hide();
          }
        }, 600);

        var titleHtml = $('.reply-to').html();
        titleHtml = titleHtml.split('<div class="edit-reason-input')[0];
        titleHtml = titleHtml.split('<a class="display-edit-reason')[0];
        var $title = $("<span>" + $('<div/>').html(titleHtml).contents().text() + "</span>");
        $title.prepend($('.reply-to i:first-child'));
        $('#editor .editor-header h2').html($title);

        resetEditor();
        $('#editor').addClass('visible');
      }
    };

    var hideEditor = function(keepDefaultEditor) {
      $markdownSwitch.off('switchChange.bootstrapSwitch');

      if (keepDefaultEditor == null)
        keepDefaultEditor = false;

      if (cleanedMarkdown) {
        $('.d-editor-input').val("");
        appEvents.trigger('composer:insert-text', cleanedMarkdown);
      }

      $('#reply-title').trigger('focus');
      $('#editor').removeClass('visible');
      $('#main-outlet').show();
      if (keepDefaultEditor) {
        $defaultEditor.removeClass('invisible');
      } else {
        $defaultEditor.addClass('invisible');
      }
    };

    appEvents.on('composer:opened', this, function(){
      showEditor();

      var defaultEditorTitle = $('#reply-title').val();
      editorTitle.setContent(defaultEditorTitle);

      var $clonedDefaultEditorCategorySelect = $('#reply-control select.category-combobox')
      .clone()
      .attr('class', 'form-control')
      .attr('id', '');
      $('#editor select').replaceWith($clonedDefaultEditorCategorySelect);
      $('#editor select').show()
      .on('change', function() {
        var $defaultEditorCategorySelect = $('#reply-control select.category-combobox')
        $defaultEditorCategorySelect.val($(this).val());
        $defaultEditorCategorySelect.trigger('change');
      });

      $('.editor-body-textarea .fa-spin').remove();
      // $('.editor-body-textarea').append('<i class="fa fa-circle-o-notch fa-spin fa-fw"></i>');

      setTimeout(function() {
        $('.editor-body-textarea .fa-spin').remove();

        var defaultEditorBodyMarkdown = $('.d-editor-input').val();
        if (defaultEditorBodyMarkdown && defaultEditorBodyMarkdown != '') {
          var defaultEditorBody = $('.d-editor-preview').html();
          editorBody.setContent(defaultEditorBody);
        }
      }, 5000);
    });

    appEvents.on('composer:will-open', this, function(){
      showEditor();
    });

    // Back button
    $('a.editor-header-text').on('click', function() {
      hideEditor();
    });

    $submitButton.on('click', function() {
      hideEditor(true);
      setTimeout(function() {
        $('#reply-control .btn.create ').trigger('click');
      });
    });

    var validateForm = function() {
      var title = MediumEditor.getEditorFromElement($('h1.editable')[0]).getContent();
      var body = cleanedMarkdown;
      if (title.length > Discourse.SiteSettings.min_topic_title_length &&
          body.length > Discourse.SiteSettings.min_post_length) {
        $submitButton
        .removeAttr('disabled')
        .removeAttr('title');
      } else {
        $submitButton
        .attr('disabled', '');
      }
    };

    if ($('#reply-control').hasClass('open'))
      showEditor();

  });
}).call(this);
