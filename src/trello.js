export const trello =
  window.self !== window.top && window.TrelloPowerUp
    ? window.TrelloPowerUp.iframe()
    : null;