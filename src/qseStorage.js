import { trello, isTrelloFrame } from "./trello";
import {
  loadQseEventCards,
  upsertQseEventCard,
  cancelQseEventCard,
  loadQseGreenDays,
  saveQseGreenDays
} from "./trelloEvents";

const INDICATORS = ["security", "quality", "dysfunction"];
const GREEN_COLOR = "green";

function validateIndicator(indicator) {
  if (!INDICATORS.includes(indicator)) {
    throw new Error(`Indicateur QSE inconnu : ${indicator}`);
  }
}

function getMonthParts(date = new Date()) {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

async function readLegacyBoardData(indicator, year, month) {
  if (!trello) return {};
  const legacyKeys = [
    `${indicator}Events-${year}-${String(month).padStart(2, "0")}`,
    `${indicator}Events`
  ];
  for (const key of legacyKeys) {
    if (key.endsWith("Events") && !(year === 2026 && month === 11)) continue;
    try {
      const value = await trello.get("board", "shared", key, {});
      if (value && typeof value === "object") {
        if (key.endsWith("Events")) {
          return Object.fromEntries(Object.entries(value).filter(([day]) => Number(day) >= 1 && Number(day) <= 15));
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
    const greenDays = await loadQseGreenDays(targetYear, targetMonth);
    const result = { ...cardEvents };
    for (const day of (greenDays[indicator] || [])) {
      if (!result[day]) result[day] = { label: "Journée en sécurité / état vert", color: GREEN_COLOR };
    }

    // Migration non destructive des anciennes cartes/données.
    const legacyEvents = await readLegacyBoardData(indicator, targetYear, targetMonth);
    let migratedAny = false;
    for (const [day, event] of Object.entries(legacyEvents)) {
      if (!event?.label || !event?.color || result[day]) continue;
      if (event.color === GREEN_COLOR) {
        const updatedGreen = { ...greenDays, [indicator]: [...new Set([...(greenDays[indicator] || []), Number(day)])] };
        await saveQseGreenDays(targetYear, targetMonth, updatedGreen);
      } else {
        await upsertQseEventCard({ indicator, day: Number(day), month: targetMonth, year: targetYear, event });
      }
      migratedAny = true;
    }
    return migratedAny ? loadQseEvents(indicator, targetYear, targetMonth) : result;
  }

  if (isTrelloFrame) throw new Error("Le Power-Up Trello n'est pas initialisé correctement.");
  const key = `qse-${indicator}-${targetYear}-${String(targetMonth).padStart(2, "0")}`;
  try { return JSON.parse(localStorage.getItem(key) || "{}"); }
  catch { return {}; }
}

export async function saveQseEvents(indicator, events) {
  validateIndicator(indicator);
  const { year, month } = getMonthParts();
  const previous = await loadQseEvents(indicator, year, month);
  const allDays = new Set([...Object.keys(previous), ...Object.keys(events)]);

  if (trello) {
    const greenDays = await loadQseGreenDays(year, month);
    const nextGreenDays = {
      security: [...(greenDays.security || [])],
      quality: [...(greenDays.quality || [])],
      dysfunction: [...(greenDays.dysfunction || [])]
    };

    for (const dayText of allDays) {
      const day = Number(dayText);
      const oldEvent = previous[dayText];
      const newEvent = events[dayText];
      const wasGreen = nextGreenDays[indicator].includes(day);
      const isGreen = Boolean(newEvent && newEvent.color === GREEN_COLOR);

      if (isGreen) {
        // Une journée verte n'a jamais de carte événement.
        await cancelQseEventCard({ indicator, day, month, year });
        if (!wasGreen) nextGreenDays[indicator].push(day);
      } else {
        nextGreenDays[indicator] = nextGreenDays[indicator].filter((value) => value !== day);
        if (newEvent && JSON.stringify(newEvent) !== JSON.stringify(oldEvent)) {
          await upsertQseEventCard({ indicator, day, month, year, event: newEvent });
        } else if (!newEvent && oldEvent && oldEvent.color !== GREEN_COLOR) {
          await cancelQseEventCard({ indicator, day, month, year });
        }
      }
    }

    await saveQseGreenDays(year, month, nextGreenDays);
    return events;
  }

  if (isTrelloFrame) throw new Error("Stockage Trello indisponible. Vérifie l'autorisation du Power-Up.");
  const key = `qse-${indicator}-${year}-${String(month).padStart(2, "0")}`;
  localStorage.setItem(key, JSON.stringify(events));
  return events;
}
