import LegalPage from '@/components/site/LegalPage'

const sections = [
  {
    title: '1. Datos que pueden tratarse',
    content: (
      <>
        <p>
          <strong className="text-[var(--app-foreground)]">Cuenta e identificación:</strong> correo electrónico, nombre si lo facilitas, contraseña
          de forma protegida (salvo cuentas que solo usan inicio de sesión con Google u otro proveedor, sin contraseña en Luma Grid), preferencias de
          interfaz (tema, tipografía adaptada, opciones del tablero y de predicción), identificadores de sesión y datos técnicos necesarios para el
          funcionamiento seguro.
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">Inicio de sesión con Google:</strong> si lo utilizas, Google puede facilitar datos básicos
          de perfil (por ejemplo correo y nombre) según tu configuración y su política; Luma Grid los asocia a tu cuenta en la aplicación.
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">Uso del comunicador:</strong> tableros, símbolos, disposición del grid, carpetas, frases
          guardadas, ajustes de acceso asistido (p. ej. escáner), configuración de voz en la aplicación (modo de síntesis, identificador de voz cuando
          aplica) y contenidos que guardes como usuario.
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">Aprendizaje de predicción AAC (opcional):</strong> si mantienes activa la opción de compartir
          pulsaciones y transiciones para mejorar predicciones, se pueden registrar en el servidor eventos relativos a la secuencia de símbolos
          utilizados en el tablero (identificadores de símbolo, información léxica asociada al símbolo y metadatos de sesión), con la finalidad de
          ajustar sugerencias. Puedes desactivar esta opción en la configuración de cuenta; al hacerlo se dejan de acumular esos datos para ese fin y se
          pueden eliminar colas locales pendientes en el dispositivo.
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">Voz y facturación de síntesis:</strong> texto enviado a servicios de síntesis de voz de
          terceros cuando elijas voces gestionadas por proveedor externo; contadores de caracteres u otros límites asociados al plan y periodo de
          facturación; en el caso de clonación de voz, muestras de audio que envíes para crear una voz personalizada.
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">Caché de audio en servidor:</strong> para determinadas voces, la aplicación puede almacenar de
          forma acotada frases ya sintetizadas para evitar regenerar el mismo audio (texto acotado a la petición de voz).
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">Planes y pagos:</strong> tipo de plan, estado de la suscripción, identificadores de cliente o
          suscripción ante el proveedor de pagos cuando existan, y los datos necesarios para facturación u obligaciones fiscales y contables.
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">Panel de administración y léxico:</strong> datos que visualices o generes al revisar
          cobertura léxica, sugerencias de detección y métricas asociadas al tablero; no suponen por sí una “analítica” de terceros comercial, sino
          funciones del propio producto sobre tus contenidos.
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">Almacenamiento en el dispositivo:</strong> el navegador puede guardar datos en{' '}
          <em>IndexedDB</em> u otros medios locales (p. ej. cola de eventos de uso pendientes de sincronizar, caché de la aplicación) para continuidad
          cuando la red es intermitente. El detalle se describe en la política de cookies y almacenamiento local.
        </p>
        <p>
          <strong className="text-[var(--app-foreground)]">Funciones con modelos de lenguaje:</strong> si en una versión del producto se utilizan
          proveedores de inteligencia artificial para asistencia o predicción (p. ej. envío de texto o listas de símbolos a un modelo en la nube), esos
          contenidos se tratarán según la política del proveedor correspondiente y solo en la medida necesaria para esa función.
        </p>
      </>
    ),
  },
  {
    title: '2. Finalidad del tratamiento',
    content: (
      <>
        <p>
          Los datos se utilizan para permitir el acceso a la aplicación, gestionar cuentas y suscripciones, guardar configuraciones, personalizar
          tableros, aplicar los límites del plan, ofrecer predicción y comunicación aumentativa, aplicar el sistema léxico (incluida conjugación y
          detección cuando corresponda), reproducir frases con voz del sistema o mediante proveedores de síntesis, y mantener la seguridad del servicio.
        </p>
        <p>
          Los datos opcionales de uso del tablero para predicción se tratan para mejorar las sugerencias contextuales en tu cuenta, no para publicidad de
          terceros.
        </p>
        <p>
          Los datos de pago se tratan para formalizar la relación contractual, procesar cobros y permitir la gestión de la suscripción (incluido acceso
          al portal del proveedor de pagos cuando esté disponible).
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
          política cuando actúan como responsables independientes. Según la configuración del despliegue, pueden intervenir, entre otros:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-[var(--app-foreground)]">Proveedor de alojamiento y base de datos</strong> (p. ej. infraestructura en la nube y{' '}
            <strong className="text-[var(--app-foreground)]">PostgreSQL</strong>) para almacenar cuentas, tableros y datos de aplicación.
          </li>
          <li>
            <strong className="text-[var(--app-foreground)]">Stripe</strong> (u otro procesador de pagos) para cobros, suscripciones y gestión del cliente
            de pago.
          </li>
          <li>
            <strong className="text-[var(--app-foreground)]">ElevenLabs</strong> u otros proveedores de voz para síntesis y, si lo utilizas, creación de
            voces a partir de muestras de audio.
          </li>
          <li>
            <strong className="text-[var(--app-foreground)]">Google</strong> (u otro proveedor OAuth) cuando inicies sesión con una cuenta externa.
          </li>
          <li>
            <strong className="text-[var(--app-foreground)]">Proveedores de almacenamiento de objetos</strong> (p. ej. para subida opcional de recursos
            gráficos en flujos concretos del sitio), cuando estén configurados.
          </li>
          <li>
            <strong className="text-[var(--app-foreground)]">Proveedores de modelos de lenguaje o IA</strong>, si una función del producto envía datos a
            dichos servicios.
          </li>
        </ul>
        <p>
          Algunos de estos proveedores pueden estar ubicados fuera del Espacio Económico Europeo; en esos casos se aplicarán las garantías previstas en la
          normativa de protección de datos (por ejemplo cláusulas contractuales tipo u otras medidas adecuadas).
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
          El diseño de Luma Grid prioriza la minimización de datos y el almacenamiento vinculado a la utilidad para la persona usuaria. Los eventos de
          uso para predicción solo se generan mientras mantengas activa la opción correspondiente.
        </p>
        <p>
          Esos mismos eventos pueden conservarse en servidor mientras la cuenta exista para permitir informes de uso en el panel (p. ej. resúmenes por
          periodos y comparación entre tramos). No se trata de un borrado automático al «cerrar» un informe en pantalla: el informe es una vista calculada
          sobre los datos almacenados. Podrán aplicarse políticas de retención o supresión al eliminar la cuenta o según lo publicado en su momento.
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
      intro="Descripción del tratamiento de datos en Luma Grid: cuenta (correo, contraseña u OAuth Google), tableros y comunicador, opción de compartir uso para predicción AAC, voz y límites de plan, pagos con Stripe, proveedores técnicos y almacenamiento local en el dispositivo."
      sections={sections}
    />
  )
}
