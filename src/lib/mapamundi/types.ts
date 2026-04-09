import type { Geometry } from "geojson";

export interface MapCountryRecord {
  iso3: string;
  flag: string;
  countryName: string;
  capital: string;
  population: number | null;
  gdp: number | null;
  gdpPerCapita: number | null;
  governmentForm: string;
  headOfState: string;
  headOfGovernment: string;
  updatedAt: string;
  source: string;
  continent: string;
  politicalSystem: string;
}

export interface MapGeometryFeature {
  type: "Feature";
  properties: {
    iso3: string;
    countryName: string;
    continent: string;
  };
  geometry: Geometry;
}

export interface MapGeometryCollection {
  type: "FeatureCollection";
  features: MapGeometryFeature[];
}
