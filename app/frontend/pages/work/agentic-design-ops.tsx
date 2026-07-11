import { Head, Link } from '@inertiajs/react'
import { Prose } from '@/ds/components/Prose/Prose'
import { useFx } from '@/ds/motion/useFx'
import { OrchestrationDiagram } from '@/studies/agentic-design-ops/OrchestrationDiagram'
import { PatternGallery } from '@/studies/agentic-design-ops/PatternGallery'
import { RippleDiagram } from '@/studies/agentic-design-ops/RippleDiagram'
import styles from './agentic-design-ops.module.css'

/**
 * Study A — Agentic design-ops (spec §6.3).
 * Prose landed at M10 from the content workstream (sanitization decision
 * points resolved by J); diagrams render neutral data by design.
 */
export default function AgenticDesignOps() {
  // Scroll-enter rise on the below-fold sections only — the header (the LCP
  // element) never carries a reveal target, per the /work placement rule.
  const revealRef = useFx<HTMLDivElement>((fx, el) =>
    fx.mountReveal(el, { selector: '[data-reveal]' }),
  )

  return (
    <>
      <Head title="Agentic design-ops — J Galenti">
        <meta
          name="description"
          content="Case study: agentic design-ops — orchestrating design-system work with agent fleets; the decision, the build, and the ripple."
        />
      </Head>
      <main id="main" className={styles.page}>
        <div ref={revealRef} className={styles.container}>
          {/* ── Page header ── */}
          <div className={styles.header}>
            <h1 className={styles.heading}>Agentic design-ops</h1>
            <Prose>
              <p>
                I’ve been building design systems for over a decade, across multiple stacks. Rails
                with SCSS came first, then React once composition won me over, and a few sidequests
                into Angular and Laravel with Tailwind along the way. I’ve always been
                framework-agnostic and the design system is my deity. Now I’m focused on systems
                where the framework itself is a swappable layer. The north star I’ve actually been
                chasing this whole time hasn’t changed: reusable systems that lock design decisions
                directly to production code.
              </p>
              <p>
                This study is about the newest of those systems: an agentic design-ops harness I
                designed for a movie-streaming design org. An end-to-end pipeline orchestrator keeps
                every design feature in tight alignment with the org’s process workflow, managing
                the major milestones and gates, while delegating each phase’s task work to 5
                self-orchestrated AI agent teams across their own domain-focused workflows. The
                agent teams handle the repetitive production work in the design-to-development
                pipeline (PRD drafts, user stories, flow diagrams, wireframes, screen comps,
                prototypes, handoff requirements, quality assurance) and humans stay tightly in the
                loop, collaborating and owning every judgment call. I’m keeping this study at the
                architecture level on purpose. The patterns are what transfer, and the internal
                details of that system aren’t mine to publish.
              </p>
            </Prose>
          </div>

          {/* ── Decision ── */}
          <section aria-labelledby="decision-heading" className={styles.section} data-reveal>
            <h2 id="decision-heading" className={styles['section-heading']}>
              Decision
            </h2>
            <Prose>
              <p>
                The pipeline was the problem, though it took a while to see that because it looks
                like a people problem at first. Every deliverable between a product requirement and
                a shipped screen was hand-built, inconsistently shaped, and slow to revise, and each
                revision re-opened everything downstream of it. We kept treating handoff friction
                like a communication issue when really it was structural. The same decisions were
                getting rewritten by hand, over and over, across multiple third-party app services,
                into formats that couldn’t check each other.
              </p>
              <p>
                One decision shaped everything else: agents track and facilitate the production
                work, while humans make the calls. Agents draft; people review and approve at set
                checkpoints. Every meeting transcript, product decision, design insight, and
                engineering question lives in versioned history logs and context knowledge
                databases. The key details are recorded in structured specs, not in chat threads or
                anyone’s head, so everything downstream gets generated from the same source instead
                of paraphrasing it. One colleague moves on and gets replaced with a new one, but the
                domain knowledge always stays put, compounding automatically. And the design system
                holds it together: agents build with the same components the org actually ships, so
                a generated comp is made of real, buildable parts instead of pictures of colorful
                boxes.
              </p>
              <p>
                The diagram below shows the shape: one coordinator handing work to teams of
                specialized agents, a human review step everything passes through, and the chain of
                deliverables that falls out the other side.
              </p>
            </Prose>
            {/* The study's identity moment: the orchestration diagram sits in
                a kiln-dark island — same semantic tokens, night values. */}
            <div className={styles.island} data-zone="night">
              <OrchestrationDiagram />
            </div>
          </section>

          {/* ── Build ── */}
          <section aria-labelledby="build-heading" className={styles.section} data-reveal>
            <h2 id="build-heading" className={styles['section-heading']}>
              Build
            </h2>
            <Prose>
              <p>
                What shipped is a working harness, but the part worth writing about is the
                interaction patterns, the UX of working <em>with</em> agents, which barely existed
                as a discipline when we started. Three carried most of the weight:
              </p>
              <p>
                Review gets its own UI. Agent output never lands silently. It shows up in a queue
                built for review, diffed against what’s current, with the agent’s confidence and its
                open questions called out, so a reviewer looks hardest where the model was least
                sure.
              </p>
              <p>
                Prompts as specs. The inputs that drive the agent teams are versioned, structured
                documents with owners and review, treated the way the design system treats tokens:
                one source that many outputs come from, instead of one-off chat messages nobody can
                find later.
              </p>
              <p>
                Built-in escalation. Every automated path has a set point where it stops and hands
                off to a person, and the handoff brings its context along (what was tried, what’s
                uncertain, what’s blocked) instead of dumping raw output on someone.
              </p>
              <p>
                The gallery below shows these patterns with placeholder data, since the real content
                is private. The shapes are what I can show, and honestly they’re the valuable part
                anyway.
              </p>
            </Prose>
            <PatternGallery />
          </section>

          {/* ── Ripple ── */}
          <section aria-labelledby="ripple-heading" className={styles.section} data-reveal>
            <h2 id="ripple-heading" className={styles['section-heading']}>
              Ripple
            </h2>
            <Prose>
              <p>
                The payoff stacked up, and not quite in the order I expected. Cycle time dropped
                first: revisions stopped re-opening the whole chain of deliverables, because the
                downstream ones get regenerated instead of rewritten by hand. Consistency followed.
                Once comps are built from the real component library, the “this doesn’t exist in the
                system” kind of handoff bug mostly stops happening. The part that mattered most
                showed up last: focus. Designers got their time back for the calls that actually
                need a designer, instead of re-typing decisions into formats.
              </p>
              <p>
                Nobody had to push adoption. One team’s workflow became the org’s default because
                its deliverables were easier to receive than the hand-built kind, and the teams on
                the receiving end started asking for the same setup. The ripple diagram below traces
                that spread, from one pipeline out to the org’s default way of working.
              </p>
            </Prose>
            <RippleDiagram />
          </section>

          {/* ── Connect to targets ── */}
          <section aria-labelledby="close-heading" className={styles.section} data-reveal>
            <h2 id="close-heading" className={styles['section-heading']}>
              Connect to targets
            </h2>
            <Prose>
              <p>
                I think this is what design orgs are actually hiring for right now. “Can you use AI”
                is the easy part; the harder question is whether you can build the system where
                agent teams and people each do the work they’re best at, and wire it into a design
                system so what comes out is real and shippable.
              </p>
              <p>
                This site is its own evidence. It was built by AI agent teams I directed, working
                from a locked spec, session by session, and it publishes its receipts: the build log
                in <Link href="/story/agentic">Chapter 3 of the story</Link>, the craft numbers on
                the <Link href="/colophon">colophon</Link>. The playbook there is just the process
                this page came out of, written down.
              </p>
            </Prose>
            <nav aria-label="Related pages" className={styles['link-row']}>
              <Link href="/work" className={styles['nav-link']}>
                All work
              </Link>
              <Link href="/work/shadcn-to-polaris" className={styles['nav-link']}>
                shadcn → Polaris
              </Link>
              <Link href="/system" className={styles['nav-link']}>
                Design system
              </Link>
            </nav>
          </section>
        </div>
      </main>
    </>
  )
}
