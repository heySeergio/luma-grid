import type { Metadata } from 'next'
import Link from 'next/link'
import { AdminDragGridDemo } from '@/components/demos/AdminDragGridDemo'
import { BaseFijaZonaFijaDemo } from '@/components/demos/BaseFijaZonaFijaDemo'
import { OnboardingJourneyDemo } from '@/components/demos/OnboardingJourneyDemo'
import { Reveal } from '@/components/motion/Reveal'
import { Stagger } from '@/components/motion/Stagger'
import { APP_ORIGIN } from '@/config/app-origin'

export const metadata: Metadata = {
  title: 'Recorrido desde cero',
  description:
    'Desde el registro hasta el tablero y el panel de administración: primeros pasos, base fija, pictos, variantes y léxico.',
}

export default function EmpiezaAquiPage() {
  return (
    <article className="docs-article docs-prose" data-doc-article>
      <header className="docs-article-header">
        <p className="docs-eyebrow">Empieza aquí</p>
        <h1 id="recorrido-completo">Recorrido completo en Luma Grid</h1>
        <p className="docs-hero-lead">
          Esta página une el hilo de principio a fin: <strong>dónde registrarte</strong>, qué verás al entrar, la
          diferencia entre comunicar en <strong>/tablero</strong> y configurar en <strong>/admin</strong>, cómo colocar
          pictos, variantes, la <strong>base fija</strong> y cómo pensamos el <strong>léxico interno</strong> sin
          tratarte como un dataset.
        </p>
      </header>

      <Reveal>
        <OnboardingJourneyDemo />
      </Reveal>

      <Reveal>
        <Stagger className="docs-empieza-highlights">
          <div className="docs-empieza-hl">
            <span className="docs-empieza-hl-k">1</span>
            <span className="docs-empieza-hl-t">Alta y sesión</span>
            <span className="docs-empieza-hl-d">Correo, Google o invitación según cómo esté abierta tu instancia.</span>
          </div>
          <div className="docs-empieza-hl">
            <span className="docs-empieza-hl-k">2</span>
            <span className="docs-empieza-hl-t">Tablero</span>
            <span className="docs-empieza-hl-d">Aquí vive el día a día: pictos, frase, voz y teclado complementario.</span>
          </div>
          <div className="docs-empieza-hl">
            <span className="docs-empieza-hl-k">3</span>
            <span className="docs-empieza-hl-t">Admin</span>
            <span className="docs-empieza-hl-d">Aquí se diseña el tablero: celdas, carpetas, pictos y cuenta.</span>
          </div>
          <div className="docs-empieza-hl">
            <span className="docs-empieza-hl-k">↺</span>
            <span className="docs-empieza-hl-t">Ida y vuelta</span>
            <span className="docs-empieza-hl-d">Cambias de pantalla cuando toca; los datos son los mismos.</span>
          </div>
        </Stagger>
      </Reveal>

      <Reveal>
        <h2 id="registro-y-primer-acceso">Registro y primer acceso</h2>
        <p>
          La cuenta se crea en la ruta <strong>/register</strong> de la aplicación (por ejemplo{' '}
          <a href={`${APP_ORIGIN}/register`} rel="noopener noreferrer">
            {APP_ORIGIN}/register
          </a>
          ). Suele ofrecerse correo y contraseña y, si está activado, inicio con Google. Tras validar datos, entras con{' '}
          <strong>/login</strong> y, en condiciones normales, acabas en el entorno de comunicación.
        </p>
        <p>
          Los <strong>primeros pasos</strong> son explorar el tablero con calma: tocar pictos, ver cómo suben palabras a
          la barra de frase, probar volver a la vista principal con el botón de inicio (casa) y, si quieres, la pestaña
          de teclado. No hace falta tocar el panel de administración el primer día.
        </p>
      </Reveal>

      <Reveal>
        <h2 id="tablero-frente-a-admin">/tablero frente a /admin</h2>
        <p>
          <strong>/tablero</strong> es donde <strong>se comunica la persona</strong>: rejilla de símbolos, barra de
          frase, lectura en voz alta, sugerencias y teclado. Está pensado para dedos, ojos y ritmo conversacional.
        </p>
        <p>
          <strong>/admin</strong> es el <strong>panel de administración</strong>: sirve para quien adapta el tablero
          (familia, logopeda, técnico…). Ahí se editan celdas, se buscan pictogramas (por ejemplo ARASAAC), se guardan
          cambios en el perfil y se revisan preferencias de cuenta o informes de uso.
        </p>
        <p>
          En muchos comunicadores del pasado tenías que elegir entre “modo tablero” o “modo teclado”. En Luma Grid eso
          se acerca más a <strong>complementarse</strong>; si quieres el matiz, lee{' '}
          <Link href="/teclado-complementativo">Teclado complementativo</Link>.
        </p>
      </Reveal>

      <Reveal>
        <h2 id="como-entrar-al-admin-desde-tablero">Cómo entrar al admin estando en el tablero</h2>
        <p>
          La forma directa es escribir en el navegador la ruta <strong>/admin</strong> (por ejemplo{' '}
          <a href={`${APP_ORIGIN}/admin`} rel="noopener noreferrer">
            {APP_ORIGIN}/admin
          </a>
          ) estando ya con la sesión iniciada: el panel carga con los permisos de tu cuenta.
        </p>
        <p>
          Desde la propia interfaz del tablero también hay un acceso pensado para quien lo necesite sin enseñar un
          botón enorme a todo el mundo: <strong>pulsa cinco veces seguidas el botón de inicio (casa)</strong> en un
          intervalo breve (unos dos segundos). Se abre un cuadro que explica que vas al panel de administración; al
          confirmar, navegas a <strong>/admin</strong>. Así se reduce el riesgo de entrar por error mientras se
          conversa.
        </p>
      </Reveal>

      <Reveal>
        <h2 id="editar-en-el-admin">En el admin: cómo editar símbolos</h2>
        <p>
          En el grid principal, <strong>toca una celda</strong> para abrir el editor del símbolo: etiqueta, color,
          carpeta, imagen o emoji, si abre el teclado, etc. Los cambios de contenido del símbolo se confirman desde ese
          editor; el orden en la rejilla se cambia de otra forma: <strong>arrastrando</strong>.
        </p>
        <AdminDragGridDemo />
        <p>
          <strong>Reordenar celdas:</strong> coloca el puntero (o el dedo) sobre el símbolo, <strong>pulsa y mantén
          pulsado</strong>, <strong>arrastra</strong> hasta la celda vacía o el hueco donde quieras dejarlo y{' '}
          <strong>suelta</strong>. Verás el símbolo “flotando” mientras lo mueves; al soltar, ocupa la nueva posición.
          En tableta el gesto es el mismo que reorganizar iconos en la pantalla de inicio. Si una celda está bloqueada o
          no admite movimiento, el panel no dejará completar el gesto: revisa el estado de la celda o los permisos del
          perfil.
        </p>
        <p>
          También puedes usar el <strong>teclado</strong> cuando el foco está en la rejilla (por ejemplo para moverte
          entre celdas con las flechas en ciertos contextos), pero el reordenamiento visual que más se enseña es el de
          <strong>clic prolongado + arrastre</strong>.
        </p>
        <p>
          Los cambios se guardan con los botones habituales de <strong>guardar</strong> del panel: si ves un aviso de
          cambios sin guardar, revisa antes de salir.
        </p>
        <p>
          Para <strong>poner pictogramas</strong>, en el editor suele haber búsqueda en catálogo (ARASAAC u otras
          fuentes configuradas). Elige picto, revisa la etiqueta que leerá la persona y guarda. Más contexto en la guía
          de <Link href="/arasaac">Pictogramas ARASAAC</Link>.
        </p>
      </Reveal>

      <Reveal>
        <h2 id="base-fija-y-zona-fija">Base fija y “zona fija”</h2>
        <p>
          El tablero tiene una <strong>rejilla principal</strong> que actúa como mapa mental estable. Algunas celdas
          pueden marcarse como <strong>fijas</strong>: siguen visibles como ancla cuando entras en una carpeta, para
          que no desaparezcan, por ejemplo, “Sí / No”, “Parar” o el pronombre que más se usa.
        </p>
        <BaseFijaZonaFijaDemo />
        <p>
          Además, el producto distingue una <strong>zona fija</strong> (por defecto suele alinearse con la primera fila
          y el ancho del grid principal): es el “andén” donde conviene dejar comunicación esencial. Quien administra
          puede ajustar qué entra en esa zona según el perfil. La idea es simple: <strong>menos sorpresas</strong> al
          navegar carpetas.
        </p>
      </Reveal>

      <Reveal>
        <h2 id="variantes-de-palabra-en-admin">Variantes de palabra</h2>
        <p>
          En el editor avanzado de una celda puedes definir <strong>variantes</strong>: la misma idea con distintas
          formas (“yo / tú”, género de familia, tiempo verbal…) sin multiplicar pictos en el tablero. En pantalla, al
          pulsar el símbolo, aparece el menú circular o lista de variantes que ya conoces en la app.
        </p>
        <p>
          La guía de usuario va más al detalle visual en{' '}
          <Link href="/variantes">Variantes de palabra</Link>.
        </p>
      </Reveal>

      <Reveal>
        <h2 id="preferencias-de-cuenta">Preferencias de cuenta (dónde están)</h2>
        <p>
          Dentro de <strong>/admin</strong> encontrarás el bloque de <strong>cuenta y preferencias</strong> (tema,
          voz, privacidad de datos para sugerencias, visibilidad de filas auxiliares en el tablero como atajos o
          sugerencias, etc.). Lo que cambies ahí suele guardarse en tu <strong>cuenta</strong>, no solo en el
          dispositivo, para que la experiencia sea coherente si cambias de tableta.
        </p>
      </Reveal>

      <Reveal>
        <h2 id="lexico-interno-y-transparencia">Sistema léxico interno y transparencia</h2>
        <p>
          Luma Grid lleva por debajo un <strong>modelo léxico</strong>: cada símbolo puede enlazarse a un{' '}
          <strong>lexema</strong> (la entrada de diccionario abstracta) y a pistas gramaticales ligeras. Eso sirve para
          conjugar mejor al leer en voz alta, para sugerir la siguiente palabra con criterio y para que las{' '}
          <strong>variantes</strong> no sean solo texto suelto, sino decisiones coherentes con el español.
        </p>
        <p>
          El léxico también alimenta la parte de <strong>evaluación de uso</strong> (qué categorías se usan, cómo
          evoluciona el hábito en el tiempo). Ahí entra nuestra obsesión buena con la transparencia: los informes son
          para titulares de cuenta y equipo clínico, no un feed de “lo que dijo en casa”. Puedes profundizar en{' '}
          <Link href="/lexico-y-evaluacion">Léxico y evaluación</Link>.
        </p>
        <div className="docs-callout" role="note">
          <p className="docs-callout-title">Privacidad sin postureo</p>
          <p>
            No vendemos conversaciones como producto. Los datos de uso que importan al léxico van orientados a
            patrones y estadísticas agregadas; donde haya opciones para compartir datos con fines de predicción, están
            etiquetadas para que la decisión sea consciente. Si algo no encaja con tu criterio, desactívalo y sigue
            usando tablero y voz. Entre tu dispositivo y los servidores, el tráfico va siempre por{' '}
            <strong>HTTPS (TLS)</strong>, de modo que <strong>los datos viajan cifrados en tránsito</strong> y no en
            claro por la red.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <h2 id="siguientes-lecturas">Siguientes lecturas</h2>
        <p>
          Vuelve al <Link href="/guia">resumen de funciones</Link>, entra en <Link href="/voz-ia">Voz con IA</Link> o
          revisa las <Link href="/preguntas">preguntas frecuentes</Link> si buscas respuestas cortas.
        </p>
      </Reveal>
    </article>
  )
}
