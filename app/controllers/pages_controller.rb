# frozen_string_literal: true

class PagesController < InertiaController
  def home
    render inertia: "home/index", props: { greeting: "Hello, world" }
  end
end
