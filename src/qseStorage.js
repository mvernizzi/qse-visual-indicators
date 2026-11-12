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

function getDayKey(monthlyKey, day) {
  return `${monthlyKey}-day-${String(day).padStart(2, "0")}`;
}

export async function loadQseEvents(indicator) {
  const monthlyKey = getMonthlyKey(indicator);
  const events = {};

  if (trello) {
    const keys = Array.from(
      { length: 31 },
      (_, index) => getDayKey(monthlyKey, index + 1)
    );

    const values = await Promise.all(
      keys.map((key) => trello.get("board", "shared", key, {}))
    );

    values.forEach((event, index) => {
      if (event && event.label) {
        events[index + 1] = event;
      }
    });

    // Lecture de l'ancien stockage, sans le modifier
    if (Object.keys(events).length === 0) {
      const oldData = await trello.get(
        "board",
        "shared",
        monthlyKey,
        {}
      );

      return oldData || {};
    }

    return events;
  }

  for (let day = 1; day <= 31; day++) {
    const savedData = localStorage.getItem(
      `qse-${getDayKey(monthlyKey, day)}`
    );

    if (savedData) {
      const event = JSON.parse(savedData);

      if (event && event.label) {
        events[day] = event;
      }
    }
  }

  if (Object.keys(events).length === 0) {
    const oldData = localStorage.getItem(`qse-${monthlyKey}`);
    return oldData ? JSON.parse(oldData) : {};
  }

  return events;
}

export async function saveQseEvents(indicator, events) {
  const monthlyKey = getMonthlyKey(indicator);

  if (trello) {
    const operations = [];

    for (let day = 1; day <= 31; day++) {
      const key = getDayKey(monthlyKey, day);
      const event = events[day] || {};

      operations.push(
        trello.set("board", "shared", key, event)
      );
    }

    await Promise.all(operations);
  } else {
    for (let day = 1; day <= 31; day++) {
      const key = getDayKey(monthlyKey, day);
      const event = events[day] || {};

      localStorage.setItem(
        `qse-${key}`,
        JSON.stringify(event)
      );
    }
  }
}
EOF