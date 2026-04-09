import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const NATURAL_EARTH_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const REST_COUNTRIES_URL =
  "https://restcountries.com/v3.1/all?fields=cca3,name,capital,population,flags,region";
const WORLD_BANK_GDP_INDICATOR = "NY.GDP.MKTP.CD";
const WORLD_BANK_GDP_PC_INDICATOR = "NY.GDP.PCAP.CD";

const WIKIDATA_QUERY = `
SELECT ?iso3 ?governmentFormLabel ?headOfStateLabel ?headOfGovernmentLabel WHERE {
  {
    ?country wdt:P31 wd:Q3624078;
             wdt:P298 ?iso3.
  }
  UNION
  {
    ?country wdt:P31 wd:Q6256;
             wdt:P298 ?iso3.
  }
  OPTIONAL { ?country wdt:P122 ?governmentForm. }
  OPTIONAL { ?country wdt:P35 ?headOfState. }
  OPTIONAL { ?country wdt:P6 ?headOfGovernment. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
}
`;

const WIKIDATA_URL = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(
  WIKIDATA_QUERY,
)}`;

const SOURCE_LABEL = "Natural Earth · REST Countries · Banco Mundial · Wikidata";

const ISO_OVERRIDES = {
  XKX: "XKX",
};

const OUTPUT_DIR = path.join(process.cwd(), "data", "mapamundi");

function normalizeIso3(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (ISO_OVERRIDES[normalized]) {
    return ISO_OVERRIDES[normalized];
  }

  if (/^[A-Z]{3}$/.test(normalized)) {
    return normalized;
  }

  return null;
}

function pickNaturalEarthIso3(properties) {
  const candidates = [
    properties?.ADM0_A3,
    properties?.ADM0_A3_US,
    properties?.SOV_A3,
    properties?.ISO_A3,
    properties?.ISO_A3_EH,
    properties?.GU_A3,
  ];

  for (const candidate of candidates) {
    const iso3 = normalizeIso3(candidate);
    if (iso3 && iso3 !== "-99") {
      return iso3;
    }
  }

  return null;
}

function classifyPoliticalSystem(governmentForm) {
  if (!governmentForm || governmentForm === "No disponible") {
    return "No clasificado";
  }

  const value = governmentForm.toLowerCase();

  if (value.includes("semipresid")) {
    return "Semipresidencial";
  }

  if (value.includes("parlament")) {
    return "Parlamentario";
  }

  if (value.includes("presidencial")) {
    return "Presidencial";
  }

  if (value.includes("monarqu") && value.includes("constitucional")) {
    return "Monarquía constitucional";
  }

  if (value.includes("monarqu")) {
    return "Monarquía";
  }

  if (value.includes("federal")) {
    return "Federal";
  }

  if (value.includes("teocr")) {
    return "Teocrático";
  }

  return "Otros / mixto";
}

async function fetchJson(url, label) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "la-camara-anecoica-mapamundi-updater/1.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`${label} respondió ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function buildRestCountriesMap(restCountriesData) {
  const map = new Map();

  for (const entry of restCountriesData) {
    const iso3 = normalizeIso3(entry?.cca3);
    if (!iso3) {
      continue;
    }

    map.set(iso3, {
      countryName: entry?.name?.common || "No disponible",
      flag: entry?.flags?.svg || entry?.flags?.png || entry?.flag || "",
      capital: Array.isArray(entry?.capital) && entry.capital.length > 0
        ? entry.capital[0]
        : "No disponible",
      population: typeof entry?.population === "number" ? entry.population : null,
      continent: entry?.region || "No clasificado",
    });
  }

  return map;
}

async function fetchWorldBankValue(iso3, indicator) {
  const url = `https://api.worldbank.org/v2/country/${iso3}/indicator/${indicator}?format=json&mrnev=1`;

  const data = await fetchJson(url, `Banco Mundial ${indicator} ${iso3}`);
  const rows = Array.isArray(data) ? data[1] : [];

  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const row = rows.find((item) => typeof item?.value === "number");
  if (!row || typeof row.value !== "number") {
    return null;
  }

  return {
    value: row.value,
    date: row?.date || null,
  };
}

async function fetchWorldBankIndicatorMap(iso3List, indicator, concurrency = 8) {
  const resultMap = new Map();
  const errors = [];

  let pointer = 0;

  async function worker() {
    while (pointer < iso3List.length) {
      const currentIndex = pointer;
      pointer += 1;

      const iso3 = iso3List[currentIndex];

      try {
        const value = await fetchWorldBankValue(iso3, indicator);
        if (value) {
          resultMap.set(iso3, value);
        }
      } catch (error) {
        errors.push({
          iso3,
          error: String(error),
        });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  return {
    map: resultMap,
    errors,
  };
}

function buildWikidataMap(wikidataData) {
  const map = new Map();
  const bindings = wikidataData?.results?.bindings;

  if (!Array.isArray(bindings)) {
    return map;
  }

  for (const row of bindings) {
    const iso3 = normalizeIso3(row?.iso3?.value);
    if (!iso3) {
      continue;
    }

    const current = map.get(iso3) || {
      governmentForms: new Set(),
      headsOfState: new Set(),
      headsOfGovernment: new Set(),
    };

    if (row?.governmentFormLabel?.value) {
      current.governmentForms.add(row.governmentFormLabel.value);
    }

    if (row?.headOfStateLabel?.value) {
      current.headsOfState.add(row.headOfStateLabel.value);
    }

    if (row?.headOfGovernmentLabel?.value) {
      current.headsOfGovernment.add(row.headOfGovernmentLabel.value);
    }

    map.set(iso3, current);
  }

  return map;
}

function setToDisplayValue(set) {
  if (!set || set.size === 0) {
    return "No disponible";
  }

  return Array.from(set).slice(0, 3).join(" · ");
}

function buildGeometry(naturalEarthData) {
  const geometry = {
    type: "FeatureCollection",
    features: [],
  };

  const naturalEarthIso3 = new Set();
  const discardedFeatures = [];

  for (const feature of naturalEarthData.features || []) {
    const iso3 = pickNaturalEarthIso3(feature.properties);
    if (!iso3 || iso3 === "ATA") {
      discardedFeatures.push(feature?.properties?.NAME_LONG || feature?.properties?.ADMIN || "unknown");
      continue;
    }

    naturalEarthIso3.add(iso3);
    geometry.features.push({
      type: "Feature",
      properties: {
        iso3,
        countryName:
          feature?.properties?.NAME_LONG ||
          feature?.properties?.ADMIN ||
          feature?.properties?.NAME ||
          iso3,
        continent: feature?.properties?.CONTINENT || "No clasificado",
      },
      geometry: feature.geometry,
    });
  }

  return {
    geometry,
    naturalEarthIso3,
    discardedFeatures,
  };
}

function buildCountryRecord({
  iso3,
  geometryProperties,
  restEntry,
  worldBankGdp,
  worldBankGdpPc,
  wikidataEntry,
  generatedAt,
}) {
  const governmentForm = setToDisplayValue(wikidataEntry?.governmentForms);
  const headOfState = setToDisplayValue(wikidataEntry?.headsOfState);
  const headOfGovernment = setToDisplayValue(wikidataEntry?.headsOfGovernment);

  const continent = restEntry?.continent || geometryProperties?.continent || "No clasificado";

  return {
    iso3,
    flag: restEntry?.flag || "",
    countryName:
      restEntry?.countryName || geometryProperties?.countryName || "No disponible",
    capital: restEntry?.capital || "No disponible",
    population: restEntry?.population ?? null,
    gdp: worldBankGdp?.value ?? null,
    gdpPerCapita: worldBankGdpPc?.value ?? null,
    governmentForm,
    headOfState,
    headOfGovernment,
    updatedAt: generatedAt,
    source: SOURCE_LABEL,
    continent,
    politicalSystem: classifyPoliticalSystem(governmentForm),
  };
}

function collectIssues(record) {
  const issues = [];

  if (!record.flag) {
    issues.push("Bandera no disponible en REST Countries");
  }

  if (record.capital === "No disponible") {
    issues.push("Capital no disponible en REST Countries");
  }

  if (record.population === null) {
    issues.push("Población no disponible en REST Countries");
  }

  if (record.gdp === null) {
    issues.push("PIB no disponible en Banco Mundial");
  }

  if (record.gdpPerCapita === null) {
    issues.push("PIB per cápita no disponible en Banco Mundial");
  }

  if (record.governmentForm === "No disponible") {
    issues.push("Forma de gobierno no disponible en Wikidata");
  }

  if (record.headOfState === "No disponible") {
    issues.push("Jefe de Estado no disponible en Wikidata");
  }

  if (record.headOfGovernment === "No disponible") {
    issues.push("Jefe de Gobierno no disponible en Wikidata");
  }

  return issues;
}

async function writeJson(filePath, data) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const sourceStatus = [];
  const generatedAt = new Date().toISOString().slice(0, 10);

  let naturalEarthData;
  let restCountriesData;
  let worldBankGdpErrors = [];
  let worldBankGdpPcErrors = [];
  let wikidataData;

  try {
    naturalEarthData = await fetchJson(NATURAL_EARTH_URL, "Natural Earth");
    sourceStatus.push({ source: "Natural Earth", status: "ok" });
  } catch (error) {
    sourceStatus.push({ source: "Natural Earth", status: "error", message: String(error) });
    throw error;
  }

  try {
    restCountriesData = await fetchJson(REST_COUNTRIES_URL, "REST Countries");
    sourceStatus.push({ source: "REST Countries", status: "ok" });
  } catch (error) {
    sourceStatus.push({ source: "REST Countries", status: "error", message: String(error) });
    restCountriesData = [];
  }

  try {
    wikidataData = await fetchJson(WIKIDATA_URL, "Wikidata");
    sourceStatus.push({ source: "Wikidata", status: "ok" });
  } catch (error) {
    sourceStatus.push({ source: "Wikidata", status: "error", message: String(error) });
    wikidataData = {};
  }

  const { geometry, naturalEarthIso3, discardedFeatures } = buildGeometry(naturalEarthData);
  const worldBankIsoList = Array.from(naturalEarthIso3);

  const worldBankGdpResult = await fetchWorldBankIndicatorMap(
    worldBankIsoList,
    WORLD_BANK_GDP_INDICATOR,
  );
  const worldBankGdpPcResult = await fetchWorldBankIndicatorMap(
    worldBankIsoList,
    WORLD_BANK_GDP_PC_INDICATOR,
  );

  worldBankGdpErrors = worldBankGdpResult.errors;
  worldBankGdpPcErrors = worldBankGdpPcResult.errors;

  sourceStatus.push({
    source: "Banco Mundial GDP",
    status: worldBankGdpErrors.length > 0 ? "partial" : "ok",
    message:
      worldBankGdpErrors.length > 0
        ? `${worldBankGdpErrors.length} países con error de consulta individual`
        : undefined,
  });
  sourceStatus.push({
    source: "Banco Mundial GDP per cápita",
    status: worldBankGdpPcErrors.length > 0 ? "partial" : "ok",
    message:
      worldBankGdpPcErrors.length > 0
        ? `${worldBankGdpPcErrors.length} países con error de consulta individual`
        : undefined,
  });

  const restMap = buildRestCountriesMap(restCountriesData);
  const worldBankGdpMap = worldBankGdpResult.map;
  const worldBankGdpPcMap = worldBankGdpPcResult.map;
  const wikidataMap = buildWikidataMap(wikidataData);

  const countries = [];
  const countriesWithIssues = [];

  for (const feature of geometry.features) {
    const iso3 = feature.properties.iso3;

    const record = buildCountryRecord({
      iso3,
      geometryProperties: feature.properties,
      restEntry: restMap.get(iso3),
      worldBankGdp: worldBankGdpMap.get(iso3),
      worldBankGdpPc: worldBankGdpPcMap.get(iso3),
      wikidataEntry: wikidataMap.get(iso3),
      generatedAt,
    });

    const issues = collectIssues(record);
    if (issues.length > 0) {
      countriesWithIssues.push({
        iso3,
        countryName: record.countryName,
        issues,
      });
    }

    countries.push(record);
  }

  countries.sort((a, b) => a.countryName.localeCompare(b.countryName, "es"));

  const report = {
    generatedAt,
    totals: {
      countries: countries.length,
      countriesWithIssues: countriesWithIssues.length,
      discardedNaturalEarthFeatures: discardedFeatures.length,
    },
    sourceStatus,
    worldBankErrors: {
      gdp: worldBankGdpErrors,
      gdpPerCapita: worldBankGdpPcErrors,
    },
    countriesWithIssues,
    naturalEarthIsoCoverage: {
      totalIso3: naturalEarthIso3.size,
      withRestCountries: countries.filter((c) => c.flag).length,
      withWorldBankGdp: countries.filter((c) => c.gdp !== null).length,
      withWorldBankGdpPerCapita: countries.filter((c) => c.gdpPerCapita !== null).length,
      withWikidataGovernmentForm: countries.filter((c) => c.governmentForm !== "No disponible").length,
    },
  };

  await writeJson(path.join(OUTPUT_DIR, "countries.normalized.json"), countries);
  await writeJson(path.join(OUTPUT_DIR, "geometry.geo.json"), geometry);
  await writeJson(path.join(OUTPUT_DIR, "update-report.json"), report);

  console.log(
    `Mapamundi actualizado: ${countries.length} países (${countriesWithIssues.length} con incidencias).`,
  );
}

main().catch((error) => {
  console.error("Error al actualizar dataset de mapamundi:", error);
  process.exitCode = 1;
});
