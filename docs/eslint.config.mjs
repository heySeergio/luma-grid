import coreWebVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...coreWebVitals,
  {
    rules: {
      /** Patrones válidos (hash del navegador, TOC desde DOM, cerrar drawer al navegar). */
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]

export default config