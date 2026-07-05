# frozen_string_literal: true

class SystemController < InertiaController
  def tokens
    render inertia: "system/tokens"
  end

  def gallery
    render inertia: "system/gallery"
  end
end
