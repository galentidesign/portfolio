# frozen_string_literal: true

# Server-side `og:*` / `twitter:*` emission (§8). Unfurl crawlers (LinkedIn,
# Slack, X) do not execute JavaScript, so social tags must be present in the
# HTML Rails serves — the client-side Inertia <Head> covers humans, this
# covers robots. Keyed by the Inertia page component captured in
# InertiaController.
module OgHelper
  # Per-key metadata: copy for og:* / twitter:* tags and for the card visual.
  # Description copy is sourced from each page's <Head> meta description.
  CARD_MAP = {
    "home" => {
      title: "J Galenti",
      description: "J Galenti — design technologist. A portfolio built as evidence: " \
                   "a token-driven design system, re-theming story chapters, and agent-built receipts.",
      image_alt: "J Galenti portfolio — design technologist",
      subtitle: "Token systems. Production code. Agentic playbook.",
      skin: "galenti"
    },
    "work" => {
      title: "Work — J Galenti",
      description: "The skim hub: thesis, two case studies, the design system, " \
                   "and the résumé — every claim linked to proof.",
      image_alt: "J Galenti — work overview",
      subtitle: "Thesis, two studies, the system, the résumé.",
      skin: "galenti"
    },
    "study-a" => {
      title: "Agentic design-ops",
      description: "Case study: agentic design-ops — orchestrating design-system work " \
                   "with agent fleets; the decision, the build, and the ripple.",
      image_alt: "Agentic design-ops case study",
      subtitle: "Orchestrating design-system work with agent fleets.",
      skin: "galenti"
    },
    "study-b" => {
      title: "shadcn → Polaris",
      description: "Case study: migrating a shadcn/Tailwind flow to Shopify Polaris — " \
                   "token translation, component API mapping, the a11y layer, and a live demo.",
      image_alt: "shadcn to Polaris migration case study",
      subtitle: "Design-system migration without a rewrite.",
      skin: "galenti"
    },
    "system" => {
      title: "Design system — J Galenti",
      description: "The design system: 16 components documented from a single manifest — " \
                   "tokens, motion, skins, and live playgrounds.",
      image_alt: "Portfolio design system",
      subtitle: "Token-compiled. A11y-first. Agent-built in public.",
      skin: "galenti"
    },
    "story-rails-era" => {
      title: "The Rails era",
      description: "Chapter 1: the Rails era — 2014–2019, the dense product years.",
      image_alt: "The Rails era chapter cover",
      subtitle: "2014–2019 · the dense product years.",
      skin: "rails-era"
    },
    "story-react-era" => {
      title: "The React era",
      description: "Chapter 2: the React era — 2019–2023, components, tokens, " \
                   "and the system behind the system.",
      image_alt: "The React era chapter cover",
      subtitle: "2019–2023 · components, tokens, and the system.",
      skin: "galenti"
    },
    "story-agentic" => {
      title: "The agentic era",
      description: "Chapter 3: the agentic era — 2023–now, building with an agent fleet.",
      image_alt: "The agentic era chapter cover",
      subtitle: "2023–now · building with an agent fleet.",
      skin: "galenti"
    },
    "resume" => {
      title: "Résumé — J Galenti",
      description: "Résumé — J Galenti, design technologist: web summary and designed PDF download.",
      image_alt: "J Galenti résumé",
      subtitle: "J Galenti, design technologist.",
      skin: "galenti"
    },
    "colophon" => {
      title: "Colophon — J Galenti",
      description: "Colophon — the stack, craft-bar numbers, and the privacy note for jgalenti.com.",
      image_alt: "Colophon — jgalenti.com",
      subtitle: "Stack, craft-bar numbers, privacy note.",
      skin: "galenti"
    }
  }.freeze

  # Inertia page component → OG card key.
  # Components absent from this map (errors/not-found, og/card, ops/index)
  # get no tags — return early.
  COMPONENT_KEY_MAP = {
    "home/index"                   => "home",
    "work/index"                   => "work",
    "work/agentic-design-ops"      => "study-a",
    "work/shadcn-to-polaris"       => "study-b",
    "work/shadcn-to-polaris-demo"  => "study-b",
    "system/index"                 => "system",
    "system/tokens"                => "system",
    "system/motion"                => "system",
    "system/skins"                 => "system",
    "system/components/show"       => "system",
    "story/rails-era"              => "story-rails-era",
    "story/react-era"              => "story-react-era",
    "story/agentic"                => "story-agentic",
    "resume/index"                 => "resume",
    "colophon/index"               => "colophon"
  }.freeze

  # Emit og:* and twitter:* meta tags for the given Inertia page component.
  # Returns an empty HTML-safe string when the component has no OG entry.
  def og_meta_tags(component)
    key = COMPONENT_KEY_MAP[component]
    return "".html_safe unless key

    meta  = CARD_MAP[key]
    return "".html_safe unless meta

    title    = meta[:title]
    desc     = meta[:description]
    alt      = meta[:image_alt]
    image    = "#{request.base_url}/og/#{key}.png#{og_image_version(key)}"
    page_url = request.base_url + request.path

    safe_join([
      tag.meta(property: "og:title",        content: title),
      tag.meta(property: "og:description",  content: desc),
      tag.meta(property: "og:type",         content: "website"),
      tag.meta(property: "og:url",          content: page_url),
      tag.meta(property: "og:image",        content: image),
      tag.meta(property: "og:image:width",  content: "1200"),
      tag.meta(property: "og:image:height", content: "630"),
      tag.meta(property: "og:image:alt",    content: alt),
      tag.meta(name: "twitter:card",        content: "summary_large_image"),
      tag.meta(name: "twitter:title",       content: title),
      tag.meta(name: "twitter:description", content: desc),
      tag.meta(name: "twitter:image",       content: image)
    ], "\n")
  end

  private

  # Content-hash version param for og:image URLs. Unfurl proxies (LinkedIn's
  # media CDN especially) cache their DERIVED image variants by source URL —
  # a regenerated PNG, or a badly-derived variant (observed: blurry home-card
  # thumbnail at launch), stays stale until the URL changes. Hashing the file
  # makes every regeneration a new URL automatically. Per-request memo only:
  # ten ~20 kB hashes are microseconds, and the process never serves a stale
  # hash after `rake og:generate` without a restart.
  def og_image_version(key)
    @og_image_versions ||= {}
    @og_image_versions[key] ||= begin
      path = Rails.public_path.join("og", "#{key}.png")
      File.exist?(path) ? "?v=#{Digest::SHA256.file(path).hexdigest.first(8)}" : ""
    end
  end
end
