import { trello, APP_KEY, isTrelloFrame } from "./trello";

export const EVENT_LIST_NAME = "Événements QSE";
export const ARCHIVE_LIST_NAME = "Archives QSE";
const EVENT_MARKER = "QSE_EVENT_DATA:";

const INDICATOR_LABELS = {
  security: "Sécurité",
  quality: "Qualité",
  dysfunction: "Dysfonctionnement"
};

function requireTrello() {
  if (!trello) {
    throw new Error("Le tableau de bord doit être ouvert depuis le bouton Trello.");
  }
}

async function getToken({ authorize = false } = {}) {
  requireTrello();
  const restApi = await trello.getRestApi();
  let token = await restApi.getToken();

  if (!token && authorize) {
    token = await restApi.authorize({ scope: "read,write", expiration: "never" });
  }

  if (!token) {
    throw new Error("Autorisation Trello requise. Clique sur « Connecter Trello » dans le tableau de bord.");
  }

  return token;
}

async function api(path, options = {}) {
  const token = await getToken();
  const separator = path.includes("?") ? "&" : "?";
  const url = `https://api.trello.com/1${path}${separator}key=${encodeURIComponent(APP_KEY)}&token=${encodeURIComponent(token)}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Erreur API Trello ${response.status} : ${detail}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function isTrelloAuthorized() {
  if (!isTrelloFrame) return true;
  requireTrello();
  const restApi = await trello.getRestApi();
  return restApi.isAuthorized();
}

export async function authorizeTrello() {
  if (!isTrelloFrame) return true;
  await getToken({ authorize: true });
  return true;
}

async function getBoardId() {
  const board = await trello.board("id");
  if (!board?.id) throw new Error("Impossible d'identifier le tableau Trello.");
  return board.id;
}

async function getOpenLists() {
  const boardId = await getBoardId();
  return api(`/boards/${boardId}/lists?fields=id,name&filter=open`);
}

async function ensureEventList() {
  const lists = await getOpenLists();
  const existing = lists.find((list) => list.name.trim().toLowerCase() === EVENT_LIST_NAME.toLowerCase());
  if (existing) return existing;

  const boardId = await getBoardId();
  return api(`/lists?name=${encodeURIComponent(EVENT_LIST_NAME)}&idBoard=${encodeURIComponent(boardId)}&pos=bottom`, { method: "POST" });
}

async function getCardsFromList(listId) {
  return api(`/lists/${listId}/cards?filter=all&fields=id,name,desc,idList,closed`);
}

function parseMarker(description = "") {
  const line = description.split("\n").find((part) => part.startsWith(EVENT_MARKER));
  if (!line) return null;
  try {
    return JSON.parse(line.slice(EVENT_MARKER.length).trim());
  } catch {
    return null;
  }
}

function parseLegacyCard(card) {
  const description = card.desc || "";
  const indicatorMatch = description.match(/\*\*Indicateur :\*\*\s*(.+)/i);
  const dateMatch = description.match(/\*\*Date :\*\*\s*(\d{2})\/(\d{2})\/(\d{4})/i);
  const eventMatch = description.match(/\*\*Événement :\*\*\s*(.+)/i);
  const colorMatch = description.match(/\*\*Couleur :\*\*\s*(\w+)/i);
  if (!indicatorMatch || !dateMatch || !eventMatch || !colorMatch) return null;

  const indicator = Object.entries(INDICATOR_LABELS).find(([, label]) => label.toLowerCase() === indicatorMatch[1].trim().toLowerCase())?.[0];
  if (!indicator) return null;

  const [, day, month, year] = dateMatch;
  return {
    version: 1,
    indicator,
    day: Number(day),
    month: Number(month),
    year: Number(year),
    date: `${year}-${month}-${day}`,
    label: eventMatch[1].trim(),
    color: colorMatch[1].trim(),
    status: "active"
  };
}

function getCardData(card) {
  return parseMarker(card.desc) || parseLegacyCard(card);
}

function makeDescription(data) {
  return [
    `Événement QSE — ${INDICATOR_LABELS[data.indicator]}`,
    "",
    `Date : ${String(data.day).padStart(2, "0")}/${String(data.month).padStart(2, "0")}/${data.year}`,
    `Indicateur : ${INDICATOR_LABELS[data.indicator]}`,
    `Événement : ${data.label}`,
    `Couleur : ${data.color}`,
    "",
    "Cette carte est générée automatiquement par le tableau de bord QSE.",
    "",
    `${EVENT_MARKER} ${JSON.stringify(data)}`
  ].join("\n");
}

function makeCardName(data) {
  const date = `${String(data.day).padStart(2, "0")}/${String(data.month).padStart(2, "0")}/${data.year}`;
  return `${date} - ${INDICATOR_LABELS[data.indicator]} - ${data.label}`;
}

async function findEventCard(indicator, day, month, year) {
  const lists = await getOpenLists();
  const eventList = lists.find((list) => list.name.trim().toLowerCase() === EVENT_LIST_NAME.toLowerCase());
  if (!eventList) return null;

  const cards = await getCardsFromList(eventList.id);
  return cards.find((card) => {
    const data = getCardData(card);
    return data && data.status !== "cancelled" && data.indicator === indicator && Number(data.day) === Number(day) && Number(data.month) === Number(month) && Number(data.year) === Number(year);
  }) || null;
}

export async function loadQseEventCards(indicator, year, month) {
  const lists = await getOpenLists();
  const wantedNames = [EVENT_LIST_NAME, ARCHIVE_LIST_NAME].map((name) => name.toLowerCase());
  const targetLists = lists.filter((list) => wantedNames.includes(list.name.trim().toLowerCase()));
  const cardsByList = await Promise.all(targetLists.map((list) => getCardsFromList(list.id)));
  const events = {};

  for (const card of cardsByList.flat()) {
    const data = getCardData(card);
    if (!data || data.status === "cancelled") continue;
    if (data.indicator !== indicator || Number(data.year) !== Number(year) || Number(data.month) !== Number(month)) continue;
    events[data.day] = { label: data.label, color: data.color };
  }

  return events;
}

export async function upsertQseEventCard({ indicator, day, month, year, event }) {
  const list = await ensureEventList();
  const data = {
    version: 1,
    indicator,
    day: Number(day),
    month: Number(month),
    year: Number(year),
    date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    label: event.label,
    color: event.color,
    status: "active"
  };
  const existing = await findEventCard(indicator, day, month, year);
  const payload = { name: makeCardName(data), desc: makeDescription(data), idList: list.id, closed: false };

  if (existing) {
    return api(`/cards/${existing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  return api("/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, pos: "top" })
  });
}

export async function cancelQseEventCard({ indicator, day, month, year }) {
  const existing = await findEventCard(indicator, day, month, year);
  if (!existing) return null;
  const data = getCardData(existing);
  const cancelled = { ...data, status: "cancelled" };
  return api(`/cards/${existing.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ desc: makeDescription(cancelled), name: `[ANNULÉ] ${existing.name}`, closed: true })
  });
}

export async function createQseEventCard({ day, event, indicator }) {
  const key = Object.entries(INDICATOR_LABELS).find(([, label]) => label === indicator)?.[0];
  if (!key) throw new Error(`Indicateur non reconnu : ${indicator}`);
  const now = new Date();
  return upsertQseEventCard({ indicator: key, day, month: now.getMonth() + 1, year: now.getFullYear(), event });
}


// Registre compact des journées vertes : une seule carte technique par mois,
// jamais une carte événement individuelle pour une journée verte.
export const DATA_LIST_NAME = "Données QSE";
const GREEN_MARKER = "QSE_GREEN_DAYS:";

function makeGreenRegisterDescription(year, month, greenDays) {
  const payload = { version: 1, year, month, greenDays };
  return [
    `Registre technique QSE — ${String(month).padStart(2, "0")}/${year}`,
    "Cette carte technique conserve les journées vertes. Elle ne représente pas un événement.",
    `${GREEN_MARKER} ${JSON.stringify(payload)}`
  ].join("\n");
}

function parseGreenRegister(card) {
  const line = (card.desc || "").split("\n").find((part) => part.startsWith(GREEN_MARKER));
  if (!line) return null;
  try { return JSON.parse(line.slice(GREEN_MARKER.length).trim()); }
  catch { return null; }
}

async function ensureDataList() {
  const lists = await getOpenLists();
  const existing = lists.find((list) => list.name.trim().toLowerCase() === DATA_LIST_NAME.toLowerCase());
  if (existing) return existing;
  const boardId = await getBoardId();
  return api(`/lists?name=${encodeURIComponent(DATA_LIST_NAME)}&idBoard=${encodeURIComponent(boardId)}&pos=bottom`, { method: "POST" });
}

async function findGreenRegister(year, month) {
  const lists = await getOpenLists();
  const list = lists.find((item) => item.name.trim().toLowerCase() === DATA_LIST_NAME.toLowerCase());
  if (!list) return null;
  const cards = await getCardsFromList(list.id);
  return cards.find((card) => {
    const data = parseGreenRegister(card);
    return data && Number(data.year) === Number(year) && Number(data.month) === Number(month);
  }) || null;
}

export async function loadQseGreenDays(year, month) {
  const lists = await getOpenLists();
  const wanted = [DATA_LIST_NAME, ARCHIVE_LIST_NAME].map((name) => name.toLowerCase());
  const targetLists = lists.filter((item) => wanted.includes(item.name.trim().toLowerCase()));
  const cardsByList = await Promise.all(targetLists.map((list) => getCardsFromList(list.id)));
  const card = cardsByList.flat().find((item) => {
    const data = parseGreenRegister(item);
    return data && Number(data.year) === Number(year) && Number(data.month) === Number(month);
  });
  const data = card ? parseGreenRegister(card) : null;
  return data?.greenDays || { security: [], quality: [], dysfunction: [] };
}

export async function saveQseGreenDays(year, month, greenDays) {
  const existing = await findGreenRegister(year, month);
  const hasGreenDays = Object.values(greenDays || {}).some((days) => Array.isArray(days) && days.length > 0);
  if (!existing && !hasGreenDays) return null;
  const list = await ensureDataList();
  const payload = {
    name: `Registre des journées vertes - ${String(month).padStart(2, "0")}/${year}`,
    desc: makeGreenRegisterDescription(year, month, greenDays),
    idList: list.id,
    closed: false
  };
  if (existing) {
    return api(`/cards/${existing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }
  return api("/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, pos: "top" })
  });
}
