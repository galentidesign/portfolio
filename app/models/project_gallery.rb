# frozen_string_literal: true

# Reads data/projects/*.yml and exposes the product-design gallery to Rails.
#
# Parallels app/models/manifest.rb (the DS component manifest): same load /
# validate / memoize idiom, but a project schema instead of tokens/props. Kept
# separate rather than generalized — the two schemas share nothing but the
# plumbing, and Manifest's DS-specific rules (token prefixes, links.repo path,
# a11y contract) don't apply here.
#
# Ordering: featured projects first (alphabetically by title), then the rest.
#
# Image assets are placeholder-aware: each cover / shot src is resolved against
# public/gallery/, and an `available` boolean is attached so the frontend renders
# the real <img> when the file is on disk and a labeled placeholder otherwise —
# the same File.exist? idiom PagesController uses for the résumé PDF. Drop a real
# PNG into public/gallery/<slug>/ and the next request renders it, no code change.
#
# Memoized in production and test; re-read on every call in development for
# edit-refresh feedback without a restart.
class ProjectGallery
  class NotFound < StandardError; end
  class InvalidError < StandardError; end

  REQUIRED_KEYS = %w[
    slug title role client year featured disciplines summary cover overview highlights shots links
  ].freeze

  class << self
    # All validated, asset-resolved entries in featured-then-name order.
    def all
      loaded
    end

    # The entry whose slug equals +slug+, or nil.
    def find(slug)
      all.find { |entry| entry["slug"] == slug }
    end

    # Like find but raises NotFound when the slug is absent.
    def find!(slug)
      find(slug) || raise(NotFound, "No project for slug: #{slug.inspect}")
    end

    # Every slug string in all order (used by the sitemap).
    def slugs
      all.map { |entry| entry["slug"] }
    end

    # Light index-card data for the grid — the detail-only fields (overview,
    # highlights, shots, links) are dropped.
    def cards
      all.map do |entry|
        entry.slice(
          "slug", "title", "role", "client", "year", "featured",
          "disciplines", "summary", "cover"
        )
      end
    end

    # Prev/next neighbours for the detail-page footer, in all order. Wraps at
    # both ends so every project has both a prev and a next (unless there is
    # only one). Returns {slug, title} refs or nil.
    def siblings(slug)
      list = all
      idx = list.index { |entry| entry["slug"] == slug }
      return { "prev" => nil, "next" => nil } if idx.nil? || list.size < 2

      {
        "prev" => sibling_ref(list[(idx - 1) % list.size]),
        "next" => sibling_ref(list[(idx + 1) % list.size])
      }
    end

    # Validates every YAML file; raises InvalidError with per-file messages.
    # Called at boot in production; exercised by specs elsewhere.
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
      return sort_entries(load_and_validate) if Rails.env.development?

      @loaded ||= sort_entries(load_and_validate)
    end

    # Loads + validates every YAML file, collecting all per-file errors before
    # raising so callers see every problem at once. Returns asset-resolved,
    # unsorted entries.
    def load_and_validate
      errors     = []
      entries    = []
      slugs_seen = {}

      Dir.glob(projects_dir.join("*.yml")).sort.each do |file|
        filename = File.basename(file)
        begin
          data = YAML.safe_load(File.read(file))
          validate_entry!(data, filename, slugs_seen)
          entries << resolve_assets(data)
        rescue InvalidError => e
          errors << e.message
        rescue Psych::Exception => e
          errors << "#{filename}: YAML parse error — #{e.message}"
        end
      end

      raise InvalidError, errors.join("\n") if errors.any?

      entries
    end

    # Featured first (alphabetical by title), then the rest (alphabetical).
    def sort_entries(entries)
      featured = entries.select { |e| e["featured"] }.sort_by { |e| e["title"] }
      standard = entries.reject { |e| e["featured"] }.sort_by { |e| e["title"] }
      featured + standard
    end

    # Isolated so specs can stub it without touching the real projects dir.
    def projects_dir
      Rails.root.join("data/projects")
    end

    def sibling_ref(entry)
      entry.slice("slug", "title")
    end

    # ---------------------------------------------------------------------------
    # Asset resolution — attach {src, available} (+ alt/caption) to every image
    # ---------------------------------------------------------------------------

    def resolve_assets(data)
      entry = data.dup
      cover = data["cover"]
      entry["cover"] = cover.nil? ? nil : resolve_image(cover).merge("alt" => "#{data['title']} — cover")
      entry["shots"] = Array(data["shots"]).map do |shot|
        resolve_image(shot["src"]).merge("alt" => shot["alt"], "caption" => shot["caption"])
      end
      entry
    end

    # A src like "qwinix-streaming/cover.png" → the served URL plus a disk check.
    def resolve_image(src)
      {
        "src"       => "/gallery/#{src}",
        "available" => File.exist?(Rails.public_path.join("gallery", src))
      }
    end

    # ---------------------------------------------------------------------------
    # Per-entry validation
    # ---------------------------------------------------------------------------

    def validate_entry!(data, filename, slugs_seen)
      raise InvalidError, "#{filename}: top-level value must be a Hash" unless data.is_a?(Hash)

      missing = REQUIRED_KEYS - data.keys
      raise InvalidError, "#{filename}: missing required keys: #{missing.join(', ')}" if missing.any?

      validate_slug!(data, filename, slugs_seen)
      validate_strings!(data, filename, %w[title role client year summary overview])
      validate_featured!(data, filename)
      validate_string_array!(data["disciplines"], "disciplines", filename)
      validate_string_array!(data["highlights"], "highlights", filename)
      validate_cover!(data["cover"], filename)
      validate_shots!(data["shots"], filename)
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
        raise InvalidError, "#{filename}: slug #{slug.inspect} duplicates #{slugs_seen[slug]}"
      end

      slugs_seen[slug] = filename
    end

    def validate_strings!(data, filename, keys)
      keys.each do |key|
        unless data[key].is_a?(String) && !data[key].strip.empty?
          raise InvalidError, "#{filename}: #{key} must be a nonempty String"
        end
      end
    end

    def validate_featured!(data, filename)
      return if [ true, false ].include?(data["featured"])

      raise InvalidError, "#{filename}: featured must be a boolean, got #{data['featured'].inspect}"
    end

    def validate_string_array!(value, key, filename)
      unless value.is_a?(Array) && value.any? && value.all? { |s| s.is_a?(String) }
        raise InvalidError, "#{filename}: #{key} must be a nonempty Array of Strings"
      end
    end

    # cover is a project-relative path String, or nil for a text-only entry.
    def validate_cover!(cover, filename)
      return if cover.nil?
      return if cover.is_a?(String) && !cover.strip.empty?

      raise InvalidError, "#{filename}: cover must be a String path or null"
    end

    # shots is an Array (possibly empty) of { src, alt, caption? } hashes.
    def validate_shots!(shots, filename)
      raise InvalidError, "#{filename}: shots must be an Array" unless shots.is_a?(Array)

      shots.each_with_index do |shot, i|
        raise InvalidError, "#{filename}: shots[#{i}] must be a Hash" unless shot.is_a?(Hash)

        %w[src alt].each do |key|
          unless shot[key].is_a?(String) && !shot[key].strip.empty?
            raise InvalidError, "#{filename}: shots[#{i}].#{key} must be a nonempty String"
          end
        end

        if shot.key?("caption") && !shot["caption"].nil? && !shot["caption"].is_a?(String)
          raise InvalidError, "#{filename}: shots[#{i}].caption must be a String or null"
        end
      end
    end

    # links is a Hash whose values are each nil or an http(s) URL String.
    def validate_links!(links, filename)
      raise InvalidError, "#{filename}: links must be a Hash" unless links.is_a?(Hash)

      links.each do |key, value|
        next if value.nil?

        unless value.is_a?(String) && value.match?(%r{\Ahttps?://})
          raise InvalidError, "#{filename}: links.#{key} must be nil or an http(s) URL"
        end
      end
    end
  end
end
