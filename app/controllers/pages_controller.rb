# frozen_string_literal: true

class PagesController < InertiaController
  def home
    render inertia: "home/index"
  end

  def resume
    render inertia: "resume/index"
  end

  def colophon
    render inertia: "colophon/index"
  end

  def not_found
    render inertia: "errors/not-found", status: :not_found
  end
end
