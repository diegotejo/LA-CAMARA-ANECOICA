import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import MapamundiPoliticoShell from "@/components/MapamundiPoliticoShell";
import type { MapCountryRecord, MapGeometryCollection } from "@/lib/mapamundi/types";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Mapamundi político",
  description:
    "Mapa político mundial interactivo de La Cámara Anecoica con indicadores político-sociológicos y económicos por país.",
};

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

function getMapamundiData() {
  const countriesPath = path.join(process.cwd(), "data", "mapamundi", "countries.normalized.json");
  const geometryPath = path.join(process.cwd(), "data", "mapamundi", "geometry.geo.json");

  const countries = readJsonFile<MapCountryRecord[]>(countriesPath, []);
  const geometry = readJsonFile<MapGeometryCollection>(geometryPath, {
    type: "FeatureCollection",
    features: [],
  });

  return { countries, geometry };
}

export default function MapamundiPoliticoPage() {
  const { countries, geometry } = getMapamundiData();

  return (
    <div className={`container ${styles.page} mixToneCopy`}>
      <header className={styles.header}>
        <p className={`${styles.label} fade-in`}>Recurso abierto</p>
        <h1 className={`${styles.title} fade-in`}>Mapamundi político</h1>
        <p className={`${styles.intro} slide-up`}>
          Herramienta interactiva para consultar fichas político-sociológicas y económicas por país.
          Usa datos estructurados de Natural Earth, REST Countries, Banco Mundial y Wikidata.
        </p>
      </header>

      <MapamundiPoliticoShell countries={countries} geometry={geometry} />
    </div>
  );
}
