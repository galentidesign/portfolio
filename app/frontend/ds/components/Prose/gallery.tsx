import { Prose } from './Prose'

export const galleryMeta = { slug: 'prose', title: 'Prose' }

export default function ProseGallery() {
  return (
    <div style={{ padding: 'var(--space-5)' }}>
      <Prose>
        <h1>A Crafted Story</h1>

        <p>
          Every great narrative starts with intention. This article explores the subtle art of{' '}
          <strong>narrative structure</strong> and how it shapes the reader's journey. You can find
          more details in the <a href="#example">comprehensive guide</a>.
        </p>

        <p>
          For code examples, check out the <code>prose-container</code> pattern. It ensures
          readability at 65 characters per line — a proven measure for comfortable long-form
          reading.
        </p>

        <h2>The Foundation</h2>

        <p>Building a solid foundation means understanding these key principles:</p>

        <ul>
          <li>Clarity through semantic HTML structure</li>
          <li>Consistency in token usage across components</li>
          <li>Accessibility as a first-class concern</li>
          <li>Motion that respects user preferences</li>
        </ul>

        <h2>Implementation Details</h2>

        <p>Here's a representative code block showing how to structure markup:</p>

        <pre>
          <code>
            {`<article className={styles.prose}>
  <h1>Title</h1>
  <p>Introduction with <strong>emphasis</strong>.</p>
  <ul>
    <li>Item one</li>
    <li>Item two</li>
  </ul>
</article>`}
          </code>
        </pre>

        <blockquote>
          The measure of a good design system isn't what it enables, but what it prevents. Good
          design prevents bad design.
        </blockquote>

        <h3>Key Takeaway</h3>

        <p>
          A typographic container like <code>Prose</code> isn't just styling—it's a contract with
          the reader. It promises a comfortable, accessible, predictable reading experience. When
          you respect that contract, the content shines.
        </p>

        <hr />

        <p>
          End of article. For further reading, explore the related components or return to the{' '}
          <a href="#gallery">component gallery</a>.
        </p>
      </Prose>
    </div>
  )
}
