"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import L, { type Layer } from "leaflet";
import styles from "@/app/mapamundi-politico/page.module.css";
import type { MapCountryRecord, MapGeometryCollection } from "@/lib/mapamundi/types";

const NUMBER_FORMATTER = new Intl.NumberFormat("es-ES");
const CURRENCY_FORMATTER = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatNumber(value: number | null) {
  if (value === null) {
    return "No hay datos disponibles";
  }

  return NUMBER_FORMATTER.format(value);
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "No hay datos disponibles";
  }

  return CURRENCY_FORMATTER.format(value);
}

function normalizeSearchValue(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatTextValue(value: string | null | undefined) {
  if (!value || value.trim().length === 0 || value === "No disponible") {
    return "No hay datos disponibles";
  }

  return value;
}

interface MapamundiPoliticoProps {
  countries: MapCountryRecord[];
  geometry: MapGeometryCollection;
}

export default function MapamundiPolitico({ countries, geometry }: MapamundiPoliticoProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const layerByIsoRef = useRef<Map<string, Layer>>(new Map());

  const [search, setSearch] = useState("");
  const [continent, setContinent] = useState("Todos");
  const [politicalFilter, setPoliticalFilter] = useState("Todos");
  const [manualSelectedIso3, setManualSelectedIso3] = useState<string | null>(countries[0]?.iso3 ?? null);

  const countriesByIso = useMemo(() => {
    const map = new Map<string, MapCountryRecord>();

    for (const country of countries) {
      map.set(country.iso3, country);
    }

    return map;
  }, [countries]);

  const continents = useMemo(() => {
    return [
      "Todos",
      ...Array.from(new Set(countries.map((country) => country.continent))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    ];
  }, [countries]);

  const politicalFilters = useMemo(() => {
    return [
      "Todos",
      ...Array.from(new Set(countries.flatMap((country) => country.politicalFilterTags))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    ];
  }, [countries]);

  const filteredCountries = useMemo(() => {
    const normalizedSearch = normalizeSearchValue(search.trim());

    return countries.filter((country) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        normalizeSearchValue(country.countryName).includes(normalizedSearch);

      const matchesContinent = continent === "Todos" || country.continent === continent;
      const matchesSystem =
        politicalFilter === "Todos" || country.politicalFilterTags.includes(politicalFilter);

      const matchesPoliticalSearch =
        normalizedSearch.length === 0 ||
        country.politicalFilterTags.some((tag) => normalizeSearchValue(tag).includes(normalizedSearch)) ||
        country.politicalCharacteristics.governmentForm.some((value) =>
          normalizeSearchValue(value).includes(normalizedSearch),
        ) ||
        country.politicalCharacteristics.organizationModel.some((value) =>
          normalizeSearchValue(value).includes(normalizedSearch),
        ) ||
        country.politicalCharacteristics.governmentStructure.some((value) =>
          normalizeSearchValue(value).includes(normalizedSearch),
        );

      return (matchesSearch || matchesPoliticalSearch) && matchesContinent && matchesSystem;
    });
  }, [countries, continent, politicalFilter, search]);

  const filteredIsoSet = useMemo(() => {
    return new Set(filteredCountries.map((country) => country.iso3));
  }, [filteredCountries]);

  const selectedIso3 = useMemo(() => {
    if (manualSelectedIso3 && filteredIsoSet.has(manualSelectedIso3)) {
      return manualSelectedIso3;
    }

    return filteredCountries[0]?.iso3 ?? null;
  }, [filteredCountries, filteredIsoSet, manualSelectedIso3]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      minZoom: 1.8,
      maxZoom: 8,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      scrollWheelZoom: true,
      worldCopyJump: false,
      attributionControl: true,
      zoomAnimation: true,
    }).setView([20, 0], 2);

    map.attributionControl.setPrefix(
      '<a href="https://leafletjs.com" target="_blank" rel="noreferrer noopener">Leaflet</a> 🇺🇦',
    );

    const layerMap = layerByIsoRef.current;

    const layer = L.geoJSON(geometry as GeoJSON.FeatureCollection, {
      style: {
        color: "rgba(255,255,255,0.5)",
        weight: 1,
        fillColor: "rgba(184, 134, 91, 0.22)",
        fillOpacity: 0.55,
      },
      onEachFeature: (feature, mapLayer) => {
        const iso3 = feature.properties?.iso3;

        if (typeof iso3 === "string") {
          layerMap.set(iso3, mapLayer);
        }

        const pathLayer = mapLayer as L.Path;
        const label =
          typeof iso3 === "string"
            ? countriesByIso.get(iso3)?.countryName || feature.properties?.countryName || iso3
            : feature.properties?.countryName || "";

        if (label) {
          pathLayer.bindTooltip(label, {
            permanent: true,
            direction: "center",
            opacity: 0.82,
            className: styles.countryLabel,
            interactive: false,
          });
        }

        pathLayer.on({
          mouseover: () => {
            pathLayer.setStyle({
              color: "#f0d2ba",
              weight: 2,
              fillOpacity: 0.8,
            });
          },
          mouseout: () => {
            pathLayer.setStyle({
              color: "rgba(255,255,255,0.5)",
              weight: 1,
              fillColor: "rgba(184, 134, 91, 0.22)",
              fillOpacity: 0.55,
            });
          },
          click: () => {
            if (typeof iso3 === "string" && countriesByIso.has(iso3)) {
              setManualSelectedIso3(iso3);
            }
          },
        });
      },
    }).addTo(map);

    geoJsonRef.current = layer;
    mapRef.current = map;

    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: 3,
        animate: false,
      });
    }

    return () => {
      layerMap.clear();
      geoJsonRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [countriesByIso, geometry]);

  useEffect(() => {
    if (!geoJsonRef.current || !mapRef.current) {
      return;
    }

    geoJsonRef.current.eachLayer((layerEntry) => {
      const currentLayer = layerEntry as Layer & {
        feature?: {
          properties?: {
            iso3?: string;
          };
        };
        setStyle?: (style: L.PathOptions) => void;
        openTooltip?: () => void;
        closeTooltip?: () => void;
      };

      if (!currentLayer.setStyle) {
        return;
      }

      const iso3 = currentLayer.feature?.properties?.iso3;
      const isSelected = iso3 === selectedIso3;
      const isVisible = typeof iso3 === "string" ? filteredIsoSet.has(iso3) : false;

      currentLayer.setStyle({
        color: isSelected ? "#ffe3c5" : "rgba(255,255,255,0.5)",
        weight: isSelected ? 2.25 : 1,
        fillColor: isVisible ? "rgba(184, 134, 91, 0.22)" : "rgba(110, 110, 110, 0.15)",
        fillOpacity: isVisible ? 0.62 : 0.24,
      });

      if (isVisible && currentLayer.openTooltip) {
        currentLayer.openTooltip();
      }

      if (!isVisible && currentLayer.closeTooltip) {
        currentLayer.closeTooltip();
      }
    });

    if (!selectedIso3) {
      return;
    }

    const layer = layerByIsoRef.current.get(selectedIso3) as (L.Layer & {
      getBounds?: () => L.LatLngBounds;
    }) | undefined;

    if (!layer || typeof layer.getBounds !== "function") {
      return;
    }

    const bounds = layer.getBounds();
    if (!bounds.isValid()) {
      return;
    }

    mapRef.current.flyToBounds(bounds, {
      duration: 0.8,
      maxZoom: 4.5,
      padding: [28, 28],
    });
  }, [filteredIsoSet, selectedIso3]);

  const selectedCountry = selectedIso3 ? countriesByIso.get(selectedIso3) ?? null : null;

  const handleNextCountry = () => {
    if (filteredCountries.length === 0) {
      return;
    }

    if (!selectedIso3) {
      setManualSelectedIso3(filteredCountries[0].iso3);
      return;
    }

    const index = filteredCountries.findIndex((country) => country.iso3 === selectedIso3);
    const nextIndex = index >= 0 ? (index + 1) % filteredCountries.length : 0;
    setManualSelectedIso3(filteredCountries[nextIndex].iso3);
  };

  return (
    <section className={styles.toolWrap}>
      <div className={styles.controls}>
        <label className={styles.controlLabel}>
          Buscar país
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ej. Chile, Japón, Marruecos..."
            className={styles.input}
          />
        </label>

        <label className={styles.controlLabel}>
          Continente
          <select
            value={continent}
            onChange={(event) => setContinent(event.target.value)}
            className={styles.select}
          >
            {continents.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.controlLabel}>
          Sistema político
          <select
            value={politicalFilter}
            onChange={(event) => setPoliticalFilter(event.target.value)}
            className={styles.select}
          >
            {politicalFilters.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className={styles.nextButton} onClick={handleNextCountry}>
          Ir al siguiente país
        </button>
      </div>

      <div className={styles.layout}>
        <div className={styles.mapCard}>
          <div ref={mapContainerRef} className={styles.mapCanvas} aria-label="Mapa político mundial" />
        </div>

        <aside className={styles.panel}>
          {selectedCountry ? (
            <>
              <div className={styles.panelHeader}>
                {selectedCountry.flag ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedCountry.flag}
                    alt={`Bandera de ${selectedCountry.countryName}`}
                    className={styles.flag}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.flagFallback}>Sin bandera</div>
                )}
                <h2 className={styles.countryName}>{selectedCountry.countryName}</h2>
              </div>

              <dl className={styles.dataList}>
                <div>
                  <dt>capital</dt>
                  <dd>{formatTextValue(selectedCountry.capital)}</dd>
                </div>
                <div>
                  <dt>población</dt>
                  <dd>{formatNumber(selectedCountry.population)}</dd>
                </div>
                <div>
                  <dt>PIB</dt>
                  <dd>{formatCurrency(selectedCountry.gdp)}</dd>
                </div>
                <div>
                  <dt>PIB per cápita</dt>
                  <dd>{formatCurrency(selectedCountry.gdpPerCapita)}</dd>
                </div>
                <div>
                  <dt>jefe de Estado</dt>
                  <dd>{formatTextValue(selectedCountry.headOfState)}</dd>
                </div>
                <div>
                  <dt>jefe de Gobierno</dt>
                  <dd>{formatTextValue(selectedCountry.headOfGovernment)}</dd>
                </div>
                <div>
                  <dt>fecha de actualización</dt>
                  <dd>{selectedCountry.updatedAt}</dd>
                </div>
                <div>
                  <dt>fuente</dt>
                  <dd>{formatTextValue(selectedCountry.source)}</dd>
                </div>
              </dl>

              {(selectedCountry.politicalCharacteristics.governmentForm.length > 0 ||
                selectedCountry.politicalCharacteristics.organizationModel.length > 0 ||
                selectedCountry.politicalCharacteristics.governmentStructure.length > 0) && (
                <section className={styles.politicalBlock}>
                  <h3 className={styles.politicalTitle}>Características del sistema político</h3>

                  {selectedCountry.politicalCharacteristics.governmentForm.length > 0 && (
                    <div className={styles.politicalRow}>
                      <p className={styles.politicalLabel}>Forma de gobierno</p>
                      <p className={styles.politicalValue}>
                        {selectedCountry.politicalCharacteristics.governmentForm.join(" · ")}
                      </p>
                    </div>
                  )}

                  {selectedCountry.politicalCharacteristics.organizationModel.length > 0 && (
                    <div className={styles.politicalRow}>
                      <p className={styles.politicalLabel}>Modelo de organización</p>
                      <p className={styles.politicalValue}>
                        {selectedCountry.politicalCharacteristics.organizationModel.join(" · ")}
                      </p>
                    </div>
                  )}

                  {selectedCountry.politicalCharacteristics.governmentStructure.length > 0 && (
                    <div className={styles.politicalRow}>
                      <p className={styles.politicalLabel}>Estructura de gobierno</p>
                      <p className={styles.politicalValue}>
                        {selectedCountry.politicalCharacteristics.governmentStructure.join(" · ")}
                      </p>
                    </div>
                  )}
                </section>
              )}
            </>
          ) : (
            <p className={styles.emptyPanel}>No hay países para el filtro actual.</p>
          )}
        </aside>
      </div>

      <div className={styles.metaRow}>
        <p className={styles.disclaimer}>
          La representación cartográfica sigue criterios técnicos de Natural Earth y disponibilidad de datos.
          No implica posicionamiento normativo del proyecto ante disputas territoriales.
        </p>

        <section className={styles.sourcesBlock} aria-label="Fuentes y créditos del mapamundi">
          <p className={styles.sourcesTitle}>Fuentes y créditos</p>
          <ul className={styles.sourcesList}>
            <li>
              <strong>Natural Earth:</strong> base cartográfica de países y territorios.
            </li>
            <li>
              <strong>REST Countries:</strong> bandera, nombre, capital, población y metadatos generales.
            </li>
            <li>
              <strong>Banco Mundial:</strong> PIB y PIB per cápita.
            </li>
            <li>
              <strong>Wikidata:</strong> forma de gobierno, jefe de Estado y jefe de Gobierno.
            </li>
            <li>
              <strong>Leaflet</strong> 🇺🇦: render e interacción del mapa (zoom, capas y selección).
            </li>
          </ul>
        </section>
      </div>
    </section>
  );
}
