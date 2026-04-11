import LegalPage from '@/components/site/LegalPage'

const sections = [
  {
    title: '1. Qué son las cookies y almacenamiento local',
    content: (
      <>
        <p>
          Las <strong className="text-[var(--app-foreground)]">cookies</strong> son pequeños archivos que el sitio puede guardar en tu dispositivo a
          través del navegador. Las tecnologías similares incluyen el <strong className="text-[var(--app-foreground)]">almacenamiento local</strong>{' '}
          (<em>localStorage</em>, <em>sessionStorage</em>) y, en aplicaciones web avanzadas, bases de datos en el dispositivo como{' '}
          <strong className="text-[var(--app-foreground)]">IndexedDB</strong>, usadas para datos de aplicación, colas de sincronización o caché.
        </p>
      </>
    ),
  },
  {
    title: '2. Uso en Luma Grid',
    content: (
      <>
        <p>
          <strong className="text-[var(--app-foreground)]">Sesión e identificación:</strong> Luma Grid utiliza cookies o mecanismos equivalentes
          asociados a <strong className="text-[var(--app-foreground)]">NextAuth</strong> (sesión basada en JWT) para mantener el inicio de sesión de forma
          segura y proteger rutas que requieren autenticación (tablero, panel de administración, etc.). Si usas{' '}
          <strong className="text-[var(--app-foreground)]">inicio de sesión con Google</strong>, el flujo de OAuth puede implicar cookies o almacenamiento
          gestionado por Google durante la redirección; rigen las políticas de Google en ese contexto.
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">Preferencias y estado en el navegador:</strong> pueden guardarse datos en{' '}
          <em>sessionStorage</em> o <em>localStorage</em> para recordar la bienvenida en el tablero, consejos ya mostrados, preferencias de interfaz o
          estados de la sesión de navegación, según la versión del producto.
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">IndexedDB (incl. Dexie):</strong> la aplicación puede usar una base de datos local en el
          dispositivo para, entre otras cosas: mantener una <strong className="text-[var(--app-foreground)]">cola de eventos de uso</strong> pendientes de
          envío al servidor cuando compartes datos para predicción y la conexión falla; almacenar <strong className="text-[var(--app-foreground)]">caché</strong>{' '}
          de contenidos o audio; y datos de configuración de acceso. Así se mejora la continuidad con red intermitente hasta sincronizar.
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">Pagos (Stripe):</strong> si completas un pago o gestionas la suscripción a través de Stripe,
          Stripe puede establecer sus propias cookies o tecnologías cuando cargas sus páginas o el portal de cliente; rige la política de cookies y
          privacidad de Stripe en ese contexto.
        </p>
      </>
    ),
  },
  {
    title: '3. Aplicación instalada (PWA)',
    content: (
      <>
        <p>
          Si instalas Luma Grid como aplicación (PWA), el navegador puede registrar un <strong className="text-[var(--app-foreground)]">service worker</strong>{' '}
          para cachear recursos y permitir el uso similar a una app nativa. Ese mecanismo es técnico y está orientado al funcionamiento del servicio y a
          la disponibilidad offline parcial descrita en la política de privacidad.
        </p>
      </>
    ),
  },
  {
    title: '4. Tipos según finalidad',
    content: (
      <>
        <p>
          <strong className="text-[var(--app-foreground)]">Necesarias / técnicas:</strong> imprescindibles para el inicio de sesión, la seguridad, la
          sesión autenticada y el funcionamiento básico de la aplicación.
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">Preferencias y continuidad:</strong> recuerdan elecciones de la interfaz, avisos ya mostrados
          o permiten retener datos localmente hasta sincronizar.
        </p>
        <p>
          Luma Grid no utiliza cookies de publicidad de terceros con fines de perfilado comercial en el sentido tradicional; cualquier medición orientada
          a mejorar el producto se limitará a lo descrito en la política de privacidad si se incorpora en el futuro.
        </p>
      </>
    ),
  },
  {
    title: '5. Gestión y control',
    content: (
      <>
        <p>
          Puedes configurar tu navegador para bloquear o eliminar cookies y datos de sitios, o borrar el almacenamiento local e IndexedDB de Luma Grid. Ten
          en cuenta que hacerlo puede cerrar tu sesión, borrar preferencias, vaciar colas pendientes de sincronización o afectar al modo sin conexión hasta
          que la aplicación vuelva a cargar y sincronizar.
        </p>
      </>
    ),
  },
  {
    title: '6. Actualizaciones',
    content: (
      <>
        <p>
          Esta política podrá actualizarse si cambian los mecanismos de almacenamiento, se incorporan nuevas integraciones (pagos, voz, identidad social,
          modelos de IA) o funciones que utilicen cookies o almacenamiento local de forma distinta.
        </p>
      </>
    ),
  },
]

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Cookies"
      title="Política de cookies"
      intro="Uso de cookies, sesión NextAuth, almacenamiento local, IndexedDB (cola de sincronización y caché), OAuth Google, PWA con service worker y relación con pagos Stripe."
      sections={sections}
    />
  )
}
