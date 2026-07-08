# frozen_string_literal: true

# The product-design gallery pillar (/gallery). A pure function of
# data/projects/*.yml via ProjectGallery — mirrors SystemController.
class GalleryController < InertiaController
  rescue_from ProjectGallery::NotFound, with: :not_found

  def index
    render inertia: "gallery/index", props: { projects: ProjectGallery.cards }
  end

  def show
    render inertia: "gallery/show", props: {
      project:  ProjectGallery.find!(params[:slug]),
      siblings: ProjectGallery.siblings(params[:slug])
    }
  end

  private

  def not_found
    render inertia: "errors/not-found", status: :not_found
  end
end
