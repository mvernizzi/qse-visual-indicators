export default function DayCell({ day, color = "green", onClick }) {

  const colors = {
    green: "#34C759",
    blue: "#007AFF",
    red: "#FF3B30",
    black: "#2C2C2C",
    white: "#FFFFFF"
  };

  return (
    <button
      onClick={onClick}
      style={{
        width: "52px",
        height: "52px",
        borderRadius: "10px",
        border: "1px solid #D8D8D8",
        background: colors[color],
        color: color === "white" ? "#333" : "white",
        fontWeight: "bold",
        fontSize: "16px",
        cursor: "pointer",
        transition: ".2s",
        boxShadow: "0 2px 6px rgba(0,0,0,.15)"
      }}
    >
      {day}
    </button>
  );
}