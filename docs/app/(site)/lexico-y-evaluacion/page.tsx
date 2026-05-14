import type { Metadata } from 'next'
import Link from 'next/link'
import { LexEvalMiniDemo } from '@/components/demos/LexEvalMiniDemo'
import { Reveal } from '@/components/motion/Reveal'

export const metadata: Metadata = {
  title: 'Léxico y evaluación',
}

export default function LexicoEvaluacionPage() {
  return (
    <article className="docs-article docs-prose" data-doc-article>
      <header className="docs-article-header">
        <p className="docs-eyebrow">Funciones</p>
        <h1 id="lexico-evaluacion">Léxico y evaluación</h1>
        <p className="docs-hero-lead">
          “Léxico” es el conjunto de palabras y pictos que la app conoce para <strong>entenderte mejor</strong>: sugerir
          lo siguiente, conjugar o encajar variantes. “Evaluación” es la parte que permite <strong>ver cómo se usa el
          tablero</strong> en un periodo, siempre con respeto a la privacidad.
        </p>
      </header>

      <Reveal>
        <h2 id="lexico-dia-a-dia">Cómo se nota en el día a día</h2>
        <p>
          Cuando usas Luma Grid con regularidad, el sistema va reconociendo <strong>qué palabras combinas</strong> y en
          qué contextos. Eso mejora las sugerencias y hace que la comunicación sea más ágil con el tiempo. No sustituye a
          la persona: solo recoge pistas de uso para ayudar en la siguiente frase.
        </p>
        <p>
          Si en la cuenta está activada la opción de compartir datos anónimos para predicción, ayuda a que las
          sugerencias se adapten mejor. Si está desactivada, la app sigue siendo usable; solo cambia cuánta información
          de contexto puede aprovechar.
        </p>
        <LexEvalMiniDemo />
      </Reveal>

      <Reveal>
        <h2 id="informes">Informes de uso en el panel</h2>
        <p>
          Quien administra el tablero puede abrir el <strong>panel de administración</strong>, ir al apartado de léxico
          y consultar la <strong>evaluación de uso</strong>: resúmenes por periodo (por ejemplo últimos días), qué
          categorías de pictos se usan más, comparaciones con el periodo anterior y descargas en PDF si hace falta
          compartirlo con el equipo terapéutico.
        </p>
        <p>
          Estos informes sirven para <strong>tomar decisiones con calma</strong>: reorganizar el tablero, añadir
          vocabulario nuevo o celebrar que algo que costaba ya se usa con soltura.
        </p>
      </Reveal>

      <Reveal>
        <h2 id="privacidad">Privacidad y tranquilidad</h2>
        <p>
          La comunicación con Luma Grid usa siempre <strong>HTTPS (TLS)</strong>: lo que envías y recibes desde el
          navegador hacia los servidores <strong>viaja cifrado en tránsito</strong> por la red.
        </p>
        <p>
          Los informes están pensados para la <strong>persona titular de la cuenta</strong> y quienes cuidan el
          tablero. Si algo no te encaja, puedes limitar el uso compartido desde ajustes de cuenta o hablar con soporte.
        </p>
      </Reveal>

      <Reveal>
        <h2 id="mas-ayuda">Más ayuda</h2>
        <p>
          Si buscas respuestas cortas, mira las <Link href="/preguntas">preguntas frecuentes</Link> o el resumen en la{' '}
          <Link href="/guia">página de funciones</Link>.
        </p>
      </Reveal>
    </article>
  )
}
