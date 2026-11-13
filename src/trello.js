
const APP_KEY = "8fa873a464902e9bee20c8fd8665f95a";

// Le Power-Up ne s'initialise que dans une iframe Trello.
const isTrelloFrame =
  window.self !== window.top &&
  Boolean(window.TrelloPowerUp);

export const trello = isTrelloFrame
  ? window.TrelloPowerUp.iframe({
      appKey: APP_KEY,
      appName: "Indicateurs QSE",
      appAuthor: "QSE"
    })
  : null;

export { APP_KEY };
