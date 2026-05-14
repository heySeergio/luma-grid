import type { Metadata } from 'next'
import { Reveal } from '@/components/motion/Reveal'

export const metadata: Metadata = {
  title: 'Pictogramas ARASAAC',
}

export default function ArasaacPage() {
  return (
    <article className="docs-article docs-prose" data-doc-article>
      <header className="docs-article-header">
        <p className="docs-eyebrow">Funciones</p>
        <h1 id="arasaac">Pictogramas ARASAAC</h1>
        <p className="docs-hero-lead">
          En Luma Grid verás muchos <strong>pictogramas del proyecto ARASAAC</strong>, el banco de símbolos creado en
          Zaragoza que se ha extendido por escuelas, centros de día y terapias en español. Son dibujos claros, con el
          mismo estilo en todos, para que sea fácil reconocerlos de un vistazo.
        </p>
      </header>

      <Reveal>
        <h2 id="por-que-importa">Por qué es importante para quien comunica</h2>
        <p>
          Cuando varias personas (familia, logopeda, profes) usan el <strong>mismo tipo de pictos</strong>, se entienden
          antes: no hay que volver a explicar cada dibujo. ARASAAC es casi un “idioma visual” compartido en muchos
          países hispanohablantes.
        </p>
      </Reveal>

      <Reveal>
        <h2 id="como-aparecen">Cómo aparecen en tu tablero</h2>
        <p>
          Algunos tableros cargan pictos de ARASAAC automáticamente según la palabra de cada celda. Otras veces, quien
          configura el tablero elige imágenes a mano. En ambos casos, lo que ves en pantalla está pensado para{' '}
          <strong>acompañar la palabra escrita</strong> o el picto principal.
        </p>
        <p>
          Los pictos de ARASAAC se publican con una licencia abierta (Creative Commons) que permite usarlos en
          aplicaciones como esta; el proyecto pide que se reconozca su autoría, como hacemos aquí con cariño.
        </p>
      </Reveal>

      <Reveal>
        <h2 id="familias">Qué puedes hacer tú en casa</h2>
        <ul>
          <li>Nombra en voz alta el picto cuando lo uses: refuerza la asociación palabra–imagen.</li>
          <li>Si tu hijo o hija ya conoce ARASAAC del cole, Luma Grid les resultará familiar.</li>
          <li>Si un picto no encaja con vuestra forma de hablar, quien administra el tablero puede cambiarlo en el panel.</li>
        </ul>
      </Reveal>
    </article>
  )
}
