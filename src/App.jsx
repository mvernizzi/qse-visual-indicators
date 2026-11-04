
import { useState } from "react";
import "./App.css";
import SecurityCross from "./components/SecurityCross";
import QualityDiamond from "./components/QualityDiamond";
import DysfunctionCross from "./components/DysfunctionCross";
import { loadQseEvents } from "./qseStorage";

function App() {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const exportQseData = async () => {
    try {
      setExporting(true);
      setExportError("");

      const backup = {
        exportDate: new Date().toISOString(),
        securityEvents: await loadQseEvents("security"),
        qualityEvents: await loadQseEvents("quality"),
        dysfunctionEvents: await loadQseEvents("dysfunction")
      };

      const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "sauvegarde-indicateurs-QSE.json";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur export QSE :", error);
      setExportError("Impossible d'exporter les données QSE.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="app">
      <header className="dashboard-header">
        <div>
          <h1>📊 Tableau de bord QSE</h1>
          <p className="dashboard-subtitle">
            Suivi mensuel — Sécurité, Qualité et Dysfonctionnements
          </p>
        </div>
      </header>

      <div style={{ marginBottom: "20px" }}>
        <button
          type="button"
          onClick={exportQseData}
          disabled={exporting}
        >
          {exporting ? "Exportation..." : "⬇️ Exporter les données QSE"}
        </button>

        {exportError && (
          <p style={{ color: "red" }}>{exportError}</p>
        )}
      </div>

      <section className="dashboard-grid">
        <div className="card">
          <SecurityCross />
        </div>

        <div className="card">
          <QualityDiamond />
        </div>

        <div className="card">
          <DysfunctionCross />
        </div>
      </section>
    </main>
  );
}

export default App;
