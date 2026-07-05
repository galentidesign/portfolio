# frozen_string_literal: true

class StoryController < InertiaController
  # Chapter slugs are allowlisted in routes.rb; the interpolation below only
  # ever sees one of the three route-constrained values.
  def show
    render inertia: "story/#{params[:chapter]}"
  end
end
