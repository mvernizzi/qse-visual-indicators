import { useState } from "react";
import EventDialog from "./EventDialog";
import { securityEvents } from "../data/security";
import "./SecurityCross.css";

const rows = [
  [null, null, 1, 2, null, null, null, null],
  [null, null, 3, 4, null, null, null, null],
  [null, null, 5, 6, null, null, null, null],
  [null, null, 7, 8, null, null, null, null],
  [9, 10, 11, 12, 13, 14, 15, 16],
  [17, 18, 19, 20, 21, 22, 23, 24],
  [null, null, 25, 26, null, null, null, null],
  [null, null, 27, 28, null, null, null, null],
  [null, null, 29, 30, null, null, null, null],
  [null, null, null, 31, null, null, null, null]
];

function SecurityCross() {
  const [selectedDay, setSelectedDay] = useState(null);

  const [dayEvents, setDayEvents] = useState(() => {
    const savedData = localStorage.getItem("qse-security-events");

    return savedData ? JSON.parse(savedData) : {};
  });

  const openDialog = (day) => {
    setSelectedDay(day);
  };

  const closeDialog = () => {
    setSelectedDay(null);
  };

  const selectEvent = (event) => {
    const updatedEvents = {
      ...dayEvents,
      [selectedDay]: event
    };

    setDayEvents(updatedEvents);

    localStorage.setItem(
      "qse-security-events",
      JSON.stringify(updatedEvents)
    );

    closeDialog();
  };

  const resetDay = () => {
    const updatedEvents = { ...dayEvents };

    delete updatedEvents[selectedDay];

    setDayEvents(updatedEvents);

    localStorage.setItem(
      "qse-security-events",
      JSON.stringify(updatedEvents)
    );

    closeDialog();
  };

  return (
    <section className="security-indicator">
      <h2>🛡️ Croix Sécurité</h2>

      <div className="security-cross">
        {rows.flatMap((row, rowIndex) =>
          row.map((day, columnIndex) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${rowIndex}-${columnIndex}`}
                  className="security-empty"
                />
              );
            }

            const selectedEvent = dayEvents[day];
            const cellColor = selectedEvent?.color || "green";

            return (
              <button
                key={day}
                type="button"
                className={`security-day security-day-${cellColor}`}
                onClick={() => openDialog(day)}
                title={selectedEvent?.label || "Journée en sécurité"}
              >
                {day}
              </button>
            );
          })
        )}
      </div>

      <div className="security-legend">
        {securityEvents.map((event) => (
          <div className="security-legend-item" key={event.label}>
            <span
              className={`security-legend-color security-legend-${event.color}`}
            />
            <span>{event.label}</span>
          </div>
        ))}
      </div>

      <EventDialog
        isOpen={selectedDay !== null}
        title={
          selectedDay !== null
            ? `Événement sécurité — Jour ${selectedDay}`
            : ""
        }
        options={securityEvents}
        onSelect={selectEvent}
        onClose={closeDialog}
      />

      {selectedDay !== null && dayEvents[selectedDay] && (
        <button
          type="button"
          className="security-reset-button"
          onClick={resetDay}
        >
          Remettre le jour {selectedDay} en vert
        </button>
      )}
    </section>
  );
}

export default SecurityCross;