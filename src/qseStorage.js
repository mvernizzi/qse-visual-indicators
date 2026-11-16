
import { trello } from "./trello";

const STORAGE_KEYS = {
  security: "securityEvents",
  quality: "qualityEvents",
  dysfunction: "dysfunctionEvents"
};

function getMonthKey(indicator) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  return `${STORAGE_KEYS[indicator]}-${month}`;
}

async function readData(key, indicator) {
  if (trello) {
    return (await trello.get("board", "shared", key, {})) || {};
  }

  const saved = localStorage.getItem(`qse-${key}`);
  return saved ? JSON.parse(saved) : {};
}

async function writeData(key, indicator, events) {
  if (trello) {
    await trello.set("board", "shared", key, events);
  } else {
    localStorage.setItem(`qse-${key}`, JSON.stringify(events));
  }
}

export async function loadQseEvents(indicator) {
  const legacyKey = STORAGE_KEYS[indicator];

  if (!legacyKey) {
    throw new Error("Indicateur QSE inconnu.");
  }

  const monthKey = getMonthKey(indicator);
  const currentData = await readData(monthKey, indicator);

  if (Object.keys(currentData).length > 0) {
    return currentData;
  }

  // Migration spéciale de novembre 2026 :
  // conserver les jours 1 à 15 et laisser les suivants vierges.
  const now = new Date();
  const isNovember2026 =
    now.getFullYear() === 2026 && now.getMonth() === 10;

  if (isNovember2026) {
    const legacyData = await readData(legacyKey, indicator);

    const novemberData = Object.fromEntries(
      Object.entries(legacyData).filter(
        ([day]) => Number(day) >= 1 && Number(day) <= 15
      )
    );

    await writeData(monthKey, indicator, novemberData);
    return novemberData;
  }

  return {};
}

export async function saveQseEvents(indicator, events) {
  if (!STORAGE_KEYS[indicator]) {
    throw new Error("Indicateur QSE inconnu.");
  }

  const monthKey = getMonthKey(indicator);
  await writeData(monthKey, indicator, events);
}
