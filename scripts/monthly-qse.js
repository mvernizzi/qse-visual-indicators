const API_KEY = process.env.TRELLO_API_KEY;
const TOKEN = process.env.TRELLO_TOKEN;
const BOARD_ID = process.env.TRELLO_BOARD_ID;

const ACTIVE_LIST_NAME = "STANDARD BRIEFING";
const ARCHIVE_LIST_NAME = "Archives QSE";
const CARD_PREFIX = "Indicateurs QSE -";

if (!API_KEY || !TOKEN || !BOARD_ID) {
  console.error(
    "Variables manquantes : TRELLO_API_KEY, TRELLO_TOKEN ou TRELLO_BOARD_ID."
  );
  process.exit(1);
}

const apiBase = "https://api.trello.com/1";

function authUrl(path) {
  const separator = path.includes("?") ? "&" : "?";

  return (
    `${apiBase}${path}` +
    `${separator}key=${encodeURIComponent(API_KEY)}` +
    `&token=${encodeURIComponent(TOKEN)}`
  );
}

async function trelloFetch(path, options = {}) {
  const response = await fetch(
    authUrl(path),
    options
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Erreur Trello ${response.status} : ${text}`
    );
  }

  return response.json();
}

function getFrenchMonthName(date) {
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre"
  ];

  return monthNames[date.getMonth()];
}

function getMonthlyCardName(date) {
  return `${CARD_PREFIX} ${getFrenchMonthName(date)} ${date.getFullYear()}`;
}

async function getBoardLists() {
  return trelloFetch(
    `/boards/${BOARD_ID}/lists?fields=id,name&filter=open`
  );
}

async function getCardsFromList(listId) {
  return trelloFetch(
    `/lists/${listId}/cards?fields=id,name,idList&filter=open`
  );
}

async function moveCard(cardId, targetListId) {
  return trelloFetch(
    `/cards/${cardId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        idList: targetListId
      })
    }
  );
}

async function createMonthlyCard(listId, cardName) {
  return trelloFetch(
    "/cards",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        idList: listId,
        name: cardName,
        desc:
          "📊 Suivi mensuel des indicateurs QSE.\n\n" +
          "Cette carte contient :\n" +
          "- 🛡️ Croix Sécurité\n" +
          "- 💎 Diamant Qualité\n" +
          "- ♻️ Dysfonctionnements\n\n" +
          "Carte créée automatiquement au début du mois.",
        pos: "top"
      })
    }
  );
}

async function main() {
  console.log(
    "Démarrage de l'automatisation QSE mensuelle."
  );

  const now = new Date();

  const currentCardName =
    getMonthlyCardName(now);

  console.log(
    `Mois courant : ${currentCardName}`
  );

  const lists =
    await getBoardLists();

  const activeList =
    lists.find(
      (list) =>
        list.name.trim() ===
        ACTIVE_LIST_NAME
    );

  const archiveList =
    lists.find(
      (list) =>
        list.name.trim() ===
        ARCHIVE_LIST_NAME
    );

  if (!activeList) {
    throw new Error(
      `Liste "${ACTIVE_LIST_NAME}" introuvable.`
    );
  }

  if (!archiveList) {
    throw new Error(
      `Liste "${ARCHIVE_LIST_NAME}" introuvable.`
    );
  }

  console.log(
    `Liste active : ${activeList.name}`
  );

  console.log(
    `Liste archives : ${archiveList.name}`
  );

  const activeCards =
    await getCardsFromList(activeList.id);

  // Vérifie si la carte du mois courant existe déjà.
  const currentCard =
    activeCards.find(
      (card) =>
        card.name.trim() ===
        currentCardName
    );

  if (currentCard) {
    console.log(
      `La carte "${currentCardName}" existe déjà.`
    );

    console.log(
      "Aucune nouvelle carte ne sera créée."
    );
  } else {
    // Archive uniquement les anciennes cartes mensuelles QSE.
    const oldMonthlyCards =
      activeCards.filter(
        (card) =>
          card.name.startsWith(
            `${CARD_PREFIX} `
          )
      );

    for (const card of oldMonthlyCards) {
      console.log(
        `Archivage de "${card.name}"...`
      );

      await moveCard(
        card.id,
        archiveList.id
      );

      console.log(
        `Carte déplacée dans "${ARCHIVE_LIST_NAME}".`
      );
    }

    console.log(
      `Création de "${currentCardName}"...`
    );

    const newCard =
      await createMonthlyCard(
        activeList.id,
        currentCardName
      );

    console.log(
      `Nouvelle carte créée : ${newCard.name}`
    );
  }

  console.log(
    "Automatisation QSE terminée."
  );
}

main().catch((error) => {
  console.error(
    "Échec de l'automatisation QSE :",
    error
  );

  process.exit(1);
});