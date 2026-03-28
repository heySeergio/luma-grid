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
          <strong className="text-[var(--app-foreground)]">IndexedDB</strong>, usadas para funcionar sin conexión o guardar datos de la aplicación.
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
          (por ejemplo asociados a NextAuth) para mantener la sesión iniciada de forma segura tras el inicio de sesión y proteger rutas que requieren
          autenticación (tablero, panel de administración, etc.).
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">Preferencias en el navegador:</strong> pueden guardarse datos en almacenamiento local para
          recordar opciones de la interfaz (por ejemplo tema claro u oscuro) o avisos ya mostrados (como confirmaciones de uso de funciones sensibles),
          de modo que no tengas que repetir el mismo paso en cada visita.
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">Funcionamiento de la aplicación:</strong> parte del contenido del tablero y datos de uso
          pueden almacenarse en el dispositivo para permitir trabajo sin conexión o rendimiento fluido, según la versión del producto.
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
          para cachear recursos y permitir el uso similar a una app nativa. Ese mecanismo es técnico y está orientado al funcionamiento del servicio.
        </p>
      </>
    ),
  },
  {
    title: '4. Tipos según finalidad',
    content: (
      <>
        <p>
          <strong className="text-[var(--app-foreground)]">Necesarias / técnicas:</strong> imprescindibles para el inicio de sesión, la seguridad y
          el funcionamiento básico de la aplicación.
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">Preferencias:</strong> recuerdan elecciones de la interfaz o avisos ya aceptados.
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
          Puedes configurar tu navegador para bloquear o eliminar cookies y datos de sitios, o borrar el almacenamiento local de Luma Grid. Ten en cuenta
          que hacerlo puede cerrar tu sesión, borrar preferencias o afectar al modo sin conexión hasta que la aplicación vuelva a sincronizar.
        </p>
      </>
    ),
  },
  {
    title: '6. Actualizaciones',
    content: (
      <>
        <p>
          Esta política podrá actualizarse si cambian los mecanismos de almacenamiento, se incorporan nuevas integraciones (pagos, voz, analítica) o
          funciones que utilicen cookies o almacenamiento local de forma distinta.
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
      intro="Resumen del uso de cookies, almacenamiento local y tecnologías similares en Luma Grid: sesión, preferencias, PWA y relación con el pago por Stripe."
      sections={sections}
    />
  )
}
