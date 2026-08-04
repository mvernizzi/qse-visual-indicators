import { trello, APP_KEY } from "./trello";

const TARGET_LIST_NAME = "Événements QSE";

export async function authorizeTrello() {
  if (!trello) {
    throw new Error("Le Power-Up n'est pas ouvert dans Trello.");
  }

  const restApi = await trello.getRestApi();

  const token = await restApi.authorize({
    scope: "read,write",
    expiration: "never"
  });

  if (!token) {
    throw new Error("Trello n'a retourné aucun jeton.");
  }

  return token;
}

async function getToken() {
  if (!trello) {
    throw new Error("Le Power-Up n'est pas ouvert dans Trello.");
  }

  const restApi = await trello.getRestApi();

  const token = await restApi.getToken();

  if (!token) {
    throw new Error(
      "Trello n'est pas encore autorisé. Cliquez d'abord sur « Autoriser Trello »."
    );
  }

  return token;
}

async function getTargetList(token) {
  const board = await trello.board("id");

  if (!board?.id) {
    throw new Error("Impossible d'identifier le tableau Trello.");
  }

  const response = await fetch(
    `https://api.trello.com/1/boards/${board.id}/lists?fields=id,name&filter=open&key=${encodeURIComponent(
      APP_KEY
    )}&token=${encodeURIComponent(token)}`
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Impossible de lire les listes Trello (${response.status}) : ${text}`
    );
  }

  const lists = await response.json();

  const targetList = lists.find(
    (list) =>
      list.name.trim().toLowerCase() ===
      TARGET_LIST_NAME.toLowerCase()
  );

  if (!targetList) {
    throw new Error(
      `La liste "${TARGET_LIST_NAME}" est introuvable sur ce tableau.`
    );
  }

  return targetList;
}

function formatDate(day) {
  const now = new Date();

  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const formattedDay = String(day).padStart(2, "0");

  return `${formattedDay}/${month}/${year}`;
}

export async function createQseEventCard({
  day,
  event,
  indicator
}) {
  const token = await getToken();

  const targetList = await getTargetList(token);

  const date = formatDate(day);

  const cardName = `${date} - ${event.label}`;

  const description = [
    `Indicateur : ${indicator}`,
    `Date : ${date}`,
    `Événement : ${event.label}`,
    `Couleur : ${event.color}`,
    "",
    "Carte créée automatiquement par Indicateurs QSE."
  ].join("\n");

  const response = await fetch(
    `https://api.trello.com/1/cards?key=${encodeURIComponent(
      APP_KEY
    )}&token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
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
    const text = await response.text();

    throw new Error(
      `Création de la carte refusée (${response.status}) : ${text}`
    );
  }

  return response.json();
}