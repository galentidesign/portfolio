# frozen_string_literal: true

class WorkController < InertiaController
  def index
    render inertia: "work/index"
  end

  def agentic_design_ops
    render inertia: "work/agentic-design-ops"
  end

  def shadcn_to_polaris
    render inertia: "work/shadcn-to-polaris"
  end

  def shadcn_to_polaris_demo
    render inertia: "work/shadcn-to-polaris-demo"
  end
end
