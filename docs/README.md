# Documentación (Luma Grid)

Sitio Next.js independiente para **docs.lumagrid.app**. Vive en este mismo repositorio; en Vercel se configura como **segundo proyecto** con **Root Directory** apuntando a `docs`.

Contenido orientado a **personas usuarias, familias y profesionales**: voz con IA, pictogramas ARASAAC, variantes de palabra, léxico y evaluación, preguntas frecuentes. Sin apartados técnicos para desarrolladores.

Interfaz tipo documentación (barra superior, lateral, TOC). Branding Luma Grid: canvas/forest, acento índigo, tipografía Bricolage (Adobe Fonts, mismo kit que la web) y logo `public/logo-luma-grid.png`.

## Desarrollo

```bash
cd docs
npm install
npm run dev
```

Por defecto el servidor escucha en el puerto **3001** para no solaparse con la app principal (`next dev` en la raíz, puerto 3000).

## Producción (local)

```bash
cd docs
npm run build
npm start
```

## Vercel

1. New Project → mismo repositorio que la app.
2. **Root Directory**: `docs`.
3. Build: `npm run build` (por defecto). Output: Next.js (sin `output: 'export'`).
4. Dominio: `docs.lumagrid.app` en el proyecto de documentación.

No hace falta tocar el `package.json` de la raíz del monorepo.
