import type { Metadata } from 'next'
import { WordVariantsRadialDemo } from '@/components/demos/WordVariantsRadialDemo'
import { Reveal } from '@/components/motion/Reveal'

export const metadata: Metadata = {
  title: 'Variantes de palabra',
}

export default function VariantesPage() {
  return (
    <article className="docs-article docs-prose" data-doc-article>
      <header className="docs-article-header">
        <p className="docs-eyebrow">Funciones</p>
        <h1 id="variantes">Variantes de palabra</h1>
        <p className="docs-hero-lead">
          A veces quieres decir <strong>la misma idea</strong> de formas distintas: “yo” o “tú”, “ayer” o “mañana”,
          “quiero” o “necesito”. Las <strong>variantes</strong> permiten elegir esa forma sin llenar el tablero de
          botones casi iguales.
        </p>
      </header>

      <Reveal>
        <h2 id="como-funciona">Cómo se usa en pantalla</h2>
        <p>
          En algunos pictos, al pulsar se abre un <strong>círculo de opciones</strong> alrededor del símbolo. Cada opción
          es una variante: misma familia de significado, distinta forma de decirlo. Eliges la que toca en ese momento y se
          coloca en la barra de frase.
        </p>
        <p>
          Así el tablero se mantiene <strong>ordenado y liviano</strong>, pero sigues teniendo matices cuando los
          necesitas.
        </p>
        <WordVariantsRadialDemo />
      </Reveal>

      <Reveal>
        <h2 id="ejemplos">Ejemplos que ayudan a imaginarlo</h2>
        <ul>
          <li>Un verbo que puede conjugarse de varias maneras según quién habla.</li>
          <li>
            Palabras de familia o personas con formas distintas (por ejemplo, <strong>abuela</strong>,{' '}
            <strong>abuelos</strong> o <strong>abuelas</strong> a partir de <strong>abuelo</strong>).
          </li>
          <li>Una palabra de tiempo (pasado / presente / futuro) sin tener tres celdas fijas ocupando sitio.</li>
          <li>Una misma acción expresada con distinto tono (afirmación, pregunta, petición cortés).</li>
        </ul>
      </Reveal>

      <Reveal>
        <h2 id="quien-configura">Quién prepara las variantes</h2>
        <p>
          Las variantes las define quien <strong>adapta el tablero</strong> en el panel de administración, junto con el
          resto de pictos. Si echas en falta una opción, coméntalo con esa persona: a veces basta con ajustar una sola
          celda.
        </p>
      </Reveal>
    </article>
  )
}
