import LegalPage from '@/components/site/LegalPage'

const sections = [
  {
    title: '1. Datos que pueden tratarse',
    content: (
      <>
        <p>
          Luma Grid puede tratar datos básicos de cuenta: correo electrónico, nombre si lo facilitas, contraseña de forma protegida, preferencias
          de interfaz (por ejemplo tema claro/oscuro o tipografía), identificador de sesión y datos técnicos necesarios para el funcionamiento seguro.
        </p>
        <p>
          Relacionados con el uso del producto: tableros configurados, símbolos, disposición del tablero, frases, historial funcional dentro de la app,
          ajustes de voz (modo de síntesis, identificador de voz cuando aplica) y métricas de uso del servicio de texto a voz (por ejemplo caracteres
          utilizados en un periodo de facturación), según el plan contratado.
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">Planes y pagos:</strong> tipo de plan, estado de la suscripción, identificador de cliente
          ante el proveedor de pagos cuando exista, y los datos que resulten necesarios para emitir facturas o cumplir obligaciones fiscales y contables.
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">Voz y ElevenLabs:</strong> el texto enviado para generar audio con voces de ElevenLabs;
          en el caso de la clonación de voz, las muestras de audio que envíes para crear tu voz personalizada. Esos contenidos se transmiten al
          proveedor para su tratamiento conforme a su política.
        </p>
        <p>
          En función de la configuración del producto, también pueden tratarse datos de uso necesarios para la predicción AAC, la experiencia y la estabilidad técnica.
        </p>
      </>
    ),
  },
  {
    title: '2. Finalidad del tratamiento',
    content: (
      <>
        <p>
          Los datos se utilizan para permitir el acceso a la aplicación, gestionar cuentas y suscripciones, guardar configuraciones, personalizar tableros,
          aplicar los límites del plan contratado, mejorar el sistema léxico y ofrecer funcionalidades como historial, predicción y reproducción de frases
          con voz del sistema o mediante proveedores de síntesis.
        </p>
        <p>
          Los datos de pago se tratan para formalizar la relación contractual, procesar cobros recurrentes o puntuales y permitir la gestión de la suscripción
          (incluido acceso al portal de cliente del proveedor de pagos cuando esté disponible).
        </p>
        <p>
          También pueden emplearse para prevenir abusos y fraudes, proteger la seguridad del servicio y mantener la continuidad operativa de la plataforma.
        </p>
      </>
    ),
  },
  {
    title: '3. Encargados del tratamiento y terceros',
    content: (
      <>
        <p>
          Para prestar el servicio, Luma Grid puede recurrir a proveedores que tratan datos en nombre del responsable del tratamiento o según su propia
          política cuando actúan como responsables independientes. Entre ellos pueden figurar:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-[var(--app-foreground)]">Stripe</strong> (u otro procesador de pagos) para cobros, suscripciones, facturación y
            gestión del cliente de pago. Te recomendamos consultar la política de privacidad y las condiciones de Stripe aplicables a tu región.
          </li>
          <li>
            <strong className="text-[var(--app-foreground)]">ElevenLabs</strong> para síntesis de voz y, si lo utilizas, creación de voces clonadas a
            partir de tus muestras de audio. El tratamiento queda regulado por las condiciones y la política de privacidad de ElevenLabs.
          </li>
          <li>
            Proveedores de alojamiento, base de datos, correo o infraestructura necesarios para operar la aplicación.
          </li>
        </ul>
        <p>
          Algunos de estos proveedores pueden estar ubicados fuera del Espacio Económico Europeo; en esos casos se aplicarán las garantías previstas
          en la normativa de protección de datos (por ejemplo cláusulas contractuales tipo u otras medidas adecuadas).
        </p>
      </>
    ),
  },
  {
    title: '4. Conservación y minimización',
    content: (
      <>
        <p>
          Se procurará conservar únicamente la información necesaria para prestar el servicio, gestionar la relación contractual y el plan contratado,
          cumplir obligaciones legales y atender requisitos técnicos.
        </p>
        <p>
          El diseño de Luma Grid prioriza la minimización de datos y el almacenamiento vinculado a la utilidad real para el usuario final.
        </p>
      </>
    ),
  },
  {
    title: '5. Compartición de datos',
    content: (
      <>
        <p>
          No se venden datos personales. Los datos pueden comunicarse a los encargados y proveedores indicados cuando sea necesario para la prestación
          del servicio, o cuando exista obligación legal o requerimiento de autoridad competente.
        </p>
        <p>
          Cualquier integración adicional futura deberá respetar esta política y el marco legal aplicable.
        </p>
      </>
    ),
  },
  {
    title: '6. Derechos del usuario',
    content: (
      <>
        <p>
          En los términos previstos en el Reglamento (UE) 2016/679 y la normativa española de protección de datos, puedes ejercer los derechos de acceso,
          rectificación, supresión, limitación del tratamiento, portabilidad y oposición, así como retirar el consentimiento cuando el tratamiento se base en él.
        </p>
        <p>
          También puedes presentar reclamación ante la Agencia Española de Protección de Datos u otra autoridad competente.
        </p>
        <p>
          Para ejercer derechos o solicitar información sobre el tratamiento, puedes contactar a través de los canales que Luma Grid habilite al efecto
          (por ejemplo correo indicado en el sitio o en la aplicación).
        </p>
      </>
    ),
  },
  {
    title: '7. Seguridad',
    content: (
      <>
        <p>
          Luma Grid adopta medidas razonables para proteger la información frente a accesos no autorizados, alteraciones indebidas o pérdida accidental.
        </p>
        <p>
          Aun así, ningún sistema conectado a internet puede garantizar una seguridad absoluta, por lo que se recomienda mantener prácticas seguras de acceso y gestión de credenciales.
        </p>
      </>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacidad"
      title="Política de privacidad"
      intro="Esta política describe qué datos puede tratar Luma Grid, con qué finalidad, cómo intervienen proveedores como Stripe y ElevenLabs, y cuáles son tus derechos."
      sections={sections}
    />
  )
}
