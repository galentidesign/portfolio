# frozen_string_literal: true

class InertiaController < ApplicationController
  # Share data with all Inertia responses
  # see https://inertia-rails.dev/guide/shared-data
  #   inertia_share user: -> { Current.user&.as_json(only: [:id, :name, :email]) }

  # Capture the page component so the layout can emit modulepreload links for
  # its chunk (see ApplicationHelper#inertia_page_preload_paths). Pure
  # passthrough otherwise.
  def render(*args, **options, &)
    @inertia_page_component = options[:inertia] if options[:inertia].is_a?(String)
    super
  end
end
