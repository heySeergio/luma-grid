import coreWebVitals from 'eslint-config-next/core-web-vitals'

/** Regla nueva en eslint-plugin-react-hooks 7: patrones válidos de datos/async en efectos quedan marcados. */
const config = [
  ...coreWebVitals,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]

export default config
