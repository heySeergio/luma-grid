import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Novedades',
}

export default function ChangelogPage() {
  return (
    <article className="docs-article docs-prose" data-doc-article>
      <header className="docs-article-header">
        <p className="docs-eyebrow">Novedades</p>
        <h1 id="changelog">Qué va cambiando</h1>
        <p className="docs-hero-lead">
          Aquí iremos contando, en pocas palabras, las mejoras que notéis en la ayuda y en la aplicación. Si buscas cómo
          usar algo concreto, revisa las <Link href="/guia">funciones</Link> o las <Link href="/preguntas">preguntas frecuentes</Link>.
        </p>
      </header>

      <h2 id="2026-05-14">Mayo 2026</h2>
      <ul>
        <li>Nueva guía centrada en personas usuarias: voz con IA, pictogramas ARASAAC, variantes de palabra y léxico con evaluación.</li>
        <li>Animaciones en la ayuda para mostrar, de un vistazo, cómo se arma una frase en el tablero.</li>
      </ul>
    </article>
  )
}
