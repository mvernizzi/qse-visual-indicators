import { useEffect, useState } from "react";
import EventDialog from "./EventDialog";
import { securityEvents } from "../data/security";
import { trello } from "../trello";
import { createQseEventCard } from "../trelloEvents";
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
  const [dayEvents, setDayEvents] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        if (trello) {
          const savedEvents = await trello.get(
            "card",
            "shared",
            "securityEvents",
            {}
          );

          setDayEvents(savedEvents);
        } else {
          const savedData = localStorage.getItem(
            "qse-security-events"
          );

          setDayEvents(
            savedData ? JSON.parse(savedData) : {}
          );
        }
      } catch (error) {
        console.error(
          "Erreur de chargement sécurité :",
          error
        );

        setDayEvents({});
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const saveEvents = async (updatedEvents) => {
    setDayEvents(updatedEvents);

    try {
      if (trello) {
        await trello.set(
          "card",
          "shared",
          "securityEvents",
          updatedEvents
        );
      } else {
        localStorage.setItem(
          "qse-security-events",
          JSON.stringify(updatedEvents)
        );
      }
    } catch (error) {
      console.error(
        "Erreur d'enregistrement sécurité :",
        error
      );

      alert(
        "Impossible d'enregistrer la modification dans Trello."
      );
    }
  };

  const selectEvent = async (event) => {
    const day = selectedDay;

    alert(`TEST QSE : jour ${day} - ${event.label}`);

    const updatedEvents = {
      ...dayEvents,
      [day]: event
    };

    setSelectedDay(null);

    await saveEvents(updatedEvents);

    if (event.color !== "green") {
      try {
        await createQseEventCard({
          day,
          event,
          indicator: "Sécurité"
        });

        alert(
          `Carte "${event.label}" créée dans Événements QSE.`
        );
      } catch (error) {
  console.error(
    "Erreur création carte QSE :",
    error
  );

  alert(
    `La couleur a été enregistrée, mais la carte Trello n'a pas pu être créée.

ERREUR :
${error?.message || String(error)}`
  );
}
    }
  };

  const resetDay = async () => {
    const updatedEvents = {
      ...dayEvents
    };

    delete updatedEvents[selectedDay];

    setSelectedDay(null);

    await saveEvents(updatedEvents);
  };

  if (loading) {
    return (
      <section className="security-indicator">
        <h2>🛡️ Croix Sécurité</h2>
        <p>Chargement...</p>
      </section>
    );
  }

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

            const cellColor =
              selectedEvent?.color || "green";

            return (
              <button
                key={day}
                type="button"
                className={`security-day security-day-${cellColor}`}
                onClick={() => setSelectedDay(day)}
                title={
                  selectedEvent?.label ||
                  "Journée en sécurité"
                }
              >
                {day}
              </button>
            );
          })
        )}
      </div>

      <div className="security-legend">
        {securityEvents.map((event) => (
          <div
            className="security-legend-item"
            key={event.label}
          >
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
        onClose={() => setSelectedDay(null)}
      />

      {selectedDay !== null &&
        dayEvents[selectedDay] && (
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