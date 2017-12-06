# name: lrqdo-editor
# about: La ruche qui dit oui - editor
# version: 1.0.3
# authors: Sébastien Bourdu
# url: https://github.com/ekkans/lrqdo-editor-plugin-discourse

enabled_site_setting :lrqdo_editor_enabled

register_asset 'stylesheets/editor.css'

after_initialize do

  require_dependency 'uploads_controller'
  class ::UploadsController
    def editor
      me = current_user
      type = 'composer'
      file = params[:file] || params[:files].try(:first)
      url = nil
      for_private_message = true
      pasted = false
      is_api = true
      retain_hours = 876000
      info = ::UploadsController.create_upload(
        current_user: me,
        file: file,
        url: url,
        type: type,
        for_private_message: for_private_message,
        pasted: pasted,
        is_api: is_api,
        retain_hours: retain_hours
      )
      render json: {
        files: [ ::UploadsController.serialize_upload(info) ]
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
