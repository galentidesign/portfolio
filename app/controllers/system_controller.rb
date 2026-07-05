# frozen_string_literal: true

class SystemController < InertiaController
  inertia_share nav: -> { Manifest.nav }

  rescue_from Manifest::NotFound, with: :not_found

  def index
    render inertia: "system/index", props: { components: Manifest.cards }
  end

  def tokens
    render inertia: "system/tokens"
  end

  def motion
    render inertia: "system/motion"
  end

  def skins
    render inertia: "system/skins"
  end

  def component
    render inertia: "system/components/show",
           props: { entry: Manifest.find!(params[:slug]) }
  end

  private

  def not_found
    render inertia: "errors/not-found", status: :not_found
  end
end
