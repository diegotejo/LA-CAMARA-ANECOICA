# La Camara Anecoica - Web oficial

Sitio editorial en Next.js para el canal [La Camara Anecoica](https://www.youtube.com/@CamaraAnecoica). La propuesta visual ya parte de una base sobria y atmosferica; sobre esa direccion se han ido incorporando activos propios del proyecto, estructura de archivo y piezas audiovisuales ligadas a cada serie.

## Estado actual

- Home con hero editorial, logo oficial y acceso directo al archivo audiovisual.
- Navegacion persistente con branding integrado en cabecera y footer.
- Pagina de `videos` con galeria de ensayos y una franja visual para las tres series del canal.
- Paginas para `cuestionarios`, `articulos` y `sobre` alineadas con la identidad del proyecto.
- Pagina `mapamundi-politico` con mapa politico interactivo, ficha por pais y filtros editoriales.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- CSS Modules
- Framer Motion

## Configuracion de entorno

La web ya admite configuracion minima por variables de entorno. Copia `.env.example` a `.env.local` y ajusta los valores si hace falta.

```bash
PORT=3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_YOUTUBE_CHANNEL_URL=https://www.youtube.com/@CamaraAnecoica
NEXT_PUBLIC_INSTAGRAM_URL=https://www.instagram.com/anecoicacamara/
NEXT_PUBLIC_ENABLE_HEADER_LOGO_MOTION=false
```

- `PORT`: puerto de `next dev` y `next start`.
- `NEXT_PUBLIC_SITE_URL`: URL base usada para metadata y referencias canonicas.
- `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL`: URL centralizada del canal para CTAs y enlaces globales.
- `NEXT_PUBLIC_INSTAGRAM_URL`: URL centralizada del perfil de Instagram.
- `NEXT_PUBLIC_ENABLE_HEADER_LOGO_MOTION`: activa la capa experimental de animacion del logo del header (por defecto desactivada).

La configuracion publica se centraliza en `src/lib/site-config.ts`.

## Activos del proyecto integrados

Se han copiado al proyecto los recursos propietarios usados ya por la web:

- `public/brand/logo-anecoica.png`
- `public/brand/logo-anecoica-white.png`
- `public/intros/orbis-terrarum.mp4`
- `public/intros/la-tribu.mp4`
- `public/intros/antipendulo.mp4`

Origen local de los archivos:

- `C:\Users\daiki\Desktop\Cámara Anecoica\RECURSOS GRÁFICOS`
- `C:\Users\daiki\Desktop\Cámara Anecoica\INTROS`

## Estructura relevante

```text
public/
  brand/
    logo-anecoica.png
    logo-anecoica-white.png
  intros/
    antipendulo.mp4
    la-tribu.mp4
    orbis-terrarum.mp4
src/
  app/
    page.tsx
    mapamundi-politico/page.tsx
    videos/page.tsx
    cuestionarios/page.tsx
    articulos/page.tsx
    sobre/page.tsx
    layout.tsx
    globals.css
  components/
    MapamundiPolitico.tsx
    BrandLogo.tsx
    Navbar.tsx
    Footer.tsx
    SeriesPreviewStrip.tsx
    VideoGallery.tsx
    VideoCard.tsx
data/
  mapamundi/
    countries.normalized.json
    geometry.geo.json
    update-report.json
  videos.json
  quizzes.json
```

## Gestion de contenidos

### Anadir un video

Edita `data/videos.json` y anade un objeto con esta forma:

```json
{
  "id": "video-10",
  "title": "Titulo del video",
  "youtubeEmbedId": "ID_DEL_VIDEO_YOUTUBE",
  "slug": "slug-url",
  "topic": "Tema",
  "series": "Orbis Terrarum",
  "shortDescription": "Descripcion breve",
  "bibliography": [
    {
      "title": "Autor — Obra (ano)",
      "note": "Breve nota que conecta la obra con el tema del video."
    }
  ],
  "relatedConcepts": ["Concepto 1", "Concepto 2"],
  "publishedDate": "YYYY-MM-DD"
}
```

Series actualmente contempladas por la interfaz:

- `Orbis Terrarum`
- `La Tribu`
- `Antipendulo`

### Anadir un cuestionario

Edita `data/quizzes.json` siguiendo la estructura ya presente en el archivo.

## Desarrollo local

```bash
npm install
npm run dev
```

## Mapamundi politico: datos y actualizacion

La herramienta usa solo fuentes estructuradas permitidas:

- Natural Earth: geometria y criterio cartografico de paises/territorios.
- REST Countries: nombre, bandera, capital, poblacion y metadatos base.
- Banco Mundial: PIB y PIB per capita.
- Wikidata: forma de gobierno, jefe de Estado y jefe de Gobierno.

Pipeline manual local:

```bash
npm run map:update
```

Salida del pipeline:

- `data/mapamundi/countries.normalized.json`: dataset unificado por ISO3.
- `data/mapamundi/geometry.geo.json`: geometria optimizada para Leaflet.
- `data/mapamundi/update-report.json`: incidencias por pais/fuente.
- Si Banco Mundial falla temporalmente, el pipeline conserva los ultimos valores validos de PIB/PIB per capita y lo deja reflejado en `update-report.json`.

Clasificacion politica normalizada en la ficha:

- `Forma de gobierno`: parlamentarismo, presidencialismo, semipresidencialismo, etc.
- `Modelo de organizacion`: federalismo, confederalismo, estado unitario, etc.
- `Estructura de gobierno`: monarquia, republica, teocracia, etc.

La separacion se hace con reglas de normalizacion declaradas en `scripts/mapamundi/update-dataset.mjs`.

Automatizacion:

- Workflow mensual en `.github/workflows/mapamundi-monthly-update.yml`.
- Se ejecuta el dia 1 de cada mes, comitea cambios de `data/mapamundi` y hace `push` a `main`.
- Si el proyecto esta conectado a Vercel con despliegue por push en `main`, el redeploy queda automatico tras cada actualizacion mensual.

Por defecto el servidor local queda en `http://localhost:3000`, pero puedes cambiarlo definiendo `PORT` en `.env.local`.

## Verificacion recomendada

```bash
npm run lint
npm run build
```

## Logs de desarrollo

- El script `npm run dev` limpia `dev-server.log` antes de cada arranque para evitar ruido de sesiones anteriores.
- `dev-server.log` esta ignorado en git.
