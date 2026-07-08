# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectGallery, type: :model do
  def fixture_dir(*parts)
    Rails.root.join("spec/fixtures/projects", *parts)
  end

  before { ProjectGallery.reload! }
  after  { ProjectGallery.reload! }

  # ---------------------------------------------------------------------------
  # Valid fixture suite
  # ---------------------------------------------------------------------------
  # valid/ contains: featured-a, featured-z (featured), standard-a, standard-z.
  # Expected all order: Alpha Featured, Zeta Featured, Alpha Standard, Zeta Standard

  context "with valid fixtures" do
    before do
      allow(ProjectGallery).to receive(:projects_dir).and_return(fixture_dir("valid"))
    end

    describe ".all" do
      it "returns an Array of string-keyed hashes" do
        expect(ProjectGallery.all).to be_an(Array)
        expect(ProjectGallery.all.first).to be_a(Hash)
        expect(ProjectGallery.all.first.keys).to all(be_a(String))
      end

      it "orders featured entries alphabetically before standard entries" do
        titles = ProjectGallery.all.map { |e| e["title"] }
        expect(titles).to eq([ "Alpha Featured", "Zeta Featured", "Alpha Standard", "Zeta Standard" ])
      end

      it "puts every featured entry before any standard entry" do
        flags = ProjectGallery.all.map { |e| e["featured"] }
        featured_idx = flags.each_index.select { |i| flags[i] }
        standard_idx = flags.each_index.reject { |i| flags[i] }
        expect(featured_idx.max).to be < standard_idx.min
      end
    end

    describe "asset resolution" do
      it "attaches src + available to the cover and derives alt from the title" do
        cover = ProjectGallery.find("featured-a")["cover"]
        expect(cover["src"]).to eq("/gallery/featured-a/cover.png")
        expect(cover["available"]).to be(false)
        expect(cover["alt"]).to eq("Alpha Featured — cover")
      end

      it "leaves cover nil for a text-only entry" do
        expect(ProjectGallery.find("standard-a")["cover"]).to be_nil
      end

      it "attaches src, available, alt, and caption to each shot" do
        shot = ProjectGallery.find("featured-a")["shots"].first
        expect(shot["src"]).to eq("/gallery/featured-a/shot-01.png")
        expect(shot["available"]).to be(false)
        expect(shot["alt"]).to eq("A shot")
        expect(shot["caption"]).to eq("A caption.")
      end

      it "handles an empty shots array" do
        expect(ProjectGallery.find("featured-z")["shots"]).to eq([])
      end
    end

    describe ".find!" do
      it "returns the entry for a known slug" do
        expect(ProjectGallery.find!("standard-z")["title"]).to eq("Zeta Standard")
      end

      it "raises NotFound for an unknown slug" do
        expect { ProjectGallery.find!("missing") }.to raise_error(ProjectGallery::NotFound, /missing/)
      end
    end

    describe ".slugs" do
      it "returns all slug strings in all order" do
        expect(ProjectGallery.slugs).to eq([ "featured-a", "featured-z", "standard-a", "standard-z" ])
      end
    end

    describe ".cards" do
      it "returns the light card shape without detail-only fields" do
        card = ProjectGallery.cards.first
        expect(card.keys).to match_array(
          %w[slug title role client year featured disciplines summary cover]
        )
        expect(card).not_to have_key("overview")
        expect(card).not_to have_key("shots")
      end
    end

    describe ".siblings" do
      it "wraps around at both ends" do
        first = ProjectGallery.siblings("featured-a")
        expect(first["prev"]["slug"]).to eq("standard-z")
        expect(first["next"]["slug"]).to eq("featured-z")
      end

      it "returns {slug, title} refs" do
        ref = ProjectGallery.siblings("featured-a")["next"]
        expect(ref.keys).to match_array(%w[slug title])
      end
    end

    describe ".validate!" do
      it "returns nil when all files are valid" do
        expect(ProjectGallery.validate!).to be_nil
      end
    end
  end

  # ---------------------------------------------------------------------------
  # Invalid fixture cases — one per validation family
  # ---------------------------------------------------------------------------

  def expect_invalid(dir, pattern)
    allow(ProjectGallery).to receive(:projects_dir).and_return(fixture_dir("invalid", dir))
    expect { ProjectGallery.validate! }.to raise_error(ProjectGallery::InvalidError, pattern)
  end

  it "rejects a missing required key and names it" do
    expect_invalid("missing-key", /missing required keys.*highlights/i)
  end

  it "rejects a non-boolean featured value" do
    expect_invalid("bad-featured", /featured must be a boolean/i)
  end

  it "rejects a slug/filename mismatch naming both" do
    expect_invalid("slug-mismatch", /right-slug.*wrong-slug|wrong-slug.*right-slug/i)
  end

  it "rejects a links value that is not nil or an http(s) URL" do
    expect_invalid("bad-links", /links\.live/)
  end

  it "rejects a shot missing its src" do
    expect_invalid("bad-shots", /shots\[0\]\.src/)
  end
end
