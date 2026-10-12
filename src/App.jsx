import "./App.css";
import SecurityCross from "./components/SecurityCross";
import QualityDiamond from "./components/QualityDiamond";
import DysfunctionCross from "./components/DysfunctionCross";

function App() {
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