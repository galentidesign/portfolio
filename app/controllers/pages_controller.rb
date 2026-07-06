# frozen_string_literal: true

class PagesController < InertiaController
  def home
    render inertia: "home/index"
  end

  def resume
    pdf_path = Rails.root.join("public/resume/j-galenti-resume.pdf")
    render inertia: "resume/index", props: {
      pdf: { available: File.exist?(pdf_path), href: "/resume/j-galenti-resume.pdf" }
    }
  end

  def colophon
    craft_path = Rails.root.join("data/craft.json")
    craft = craft_path.exist? ? JSON.parse(craft_path.read) : nil
    render inertia: "colophon/index", props: { craft: }
  end

  def not_found
    render inertia: "errors/not-found", status: :not_found
  end
end
