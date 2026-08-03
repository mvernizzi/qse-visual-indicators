const APP_KEY = "8fa873a464902e9bee20c8fd8665f95a";

export const trello =
  window.self !== window.top && window.TrelloPowerUp
    ? window.TrelloPowerUp.iframe({
        appKey: APP_KEY,
        appName: "Indicateurs QSE",
        appAuthor: "QSE"
      })
    : null;

export { APP_KEY };
