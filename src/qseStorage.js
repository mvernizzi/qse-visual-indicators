
import { trello, isTrelloFrame } from "./trello";

const STORAGE_KEYS = {
  security: "securityEvents",
  quality: "qualityEvents",
  dysfunction: "dysfunctionEvents"
};

function validateIndicator(indicator) {
  if (!STORAGE_KEYS[indicator]) {
    throw new Error(`Indicateur QSE inconnu : ${indicator}`);
  }
}

function getMonthKey(indicator, year, month) {
  return `${STORAGE_KEYS[indicator]}-${year}-${String(month).padStart(2, "0")}`;
}

function getStorageKey(key) {
  return `qse-${key}`;
}

async function readData(key) {
  if (trello) {
    const data = await trello.get("board", "shared", key, {});
    return data || {};
  }

  if (isTrelloFrame) {
    throw new Error(
      "Trello n'est pas initialisé dans cette fenêtre."
    );
  }

  try {
    return JSON.parse(
      localStorage.getItem(getStorageKey(key)) || "{}"
    );
  } catch (error) {
    console.error("QSE - Erreur de lecture locale :", error);
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
      "Stockage Trello indisponible : impossible d'enregistrer."
    );
  }

  localStorage.setItem(
    getStorageKey(key),
    JSON.stringify(data)
  );
}

export async function loadQseEvents(indicator) {
  validateIndicator(indicator);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const monthKey = getMonthKey(indicator, year, month);

  let monthData = await readData(monthKey);

  // Migration des anciennes données de novembre 2026.
  // On conserve les jours 1 à 15.
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

  console.log(
    "QSE - Données chargées :",
    indicator,
    monthKey,
    monthData
  );

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

  console.log("QSE - Début de l'enregistrement");
  console.log("QSE - Indicateur :", indicator);
  console.log("QSE - Clé :", monthKey);
  console.log("QSE - Données :", events);

  try {
    if (trello) {
      const context = await trello.getContext();

      console.log(
        "QSE - Permissions Trello :",
        context?.permissions
      );

      if (
        context?.permissions?.board &&
        context.permissions.board !== "write"
      ) {
        throw new Error(
          "Droits d'écriture insuffisants sur le tableau Trello."
        );
      }
    } else if (isTrelloFrame) {
      throw new Error(
        "Trello n'est pas initialisé dans cette fenêtre."
      );
    }

    await writeData(monthKey, events);

    if (trello) {
      const savedData = await readData(monthKey);

      console.log(
        "QSE - Vérification après enregistrement :",
        savedData
      );

      if (
        JSON.stringify(savedData) !== JSON.stringify(events)
      ) {
        throw new Error(
          "Les données enregistrées ne correspondent pas aux données envoyées."
        );
      }
    }

    console.log(
      "QSE - ENREGISTREMENT RÉUSSI :",
      indicator
    );

    return events;

  } catch (error) {
    console.error(
      "QSE - ERREUR D'ENREGISTREMENT :",
      error
    );

    throw error;
  }
}
