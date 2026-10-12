const APP_URL =
"https://mvernizzi.github.io/qse-visual-indicators/";

const APP_ICON =
"https://mvernizzi.github.io/qse-visual-indicators/favicon.svg";

window.TrelloPowerUp.initialize({
// Bouton dans l'en-tête du tableau Trello
"board-buttons": function (t) {
return [
{
icon: {
dark: APP_ICON,
light: APP_ICON
},
text: "Tableau de bord QSE",
condition: "edit",
callback: function (t) {
return t.boardBar({
url: APP_URL,
title: "Tableau de bord QSE",
height: 600,
resizable: true,
accentColor: "#0c66e4"
});
}
}
];
},

// Section conservée au dos des cartes
"card-back-section": function (t) {
return {
title: "Indicateurs QSE",
icon: APP_ICON,
content: {
type: "iframe",
url: t.signUrl(APP_URL),
height: 1200
}
};
}
});