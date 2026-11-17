const API_KEY = process.env.TRELLO_API_KEY;
const TOKEN = process.env.TRELLO_TOKEN;
const BOARD_ID = process.env.TRELLO_BOARD_ID;

const ACTIVE_LIST_NAME = "STANDARD BRIEFING";
const EVENT_LIST_NAME = "Événements QSE";
const ARCHIVE_LIST_NAME = "Archives QSE";
const MONTHLY_CARD_PREFIX = "Indicateurs QSE -";
const EVENT_MARKER = "QSE_EVENT_DATA:";

if (!API_KEY || !TOKEN || !BOARD_ID) {
  console.error("Variables manquantes : TRELLO_API_KEY, TRELLO_TOKEN ou TRELLO_BOARD_ID.");
  process.exit(1);
}

const apiBase = "https://api.trello.com/1";

function authUrl(path) {
  const separator = path.includes("?") ? "&" : "?";
  return `${apiBase}${path}${separator}key=${encodeURIComponent(API_KEY)}&token=${encodeURIComponent(TOKEN)}`;
}

async function trelloFetch(path, options = {}) {
  const response = await fetch(authUrl(path), options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erreur Trello ${response.status} : ${text}`);
  }
  return response.status === 204 ? null : response.json();
}

async function getLists() {
  return trelloFetch(`/boards/${BOARD_ID}/lists?fields=id,name&filter=open`);
}

async function getOpenCards(listId) {
  return trelloFetch(`/lists/${listId}/cards?filter=open&fields=id,name,desc,idList`);
}

async function moveCard(cardId, targetListId) {
  return trelloFetch(`/cards/${cardId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idList: targetListId })
  });
}

function getEventDate(card) {
  const markerLine = (card.desc || "").split("\n").find((line) => line.startsWith(EVENT_MARKER));
  if (markerLine) {
    try {
      const data = JSON.parse(markerLine.slice(EVENT_MARKER.length).trim());
      if (data.year && data.month) return { year: Number(data.year), month: Number(data.month) };
    } catch {
      // On essaie ensuite le format des anciennes cartes.
    }
  }

  const match = (card.desc || "").match(/\*\*Date :\*\*\s*(\d{2})\/(\d{2})\/(\d{4})/i);
  if (match) return { year: Number(match[3]), month: Number(match[2]) };
  const titleMatch = (card.name || "").match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (titleMatch) return { year: Number(titleMatch[3]), month: Number(titleMatch[2]) };
  return null;
}

function isBeforeCurrentMonth(date, currentYear, currentMonth) {
  return date && (date.year < currentYear || (date.year === currentYear && date.month < currentMonth));
}

async function main() {
  console.log("Démarrage de l'archivage mensuel QSE.");
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const lists = await getLists();

  const findList = (name) => lists.find((list) => list.name.trim().toLowerCase() === name.toLowerCase());
  const standardList = findList(ACTIVE_LIST_NAME);
  const eventList = findList(EVENT_LIST_NAME);
  const archiveList = findList(ARCHIVE_LIST_NAME);

  if (!archiveList) throw new Error(`Liste « ${ARCHIVE_LIST_NAME} » introuvable.`);

  // Les anciennes cartes récapitulatives sont déplacées en archive, jamais supprimées.
  if (standardList) {
    const standardCards = await getOpenCards(standardList.id);
    const oldDashboardCards = standardCards.filter((card) => card.name.startsWith(MONTHLY_CARD_PREFIX));
    for (const card of oldDashboardCards) {
      console.log(`Déplacement de l'ancienne carte récapitulative : ${card.name}`);
      await moveCard(card.id, archiveList.id);
    }
  }

  // Les cartes événement du mois terminé sont archivées individuellement.
  if (eventList) {
    const eventCards = await getOpenCards(eventList.id);
    for (const card of eventCards) {
      const date = getEventDate(card);
      if (!isBeforeCurrentMonth(date, currentYear, currentMonth)) continue;
      console.log(`Archivage de l'événement : ${card.name}`);
      await moveCard(card.id, archiveList.id);
    }
  }

  console.log("Archivage QSE terminé. Aucune nouvelle carte « Indicateurs QSE » n'a été créée.");
}

main().catch((error) => {
  console.error("Échec de l'automatisation QSE :", error);
  process.exit(1);
});
