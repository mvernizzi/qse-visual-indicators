const APP_URL = "https://mvernizzi.github.io/qse-visual-indicators/";
const APP_ICON = "https://mvernizzi.github.io/qse-visual-indicators/favicon.svg";

window.TrelloPowerUp.initialize({
  "board-buttons": function () {
    return [{
      icon: { dark: APP_ICON, light: APP_ICON },
      text: "Tableau de bord QSE",
      condition: "edit",
      callback: function (t) {
        return t.boardBar({
          url: t.signUrl(APP_URL),
          title: "Tableau de bord QSE",
          height: 900,
          resizable: true,
          accentColor: "#0c66e4"
        });
      }
    }];
  }
});
