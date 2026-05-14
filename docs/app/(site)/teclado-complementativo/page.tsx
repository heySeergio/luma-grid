import type { Metadata } from 'next'
import Link from 'next/link'
import { KeyboardPeekDemo } from '@/components/demos/KeyboardPeekDemo'
import { Reveal } from '@/components/motion/Reveal'

export const metadata: Metadata = {
  title: 'Teclado complementativo',
}

export default function TecladoComplementativoPage() {
  return (
    <article className="docs-article docs-prose" data-doc-article>
      <header className="docs-article-header">
        <p className="docs-eyebrow">Funciones</p>
        <h1 id="teclado-complementativo">Teclado complementativo</h1>
        <p className="docs-hero-lead">
          En muchas apps de comunicación aumentativa y alternativa (CAA) sueles elegir entre <strong>un tablero de pictos</strong>{' '}
          o <strong>un teclado con letras</strong>: dos modos distintos, casi como si fueran dos caminos separados. En Luma
          Grid el teclado no sustituye al tablero: <strong>se complementa con él</strong>, para que puedas mezclar símbolos
          y texto en la misma frase, con la misma barra y el mismo ritmo de conversación.
        </p>
      </header>

      <Reveal>
        <h2 id="como-suele-ser">Cómo suele ser en otros comunicadores</h2>
        <p>
          A veces el diseño te obliga a <strong>cambiar de “modo”</strong>: o navegas pictos en rejilla, o pasas a una
          pantalla de escritura. Eso puede funcionar, pero también puede frenar cuando quieres añadir solo un apellido, un
          número o una palabra que no está en el tablero, o cuando ya dominas el teclado y no quieres renunciar a los
          pictos para el resto de la frase.
        </p>
      </Reveal>

      <Reveal>
        <h2 id="en-luma-grid">Qué hace Luma Grid distinto</h2>
        <p>
          Aquí el teclado es <strong>una ayuda más dentro del mismo flujo</strong>: sigues viendo el tablero, eliges
          pictos cuando conviene y, cuando toca escribir con letras, abres el teclado y lo que tecleas se suma a la barra
          de frase como el resto. No hace falta “salir” del picto para volver a entrar: todo forma parte de un solo
          mensaje.
        </p>
        <p>
          Así se atiende a <strong>distintos niveles y momentos del día</strong>: pictos visibles para ir rápido, teclado
          para precisión o vocabulario propio; o al revés, según quien comunique y qué necesite en cada instante.
        </p>
        <KeyboardPeekDemo
          demoLabel="Teclado junto al tablero"
          caption="Las letras entran en la misma barra de frase que los pictos: combina ambos sin cambiar de app ni de mentalidad."
        />
      </Reveal>

      <Reveal>
        <h2 id="ideas-practicas">Ideas prácticas</h2>
        <ul>
          <li>Usa pictos para el esqueleto de la frase y el teclado para nombres propios, matices o palabras nuevas.</li>
          <li>Si enseñas el tablero a alguien que ya escribe, deja claro que el teclado no es “el modo avanzado aparte”, sino un apoyo al lado.</li>
          <li>Revisa el resumen en la <Link href="/guia">página de funciones</Link> o las <Link href="/preguntas">preguntas frecuentes</Link> si buscas más contexto.</li>
        </ul>
      </Reveal>
    </article>
  )
}
