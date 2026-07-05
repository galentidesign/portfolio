# frozen_string_literal: true

require "yaml"
require "set"

# ManifestVerifier cross-references meta.ts exports against data/manifest/*.yml
# and each component's CSS/TSX source. It is a pure Ruby object with no
# ActiveRecord or Rails dependencies.
#
# Usage:
#   metas = JSON.parse(...)  # output of npm run meta:export
#   v = ManifestVerifier.new(
#     manifest_dir:   Pathname.new("data/manifest"),
#     components_dir: Pathname.new("app/frontend/ds/components"),
#     metas:          metas
#   )
#   v.errors  # => [] on clean, or array of precise human-readable strings
class ManifestVerifier
  # Semantic-token prefixes that are drift-checked.
  SEMANTIC_PREFIXES = %w[--color- --radius- --type- --density- --motion- --shadow- --space- --z-].freeze

  # Regex to pull var(--<name>) references from source files.
  TOKEN_RE = /var\(\s*(--[a-z][a-z0-9-]*)/

  def initialize(manifest_dir:, components_dir:, metas:)
    @manifest_dir   = Pathname.new(manifest_dir)
    @components_dir = Pathname.new(components_dir)
    @metas          = metas  # Array of hashes from the JSON export
  end

  # Returns an array of precise human-readable error strings.
  # Empty array means no drift.
  def errors
    @errors ||= compute_errors
  end

  private

  def compute_errors
    errs = []
    errs.concat(pairing_errors)
    errs.concat(structural_errors)
    errs.concat(token_errors)
    errs.concat(repo_link_errors)
    errs
  end

  # ── Leg 1: Pairing ──────────────────────────────────────────────────────────

  def pairing_errors
    errs = []

    meta_slugs = Set.new(@metas.map { |m| m["slug"] })

    manifest_slugs = Set.new(
      @manifest_dir.glob("*.yml")
                   .map { |f| f.basename(".yml").to_s }
                   .reject { |s| s == "README" }
    )

    (meta_slugs - manifest_slugs).sort.each do |slug|
      errs << "missing manifest: #{slug}.yml (meta.ts exists, no manifest file)"
    end

    (manifest_slugs - meta_slugs).sort.each do |slug|
      errs << "orphan manifest: #{slug}.yml (no matching meta.ts)"
    end

    errs
  end

  # ── Leg 2: Structural agreement ─────────────────────────────────────────────

  def structural_errors
    errs = []

    by_slug = @metas.each_with_object({}) { |m, h| h[m["slug"]] = m }

    @manifest_dir.glob("*.yml").sort.each do |yml_path|
      slug = yml_path.basename(".yml").to_s
      next if slug == "README"

      meta = by_slug[slug]
      next unless meta  # pairing already reported this

      doc = YAML.safe_load(yml_path.read, permitted_classes: [])

      # name
      if doc["name"] != meta["name"]
        errs << "#{slug}: name mismatch — manifest=#{doc["name"].inspect} meta=#{meta["name"].inspect}"
      end

      # tier
      if doc["tier"] != meta["tier"]
        errs << "#{slug}: tier mismatch — manifest=#{doc["tier"].inspect} meta=#{meta["tier"].inspect}"
      end

      # variants
      errs.concat(variant_errors(slug, doc["variants"] || {}, meta["variants"] || {}))

      # props
      errs.concat(prop_errors(slug, doc["props"] || [], meta["props"] || []))
    end

    errs
  end

  def variant_errors(slug, yaml_variants, meta_variants)
    errs = []

    yaml_axes = Set.new(yaml_variants.keys)
    meta_axes = Set.new(meta_variants.keys)

    (yaml_axes - meta_axes).sort.each do |axis|
      errs << "#{slug}: variants axis #{axis.inspect} in manifest but not in meta"
    end

    (meta_axes - yaml_axes).sort.each do |axis|
      errs << "#{slug}: variants axis #{axis.inspect} in meta but not in manifest"
    end

    (yaml_axes & meta_axes).sort.each do |axis|
      y_vals = yaml_variants[axis]
      m_vals = meta_variants[axis]
      if y_vals != m_vals
        errs << "#{slug}: variants[#{axis.inspect}] — manifest=#{y_vals.inspect} meta=#{m_vals.inspect}"
      end
    end

    errs
  end

  def prop_errors(slug, yaml_props, meta_props)
    errs = []

    yaml_by_name = yaml_props.each_with_object({}) { |p, h| h[p["name"]] = p }
    meta_by_name = meta_props.each_with_object({}) { |p, h| h[p["name"]] = p }

    yaml_names = Set.new(yaml_by_name.keys)
    meta_names = Set.new(meta_by_name.keys)

    (yaml_names - meta_names).sort.each do |name|
      errs << "#{slug}: prop #{name.inspect} in manifest but not in meta"
    end

    (meta_names - yaml_names).sort.each do |name|
      errs << "#{slug}: prop #{name.inspect} in meta but not in manifest"
    end

    (yaml_names & meta_names).sort.each do |name|
      yp = yaml_by_name[name]
      mp = meta_by_name[name]

      # type must match exactly
      if yp["type"] != mp["type"]
        errs << "#{slug}: prop #{name.inspect} type — manifest=#{yp["type"].inspect} meta=#{mp["type"].inspect}"
      end

      # default: compare as strings; both absent = equal; one absent ≠ present
      y_default = yp["default"]
      m_default = mp["default"]

      y_absent = y_default.nil?
      m_absent = m_default.nil?

      if y_absent != m_absent
        errs << "#{slug}: prop #{name.inspect} default — manifest=#{y_absent ? "(absent)" : y_default.inspect} meta=#{m_absent ? "(absent)" : m_default.inspect}"
      elsif !y_absent && y_default.to_s != m_default.to_s
        errs << "#{slug}: prop #{name.inspect} default — manifest=#{y_default.inspect} meta=#{m_default.inspect}"
      end
    end

    errs
  end

  # ── Leg 3: Token drift ──────────────────────────────────────────────────────

  def token_errors
    errs = []

    by_dir = @metas.each_with_object({}) { |m, h| h[m["dir"]] = m }

    by_dir.each do |dir, meta|
      slug = meta["slug"]

      component_dir = @components_dir.join(dir)
      extracted = extract_tokens(component_dir, dir)

      yaml_path = @manifest_dir.join("#{slug}.yml")
      next unless yaml_path.exist?  # pairing already reported

      doc = YAML.safe_load(yaml_path.read, permitted_classes: [])
      yaml_tokens = (doc["tokens"] || []).sort

      missing = (extracted - yaml_tokens).sort
      extra   = (yaml_tokens - extracted).sort

      missing.each do |tok|
        errs << "#{slug}: token #{tok} referenced in source but missing from manifest"
      end

      extra.each do |tok|
        errs << "#{slug}: token #{tok} in manifest but not found in source"
      end
    end

    errs
  end

  def extract_tokens(component_dir, dir_name)
    sources = [
      component_dir.join("styles.module.css"),
      component_dir.join("#{dir_name}.tsx")
    ]

    tokens = Set.new

    sources.each do |path|
      next unless path.exist?
      path.read.scan(TOKEN_RE) do |match|
        tok = match[0]
        tokens << tok if semantic_token?(tok)
      end
    end

    tokens.to_a.sort
  end

  def semantic_token?(tok)
    SEMANTIC_PREFIXES.any? { |prefix| tok.start_with?(prefix) }
  end

  # ── Leg 4: Repo link ────────────────────────────────────────────────────────

  def repo_link_errors
    errs = []

    by_dir = @metas.each_with_object({}) { |m, h| h[m["dir"]] = m }

    by_dir.each do |dir, meta|
      slug = meta["slug"]

      yaml_path = @manifest_dir.join("#{slug}.yml")
      next unless yaml_path.exist?

      doc = YAML.safe_load(yaml_path.read, permitted_classes: [])
      expected_link = "app/frontend/ds/components/#{dir}"
      actual_link   = doc.dig("links", "repo")

      if actual_link != expected_link
        errs << "#{slug}: links.repo — manifest=#{actual_link.inspect} expected=#{expected_link.inspect}"
      end
    end

    errs
  end
end
