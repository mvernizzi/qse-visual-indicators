
import { trello } from "./trello";

const STORAGE_KEYS = {
  security: "securityEvents",
  quality: "qualityEvents",
  dysfunction: "dysfunctionEvents"
};

// Identifie le mois courant : exemple 2026-11.
function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

// Calcule le mois précédent.
function getPreviousMonthKey() {
  const previousMonth = new Date();
  previousMonth.setDate(1);
  previousMonth.setMonth(previousMonth.getMonth() - 1);

  return getMonthKey(previousMonth);
}

// Construit une clé indépendante pour chaque mois.
function getMonthlyStorageKey(indicator, monthKey) {
  const baseKey = STORAGE_KEYS[indicator];

  if (!baseKey) {
    throw new Error("Indicateur QSE inconnu.");
  }

  return `${baseKey}-${monthKey}`;
}

// Migration sécurisée des anciennes données.
async function migrateLegacyEvents(indicator) {
  const legacyKey = STORAGE_KEYS[indicator];

  const previousKey = getMonthlyStorageKey(
    indicator,
    getPreviousMonthKey()
  );

  const migrationKey = `qseMigrationDone-${indicator}-v1`;

  if (trello) {
    const alreadyMigrated = await trello.get(
      "board",
      "shared",
      migrationKey,
      false
    );

    if (alreadyMigrated) {
      return;
    }

    const previousEvents = await trello.get(
      "board",
      "shared",
      previousKey,
      null
    );

    if (
      previousEvents === null ||
      previousEvents === undefined
    ) {
      const legacyEvents = await trello.get(
        "board",
        "shared",
        legacyKey,
        null
      );

      if (
        legacyEvents &&
        Object.keys(legacyEvents).length > 0
      ) {
        await trello.set(
          "board",
          "shared",
          previousKey,
          legacyEvents
        );
      }
    }

    await trello.set(
      "board",
      "shared",
      migrationKey,
      true
    );

    return;
  }

  if (localStorage.getItem(migrationKey)) {
    return;
  }

  if (!localStorage.getItem(previousKey)) {
    const legacyEvents = localStorage.getItem(legacyKey);

    if (legacyEvents) {
      const parsedEvents = JSON.parse(legacyEvents);

      if (Object.keys(parsedEvents).length > 0) {
        localStorage.setItem(
          previousKey,
          legacyEvents
        );
      }
    }
  }

  localStorage.setItem(migrationKey, "true");
}

// Charge uniquement les événements du mois courant.
export async function loadQseEvents(indicator) {
  if (!STORAGE_KEYS[indicator]) {
    throw new Error("Indicateur QSE inconnu.");
  }

  const monthKey = getMonthKey();

  const storageKey = getMonthlyStorageKey(
    indicator,
    monthKey
  );

  await migrateLegacyEvents(indicator);

  if (trello) {
    return (
      (await trello.get(
        "board",
        "shared",
        storageKey,
        {}
      )) || {}
    );
  }

  const savedData = localStorage.getItem(storageKey);

  return savedData ? JSON.parse(savedData) : {};
}

// Enregistre les événements du mois courant.
export async function saveQseEvents(indicator, events) {
  if (!STORAGE_KEYS[indicator]) {
    throw new Error("Indicateur QSE inconnu.");
  }

  const storageKey = getMonthlyStorageKey(
    indicator,
    getMonthKey()
  );

  if (trello) {
    await trello.set(
      "board",
      "shared",
      storageKey,
      events
    );
  } else {
    localStorage.setItem(
      storageKey,
      JSON.stringify(events)
    );
  }
}
