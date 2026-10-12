import { trello } from "./trello";

const STORAGE_KEYS = {
  security: "securityEvents",
  quality: "qualityEvents",
  dysfunction: "dysfunctionEvents"
};

export async function loadQseEvents(indicator) {
  const key = STORAGE_KEYS[indicator];

  if (!key) {
    throw new Error("Indicateur QSE inconnu.");
  }

  if (trello) {
    return (await trello.get("board", "shared", key, {})) || {};
  }

  const savedData = localStorage.getItem(`qse-${indicator}-events`);
  return savedData ? JSON.parse(savedData) : {};
}

export async function saveQseEvents(indicator, events) {
  const key = STORAGE_KEYS[indicator];

  if (!key) {
    throw new Error("Indicateur QSE inconnu.");
  }

  if (trello) {
    await trello.set("board", "shared", key, events);
  } else {
    localStorage.setItem(
      `qse-${indicator}-events`,
      JSON.stringify(events)
    );
  }
}