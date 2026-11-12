
import { trello } from "./trello";

const STORAGE_KEYS = {
  security: "securityEvents",
  quality: "qualityEvents",
  dysfunction: "dysfunctionEvents"
};

function getMonthlyKey(indicator) {
  const baseKey = STORAGE_KEYS[indicator];

  if (!baseKey) {
    throw new Error("Indicateur QSE inconnu.");
  }

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  return `${baseKey}-${year}-${month}`;
}

export async function loadQseEvents(indicator) {
  const key = getMonthlyKey(indicator);

  if (trello) {
    return (await trello.get("board", "shared", key, {})) || {};
  }

  const savedData = localStorage.getItem(`qse-${key}`);

  return savedData ? JSON.parse(savedData) : {};
}

export async function saveQseEvents(indicator, events) {
  const key = getMonthlyKey(indicator);

  if (trello) {
    await trello.set("board", "shared", key, events);
  } else {
    localStorage.setItem(
      `qse-${key}`,
      JSON.stringify(events)
    );
  }
}
