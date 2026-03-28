import LegalPage from '@/components/site/LegalPage'

const sections = [
  {
    title: '1. Datos que pueden tratarse',
    content: (
      <>
        <p>
          Luma Grid puede tratar datos básicos de cuenta como nombre, correo electrónico, preferencias de tema, perfiles configurados, símbolos, frases y ajustes asociados al uso del servicio.
        </p>
        <p>
          En función de la configuración del producto, también pueden tratarse eventos de uso necesarios para mejorar la predicción AAC, la experiencia y la estabilidad técnica.
        </p>
      </>
    ),
  },
  {
    title: '2. Finalidad del tratamiento',
    content: (
      <>
        <p>
          Los datos se utilizan para permitir el acceso a la aplicación, guardar configuraciones, personalizar perfiles, mejorar el sistema léxico y ofrecer funcionalidades como historial, predicción y reproducción de frases.
        </p>
        <p>
          También pueden emplearse para prevenir errores, proteger la seguridad del servicio y mantener la continuidad operativa de la plataforma.
        </p>
      </>
    ),
  },
  {
    title: '3. Base de conservación y minimización',
    content: (
      <>
        <p>
          Se procurará conservar únicamente la información necesaria para prestar el servicio, mejorar su funcionamiento y atender requisitos técnicos o legales aplicables.
        </p>
        <p>
          El diseño de Luma Grid prioriza la minimización de datos y el almacenamiento vinculado a la utilidad real para el usuario final.
        </p>
      </>
    ),
  },
  {
    title: '4. Compartición de datos',
    content: (
      <>
        <p>
          No se comparten datos personales con terceros salvo cuando sea necesario para la prestación técnica del servicio, por obligación legal o mediante proveedores claramente vinculados al funcionamiento de la plataforma.
        </p>
        <p>
          Cualquier integración futura de terceros deberá respetar esta política y el marco legal aplicable.
        </p>
      </>
    ),
  },
  {
    title: '5. Derechos del usuario',
    content: (
      <>
        <p>
          El usuario puede solicitar el acceso, rectificación, actualización o supresión de sus datos, así como limitar u oponerse al tratamiento cuando corresponda legalmente.
        </p>
        <p>
          También puede solicitar información adicional sobre el alcance del tratamiento de sus datos dentro de la plataforma.
        </p>
      </>
    ),
  },
  {
    title: '6. Seguridad',
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
      intro="Esta política describe de forma general qué datos puede tratar Luma Grid, con qué finalidad y bajo qué criterios de protección y minimización."
      sections={sections}
    />
  )
}
