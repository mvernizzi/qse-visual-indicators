import { trello, isTrelloFrame } from "./trello";
import {
  loadQseEventCards,
  upsertQseEventCard,
  cancelQseEventCard
} from "./trelloEvents";

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

function getMonthParts(date = new Date()) {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

async function readLegacyBoardData(indicator, year, month) {
  if (!trello) return {};
  const base = STORAGE_KEYS[indicator];
  const monthKey = `${base}-${year}-${String(month).padStart(2, "0")}`;

  for (const key of [monthKey, base]) {
    // L'ancienne clé sans mois ne concernait que la migration initiale de novembre 2026.
    if (key === base && !(year === 2026 && month === 11)) continue;

    try {
      const value = await trello.get("board", "shared", key, {});
      if (value && typeof value === "object") {
        if (key === base) {
          return Object.fromEntries(
            Object.entries(value).filter(([day]) => Number(day) >= 1 && Number(day) <= 15)
          );
        }
        return value;
      }
    } catch (error) {
      console.warn(`QSE - Anciennes données non lisibles (${key}) :`, error);
    }
  }

  return {};
}

export async function loadQseEvents(indicator, year, month) {
  validateIndicator(indicator);
  const current = getMonthParts();
  const targetYear = year ?? current.year;
  const targetMonth = month ?? current.month;

  if (trello) {
    const cardEvents = await loadQseEventCards(indicator, targetYear, targetMonth);

    // Migration non destructive : complète les cartes avec les anciennes données
    // encore présentes dans le stockage partagé, sans écraser les cartes déjà migrées.
    const legacyEvents = await readLegacyBoardData(indicator, targetYear, targetMonth);
    let migratedAny = false;
    for (const [day, event] of Object.entries(legacyEvents)) {
      if (!event?.label || !event?.color || cardEvents[day]) continue;
      await upsertQseEventCard({
        indicator,
        day: Number(day),
        month: targetMonth,
        year: targetYear,
        event
      });
      migratedAny = true;
    }

    return migratedAny
      ? loadQseEventCards(indicator, targetYear, targetMonth)
      : cardEvents;
  }

  if (isTrelloFrame) {
    throw new Error("Le Power-Up Trello n'est pas initialisé correctement.");
  }

  const key = `qse-${indicator}-${targetYear}-${String(targetMonth).padStart(2, "0")}`;
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

export async function saveQseEvents(indicator, events) {
  validateIndicator(indicator);
  const { year, month } = getMonthParts();
  const previous = await loadQseEvents(indicator, year, month);
  const allDays = new Set([...Object.keys(previous), ...Object.keys(events)]);

  if (trello) {
    for (const dayText of allDays) {
      const day = Number(dayText);
      const oldEvent = previous[dayText];
      const newEvent = events[dayText];

      if (newEvent && JSON.stringify(newEvent) !== JSON.stringify(oldEvent)) {
        await upsertQseEventCard({ indicator, day, month, year, event: newEvent });
      } else if (!newEvent && oldEvent) {
        await cancelQseEventCard({ indicator, day, month, year });
      }
    }
    return events;
  }

  if (isTrelloFrame) {
    throw new Error("Stockage Trello indisponible. Vérifie l'autorisation du Power-Up.");
  }

  const key = `qse-${indicator}-${year}-${String(month).padStart(2, "0")}`;
  localStorage.setItem(key, JSON.stringify(events));
  return events;
}
