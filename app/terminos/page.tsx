import type { Metadata } from 'next'
import LegalPage from '@/components/site/LegalPage'
import { MarketingSiteShell } from '@/components/site/MarketingSiteShell'
import { isLandingComingSoon } from '@/lib/site/comingSoon'

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description:
    'Condiciones de uso de Luma Grid: comunicador AAC, autenticación con correo o Google, voz con ElevenLabs, predicción AAC y uso como PWA.',
  alternates: { canonical: '/terminos' },
  robots: { index: true, follow: true },
}

const sections = [
  {
    title: '1. Objeto del servicio',
    content: (
      <>
        <p>
          Luma Grid es una aplicación orientada a la Comunicación Aumentativa y Alternativa (CAA/AAC), pensada para facilitar la creación
          de frases, el uso de símbolos, la gestión de tableros y la reproducción de voz. Puede utilizarse en navegador y, cuando el sistema lo
          permita, instalarse como aplicación web (PWA).
        </p>
        <p>
          El uso del servicio implica la aceptación de estas condiciones en la versión publicada en cada momento.
        </p>
      </>
    ),
  },
  {
    title: '2. Uso adecuado',
    content: (
      <>
        <p>
          El usuario se compromete a utilizar la aplicación de forma lícita, sin dañar la plataforma, sin intentar acceder a datos ajenos
          y sin realizar acciones que comprometan la seguridad o disponibilidad del sistema.
        </p>
        <p>
          Los tableros, símbolos, configuraciones y frases guardadas deben gestionarse de acuerdo con la finalidad asistencial y educativa del producto.
        </p>
      </>
    ),
  },
  {
    title: '3. Cuentas y acceso',
    content: (
      <>
        <p>
          Cada usuario es responsable de mantener la confidencialidad de sus credenciales y de la actividad realizada con su cuenta.
        </p>
        <p>
          Luma Grid incorpora autenticación y control de acceso para proteger áreas como el tablero y el panel de administración. Puedes registrarte
          e iniciar sesión con <strong className="text-[var(--app-foreground)]">correo electrónico y contraseña</strong> y, cuando esté habilitado en la
          instalación, con <strong className="text-[var(--app-foreground)]">Google</strong> u otros proveedores de identidad. Al usar el inicio de sesión
          social aceptas también las condiciones aplicables de ese proveedor en lo que corresponda.
        </p>
        <p>
          El acceso a determinadas funciones o áreas puede depender de la{' '}
          <strong className="text-[var(--app-foreground)]">configuración del producto</strong> en cada despliegue (por
          ejemplo permisos del perfil, políticas del titular de la cuenta o ajustes del entorno).
        </p>
      </>
    ),
  },
  {
    title: '4. Voz sintética y clonación (ElevenLabs)',
    content: (
      <>
        <p>
          Las funciones de voz de alta calidad y clonación pueden depender de servicios de <strong className="text-[var(--app-foreground)]">ElevenLabs</strong>{' '}
          u otros proveedores. El envío de texto para síntesis y, en su caso, de muestras de audio para crear una voz clonada implica el tratamiento
          de esos datos por parte del proveedor conforme a sus términos y políticas.
        </p>
        <p>
          Los límites de uso (por ejemplo, volumen de síntesis, voces disponibles o funciones habilitadas) dependen de la{' '}
          <strong className="text-[var(--app-foreground)]">configuración técnica del servicio</strong>, de los ajustes de cuenta o del criterio del
          titular de la instalación en cada momento.
        </p>
      </>
    ),
  },
  {
    title: '5. Predicción AAC y datos de uso',
    content: (
      <>
        <p>
          Las sugerencias de palabras en el comunicador se calculan en el servidor a partir del léxico, del historial de uso asociado a tu cuenta
          (cuando lo permitas) y de reglas del producto. Puedes{' '}
          <strong className="text-[var(--app-foreground)]">desactivar el envío de pulsaciones y transiciones para aprendizaje de predicción</strong> en
          la configuración de cuenta; en ese caso el servicio deja de registrar esos datos para ese fin, sin perjuicio de lo necesario para el
          funcionamiento básico descrito en la política de privacidad.
        </p>
        <p>
          Sin conexión o durante cortes de red, parte de la experiencia puede apoyarse en almacenamiento local del dispositivo; la predicción que
          dependa del servidor puede actualizarse con retraso hasta sincronizar.
        </p>
      </>
    ),
  },
  {
    title: '6. Propiedad intelectual',
    content: (
      <>
        <p>
          La marca, diseño visual, estructura de la aplicación, código y documentación de Luma Grid están protegidos por la normativa aplicable de propiedad intelectual.
        </p>
        <p>
          Los contenidos aportados por el usuario siguen siendo de su responsabilidad, salvo aquellos elementos propios del producto y de su identidad visual.
        </p>
      </>
    ),
  },
  {
    title: '7. Limitación de responsabilidad',
    content: (
      <>
        <p>
          Luma Grid se ofrece con el objetivo de mejorar la comunicación, pero no sustituye criterio clínico, terapéutico, educativo o profesional especializado.
        </p>
        <p>
          Aunque se trabaja para mantener la herramienta disponible y fiable, no se garantiza la ausencia total de errores, interrupciones o incidencias técnicas,
          ni el funcionamiento ininterrumpido de integraciones de terceros (voz, alojamiento).
        </p>
      </>
    ),
  },
  {
    title: '8. Modificaciones',
    content: (
      <>
        <p>
          Estas condiciones pueden actualizarse para reflejar cambios legales, funcionales, comerciales o de seguridad. Las nuevas versiones serán aplicables desde su publicación en el sitio.
        </p>
      </>
    ),
  },
]

export default function TermsPage() {
  return (
    <MarketingSiteShell comingSoon={isLandingComingSoon()}>
      <LegalPage
        eyebrow="Términos y condiciones"
        title="Términos y condiciones de uso"
        intro="Estas condiciones regulan el acceso y uso de Luma Grid: comunicador AAC, inicio de sesión con correo o Google, voz (p. ej. ElevenLabs), predicción y opciones de privacidad del aprendizaje, y uso como PWA."
        sections={sections}
      />
    </MarketingSiteShell>
  )
}
