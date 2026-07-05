# frozen_string_literal: true

require "rails_helper"
require "tmpdir"

RSpec.describe ManifestVerifier, type: :model do
  # Real fixture component trees live under spec/fixtures/verifier/components/.
  # Alpha: styles.module.css references --color-ink, --color-surface-sunken,
  #        --radius-control, --space-2; Alpha.tsx adds --color-accent.
  #        Expected sorted token set (5 tokens):
  #          --color-accent, --color-ink, --color-surface-sunken,
  #          --radius-control, --space-2
  # Beta:  styles.module.css references --color-ink, --type-body-size.
  #        Beta.tsx adds none.
  #        Expected sorted token set (2 tokens):
  #          --color-ink, --type-body-size

  COMPONENTS_DIR = Rails.root.join("spec/fixtures/verifier/components")

  # Minimal inline metas that match the real fixture source files.
  let(:alpha_meta) do
    {
      "dir" => "Alpha",
      "slug" => "alpha",
      "name" => "Alpha",
      "tier" => "gallery",
      "description" => "Fixture alpha component.",
      "variants" => { "variant" => [ "default", "alt" ] },
      "props" => [
        { "name" => "variant", "type" => "'default' | 'alt'", "default" => "'default'", "description" => "Variant axis." },
        { "name" => "size", "type" => "'sm' | 'md'", "description" => "Size (required, no default)." }
      ]
    }
  end

  let(:beta_meta) do
    {
      "dir" => "Beta",
      "slug" => "beta",
      "name" => "Beta",
      "tier" => "hero",
      "description" => "Fixture beta component.",
      "variants" => {},
      "props" => [
        { "name" => "label", "type" => "string", "description" => "Button label text." }
      ]
    }
  end

  # Canonical YAML for Alpha that agrees with alpha_meta and real CSS/TSX tokens.
  def alpha_yml
    <<~YAML
      slug: alpha
      name: Alpha
      tier: gallery
      status: stable
      description: Fixture alpha component.
      variants:
        variant: [default, alt]
      props:
        - name: variant
          type: "'default' | 'alt'"
          default: "'default'"
          description: Variant axis.
        - name: size
          type: "'sm' | 'md'"
          description: Size (required, no default).
      tokens:
        - --color-accent
        - --color-ink
        - --color-surface-sunken
        - --radius-control
        - --space-2
      links:
        repo: app/frontend/ds/components/Alpha
        figma: null
    YAML
  end

  # Canonical YAML for Beta that agrees with beta_meta and real CSS/TSX tokens.
  def beta_yml
    <<~YAML
      slug: beta
      name: Beta
      tier: hero
      status: stable
      description: Fixture beta component.
      variants: {}
      props:
        - name: label
          type: "string"
          description: Button label text.
      tokens:
        - --color-ink
        - --type-body-size
      links:
        repo: app/frontend/ds/components/Beta
        figma: null
    YAML
  end

  # Helper: build a temp manifest dir, write named files, return the path.
  def tmp_manifest(files = {})
    dir = Dir.mktmpdir("mv_spec_")
    files.each { |name, content| File.write(File.join(dir, name), content) }
    Pathname.new(dir)
  end

  def verifier(manifest_dir:, metas:)
    ManifestVerifier.new(
      manifest_dir: manifest_dir,
      components_dir: COMPONENTS_DIR,
      metas: metas
    )
  end

  # ── 1. Clean pass ────────────────────────────────────────────────────────────

  describe "clean pass" do
    it "returns no errors when manifest and meta are perfectly aligned" do
      manifest_dir = tmp_manifest("alpha.yml" => alpha_yml, "beta.yml" => beta_yml)
      metas = [ alpha_meta, beta_meta ]
      expect(verifier(manifest_dir: manifest_dir, metas: metas).errors).to be_empty
    end
  end

  # ── 2. Missing YAML ──────────────────────────────────────────────────────────

  describe "missing yaml" do
    it "reports an error when a meta slug has no manifest file" do
      # Only beta.yml present; alpha is missing.
      manifest_dir = tmp_manifest("beta.yml" => beta_yml)
      metas = [ alpha_meta, beta_meta ]
      errors = verifier(manifest_dir: manifest_dir, metas: metas).errors
      expect(errors.size).to eq(1)
      expect(errors.first).to include("missing manifest")
      expect(errors.first).to include("alpha.yml")
    end
  end

  # ── 3. Orphan YAML ───────────────────────────────────────────────────────────

  describe "orphan yaml" do
    it "reports an error when a manifest file has no matching meta slug" do
      # alpha.yml present but meta array only knows about beta.
      manifest_dir = tmp_manifest("alpha.yml" => alpha_yml, "beta.yml" => beta_yml)
      metas = [ beta_meta ]
      errors = verifier(manifest_dir: manifest_dir, metas: metas).errors
      expect(errors.size).to eq(1)
      expect(errors.first).to include("orphan manifest")
      expect(errors.first).to include("alpha.yml")
    end
  end

  # ── 4. Variant value drift ───────────────────────────────────────────────────

  describe "variant value drift" do
    it "reports an error when a variant axis has different values" do
      bad_yml = alpha_yml.gsub("variant: [default, alt]", "variant: [default, other]")
      manifest_dir = tmp_manifest("alpha.yml" => bad_yml, "beta.yml" => beta_yml)
      metas = [ alpha_meta, beta_meta ]
      errors = verifier(manifest_dir: manifest_dir, metas: metas).errors
      expect(errors.size).to eq(1)
      expect(errors.first).to include("alpha")
      expect(errors.first).to include("variant")
      expect(errors.first).to include("other")
      expect(errors.first).to include("alt")
    end
  end

  # ── 5. Prop type drift ───────────────────────────────────────────────────────

  describe "prop type drift" do
    it "reports an error when a shared prop has a different type string" do
      bad_yml = alpha_yml.gsub("type: \"'sm' | 'md'\"", "type: \"'xs' | 'md'\"")
      manifest_dir = tmp_manifest("alpha.yml" => bad_yml, "beta.yml" => beta_yml)
      metas = [ alpha_meta, beta_meta ]
      errors = verifier(manifest_dir: manifest_dir, metas: metas).errors
      expect(errors.size).to eq(1)
      expect(errors.first).to include("alpha")
      expect(errors.first).to include("size")
      expect(errors.first).to include("type")
    end
  end

  # ── 6. Default present-vs-absent drift ──────────────────────────────────────

  describe "default present-vs-absent drift" do
    it "reports an error when manifest has a default but meta does not" do
      # size in alpha_meta has no default; write the YAML with one added.
      # Use explicit YAML so indentation is unambiguous.
      bad_yml = <<~YAML
        slug: alpha
        name: Alpha
        tier: gallery
        status: stable
        description: Fixture alpha component.
        variants:
          variant: [default, alt]
        props:
          - name: variant
            type: "'default' | 'alt'"
            default: "'default'"
            description: Variant axis.
          - name: size
            type: "'sm' | 'md'"
            default: "'sm'"
            description: Size (required, no default).
        tokens:
          - --color-accent
          - --color-ink
          - --color-surface-sunken
          - --radius-control
          - --space-2
        links:
          repo: app/frontend/ds/components/Alpha
          figma: null
      YAML
      manifest_dir = tmp_manifest("alpha.yml" => bad_yml, "beta.yml" => beta_yml)
      metas = [ alpha_meta, beta_meta ]
      errors = verifier(manifest_dir: manifest_dir, metas: metas).errors
      expect(errors.size).to eq(1)
      expect(errors.first).to include("alpha")
      expect(errors.first).to include("size")
      expect(errors.first).to include("default")
    end
  end

  # ── 7. Token missing + extra ─────────────────────────────────────────────────

  describe "token drift" do
    it "reports missing and extra tokens per component" do
      # Remove --color-accent (should be in source) and add --color-bogus (not in source).
      bad_yml = alpha_yml
        .gsub("  - --color-accent\n", "")
        .sub("  - --space-2\n", "  - --space-2\n  - --color-bogus\n")
      manifest_dir = tmp_manifest("alpha.yml" => bad_yml, "beta.yml" => beta_yml)
      metas = [ alpha_meta, beta_meta ]
      errors = verifier(manifest_dir: manifest_dir, metas: metas).errors

      missing_err = errors.find { |e| e.include?("--color-accent") && e.include?("missing from manifest") }
      extra_err   = errors.find { |e| e.include?("--color-bogus") && e.include?("not found in source") }

      expect(missing_err).not_to be_nil
      expect(extra_err).not_to be_nil
    end
  end

  # ── 8. Repo link mismatch ────────────────────────────────────────────────────

  describe "repo link mismatch" do
    it "reports an error when links.repo does not match the component directory" do
      bad_yml = alpha_yml.gsub(
        "repo: app/frontend/ds/components/Alpha",
        "repo: app/frontend/ds/components/Wrong"
      )
      manifest_dir = tmp_manifest("alpha.yml" => bad_yml, "beta.yml" => beta_yml)
      metas = [ alpha_meta, beta_meta ]
      errors = verifier(manifest_dir: manifest_dir, metas: metas).errors
      expect(errors.size).to eq(1)
      expect(errors.first).to include("alpha")
      expect(errors.first).to include("links.repo")
      expect(errors.first).to include("Wrong")
      expect(errors.first).to include("Alpha")
    end
  end
end
