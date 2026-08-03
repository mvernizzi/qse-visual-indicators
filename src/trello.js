const APP_KEY = "COLLE_ICI_TA_CLE_API";

export const trello =
  window.self !== window.top && window.TrelloPowerUp
    ? window.TrelloPowerUp.iframe({
        appKey: APP_KEY,
        appName: "Indicateurs QSE",
        appAuthor: "QSE"
      })
    : null;

export { APP_KEY };
const APP_KEY = "8fa873a464902e9bee20c8fd8665f95a";
