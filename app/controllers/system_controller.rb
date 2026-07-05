# frozen_string_literal: true

class SystemController < InertiaController
  def tokens
    render inertia: "system/tokens"
  end
end
