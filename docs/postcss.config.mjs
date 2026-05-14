/**
 * PostCSS propio del sitio docs: evita heredar el postcss.config.mjs de la raíz del
 * monorepo (que activa tailwindcss), ya que la documentación solo usa CSS en globals.css.
 *
 * @type {import('postcss-load-config').Config}
 */
const config = {
  plugins: {},
}

export default config
