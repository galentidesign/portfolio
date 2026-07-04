import { Head } from '@inertiajs/react'

interface HomeProps {
  greeting: string
}

export default function Home({ greeting }: HomeProps) {
  return (
    <>
      <Head title="J Galenti" />
      <main>
        <h1>{greeting}</h1>
        <p>jgalenti.com — under construction, in public.</p>
      </main>
    </>
  )
}
