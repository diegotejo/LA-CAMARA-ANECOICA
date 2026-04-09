"use client";

import dynamic from "next/dynamic";
import styles from "@/app/mapamundi-politico/page.module.css";
import type { MapCountryRecord, MapGeometryCollection } from "@/lib/mapamundi/types";

const MapamundiPolitico = dynamic(() => import("@/components/MapamundiPolitico"), {
  ssr: false,
  loading: () => <p className={styles.loadingState}>Cargando mapa político...</p>,
});

interface MapamundiPoliticoShellProps {
  countries: MapCountryRecord[];
  geometry: MapGeometryCollection;
}

export default function MapamundiPoliticoShell({ countries, geometry }: MapamundiPoliticoShellProps) {
  return <MapamundiPolitico countries={countries} geometry={geometry} />;
}
