(function() {
  $(function() {

    var cleanedMarkdown, editorBody, editorTitle;
    var $defaultEditor = $('#reply-control');
    var $advancedSwitch = $('#editor input[name=advanced]');
    var isTitleEditable = false;
    var TCMention = require("medium-editor-autocomplete").TCMention;
    var appEvents = Discourse.__container__.lookup('app-events:main');

    $defaultEditor.addClass('invisible');

    var destroyEditor = function() {
      cleanedMarkdown = undefined;

      $('#editor .editor-header h2').html('');
      $('#editor select').select2('destroy');
      $('#editor select2-container').remove();
      $('#editor select').addClass('invisible').hide();

      if (editorTitle) {
        editorTitle.unsubscribe('editableInput');
        editorTitle.resetContent();
        editorTitle.setContent('');
        editorTitle.destroy();
        $('h1.editable').replaceWith($("<h1 class='editable invisible'></h1>"));
      }

      $('a.editor-header-text').off('click');
      $('#editor .btn-primary').off('click');

      if (editorBody) {
        editorBody.unsubscribe('editableInput');
        editorBody.resetContent();
        editorBody.setContent('');
        editorBody.destroy();
        $('textarea.editable').replaceWith("<textarea class='editable invisible'></textarea>");
        $('.medium-editor-element').remove()
      }

      $advancedSwitch.bootstrapSwitch('destroy');
    }

    var resetEditor = function() {

      // Back button
      $('a.editor-header-text').on('click', function(event) {
        event.preventDefault();
        hideEditor();
      });

      $('#editor .btn-primary').on('click', function() {
        hideEditor(true);
        setTimeout(function() {
          $('#reply-title').trigger('change');
          $('#reply-control .btn.create ').trigger('click');
        });
      });

      $advancedSwitch = $('#editor input[name=advanced]')
      $advancedSwitch.bootstrapSwitch({
        inverse: true,
        offText: '&nbsp;',
        onText: '&nbsp;'
      }).on('switchChange.bootstrapSwitch', function(event, state) {
        if (state)
          hideEditor(true);
      }).bootstrapSwitch('state', false);
    }

    var initFields = function() {

      isTitleEditable = ($('#reply-title').length > 0);
      if (isTitleEditable) {
        messagePlaceholder = 'et commencer votre message ici (taper " : " pour les émojis :D)';
        $('h1.editable').removeClass('invisible');
      } else {
        messagePlaceholder = 'Taper votre message ici';
        $('h1.editable').addClass('invisible');
      }

      editorTitle = new MediumEditor('h1.editable', {
        toolbar: false,
        disableReturn: true,
        disableDoubleReturn: true,
        keyboardCommands: false,
        placeholder: {
          text: 'Donner un titre'
        }
      });

      editorTitle.subscribe('editableInput', function (event, editable) {
        if ($('#editor').hasClass('visible')) {
          var title = $(editable).text();
          if (title.length > Discourse.SiteSettings.max_topic_title_length)
            editorTitle.setContent(title.substring(0, Discourse.SiteSettings.max_topic_title_length));
          $("#reply-title").val(title);
          validateForm();
        }
      });

      editorBody = new MediumEditor('textarea.editable', {
        extensions: {
          mention: new TCMention({
            renderPanelContent: function (panelEl, currentMentionText, selectMentionCallback) {
              $.ajax({url: 'http://localhost:4000/users/search/users.json?term=' + currentMentionText.substring(1) + '&topic_id=&include_groups=true'})
              .done(function(response) {
                if (response.users.slice(0, 5).length > 0) {
                  $(panelEl).html('<div class="dropdown-menu"></div>');
                  response.users.forEach(function(user) {
                    $(panelEl).find('> div').append("<a href='' class='dropdown-item' data-medium-value=" + user.username + "><div class='dropdown-item-content'>" + user.username + " <small>" + user.name + "</small></div></a>");
                  });
                  $(panelEl).find('> div a').on('click', function(event) {
                    event.preventDefault();
                    selectMentionCallback('<a class="mention" href="/users/' + $(this).attr('data-medium-value') + '">@' + $(this).attr('data-medium-value') + '</a>');
                    validateForm();
                  });
                } else {
                  $(panelEl).html('');
                }
              });
            },
            activeTriggerList: ["@"],
            tagName: 'span',
            htmlNode: true
          }),
          emoji: new TCMention({
            renderPanelContent: function (panelEl, currentMentionText, selectMentionCallback) {
              $.ajax({url: 'http://localhost:4000/emojis/search.json?term=' + currentMentionText.substring(1) + '&topic_id=&include_groups=true'})
              .done(function(response) {
                if (response.emojis.length > 0) {
                  $(panelEl).html('<div class="dropdown-menu"></div>');
                  response.emojis.forEach(function(emoji) {
                    $(panelEl).find('> div').append("<a href='' class='dropdown-item' data-medium-value='" + emoji.name + "' data-medium-url='" + emoji.url + "'><div class='dropdown-item-content'><img class='emoji' src='" + emoji.url + "' width='20' height='20' /> " + emoji.name + "</div></a>");
                  });
                  $(panelEl).find('> div a').on('click', function(event) {
                    event.preventDefault();
                    selectMentionCallback('<img src="' + $(this).attr('data-medium-url') + '" title=":' + $(this).attr('data-medium-value') + ':" class="emoji" alt=":' + $(this).attr('data-medium-value') + ':">');
                    validateForm();
                  });
                } else {
                  $(panelEl).html('');
                }
              });
            },
            activeTriggerList: [":"],
            tagName: 'span',
            htmlNode: true
          }),
          customHtml: new CustomHtml({
            buttonText: "—",
            htmlToInsert: "<hr>"
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
            }, 'customHtml'
          ]
        },
        anchor: {
            linkValidation: true,
            placeholderText: 'Insérer le lien'
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
        validateForm();
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
        titleHtml = titleHtml
        .split('<div class="edit-reason-input')[0]
        .split('<a class="display-edit-reason')[0]
        .split('<i class="fa fa-mail-forward reply-to-glyph')[0];
        var $title = $("<span>" + $('<div/>').html(titleHtml).contents().text() + "</span>");
        $title.prepend($('.reply-to i:first-child'));
        $('#editor .editor-header h2').html($title);

        resetEditor();
        $('#editor').addClass('visible');
      }
    };

    var hideEditor = function(keepDefaultEditor) {
      validateForm();
      
      $advancedSwitch.off('switchChange.bootstrapSwitch');

      if (keepDefaultEditor == null)
        keepDefaultEditor = false;

      if (cleanedMarkdown) {
        $('.d-editor-input').val("");
        appEvents.trigger('composer:insert-text', cleanedMarkdown);
      }

      $('#editor').removeClass('visible');
      $('#main-outlet').show();
      if (keepDefaultEditor) {
        $defaultEditor.removeClass('invisible');
      } else {
        $defaultEditor.find('a.cancel').trigger('click');
        $defaultEditor.addClass('invisible');
      }

      destroyEditor();
    };

    var loadDefaultEditorBodyValue = function() {
      if ($('.d-editor-input').parent('div').find('.spinner').length > 0) {
        setTimeout(function() {
          loadDefaultEditorBodyValue();
        }, 200);
      } else {
        setTimeout(function() {
          $('.editor-body-textarea .fa-spin').remove();
          $('textarea.editable').parent('div').find('.editable').removeClass('invisible');
          var defaultEditorBodyMarkdown = $('.d-editor-input').val();
          if (defaultEditorBodyMarkdown && defaultEditorBodyMarkdown != '') {
            var defaultEditorBody = $('.d-editor-preview').html();
            editorBodyId = $("textarea.editable").attr('medium-editor-textarea-id');
            if ($('#' + editorBodyId).length > 0) {
              editorBody = MediumEditor.getEditorFromElement($('#' + editorBodyId)[0])
              editorBody.setContent(defaultEditorBody  + '<br>');
            }
          }
        }, 100);
      }
    }

    appEvents.on('composer:opened', this, function(){

      showEditor();
      initFields();

      var defaultEditorTitle = $('#reply-title').val();
      if (defaultEditorTitle)
        editorTitle.setContent(defaultEditorTitle);

      var $defaultEditorCategorySelect = $('#reply-control select.category-combobox');
      if ($defaultEditorCategorySelect.length > 0) {
        var $clonedDefaultEditorCategorySelect = $defaultEditorCategorySelect
          .clone()
          .attr('class', 'form-control')
          .attr('id', '');
        $('#editor select').replaceWith($clonedDefaultEditorCategorySelect);
        $('#editor select').removeClass('invisible').show().on('change', function() {
          var $defaultEditorCategorySelect = $('#reply-control select.category-combobox')
          $defaultEditorCategorySelect.val($(this).val());
          $defaultEditorCategorySelect.trigger('change');
        });
        $.ajax({url: '/categories.json'})
          .done(function(results) {
            var categories = results.category_list.categories;
            var formatResult = function (state) {
              var html = `<h5 class='m-b-0>${state.text}</h5>`;
              var categoryFinder = $.grep(categories, function(category){ return category.id == state.id; });
              if (categoryFinder.length == 0) { return html };
              var category = categoryFinder[0];
              html = `<h5 class='m-b-0'>${state.text} <small>&times; ${category.topic_count}</small></h5>`;
              if (category.description) {
                html += `<div class="text-muted small">${category.description.substr(0, 200)}${category.description.length > 200 ? '&hellip;' : ''}</div>`;
              }
              return html;
            }
            $('#editor select').select2({
              formatResult: formatResult,
              width: '300px'
            });
          })
      }

      $('.editor-body-textarea .fa-spin').remove();
      $('.editor-body-textarea').append('<i class="fa fa-circle-o-notch fa-spin fa-fw"></i>');

      loadDefaultEditorBodyValue();
    });

    appEvents.on('composer:will-open', this, function(){
      $defaultEditor.addClass('invisible');
      showEditor('');
    });

    appEvents.on('composer:insert-text', this, function(){
      // showEditor();
    });

    appEvents.on('composer:typed-reply', this, function(){
      // showEditor();
    });

    var validateForm = function() {
      // var errors = [];
      // $('.popup-tip.bad').each(function() { errors.push($(this).text()); });

      var mediumEditorTitle = MediumEditor.getEditorFromElement($('h1.editable')[0]);
      var title = mediumEditorTitle ? mediumEditorTitle.getContent() : '';

      var editorBodyId = $("textarea.editable").attr('medium-editor-textarea-id');
      if ($('#' + editorBodyId).length > 0) {
        var bodyAllContents = MediumEditor.getEditorFromElement($('#' + editorBodyId)[0]).serialize();
        var bodyElContent = bodyAllContents[editorBodyId].value;
        var emojiConverter  = {
          filter: function (node) {
            return node.nodeName === 'IMG' && node.className === 'emoji';
          },
          replacement: function(content, node) {
            return node.getAttribute('title');
          }
        }
        var mentionConverter  = {
          filter: function (node) {
            var targetNode;
            if (node.nodeName === 'SPAN') {
              targetNode = node.children[0] ? node.children[0] : node;
            } else {
              targetNode = node;
            }
            return targetNode.className.trim() === 'mention';
          },
          replacement: function(content, node) {
            var targetNode;
            if (node.nodeName === 'SPAN') {
              targetNode = node.children[0] ? node.children[0] : node;
            } else {
              targetNode = node;
            }
            return targetNode.textContent;
          }
        }
        var markdown = toMarkdown(bodyElContent, { converters: [emojiConverter, mentionConverter]});
        cleanedMarkdown = markdown
        .replace(/<figure>/g, '')
        .replace(/<figure contenteditable="false">/g, '')
        .replace(/<\/figure>/g, '');
      }

      var body = cleanedMarkdown || '';

      if ((!isTitleEditable || title.length > (Discourse.SiteSettings.min_topic_title_length + 1)) &&
          body.length > (Discourse.SiteSettings.min_post_length + 1)) {

        $('#editor .btn-primary')
        .removeAttr('disabled')
        .removeAttr('title');
      } else {

        $('#editor .btn-primary')
        .attr('disabled', '');
      }
    };

    setTimeout(function() {
      if ($('#reply-control').hasClass('open')) {
        showEditor();
      }
    }, 100);

  });
}).call(this);
