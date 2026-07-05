# frozen_string_literal: true

require "rails_helper"
require "tmpdir"

RSpec.describe SkinRegistry, type: :model do
  let(:fixture_data) do
    {
      "default" => "galenti",
      "storage" => { "skin" => "portfolio:skin", "motion" => "portfolio:motion" },
      "skins" => [
        {
          "name" => "galenti", "label" => "Galenti", "era" => "own-brand",
          "colorScheme" => "light", "hidden" => false,
          "description" => "Test default skin", "preloadFonts" => [ "fonts/test.woff2" ]
        },
        {
          "name" => "debug", "label" => "Debug", "era" => "torture-test",
          "colorScheme" => "dark", "hidden" => true,
          "description" => "Test debug skin", "preloadFonts" => []
        }
      ]
    }
  end

  let(:tmp_dir) { Dir.mktmpdir("skin_registry_spec_") }
  let(:tmp_path) do
    path = Pathname.new(tmp_dir).join("skins.json")
    path.write(JSON.generate(fixture_data))
    path
  end

  before do
    SkinRegistry.reload!
    allow(SkinRegistry).to receive(:json_path).and_return(tmp_path)
  end

  after do
    SkinRegistry.reload!
    FileUtils.rm_rf(tmp_dir)
  end

  describe ".all" do
    it "returns an array of skin hashes with string keys" do
      expect(SkinRegistry.all).to be_an(Array)
      expect(SkinRegistry.all.first).to include("name" => "galenti")
    end
  end

  describe ".names" do
    it "returns all skin name strings" do
      expect(SkinRegistry.names).to eq([ "galenti", "debug" ])
    end
  end

  describe ".default_skin" do
    it "returns the skin marked as default" do
      expect(SkinRegistry.default_skin["name"]).to eq("galenti")
    end
  end

  describe ".find" do
    it "returns the matching skin hash for a known name" do
      result = SkinRegistry.find("debug")
      expect(result["label"]).to eq("Debug")
    end

    it "returns nil for an unknown name" do
      expect(SkinRegistry.find("bogus")).to be_nil
    end

    it "returns nil for a nil argument" do
      expect(SkinRegistry.find(nil)).to be_nil
    end
  end

  describe ".resolve" do
    it "returns the named skin for a valid param" do
      expect(SkinRegistry.resolve("debug")["name"]).to eq("debug")
    end

    it "falls back to default_skin for an invalid param" do
      expect(SkinRegistry.resolve("nonexistent")["name"]).to eq("galenti")
    end

    it "falls back to default_skin for a nil param" do
      expect(SkinRegistry.resolve(nil)["name"]).to eq("galenti")
    end
  end

  describe ".storage" do
    it "exposes the skin storage key" do
      expect(SkinRegistry.storage["skin"]).to eq("portfolio:skin")
    end

    it "exposes the motion storage key" do
      expect(SkinRegistry.storage["motion"]).to eq("portfolio:motion")
    end
  end

  describe ".reload!" do
    it "clears the memoized parse" do
      SkinRegistry.all # prime the cache in non-dev envs
      SkinRegistry.reload!
      # After reload!, a subsequent call re-reads from disk.
      expect(SkinRegistry.all.first["name"]).to eq("galenti")
    end
  end

  describe "missing file" do
    let(:missing_path) { Pathname.new(Dir.mktmpdir).join("no_such_file.json") }

    before do
      SkinRegistry.reload!
      allow(SkinRegistry).to receive(:json_path).and_return(missing_path)
    end

    it "raises MissingBuildError with a message mentioning tokens:build" do
      expect { SkinRegistry.all }.to raise_error(SkinRegistry::MissingBuildError, /tokens:build/)
    end
  end
end
