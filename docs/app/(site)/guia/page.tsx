import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Resumen de funciones',
}

const bloques = [
  {
    href: '/voz-ia',
    title: 'Voz con IA',
    desc: 'Leer en alto lo que construyes y recibir sugerencias inteligentes para completar la idea.',
    emoji: '🎙️',
  },
  {
    href: '/arasaac',
    title: 'Pictogramas ARASAAC',
    desc: 'Imágenes claras y estandarizadas que muchas personas ya conocen de colegios y terapias.',
    emoji: '🖼️',
  },
  {
    href: '/variantes',
    title: 'Variantes de palabra',
    desc: 'Un mismo picto puede abrir varias formas de decir algo sin recargar el tablero.',
    emoji: '🔤',
  },
  {
    href: '/teclado-complementativo',
    title: 'Teclado complementativo',
    desc: 'Tablero y teclado conviven en el mismo flujo: no tienes que elegir solo uno u otro.',
    emoji: '⌨️',
  },
  {
    href: '/lexico-y-evaluacion',
    title: 'Léxico y evaluación',
    desc: 'La app aprende de tus hábitos y, si quieres, puedes revisar informes en el panel de administración.',
    emoji: '📊',
  },
]

export default function GuiaResumenPage() {
  return (
    <article className="docs-article docs-prose" data-doc-article>
      <header className="docs-article-header">
        <p className="docs-eyebrow">Funciones</p>
        <h1 id="resumen">Resumen para el día a día</h1>
        <p className="docs-hero-lead">
          Esta guía está pensada para <strong>personas usuarias, familias y profesionales</strong>. No hace falta saber de
          informática: solo cómo se siente usar Luma Grid cuando comunicas con pictos y frases.
        </p>
      </header>

      <h2 id="en-que-consiste">En qué consiste Luma Grid</h2>
      <p>
        Tienes un <strong>tablero</strong> con pictos (y a veces carpetas para agrupar temas). Al tocarlos, las palabras
        aparecen en la <strong>barra de frase</strong>. Cuando la frase está lista, puedes <strong>escucharla</strong>,
        guardarla como atajo o seguir afinando el mensaje.
      </p>

      <h2 id="funciones-destacadas">Funciones que conviene conocer</h2>
      <p>
        Estas capacidades trabajan en conjunto: la voz y la IA te ayudan a sonar natural; ARASAAC da pictos fáciles de
        reconocer; las variantes afinan detalles sin duplicar botones; el teclado complementa al tablero cuando hacen
        falta letras; y el léxico con la evaluación permiten mejorar con el tiempo y ver cómo se usa el tablero.
      </p>

      <div className="docs-guia-grid">
        {bloques.map((b) => (
          <Link key={b.href} href={b.href} className="docs-guia-card" prefetch={false}>
            <span className="docs-guia-card-emoji" aria-hidden>
              {b.emoji}
            </span>
            <span className="docs-guia-card-title">{b.title}</span>
            <span className="docs-guia-card-desc">{b.desc}</span>
          </Link>
        ))}
      </div>

      <h2 id="conjugacion-autocompletativa">Conjugación autocompletativa al leer</h2>
      <p>
        Cuando construyes un mensaje con pictos o formas cortas (por ejemplo <strong>«yo querer»</strong>), la app puede{' '}
        <strong>leerlo en voz alta</strong> con un español más natural, como si dijeras <strong>«yo quiero»</strong>. No
        cambia lo que elegiste en el tablero: solo ayuda a que suene más fluido al escucharlo.
      </p>
      <p>
        Si te preguntas si esto es «inteligencia artificial» como la de los chats que inventan textos:{' '}
        <strong>no</strong>. Esta conjugación autocomplementativa al leer <strong>no usa IA generativa</strong> ni un
        modelo que cree frases nuevas. La aplicación aplica <strong>reglas y tratamiento del idioma</strong> (en tu
        dispositivo o en el servidor) para que al escuchar suene más natural, sin sustituir lo que la persona eligió en
        el tablero.
      </p>
      <p>
        Otro ejemplo: <strong>«yo querer ir parque»</strong> puede sonar al leer como algo cercano a{' '}
        <strong>«yo quiero ir al parque»</strong>, añadiendo artículos, preposiciones o la conjugación que encajan con lo
        que ya pusiste. Así se gana <strong>habla más fluida</strong> sin obligar a tocar cada palabrita; complementa lo
        que la persona eligió en el tablero.
      </p>
      <p>
        Para más detalle sobre leer frases y la voz, consulta{' '}
        <Link href="/voz-ia">Voz con inteligencia artificial</Link>. Si prefieres el recorrido general desde el
        principio, está el apartado <Link href="/empieza-aqui">Empieza aquí</Link>.
      </p>

      <h2 id="siguiente-paso">Siguiente paso</h2>
      <p>
        Si quieres ver el flujo completo en la aplicación (registro, tablero, admin, base fija y léxico), abre el{' '}
        <Link href="/empieza-aqui">recorrido desde cero</Link>. También puedes elegir un tema del menú lateral o
        revisar las <Link href="/preguntas">preguntas frecuentes</Link> si buscas una respuesta rápida.
      </p>
    </article>
  )
}
