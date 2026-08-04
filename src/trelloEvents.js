import { trello, APP_KEY } from "./trello";

const TARGET_LIST_NAME = "Événements QSE";

async function getToken() {
  if (!trello) {
    throw new Error(
      "Le Power-Up n'est pas ouvert dans Trello."
    );
  }

  const restApi = await trello.getRestApi();

  const token = await restApi.getToken();

  if (!token) {
    throw new Error(
      "Aucune autorisation Trello disponible."
    );
  }

  return token;
}

async function getTargetList(token) {
  const board = await trello.board("id");

  if (!board?.id) {
    throw new Error(
      "Impossible d'identifier le tableau Trello."
    );
  }

  const url =
    `https://api.trello.com/1/boards/${board.id}/lists` +
    `?fields=id,name` +
    `&filter=open` +
    `&key=${encodeURIComponent(APP_KEY)}` +
    `&token=${encodeURIComponent(token)}`;

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Impossible de récupérer les listes Trello : ${response.status} ${text}`
    );
  }

  const lists = await response.json();

  const targetList = lists.find(
    (list) =>
      list.name.trim().toLowerCase() ===
      TARGET_LIST_NAME.trim().toLowerCase()
  );

  if (!targetList) {
    throw new Error(
      `La liste "${TARGET_LIST_NAME}" est introuvable.`
    );
  }

  return targetList;
}

function formatDate(day) {
  const now = new Date();

  const formattedDay = String(day).padStart(
    2,
    "0"
  );

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const year = now.getFullYear();

  return `${formattedDay}/${month}/${year}`;
}

export async function createQseEventCard({
  day,
  event,
  indicator
}) {
  if (!day) {
    throw new Error(
      "Le numéro du jour est manquant."
    );
  }

  if (!event) {
    throw new Error(
      "L'événement est manquant."
    );
  }

  if (!event.label) {
    throw new Error(
      "Le libellé de l'événement est manquant."
    );
  }

  if (!indicator) {
    throw new Error(
      "Le nom de l'indicateur est manquant."
    );
  }

  const token = await getToken();

  const targetList =
    await getTargetList(token);

  const date = formatDate(day);

  const cardName =
    `${date} - ${event.label}`;

  const description = [
    `**Indicateur :** ${indicator}`,
    "",
    `**Date :** ${date}`,
    "",
    `**Événement :** ${event.label}`,
    "",
    `**Couleur :** ${event.color || "non définie"}`,
    "",
    "---",
    "",
    "Carte créée automatiquement depuis le Power-Up Indicateurs QSE."
  ].join("\n");

  const url =
    `https://api.trello.com/1/cards` +
    `?key=${encodeURIComponent(APP_KEY)}` +
    `&token=${encodeURIComponent(token)}`;

  const response = await fetch(
    url,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        idList: targetList.id,
        name: cardName,
        desc: description,
        pos: "top"
      })
    }
  );

  if (!response.ok) {
    const text =
      await response.text();

    throw new Error(
      `Création de la carte refusée : ${response.status} ${text}`
    );
  }

  const card =
    await response.json();

  console.log(
    "Carte QSE créée :",
    {
      indicator,
      day,
      event: event.label,
      card: card.name
    }
  );

  return card;
}