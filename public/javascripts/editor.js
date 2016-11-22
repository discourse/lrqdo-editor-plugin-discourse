(function() {
  $(function() {

    DiscourseURL.appEvents.on('composer:will-open', this, function(){
      setTimeout(function() {
        $('#main-outlet').hide();
      }, 600);
      $('#editor').addClass('visible');
    });

    DiscourseURL.appEvents.on('composer:will-close', this, function(){
      $('#editor').removeClass('visible');
      $('#main-outlet').show();
    });

    var $markdownSwitch, editorBody, editorTitle, markDownEl;
    $('.markdown-container').hide();
    $('.markdown-container').removeClass('invisible');

    $('a.editor-header-text').on('click', function() {
      $('#editor').removeClass('visible');
      $('#main-outlet').show();
      // DiscourseURL.appEvents.trigger("composer:will-close");
      // DiscourseURL.appEvents.trigger("composer:closed");
    });

    var validateForm = function() {
      var errors = [];
      $('.popup-tip.bad').each(function() { errors.push($(this).text()); });
      var $submitButton = $('#editor .btn-primary');
      if(errors.length === 0) {
        $submitButton
        .removeAttr('disabled')
        .removeAttr('title');
      } else {
        $submitButton
        .attr('disabled', '')
        .attr('title', errors.join(', '));
      }
      console.log(errors);
    };

    $('header .btn-primary, aside .btn-primary').on('click', function() {
      setTimeout(function() {
        return $('main').hide();
      }, 600);
      return $('#editor').addClass('visible');
    });
    $('a.editor-header-text').on('click', function() {
      $('#editor').removeClass('visible');
      return $('main').show();
    });
    $markdownSwitch = $('#editor input[name=markdown]');
    $markdownSwitch.bootstrapSwitch({
      inverse: true,
      offText: '&nbsp;',
      onText: '&nbsp;'
    });
    $markdownSwitch.on('switchChange.bootstrapSwitch', function(event, state) {
      if (state) {
        $('.editor-body-textarea').hide();
        return $('.markdown-container').show();
      } else {
        $('.editor-body-textarea').show();
        return $('.markdown-container').hide();
      }
    });
    editorTitle = new MediumEditor('h1.editable', {
      toolbar: false,
      disableReturn: true,
      disableDoubleReturn: true,
      placeholder: {
        text: 'Donner un titre'
      }
    });

    editorTitle.subscribe('editableInput', function (event, editable) {
      var title = $(editable).text();
      $("#reply-title").val(title);
      validateForm();
    });

    markDownEl = $(".markdown-container");
    editorBody = new MediumEditor('textarea.editable', {
      extensions: {
        markdown: new MeMarkdown(function(markdown) {
          var cleanedMarkdown;
          cleanedMarkdown = markdown.split('<div class="medium-insert-buttons"')[0];
          markDownEl.text(cleanedMarkdown);
          $('.d-editor-input').val("")
          DiscourseURL.appEvents.trigger('composer:insert-text', cleanedMarkdown);
          $('textarea.d-editor-input').val(cleanedMarkdown);
          validateForm();
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
        text: 'et commencer votre message ici (taper " : " pour les émojis :D)'
      }
    });
    return $('textarea.editable').mediumInsert({
      editor: editorBody
    });

  });
}).call(this);
