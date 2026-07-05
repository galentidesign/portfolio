# frozen_string_literal: true

# Reads data/manifest/*.yml and exposes the DS component manifest to Rails.
#
# Ordering: hero tier alphabetically by name, then gallery tier alphabetically
# by name — matches the sidebar and index grid sort.
#
# Memoized in production and test; re-read on every call in development for
# edit-refresh feedback without a restart.
class Manifest
  class NotFound < StandardError; end
  class InvalidError < StandardError; end

  REQUIRED_KEYS = %w[
    slug name tier status description variants props tokens a11y usage example links
  ].freeze
  VALID_TIERS    = %w[hero gallery].freeze
  VALID_STATUSES = %w[draft stable].freeze
  SEMANTIC_PREFIXES = %w[
    --color- --radius- --type- --density- --motion- --shadow- --space- --z-
  ].freeze

  class << self
    # Returns all validated entries (string-keyed hashes) in tier/name order:
    # hero entries alphabetically by name, then gallery entries alphabetically.
    def all
      loaded
    end

    # Returns the entry whose slug equals +slug+, or nil.
    def find(slug)
      all.find { |entry| entry["slug"] == slug }
    end

    # Like find but raises Manifest::NotFound when the slug is absent.
    def find!(slug)
      find(slug) || raise(NotFound, "No manifest entry for slug: #{slug.inspect}")
    end

    # Returns every slug string in all order.
    def slugs
      all.map { |entry| entry["slug"] }
    end

    # Returns sidebar nav data: [{slug:, name:, tier:}] in all order.
    def nav
      all.map { |entry| entry.slice("slug", "name", "tier") }
    end

    # Returns index card data: [{slug:, name:, tier:, status:, description:}].
    def cards
      all.map { |entry| entry.slice("slug", "name", "tier", "status", "description") }
    end

    # Validates every YAML file in the manifest directory.  Raises
    # Manifest::InvalidError with precise per-file messages when any file is
    # invalid.  Called at boot in production; exercised by specs in other envs.
    def validate!
      load_and_validate
      nil
    end

    # Clears memoized data so the next call reloads from disk.
    def reload!
      @loaded = nil
    end

    private

    def loaded
      # In development, re-read on every call so manifest edits show up without
      # a server restart (same idiom as SkinRegistry).
      return load_and_validate.then { |entries| sort_entries(entries) } if Rails.env.development?

      @loaded ||= sort_entries(load_and_validate)
    end

    # Shared: loads + validates all YAML files, returns raw (unsorted) entries.
    # Collects all per-file errors before raising so callers see every problem.
    def load_and_validate
      errors     = []
      entries    = []
      slugs_seen = {}

      Dir.glob(manifest_dir.join("*.yml")).sort.each do |file|
        filename = File.basename(file)
        begin
          data = YAML.safe_load(File.read(file))
          validate_entry!(data, filename, slugs_seen)
          entries << data
        rescue InvalidError => e
          errors << e.message
        rescue Psych::Exception => e
          errors << "#{filename}: YAML parse error — #{e.message}"
        end
      end

      raise InvalidError, errors.join("\n") if errors.any?

      entries
    end

    def sort_entries(entries)
      heroes  = entries.select { |e| e["tier"] == "hero" }.sort_by  { |e| e["name"] }
      gallery = entries.select { |e| e["tier"] == "gallery" }.sort_by { |e| e["name"] }
      heroes + gallery
    end

    # Isolated so specs can stub it without touching the real manifest directory.
    def manifest_dir
      Rails.root.join("data/manifest")
    end

    # ---------------------------------------------------------------------------
    # Per-entry validation helpers
    # ---------------------------------------------------------------------------

    def validate_entry!(data, filename, slugs_seen) # rubocop:disable Metrics/MethodLength
      raise InvalidError, "#{filename}: top-level value must be a Hash" unless data.is_a?(Hash)

      missing = REQUIRED_KEYS - data.keys
      raise InvalidError, "#{filename}: missing required keys: #{missing.join(', ')}" if missing.any?

      validate_slug!(data, filename, slugs_seen)
      validate_tier!(data, filename)
      validate_status!(data, filename)
      validate_variants!(data["variants"], filename)
      validate_props!(data["props"], filename)
      validate_tokens!(data["tokens"], filename)
      validate_a11y!(data["a11y"], filename)
      validate_usage!(data["usage"], filename)
      validate_example!(data["example"], filename)
      validate_links!(data["links"], filename)
    end

    def validate_slug!(data, filename, slugs_seen)
      slug      = data["slug"]
      slug_base = File.basename(filename, ".yml")

      unless slug.is_a?(String) && slug.match?(/\A[a-z0-9]+(-[a-z0-9]+)*\z/)
        raise InvalidError, "#{filename}: slug #{slug.inspect} is not valid kebab-case"
      end

      unless slug == slug_base
        raise InvalidError,
          "#{filename}: slug #{slug.inspect} does not match filename base #{slug_base.inspect}"
      end

      if slugs_seen.key?(slug)
        raise InvalidError,
          "#{filename}: slug #{slug.inspect} duplicates #{slugs_seen[slug]}"
      end

      slugs_seen[slug] = filename
    end

    def validate_tier!(data, filename)
      return if VALID_TIERS.include?(data["tier"])

      raise InvalidError,
        "#{filename}: tier must be #{VALID_TIERS.join('|')}, got #{data['tier'].inspect}"
    end

    def validate_status!(data, filename)
      return if VALID_STATUSES.include?(data["status"])

      raise InvalidError,
        "#{filename}: status must be #{VALID_STATUSES.join('|')}, got #{data['status'].inspect}"
    end

    def validate_variants!(variants, filename)
      unless variants.is_a?(Hash) &&
             variants.all? { |k, v| k.is_a?(String) && v.is_a?(Array) && v.any? && v.all? { |item| item.is_a?(String) } }
        raise InvalidError,
          "#{filename}: variants must be a Hash of String => nonempty Array of Strings"
      end
    end

    def validate_props!(props, filename)
      unless props.is_a?(Array) && props.any?
        raise InvalidError, "#{filename}: props must be a nonempty Array of Hashes"
      end

      names_seen = []
      props.each_with_index do |prop, i|
        raise InvalidError, "#{filename}: props[#{i}] must be a Hash" unless prop.is_a?(Hash)

        %w[name type description].each do |key|
          unless prop[key].is_a?(String)
            raise InvalidError, "#{filename}: props[#{i}].#{key} must be a String"
          end
        end

        if prop.key?("default") && !prop["default"].nil?
          valid_scalar = [ String, Integer, Float, TrueClass, FalseClass ].any? { |k| prop["default"].is_a?(k) }
          raise InvalidError, "#{filename}: props[#{i}].default must be a scalar" unless valid_scalar
        end

        if prop.key?("playground") && !prop["playground"].nil?
          valid_bool = [ TrueClass, FalseClass ].any? { |k| prop["playground"].is_a?(k) }
          raise InvalidError, "#{filename}: props[#{i}].playground must be a boolean" unless valid_bool
        end

        name = prop["name"]
        if names_seen.include?(name)
          raise InvalidError, "#{filename}: duplicate prop name #{name.inspect}"
        end

        names_seen << name
      end
    end

    def validate_tokens!(tokens, filename)
      unless tokens.is_a?(Array) && tokens.any?
        raise InvalidError, "#{filename}: tokens must be a nonempty Array"
      end

      tokens.each do |token|
        valid = token.is_a?(String) && SEMANTIC_PREFIXES.any? { |prefix| token.start_with?(prefix) }
        unless valid
          raise InvalidError,
            "#{filename}: token #{token.inspect} does not match a semantic prefix " \
            "(#{SEMANTIC_PREFIXES.join(', ')})"
        end
      end
    end

    def validate_a11y!(a11y, filename)
      raise InvalidError, "#{filename}: a11y must be a Hash" unless a11y.is_a?(Hash)

      keyboard = a11y["keyboard"]
      unless keyboard.is_a?(Array) && keyboard.any?
        raise InvalidError, "#{filename}: a11y.keyboard must be a nonempty Array"
      end

      keyboard.each_with_index do |entry, i|
        unless entry.is_a?(Hash) && entry["keys"].is_a?(String) && entry["does"].is_a?(String)
          raise InvalidError,
            "#{filename}: a11y.keyboard[#{i}] must be a Hash with String 'keys' and 'does'"
        end
      end

      aria = a11y["aria"]
      unless aria.is_a?(Array) && aria.any? && aria.all? { |s| s.is_a?(String) }
        raise InvalidError, "#{filename}: a11y.aria must be a nonempty Array of Strings"
      end

      unless a11y["contrast"].is_a?(String)
        raise InvalidError, "#{filename}: a11y.contrast must be a String"
      end
    end

    def validate_usage!(usage, filename)
      raise InvalidError, "#{filename}: usage must be a Hash" unless usage.is_a?(Hash)

      %w[do dont].each do |key|
        val = usage[key]
        unless val.is_a?(Array) && val.any? && val.all? { |s| s.is_a?(String) }
          raise InvalidError, "#{filename}: usage.#{key} must be a nonempty Array of Strings"
        end
      end
    end

    def validate_example!(example, filename)
      unless example.is_a?(String) && !example.strip.empty?
        raise InvalidError, "#{filename}: example must be a nonempty String"
      end
    end

    def validate_links!(links, filename)
      raise InvalidError, "#{filename}: links must be a Hash" unless links.is_a?(Hash)

      repo = links["repo"]
      unless repo.is_a?(String) && repo.start_with?("app/frontend/ds/components/")
        raise InvalidError,
          "#{filename}: links.repo must start with 'app/frontend/ds/components/'"
      end

      figma = links["figma"]
      if !figma.nil? && !(figma.is_a?(String) && figma.start_with?("https://www.figma.com/"))
        raise InvalidError,
          "#{filename}: links.figma must be nil or a String starting with 'https://www.figma.com/'"
      end
    end
  end
end
