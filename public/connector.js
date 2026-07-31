window.TrelloPowerUp.initialize({

  "card-back-section": function (t) {

    return {
      title: "Indicateurs QSE",
      icon: "https://mvernizzi.github.io/qse-visual-indicators/favicon.svg",
      content: {
        type: "iframe",
        url: t.signUrl(
  "https://mvernizzi.github.io/qse-visual-indicators/"
)
      }
    };

  }

});