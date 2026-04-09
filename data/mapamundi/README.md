# Mapamundi politico - fuentes, creditos y funcion tecnica

Este documento resume las fuentes y recursos usados por la herramienta `Mapamundi politico` de La Camara Anecoica, y explica que papel cumple cada uno dentro del sistema.

## Fuentes de datos autorizadas

### 1) Natural Earth
- Web: https://www.naturalearthdata.com/
- Repositorio vectorial usado: https://github.com/nvkelso/natural-earth-vector
- Rol en la herramienta:
  - Proporciona la geometria base de paises y territorios (poligonos GeoJSON).
  - Marca el criterio cartografico de representacion territorial, incluidas zonas en disputa.
  - Sirve como base de integracion por identificadores ISO3 para cruzar datos de otras fuentes.

### 2) REST Countries
- Web/API: https://restcountries.com/
- Rol en la herramienta:
  - Aporta metadatos generales por pais (nombre, bandera, capital, poblacion, region).
  - Alimenta la parte informativa de la ficha editorial del pais.
  - Refuerza el etiquetado y la legibilidad de la capa cartografica.

### 3) Banco Mundial (World Bank Open Data)
- Portal: https://data.worldbank.org/
- API: https://api.worldbank.org/
- Indicadores usados:
  - `NY.GDP.MKTP.CD` (PIB, USD corrientes)
  - `NY.GDP.PCAP.CD` (PIB per capita, USD corrientes)
- Rol en la herramienta:
  - Aporta indicadores economicos comparables para cada pais.
  - Nutre los campos `PIB` y `PIB per capita` de la ficha.
  - Se integra en el pipeline mensual; si la API falla temporalmente, se conserva el ultimo valor valido cacheado.

### 4) Wikidata
- Web: https://www.wikidata.org/
- Endpoint SPARQL: https://query.wikidata.org/
- Rol en la herramienta:
  - Aporta la capa politico-institucional: forma de gobierno, jefatura de Estado y jefatura de Gobierno.
  - Permite normalizar la nueva estructura analitica en tres dimensiones:
    - Forma de gobierno
    - Modelo de organizacion
    - Estructura de gobierno
  - Alimenta filtros politicos y busqueda interna por categorias comparables.

## Recursos de interfaz y render

### Leaflet.js
- Web: https://leafletjs.com/
- Repositorio: https://github.com/Leaflet/Leaflet
- Rol en la herramienta:
  - Motor de visualizacion del mapa interactivo.
  - Gestiona zoom, paneo, eventos hover/click, estilos por capa y tooltips.
  - Se usa como base ligera para mantener buen rendimiento en desktop y mobile.

## Resumen funcional por capa

- Cartografia base: Natural Earth
- Datos generales pais: REST Countries
- Datos economicos: Banco Mundial
- Datos politico-institucionales: Wikidata
- Interaccion y render mapa: Leaflet.js

## Criterio de integridad y transparencia

- No se usan fuentes no estructuradas ni scraping de prensa/blogs/Wikipedia HTML.
- No se introducen APIs privadas u opacas fuera del alcance aprobado.
- El pipeline deja trazabilidad en `update-report.json` para incidencias por fuente y por pais.
- La representacion territorial sigue el criterio tecnico de Natural Earth y no implica posicionamiento político alguno del proyecto.
