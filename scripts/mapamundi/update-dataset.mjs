import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const NATURAL_EARTH_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const REST_COUNTRIES_URL =
  "https://restcountries.com/v3.1/all?fields=cca3,name,capital,population,flags,region";
const WORLD_BANK_GDP_INDICATOR = "NY.GDP.MKTP.CD";
const WORLD_BANK_GDP_PC_INDICATOR = "NY.GDP.PCAP.CD";
const WORLD_BANK_BASE_URL = "https://api.worldbank.org/v2/country/all/indicator";

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

// Reglas explícitas de normalización política:
// - Forma de gobierno: dinámica ejecutivo-legislativa.
// - Modelo de organización: distribución territorial del poder.
// - Estructura de gobierno: arquitectura institucional del Estado.
const GOVERNMENT_FORM_RULES = [
  { match: /semipresid/i, label: "Semipresidencialismo" },
  { match: /parlament/i, label: "Parlamentarismo" },
  { match: /presidencial/i, label: "Presidencialismo" },
  { match: /asamblea/i, label: "Gobierno de asamblea" },
  { match: /colegiad/i, label: "Gobierno colegiado" },
];

const ORGANIZATION_MODEL_RULES = [
  { match: /confeder/i, label: "Confederalismo" },
  { match: /feder/i, label: "Federalismo" },
  { match: /unitari|centrali/i, label: "Estado unitario" },
  { match: /autonom/i, label: "Estado autonómico" },
  { match: /descentr/i, label: "Descentralización territorial" },
];

const GOVERNMENT_STRUCTURE_RULES = [
  { match: /monarqu.{0,14}parlament/i, label: "Monarquía parlamentaria" },
  { match: /monarqu.{0,14}constitucional/i, label: "Monarquía constitucional" },
  { match: /monarqu/i, label: "Monarquía" },
  { match: /teocr/i, label: "Teocracia" },
  { match: /emirat/i, label: "Emirato" },
  { match: /rep[úu]blic/i, label: "República" },
];

function toNormalizedTokens(values) {
  return values
    .flatMap((value) => value.split(/·|,|\/|;|\(|\)/g))
    .map((value) => value.trim())
    .filter(Boolean);
}

function applyRules(tokens, rules) {
  const found = new Set();

  for (const token of tokens) {
    for (const rule of rules) {
      if (rule.match.test(token)) {
        found.add(rule.label);
      }
    }
  }

  return Array.from(found).sort((a, b) => a.localeCompare(b, "es"));
}

function derivePrimaryPoliticalSystem(characteristics) {
  const joined = characteristics.governmentForm.join(" · ").toLowerCase();
  if (joined.includes("semipresid")) {
    return "Semipresidencial";
  }

  if (joined.includes("parlament")) {
    return "Parlamentario";
  }

  if (joined.includes("presidencial")) {
    return "Presidencial";
  }

  const structureJoined = characteristics.governmentStructure.join(" · ").toLowerCase();
  if (structureJoined.includes("monarquía constitucional")) {
    return "Monarquía constitucional";
  }

  if (structureJoined.includes("monarquía parlamentaria")) {
    return "Monarquía parlamentaria";
  }

  if (structureJoined.includes("monarquía")) {
    return "Monarquía";
  }

  if (structureJoined.includes("teocracia")) {
    return "Teocrático";
  }

  if (characteristics.organizationModel.includes("Federalismo")) {
    return "Federal";
  }

  return "No clasificado";
}

function classifyPoliticalCharacteristics(governmentFormValues) {
  const tokens = toNormalizedTokens(governmentFormValues);

  const characteristics = {
    governmentForm: applyRules(tokens, GOVERNMENT_FORM_RULES),
    organizationModel: applyRules(tokens, ORGANIZATION_MODEL_RULES),
    governmentStructure: applyRules(tokens, GOVERNMENT_STRUCTURE_RULES),
  };

  const politicalSystem = derivePrimaryPoliticalSystem(characteristics);
  const politicalFilterTags = Array.from(
    new Set(
      [
        ...characteristics.governmentForm,
        ...characteristics.organizationModel,
        ...characteristics.governmentStructure,
        politicalSystem !== "No clasificado" ? politicalSystem : null,
      ].filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b, "es"));

  return {
    characteristics,
    politicalSystem,
    politicalFilterTags,
  };
}

async function fetchJson(url, label) {
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);

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

      const raw = await response.text();

      try {
        return JSON.parse(raw);
      } catch {
        throw new Error(`${label} devolvió contenido no JSON`);
      }
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`${label} no pudo recuperarse`);
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

function parseWorldBankRows(dataset) {
  const rows = Array.isArray(dataset) ? dataset[1] : null;
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows;
}

function buildWorldBankIndicatorMap(rows, allowedIsoSet) {
  const map = new Map();

  for (const row of rows) {
    const iso3 = normalizeIso3(row?.countryiso3code);
    const value = row?.value;

    if (!iso3 || !allowedIsoSet.has(iso3) || typeof value !== "number") {
      continue;
    }

    const year = Number.parseInt(String(row?.date ?? "0"), 10);
    const current = map.get(iso3);

    if (!current || (Number.isFinite(year) && year > current.year)) {
      map.set(iso3, {
        value,
        date: row?.date || null,
        year: Number.isFinite(year) ? year : 0,
      });
    }
  }

  return map;
}

async function fetchWorldBankIndicatorRows(indicator) {
  const url = `${WORLD_BANK_BASE_URL}/${indicator}?format=json&per_page=25000&mrv=8`;
  const data = await fetchJson(url, `Banco Mundial ${indicator}`);
  return parseWorldBankRows(data);
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
  existingCountry,
  wikidataEntry,
  generatedAt,
}) {
  const governmentFormValues = wikidataEntry?.governmentForms
    ? Array.from(wikidataEntry.governmentForms)
    : [];
  const politicalClassification = classifyPoliticalCharacteristics(governmentFormValues);
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
    gdp: worldBankGdp?.value ?? existingCountry?.gdp ?? null,
    gdpPerCapita: worldBankGdpPc?.value ?? existingCountry?.gdpPerCapita ?? null,
    politicalCharacteristics: politicalClassification.characteristics,
    politicalFilterTags: politicalClassification.politicalFilterTags,
    headOfState,
    headOfGovernment,
    updatedAt: generatedAt,
    source: SOURCE_LABEL,
    continent,
    politicalSystem: politicalClassification.politicalSystem,
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

  if (
    record.politicalCharacteristics.governmentForm.length === 0 &&
    record.politicalCharacteristics.organizationModel.length === 0 &&
    record.politicalCharacteristics.governmentStructure.length === 0
  ) {
    issues.push("Características del sistema político no disponibles en Wikidata");
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

async function readExistingCountriesMap() {
  try {
    const raw = await readFile(path.join(OUTPUT_DIR, "countries.normalized.json"), "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return new Map();
    }

    return new Map(parsed.map((country) => [country.iso3, country]));
  } catch {
    return new Map();
  }
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const existingCountriesMap = await readExistingCountriesMap();

  const sourceStatus = [];
  const generatedAt = new Date().toISOString().slice(0, 10);

  let naturalEarthData;
  let restCountriesData;
  let worldBankGdpRows = [];
  let worldBankGdpPcRows = [];
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

  try {
    worldBankGdpRows = await fetchWorldBankIndicatorRows(WORLD_BANK_GDP_INDICATOR);
    sourceStatus.push({ source: "Banco Mundial GDP", status: "ok" });
  } catch (error) {
    sourceStatus.push({ source: "Banco Mundial GDP", status: "error", message: String(error) });
  }

  try {
    worldBankGdpPcRows = await fetchWorldBankIndicatorRows(WORLD_BANK_GDP_PC_INDICATOR);
    sourceStatus.push({ source: "Banco Mundial GDP per cápita", status: "ok" });
  } catch (error) {
    sourceStatus.push({ source: "Banco Mundial GDP per cápita", status: "error", message: String(error) });
  }

  const restMap = buildRestCountriesMap(restCountriesData);
  const worldBankGdpMap = buildWorldBankIndicatorMap(worldBankGdpRows, naturalEarthIso3);
  const worldBankGdpPcMap = buildWorldBankIndicatorMap(worldBankGdpPcRows, naturalEarthIso3);
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
      existingCountry: existingCountriesMap.get(iso3),
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

  const gdpFromCache = countries.filter(
    (country) => country.gdp !== null && !worldBankGdpMap.has(country.iso3),
  ).length;
  const gdpPerCapitaFromCache = countries.filter(
    (country) => country.gdpPerCapita !== null && !worldBankGdpPcMap.has(country.iso3),
  ).length;

  const report = {
    generatedAt,
    totals: {
      countries: countries.length,
      countriesWithIssues: countriesWithIssues.length,
      discardedNaturalEarthFeatures: discardedFeatures.length,
    },
    sourceStatus,
    countriesWithIssues,
    naturalEarthIsoCoverage: {
      totalIso3: naturalEarthIso3.size,
      withRestCountries: countries.filter((c) => c.flag).length,
      withWorldBankGdp: countries.filter((c) => c.gdp !== null).length,
      withWorldBankGdpPerCapita: countries.filter((c) => c.gdpPerCapita !== null).length,
      withWikidataGovernmentForm: countries.filter((c) => c.politicalCharacteristics.governmentForm.length > 0).length,
      withWikidataOrganizationModel: countries.filter((c) => c.politicalCharacteristics.organizationModel.length > 0).length,
      withWikidataGovernmentStructure: countries.filter((c) => c.politicalCharacteristics.governmentStructure.length > 0).length,
    },
    fallbackCoverage: {
      worldBankGdpFromCache: gdpFromCache,
      worldBankGdpPerCapitaFromCache: gdpPerCapitaFromCache,
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
