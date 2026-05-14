import type { Metadata } from 'next'
import { Reveal } from '@/components/motion/Reveal'
import { PredictionChipsDemo } from '@/components/demos/PredictionChipsDemo'
import { VoiceModeSelectorDemo } from '@/components/demos/VoiceModeSelectorDemo'
import { VoicePulseDemo } from '@/components/demos/VoicePulseDemo'

export const metadata: Metadata = {
  title: 'Voz con IA',
}

export default function VozIaPage() {
  return (
    <article className="docs-article docs-prose" data-doc-article>
      <header className="docs-article-header">
        <p className="docs-eyebrow">Funciones</p>
        <h1 id="voz-ia">Voz con inteligencia artificial</h1>
        <p className="docs-hero-lead">
          Puedes <strong>escuchar en voz alta</strong> lo que has montado en la barra de frase y, al mismo tiempo, dejar
          que la aplicación te <strong>proponga palabras o trozos de frase</strong> que encajan con el contexto. Así se
          reduce el esfuerzo de buscar cada símbolo y suena más parecido a una conversación natural.
        </p>
      </header>

      <Reveal>
        <h2 id="leer-frase">Leer la frase en voz alta</h2>
        <p>
          Cuando ya tienes la frase en la barra, usa el botón de hablar para que el dispositivo la lea. Según tu cuenta y
          tu plan, puedes elegir entre la <strong>voz del sistema</strong>, una <strong>voz generada con IA</strong> o un
          modelo de <strong>voz clonada</strong>. Puedes pausar, repetir o cambiar el volumen como en cualquier otra app.
        </p>
        <div className="docs-voice-demos-row">
          <VoiceModeSelectorDemo />
          <VoicePulseDemo />
        </div>
      </Reveal>

      <Reveal>
        <h2 id="sugerencias-ia">Sugerencias con IA</h2>
        <p>
          Debajo de la barra de frase pueden aparecer <strong>pestañas o “chips” sugeridos</strong>. Son ideas que la app
          calcula a partir de lo que ya has dicho: por ejemplo, si hablas de “comer”, puede sugerirte “ahora”, “en casa” o
          “con mi familia”. Un toque y la palabra se añade a la frase.
        </p>
        <p>
          Si en algún momento prefieres no ver esta zona, quien administra la cuenta puede desactivarla desde los
          ajustes (no hace falta tocar nada complicado: es un interruptor en la configuración de la cuenta).
        </p>
        <PredictionChipsDemo />
      </Reveal>

      <Reveal>
        <h2 id="conjugar">Frases que suenan bien</h2>
        <p>
          La app también puede <strong>ordenar y conjugar</strong> la frase para que al leerla suene más fluida en
          español, respetando lo que has elegido en el tablero. Es especialmente útil cuando mezclas pictos y palabras
          sueltas.
        </p>
      </Reveal>

      <Reveal>
        <h2 id="consejos">Consejos prácticos</h2>
        <ul>
          <li>Prueba primero frases cortas y repite con la voz hasta que suenen cómodas para quien comunica.</li>
          <li>Mira las sugerencias como atajos: no hace falta usarlas todas; sirven cuando encajan con lo que quieres decir.</li>
          <li>Si compartes el dispositivo, revisa el volumen y el tipo de voz en un momento tranquilo, sin prisa.</li>
        </ul>
      </Reveal>
    </article>
  )
}
