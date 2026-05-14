import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { DocsFeedbackForm } from '@/components/feedback/DocsFeedbackForm'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
}

const faq: { q: string; a: ReactNode }[] = [
  {
    q: '¿Necesito instalar algo en el ordenador?',
    a: 'Luma Grid funciona en el navegador. En el móvil o tableta también puedes añadirla a la pantalla de inicio como una app, pero no es obligatorio.',
  },
  {
    q: '¿La voz con IA sustituye a una persona?',
    a: 'No. La voz lee lo que tú o la persona usuaria construyen, y las sugerencias son atajos. Siempre hay una persona detrás del mensaje.',
  },
  {
    q: '¿Qué son exactamente los pictogramas ARASAAC?',
    a: 'Son dibujos estandarizados del proyecto ARASAAC, muy usados en CAA en español. Ayudan a que muchos entornos (cole, terapia, casa) usen el mismo lenguaje visual.',
  },
  {
    q: '¿Puedo usar Luma Grid sin las sugerencias de IA?',
    a: 'Sí. Desde la configuración de la cuenta se puede ocultar la zona de sugerencias. El tablero y la voz siguen funcionando.',
  },
  {
    q: '¿Tengo que elegir entre tablero de pictos y teclado?',
    a: (
      <>
        No: en Luma Grid ambos se complementan en la misma barra de frase. Puedes mezclar pictos y letras sin cambiar de
        “modo” como en otros comunicadores. Más detalle en{' '}
        <Link href="/teclado-complementativo">Teclado complementativo</Link>.
      </>
    ),
  },
  {
    q: '¿Dónde veo cómo se usa el tablero?',
    a: 'En el panel de administración hay informes de uso y evaluación (periodos, categorías, exportar PDF). Solo quien tenga acceso al panel puede verlos.',
  },
  {
    q: '¿Cómo entro en la aplicación?',
    a: 'Abre tu navegador en lumagrid.app. En el menú lateral de esta ayuda tienes un acceso directo «Ir a la app».',
  },
  {
    q: '¿Los datos van cifrados por internet?',
    a: 'Sí. La aplicación y esta ayuda se sirven por HTTPS: entre tu navegador o dispositivo y los servidores de Luma Grid la información viaja cifrada en tránsito mediante TLS (no circula en claro por la red).',
  },
]

export default function PreguntasPage() {
  return (
    <article className="docs-article docs-prose" data-doc-article>
      <header className="docs-article-header">
        <p className="docs-eyebrow">Ayuda</p>
        <h1 id="preguntas">Preguntas frecuentes</h1>
        <p className="docs-hero-lead">
          Respuestas breves a lo que más nos preguntan. Si necesitas algo más concreto, contacta con quien administra la
          cuenta o con el equipo de Luma Grid desde la web.
        </p>
      </header>

      <h2 id="lista">Dudas habituales</h2>
      <dl className="docs-faq">
        {faq.map((item) => (
          <div key={item.q} className="docs-faq-item">
            <dt>{item.q}</dt>
            <dd>{item.a}</dd>
          </div>
        ))}
      </dl>

      <section className="docs-faq-contact" id="escribenos" aria-labelledby="escribenos-heading">
        <h2 id="escribenos-heading">¿Tienes alguna duda?</h2>
        <p>
          Escríbenos con el mismo formulario de <strong>feedback</strong> que usamos en la web principal: tu mensaje se
          guarda en la base de datos de Luma Grid y quien tenga acceso al <strong>panel interno (cpanel)</strong> en{' '}
          <Link href="https://lumagrid.app/cpanel" prefetch={false}>
            lumagrid.app/cpanel
          </Link>{' '}
          podrá leerlo y gestionarlo junto al resto de opiniones.
        </p>
        <DocsFeedbackForm />
      </section>

      <h2 id="guia-funciones">Guías detalladas</h2>
      <p>
        Para profundizar sin tecnicismos, visita el{' '}
        <Link href="/empieza-aqui">recorrido desde cero</Link>, las páginas de <Link href="/voz-ia">Voz con IA</Link>,{' '}
        <Link href="/arasaac">ARASAAC</Link>, <Link href="/variantes">Variantes</Link>,{' '}
        <Link href="/teclado-complementativo">Teclado complementativo</Link> y{' '}
        <Link href="/lexico-y-evaluacion">Léxico y evaluación</Link>.
      </p>
    </article>
  )
}
