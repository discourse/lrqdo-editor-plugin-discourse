# name: lrqdo-editor
# about: La ruche qui dit oui - editor
# version: 1.0.2
# authors: Sébastien Bourdu
# url: https://github.com/ekkans/lrqdo-editor-plugin-discourse

enabled_site_setting :lrqdo_editor_enabled

register_asset 'stylesheets/editor.css'

after_initialize do

  require_dependency 'uploads_controller'
  class ::UploadsController
    def editor
      type = 'composer'
      file = params[:file] || params[:files].try(:first)
      url = nil
      for_private_message = true
      pasted = false
      data = create_upload(file, url, type, for_private_message, pasted)
      render json: {
        files: [{ url: data.url }]
      }
    end
  end

  require_dependency 'application_controller'
  class ::EmojisController < ::ApplicationController
    def search
      term = params[:term] || ''
      max_results = 5

      matches = Emoji.standard.select do |emoji|
        emoji.name.start_with? term
      end[0, max_results]

      render json: matches
    end
  end

  Discourse::Application.routes.append do
    post "uploads-editor" => "uploads#editor"
    get "emojis/search" => "emojis#search"
  end

end
