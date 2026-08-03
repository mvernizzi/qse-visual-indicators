import { trello, APP_KEY } from "./trello";

const TARGET_LIST_NAME = "Événements QSE";

async function getAuthorizedToken() {
  if (!trello) {
    throw new Error("Cette fonction doit être utilisée depuis Trello.");
  }

  const restApi = await trello.getRestApi();

  let token = await restApi.getToken();

  if (!token) {
    token = await restApi.authorize({
      scope: "read,write",
      expiration: "never"
    });
  }

  if (!token) {
    throw new Error("Autorisation Trello refusée.");
  }

  return token;
}

async function getTargetList(token) {
  const board = await trello.board("id");

  const response = await fetch(
    `https://api.trello.com/1/boards/${board.id}/lists?fields=id,name&filter=open&key=${APP_KEY}&token=${token}`
  );

  if (!response.ok) {
    throw new Error(
      "Impossible de récupérer les listes du tableau Trello."
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
  if (!trello) {
    console.log(
      "Hors Trello : aucune carte événement n'est créée."
    );
    return null;
  }

  const token = await getAuthorizedToken();
  const targetList = await getTargetList(token);

  const date = formatDate(day);

  const cardName = `${date} - ${event.label}`;

  const description = [
    `**Indicateur :** ${indicator}`,
    `**Date :** ${date}`,
    `**Événement :** ${event.label}`,
    `**Couleur :** ${event.color}`,
    "",
    "Carte créée automatiquement depuis le Power-Up Indicateurs QSE."
  ].join("\n");

  const response = await fetch(
    `https://api.trello.com/1/cards?key=${APP_KEY}&token=${token}`,
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
    const errorText = await response.text();

    console.error(errorText);

    throw new Error(
      "Trello n'a pas réussi à créer la carte événement."
    );
  }

  return response.json();
}