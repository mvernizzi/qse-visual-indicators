import "./App.css";
import SecurityCross from "./components/SecurityCross";
import QualityDiamond from "./components/QualityDiamond";
import DysfunctionCross from "./components/DysfunctionCross";

function App() {
  return (
    <div className="app">
      <div className="card">
        <SecurityCross />
      </div>

      <div className="card">
        <QualityDiamond />
      </div>

      <div className="card">
  <DysfunctionCross />
</div>

    </div>
  );
}

export default App;
