import LegalPage from '@/components/site/LegalPage'

const sections = [
  {
    title: '1. Objeto del servicio',
    content: (
      <>
        <p>
          Luma Grid es una aplicación orientada a la Comunicación Aumentativa y Alternativa (CAA/AAC), pensada para facilitar la creación
          de frases, el uso de símbolos, la gestión de perfiles y la reproducción de voz.
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
          Luma Grid puede incorporar medidas de autenticación, validación y control de acceso para proteger áreas sensibles como el panel de administración.
        </p>
      </>
    ),
  },
  {
    title: '4. Propiedad intelectual',
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
    title: '5. Limitación de responsabilidad',
    content: (
      <>
        <p>
          Luma Grid se ofrece con el objetivo de mejorar la comunicación, pero no sustituye criterio clínico, terapéutico, educativo o profesional especializado.
        </p>
        <p>
          Aunque se trabaja para mantener la herramienta disponible y fiable, no se garantiza la ausencia total de errores, interrupciones o incidencias técnicas.
        </p>
      </>
    ),
  },
  {
    title: '6. Modificaciones',
    content: (
      <>
        <p>
          Estas condiciones pueden actualizarse para reflejar cambios legales, funcionales o de seguridad. Las nuevas versiones serán aplicables desde su publicación.
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
      intro="Estas condiciones regulan el acceso y uso general de Luma Grid como plataforma digital orientada a la comunicación aumentativa y alternativa."
      sections={sections}
    />
  )
}
