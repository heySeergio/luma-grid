import LegalPage from '@/components/site/LegalPage'

const sections = [
  {
    title: '1. Qué son las cookies',
    content: (
      <>
        <p>
          Las cookies son pequeños archivos o mecanismos de almacenamiento que permiten recordar información del usuario, mantener sesiones activas o mejorar la experiencia de navegación.
        </p>
      </>
    ),
  },
  {
    title: '2. Uso en Luma Grid',
    content: (
      <>
        <p>
          Luma Grid puede utilizar cookies o tecnologías equivalentes para mantener la sesión iniciada, recordar preferencias básicas y sostener el funcionamiento técnico de la aplicación.
        </p>
        <p>
          Dependiendo de la evolución del producto, también podrían emplearse mecanismos de almacenamiento para configuración visual, rendimiento o medición funcional del uso.
        </p>
      </>
    ),
  },
  {
    title: '3. Tipos de cookies que pueden intervenir',
    content: (
      <>
        <p>
          Entre los tipos de cookies que pueden estar presentes se incluyen cookies técnicas, de autenticación, de preferencias y, en su caso, de analítica estrictamente orientada a mejorar el producto.
        </p>
      </>
    ),
  },
  {
    title: '4. Gestión y control',
    content: (
      <>
        <p>
          El usuario puede configurar su navegador para bloquear o eliminar cookies, aunque hacerlo puede afectar al inicio de sesión, la persistencia de preferencias o determinadas funciones del servicio.
        </p>
      </>
    ),
  },
  {
    title: '5. Actualizaciones',
    content: (
      <>
        <p>
          Esta política podrá actualizarse si cambian los mecanismos de almacenamiento utilizados o si se incorporan nuevas integraciones, herramientas o funciones dentro de la plataforma.
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
      intro="Esta página resume el posible uso de cookies y tecnologías similares dentro de Luma Grid para autenticación, preferencias y funcionamiento técnico del servicio."
      sections={sections}
    />
  )
}
