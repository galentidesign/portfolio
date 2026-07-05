# frozen_string_literal: true

# Reads app/frontend/ds/tokens/generated/skins.json (built by `npm run tokens:build`)
# and exposes the skin registry to Rails server-side rendering.
class SkinRegistry
  class MissingBuildError < StandardError; end

  class << self
    # Returns all skin hashes (string keys), default skin first.
    def all
      parsed["skins"]
    end

    # Returns an array of valid skin name strings.
    def names
      all.map { |s| s["name"] }
    end

    # Returns the skin hash marked as default.
    def default_skin
      all.find { |s| s["name"] == parsed["default"] }
    end

    # Returns the skin hash for +name+, or nil if not found.
    def find(name)
      all.find { |s| s["name"] == name }
    end

    # Returns find(param) if valid, else default_skin.
    def resolve(param)
      find(param) || default_skin
    end

    # Returns the storage-key hash, e.g. { "skin" => "portfolio:skin", ... }.
    def storage
      parsed["storage"]
    end

    # Drops the memoized parse so the next call reloads from disk.
    def reload!
      @parsed = nil
    end

    private

    def parsed
      # In development, re-read on every call so token edits show up without restart.
      return load_json if Rails.env.development?

      @parsed ||= load_json
    end

    # Isolated so tests can stub it.
    def json_path
      Rails.root.join("app/frontend/ds/tokens/generated/skins.json")
    end

    def load_json
      path = json_path
      unless path.exist?
        raise MissingBuildError,
          "app/frontend/ds/tokens/generated/skins.json not found — run `npm run tokens:build` to generate it."
      end

      JSON.parse(path.read)
    end
  end
end
