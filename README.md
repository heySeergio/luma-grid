# Luma Grid

Luma Grid es una aplicación AAC/CAA pensada para comunicación aumentativa y alternativa en español. Combina un tablero de símbolos, construcción de frases, voz, tableros configurables, panel de administración y una capa léxica que ayuda a conjugar, clasificar palabras y mejorar la predicción contextual.

**Descripción orientada a familias y equipos no técnicos:** [PROYECTO.md](./PROYECTO.md).

## Qué hace el proyecto

- Permite comunicarse mediante un grid de símbolos y carpetas temáticas.
- Construye frases naturales a partir de selecciones AAC.
- Usa una capa léxica para detectar tipo de palabra, enlazar lexemas y mejorar predicción/conjugación.
- Incluye administración por tableros con edición visual del tablero.
- Soporta tema claro/oscuro, branding propio y opción de tipografía adaptada a dislexia.
- Está pensado para uso web tipo PWA y para evolucionar hacia flujos offline y accesibles.

## Funcionalidades principales

- `Tablero AAC`
  Selección de símbolos, carpetas, frases rápidas, teclado y reproducción de voz.

- `Panel de administración`
  Gestión de tableros (incl. cuál se abre por defecto al iniciar), símbolos, posiciones, grid, carpetas en tablero demo y en tableros propios, categorías, colores, cuenta y revisión léxica.

- `Autenticación`
  Login y registro con `NextAuth` + credenciales.

- `Sistema léxico`
  Detección automática de lema, POS, confianza, overrides manuales, conjugación y predicción por contexto.

- `Predicción AAC`
  Aprende de secuencias de uso y combina reglas gramaticales con historial del tablero.

- `Branding y páginas públicas`
  Landing, branding, páginas legales y footer global.

- `Accesibilidad visual`
  Tema modular claro/oscuro y fuente OpenDyslexic opcional.

## Stack técnico

- `Next.js 16` con `App Router`
- `React 18`
- `TypeScript`
- `Tailwind CSS`
- `NextAuth`
- `Prisma` + `PostgreSQL (Neon)`
- `Framer Motion`
- `dnd-kit`
- `next-themes`
- `bcryptjs` (hash de contraseñas, compatible con Vercel sin binario nativo)

## Estructura importante

```text
app/
  page.tsx                Landing
  tablero/                Interfaz AAC principal
  admin/                  Panel de administración
  branding/               Hub de branding
  login/ register/        Auth
  api/                    Rutas API y auth
  actions/                Server actions

components/
  app/                    UI del comunicador
  site/                   Branding, footer, páginas legales

lib/
  auth.ts                 Configuración NextAuth
  prisma.ts               Cliente Prisma
  data/defaultSymbols.ts  Grid y vocabulario base
  lexicon/                Normalización, detección, preguntas, conjugación
  ui/                     Tokens visuales y utilidades de color
  voice/                  Adaptador de síntesis de voz

prisma/
  schema.prisma           Modelo de datos
  migrations/             Migraciones
  seed-lexicon.mjs        Banco léxico inicial
```

## Rutas principales

- `/`
  Landing pública del producto.

- `/tablero`
  Interfaz principal de comunicación AAC.

- `/admin`
  Panel de administración para tableros y símbolos.

- `/branding`
  Página de sistema visual, logos, activos y paleta.

- `/login`
  Inicio de sesión.

- `/register`
  Registro de cuenta.

- `/terminos`, `/privacidad`, `/cookies`
  Páginas legales.

## Modelo de datos resumido

El proyecto separa muy claramente la parte visual AAC de la parte lingüística:

- `User`
  Cuenta, tema preferido y opción de tipografía adaptada a dislexia.

- `Profile`
  Tablero de uso del comunicador. Cada usuario puede tener varios.

- `Symbol`
  Botón visual del grid. Guarda etiqueta, emoji, color, posición y metadatos léxicos.

- `Phrase`
  Frases rápidas o fijadas.

- `Lexeme`
  Entrada lingüística base: lema, categoría gramatical y rasgos.

- `LexemeForm`
  Formas flexionadas o superficies reconocibles.

- `LexemeAlias`
  Alias o variantes toleradas.

- `PredictionTransition`
  Relación entre términos seleccionados para mejorar predicción.

- `SymbolUsageEvent`
  Registro real de uso para aprendizaje contextual.

## Sistema léxico

La capa léxica es uno de los núcleos del proyecto.

Hace posible:

- detectar automáticamente un lexema a partir de la etiqueta del símbolo
- guardar `normalizedLabel`, `lexemeId`, `posType`, `posConfidence`
- diferenciar entre análisis automático y corrección manual
- mejorar la predicción AAC
- aplicar conjugación con más contexto
- tratar preguntas como `¿Qué?`, `¿Quién?`, `¿Dónde?`, etc.

Flujo general:

1. Se normaliza el texto.
2. Se busca coincidencia en alias, formas y lema.
3. Si no hay coincidencia buena, se aplican heurísticas.
4. Se guarda el análisis en el símbolo.
5. La predicción reutiliza esa información junto al historial del tablero.

La arquitectura léxica vive en el código: modelo en `prisma/schema.prisma`, datos semilla en `prisma/seed-lexicon.mjs`, lógica en `lib/lexicon/` y acciones en `app/actions/lexicon.ts` y `app/actions/predictions.ts`.

## Interfaz AAC

La interfaz principal vive en `components/app/AppInterface.tsx`.

Incluye:

- grid principal de símbolos
- navegación por carpetas
- teclado integrado
- frases rápidas
- sugerencias predictivas
- lectura con voz
- selector de tablero
- lógica de seguimiento de secuencia para aprendizaje

## Panel de administración

El admin permite:

- crear, editar y eliminar tableros
- cambiar dimensiones del grid
- editar símbolos
- cambiar color, emoji, categoría y tipo gramatical
- guardar overrides gramaticales manuales
- revisar cobertura léxica
- cambiar preferencias de cuenta

También incorpora:

- vista grid
- vista lista
- drag and drop
- branding del producto

## Tema, branding y accesibilidad

El proyecto usa un sistema visual modular basado en variables CSS.

Incluye:

- modo claro
- modo oscuro
- selector de tema
- branding integrado en landing, footer, admin y páginas públicas
- opción de `Tipografía adaptada a dislexia`

La fuente de dislexia usa OpenDyslexic servida localmente.

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

El proyecto usa `.env` / `.env.local`.

Como mínimo conviene definir:

```bash
NEXTAUTH_SECRET=tu_secreto
NEXTAUTH_URL=http://localhost:3000
```

Si ya existe `.env` en el proyecto, respeta esa configuración.

### 3. Aplicar base de datos

```bash
npx prisma migrate dev
```

### 4. Sembrar banco léxico

```bash
npm run seed:lexicon
```

### 5. Arrancar en desarrollo

```bash
npm run dev
```

## Scripts útiles

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run seed:lexicon
npm run test:lexicon-detection
```

### Restaurar posiciones del tablero demo (BD)

Si el tablero **demo** quedó descolocado (coordenadas en base de datos distintas de la plantilla), con `DATABASE_URL` cargada (`.env` / `.env.local`):

```bash
npm run repair:demo-email
```

Por defecto actúa sobre `sergio.tdc.tdc@gmail.com`. Otro usuario:

```bash
REPAIR_EMAIL=correo@ejemplo.com npm run repair:demo-email
```

En el panel **Admin** también hay el botón **Restaurar plantilla demo** (sidebar, con el tablero demo seleccionado, y en la cabecera de la vista grid).

## Notas de desarrollo

- `middleware.ts` protege `admin`, `tablero` y algunas rutas API.
- El proyecto usa `server actions` en `app/actions/`.
- Algunas partes del código incluyen fallbacks defensivos para clientes Prisma desfasados durante desarrollo.
- El banco léxico se puede ampliar de forma progresiva sin reestructurar el sistema.

## Observabilidad léxica

Además de `getProfileLexiconCoverage`, existe `getProfileLexiconObservability` en `app/actions/lexicon.ts` para exponer métricas operativas por tablero:

- cobertura y ratio resuelto
- tasa de override manual
- eventos de uso en 7 días
- transiciones registradas en 7 días
- uso sin `lexemeId` en 7 días
- símbolos con baja confianza

Estas métricas ayudan a priorizar ampliaciones del seed y ajustes del predictor.

## Offline y sincronización (Dexie vs servidor)

Estado actual recomendado:

- **Fuente de verdad:** servidor (`Prisma` + Postgres/Neon).
- **Cliente local (`Dexie`):** caché/interacción para continuidad UX.
- **Predicción y aprendizaje:** se calculan con eventos persistidos en servidor (`SymbolUsageEvent`, `PredictionTransition`).

Cuando no hay red:

- el usuario puede seguir interactuando con el tablero local,
- los eventos locales deben considerarse pendientes de sincronización,
- hasta sincronizar, la predicción de servidor no verá esas secuencias recientes.

Buenas prácticas:

1. etiquetar eventos locales con `phraseSessionId` y timestamp,
2. reintentar envío en segundo plano al recuperar conexión,
3. deduplicar por (`phraseSessionId`, `sequenceIndex`) durante sync,
4. refrescar sugerencias tras completar sincronización.

## Estado actual del proyecto

Luma Grid ya tiene:

- autenticación funcional
- panel admin con tableros
- grid base por defecto
- branding integrado
- sistema léxico operativo
- cobertura léxica completa para el panel default
- predicción contextual AAC
- adaptación visual claro/oscuro

## Próximos pasos naturales

- mejorar cobertura léxica de vocabulario no default
- enriquecer aún más el diccionario de español AAC
- ampliar analítica de uso por tablero
- afinar accesibilidad y scanning
- preparar despliegue de producción y PWA completa

## Licencia y uso

Este repositorio no incluye todavía una licencia formal explícita en este README. Si el proyecto va a abrirse o compartirse públicamente, conviene añadir una licencia en raíz y documentar condiciones de uso.
