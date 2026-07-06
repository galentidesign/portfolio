# frozen_string_literal: true

# Namespace for the Study B live-demo domain.  Declaring table_name_prefix
# here causes all Demo:: models to resolve demo_* tables automatically.
module Demo
  def self.table_name_prefix
    "demo_"
  end
end
