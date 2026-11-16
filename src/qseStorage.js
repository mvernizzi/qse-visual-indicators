
import { trello } from "./trello";

const STORAGE_KEYS = {
  security: "securityEvents",
  quality: "qualityEvents",
  dysfunction: "dysfunctionEvents"
};

const MIGRATION_VERSION = "v1";

function getMonthKey(indicator) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  return `${STORAGE_KEYS[indicator]}-${month}`;
}

async function readData(key) {
  if (trello) {
    return (await trello.get("board", "shared", key, {})) || {};
  }

  try {
    return JSON.parse(localStorage.getItem(`qse-${key}`) || "{}");
  } catch {
    return {};
  }
}

async function writeData(key, events) {
  if (trello) {
    await trello.set("board", "shared", key, events);
    return;
  }

  localStorage.setItem(`qse-${key}`, JSON.stringify(events));
}

async function readMigrationMarker(key) {
  if (trello) {
    return await trello.get("board", "shared", key, false);
  }

  return localStorage.getItem(`qse-${key}`) === "true";
}

async function writeMigrationMarker(key) {
  if (trello) {
    await trello.set("board", "shared", key, true);
    return;
  }

  localStorage.setItem(`qse-${key}`, "true");
}

export async function loadQseEvents(indicator) {
  const legacyKey = STORAGE_KEYS[indicator];

  if (!legacyKey) {
    throw new Error("Indicateur QSE inconnu.");
  }

  const monthKey = getMonthKey(indicator);
  const migrationKey = `${monthKey}-migration-${MIGRATION_VERSION}`;

  let monthData = await readData(monthKey);

  const now = new Date();
  const isNovember2026 =
    now.getFullYear() === 2026 &&
    now.getMonth() === 10;

  const alreadyMigrated = await readMigrationMarker(migrationKey);

  if (isNovember2026 && !alreadyMigrated) {
    const legacyData = await readData(legacyKey);

    // Conserver les données historiques du 1er au 15 novembre.
    // Les jours 16 à 30 restent blancs au départ.
    const historicalData = Object.fromEntries(
      Object.entries(legacyData).filter(([day]) => {
        const number = Number(day);
        return number >= 1 && number <= 15;
      })
    );

    monthData = {
      ...historicalData,
      ...monthData
    };

    await writeData(monthKey, monthData);
    await writeMigrationMarker(migrationKey);
  }

  return monthData;
}

export async function saveQseEvents(indicator, events) {
  if (!STORAGE_KEYS[indicator]) {
    throw new Error("Indicateur QSE inconnu.");
  }

  const monthKey = getMonthKey(indicator);

  await writeData(monthKey, events);
}
