# frozen_string_literal: true

require "rails_helper"

RSpec.describe Manifest, type: :model do
  # Helper: return a Pathname to a spec/fixtures/manifest subdir.
  def fixture_dir(*parts)
    Rails.root.join("spec/fixtures/manifest", *parts)
  end

  before { Manifest.reload! }
  after  { Manifest.reload! }

  # ---------------------------------------------------------------------------
  # Valid fixture suite
  # ---------------------------------------------------------------------------
  # valid/ contains: gallery-a, gallery-z (gallery tier, A and Z by name)
  #                  hero-a,    hero-z    (hero tier,    A and Z by name)
  # Expected all order: Alpha Hero, Zeta Hero, Alpha Gallery, Zeta Gallery

  context "with valid fixtures" do
    before do
      allow(Manifest).to receive(:manifest_dir).and_return(fixture_dir("valid"))
    end

    describe ".all" do
      it "returns an Array of string-keyed hashes" do
        expect(Manifest.all).to be_an(Array)
        expect(Manifest.all.first).to be_a(Hash)
        expect(Manifest.all.first.keys).to all(be_a(String))
      end

      it "orders hero entries alphabetically before gallery entries" do
        names = Manifest.all.map { |e| e["name"] }
        expect(names).to eq([ "Alpha Hero", "Zeta Hero", "Alpha Gallery", "Zeta Gallery" ])
      end

      it "puts all hero tier entries before any gallery tier entry" do
        tiers = Manifest.all.map { |e| e["tier"] }
        hero_indices    = tiers.each_index.select { |i| tiers[i] == "hero" }
        gallery_indices = tiers.each_index.select { |i| tiers[i] == "gallery" }
        expect(hero_indices.max).to be < gallery_indices.min
      end
    end

    describe ".find" do
      it "returns the entry whose slug matches" do
        result = Manifest.find("hero-a")
        expect(result["slug"]).to eq("hero-a")
        expect(result["name"]).to eq("Alpha Hero")
      end

      it "returns nil for an unknown slug" do
        expect(Manifest.find("no-such-component")).to be_nil
      end
    end

    describe ".find!" do
      it "returns the entry for a known slug" do
        expect(Manifest.find!("gallery-z")["tier"]).to eq("gallery")
      end

      it "raises Manifest::NotFound for an unknown slug" do
        expect { Manifest.find!("missing") }.to raise_error(Manifest::NotFound, /missing/)
      end
    end

    describe ".slugs" do
      it "returns all slug strings in all order" do
        expect(Manifest.slugs).to eq([ "hero-a", "hero-z", "gallery-a", "gallery-z" ])
      end
    end

    describe ".nav" do
      it "returns hashes with exactly slug, name, and tier keys" do
        Manifest.nav.each do |item|
          expect(item.keys).to match_array(%w[slug name tier])
        end
      end

      it "is in all order" do
        expect(Manifest.nav.map { |n| n["slug"] }).to eq(Manifest.slugs)
      end
    end

    describe ".cards" do
      it "returns hashes with exactly slug, name, tier, status, and description keys" do
        Manifest.cards.each do |card|
          expect(card.keys).to match_array(%w[slug name tier status description])
        end
      end

      it "is in all order" do
        expect(Manifest.cards.map { |c| c["slug"] }).to eq(Manifest.slugs)
      end
    end

    describe ".reload!" do
      it "clears the memoized entries so the next call re-reads from disk" do
        Manifest.all # prime the cache in non-dev envs
        Manifest.reload!
        expect(Manifest.all.first["name"]).to eq("Alpha Hero")
      end
    end

    describe ".validate!" do
      it "returns nil when all files are valid" do
        expect(Manifest.validate!).to be_nil
      end
    end
  end

  # ---------------------------------------------------------------------------
  # Invalid fixture cases — one per validation family
  # ---------------------------------------------------------------------------

  shared_examples "raises InvalidError naming the file" do |dir, filename_fragment|
    it "raises Manifest::InvalidError with a message naming #{filename_fragment}" do
      allow(Manifest).to receive(:manifest_dir).and_return(fixture_dir("invalid", dir))
      expect { Manifest.validate! }.to raise_error(Manifest::InvalidError, /#{Regexp.escape(filename_fragment)}/)
    end
  end

  describe "missing required key" do
    include_examples "raises InvalidError naming the file", "missing-key", "widget.yml"

    it "names the missing key in the error" do
      allow(Manifest).to receive(:manifest_dir).and_return(fixture_dir("invalid", "missing-key"))
      expect { Manifest.validate! }.to raise_error(Manifest::InvalidError, /missing required keys.*tokens/i)
    end
  end

  describe "invalid tier value" do
    include_examples "raises InvalidError naming the file", "bad-tier", "widget.yml"

    it "reports the bad tier value" do
      allow(Manifest).to receive(:manifest_dir).and_return(fixture_dir("invalid", "bad-tier"))
      expect { Manifest.validate! }.to raise_error(Manifest::InvalidError, /legendary/)
    end
  end

  describe "slug/filename mismatch" do
    include_examples "raises InvalidError naming the file", "slug-mismatch", "wrong-slug.yml"

    it "names both the slug and the filename base" do
      allow(Manifest).to receive(:manifest_dir).and_return(fixture_dir("invalid", "slug-mismatch"))
      expect { Manifest.validate! }.to raise_error(Manifest::InvalidError, /right-slug.*wrong-slug|wrong-slug.*right-slug/i)
    end
  end

  describe "non-semantic token prefix" do
    include_examples "raises InvalidError naming the file", "bad-token", "widget.yml"

    it "names the offending token" do
      allow(Manifest).to receive(:manifest_dir).and_return(fixture_dir("invalid", "bad-token"))
      expect { Manifest.validate! }.to raise_error(Manifest::InvalidError, /--custom-primary/)
    end
  end

  describe "duplicate prop name" do
    include_examples "raises InvalidError naming the file", "dup-prop", "widget.yml"

    it "reports the duplicated prop name" do
      allow(Manifest).to receive(:manifest_dir).and_return(fixture_dir("invalid", "dup-prop"))
      expect { Manifest.validate! }.to raise_error(Manifest::InvalidError, /duplicate prop name.*variant/i)
    end
  end

  describe "bad links.repo path" do
    include_examples "raises InvalidError naming the file", "bad-links-repo", "widget.yml"

    it "describes the required prefix" do
      allow(Manifest).to receive(:manifest_dir).and_return(fixture_dir("invalid", "bad-links-repo"))
      expect { Manifest.validate! }.to raise_error(Manifest::InvalidError, /links\.repo/)
    end
  end

  describe "malformed a11y keyboard entry" do
    include_examples "raises InvalidError naming the file", "bad-a11y", "widget.yml"

    it "names the a11y.keyboard problem" do
      allow(Manifest).to receive(:manifest_dir).and_return(fixture_dir("invalid", "bad-a11y"))
      expect { Manifest.validate! }.to raise_error(Manifest::InvalidError, /a11y\.keyboard/)
    end
  end
end
