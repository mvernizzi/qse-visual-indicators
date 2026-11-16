
import { trello, isTrelloFrame } from "./trello";

const STORAGE_KEYS = {
  security: "securityEvents",
  quality: "qualityEvents",
  dysfunction: "dysfunctionEvents"
};

function getMonthKey(indicator, year, month) {
  const baseKey = STORAGE_KEYS[indicator];

  return `${baseKey}-${year}-${String(month).padStart(2, "0")}`;
}

function getStorageKey(key) {
  return `qse-${key}`;
}

async function readData(key) {
  if (trello) {
    const data = await trello.get("board", "shared", key);
    return data || {};
  }

  if (isTrelloFrame) {
    throw new Error(
      "Trello n'est pas initialisé. Vérifie le chargement du Power-Up."
    );
  }

  try {
    return JSON.parse(
      localStorage.getItem(getStorageKey(key)) || "{}"
    );
  } catch {
    return {};
  }
}

async function writeData(key, data) {
  if (trello) {
    await trello.set("board", "shared", key, data);
    return;
  }

  if (isTrelloFrame) {
    throw new Error(
      "Impossible d'enregistrer : le stockage Trello est indisponible."
    );
  }

  localStorage.setItem(
    getStorageKey(key),
    JSON.stringify(data)
  );
}

function validateIndicator(indicator) {
  if (!STORAGE_KEYS[indicator]) {
    throw new Error(`Indicateur QSE inconnu : ${indicator}`);
  }
}

export async function loadQseEvents(indicator) {
  validateIndicator(indicator);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const monthKey = getMonthKey(indicator, year, month);

  let monthData = await readData(monthKey);

  // Migration des anciennes données vers novembre 2026.
  // Seuls les jours 1 à 15 sont repris.
  if (
    year === 2026 &&
    month === 11 &&
    Object.keys(monthData).length === 0
  ) {
    const legacyData = await readData(STORAGE_KEYS[indicator]);

    const historicalData = Object.fromEntries(
      Object.entries(legacyData).filter(([day]) => {
        const dayNumber = Number(day);
        return dayNumber >= 1 && dayNumber <= 15;
      })
    );

    if (Object.keys(historicalData).length > 0) {
      await writeData(monthKey, historicalData);
      monthData = historicalData;
    }
  }

  return monthData;
}

export async function saveQseEvents(indicator, events) {
  validateIndicator(indicator);

  const now = new Date();

  const monthKey = getMonthKey(
    indicator,
    now.getFullYear(),
    now.getMonth() + 1
  );

  await writeData(monthKey, events);

  // Vérification immédiate de l'enregistrement.
  const savedData = await readData(monthKey);

  if (JSON.stringify(savedData) !== JSON.stringify(events)) {
    throw new Error(
      `La vérification du stockage a échoué pour ${indicator}.`
    );
  }

  return savedData;
}
