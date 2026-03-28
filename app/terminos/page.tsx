import LegalPage from '@/components/site/LegalPage'

const sections = [
  {
    title: '1. Objeto del servicio',
    content: (
      <>
        <p>
          Luma Grid es una aplicación orientada a la Comunicación Aumentativa y Alternativa (CAA/AAC), pensada para facilitar la creación
          de frases, el uso de símbolos, la gestión de perfiles y la reproducción de voz. Puede utilizarse en navegador y, cuando el sistema lo
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
          Los perfiles, símbolos, configuraciones y frases guardadas deben gestionarse de acuerdo con la finalidad asistencial y educativa del producto.
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
          Luma Grid incorpora autenticación y control de acceso para proteger áreas como el tablero y el panel de administración. Tras el registro
          o el inicio de sesión puede solicitarse la elección de un plan de uso (incluido un plan gratuito sin obligación de pago); hasta completar
          ese paso, el acceso a determinadas áreas puede estar condicionado según la configuración del producto.
        </p>
      </>
    ),
  },
  {
    title: '4. Planes de suscripción y pagos',
    content: (
      <>
        <p>
          Luma Grid puede ofrecer distintos planes (por ejemplo, uso gratuito con límites y planes de pago con mayores prestaciones). Las
          condiciones comerciales, precios y límites aplicables se muestran en el sitio y pueden actualizarse; el uso continuado tras un cambio
          notificado puede implicar su aceptación.
        </p>
        <p>
          Los pagos y la gestión de suscripciones (incluidos cargo recurrente, cambio de plan, método de pago y facturación cuando proceda) pueden
          tramitarse a través de <strong className="text-[var(--app-foreground)]">Stripe</strong> u otro proveedor de pagos integrado. Al contratar
          un plan de pago, el usuario acepta que los datos necesarios para la transacción sean tratados por dicho proveedor según sus propias
          condiciones y política de privacidad.
        </p>
        <p>
          El incumplimiento del pago, la cancelación o el impago pueden conllevar la limitación o el cese de las prestaciones asociadas al plan
          de pago, sin perjuicio de lo establecido en la normativa de consumo aplicable.
        </p>
      </>
    ),
  },
  {
    title: '5. Voz sintética y clonación (ElevenLabs)',
    content: (
      <>
        <p>
          Las funciones de voz de alta calidad y clonación pueden depender de servicios de <strong className="text-[var(--app-foreground)]">ElevenLabs</strong>{' '}
          u otros proveedores. El envío de texto para síntesis y, en su caso, de muestras de audio para crear una voz clonada implica el tratamiento
          de esos datos por parte del proveedor conforme a sus términos y políticas.
        </p>
        <p>
          Los límites de uso (por ejemplo, número de tableros, caracteres de voz al mes o funciones disponibles) dependen del plan contratado y de
          la configuración técnica del servicio en cada momento.
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
          ni el funcionamiento ininterrumpido de integraciones de terceros (pagos, voz, alojamiento).
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
    <LegalPage
      eyebrow="Términos y condiciones"
      title="Términos y condiciones de uso"
      intro="Estas condiciones regulan el acceso y uso de Luma Grid, incluidos planes gratuitos y de pago, integración con proveedores de pago y de voz, y el uso de la aplicación como PWA."
      sections={sections}
    />
  )
}
