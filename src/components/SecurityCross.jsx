import { useEffect, useState } from "react";
import EventDialog from "./EventDialog";
import { securityEvents } from "../data/security";
import { trello } from "../trello";
import {
  authorizeTrello,
  createQseEventCard
} from "../trelloEvents";
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
  const [authorizing, setAuthorizing] = useState(false);

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

          setDayEvents(savedEvents || {});
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
          "Erreur chargement événements sécurité :",
          error
        );

        setDayEvents({});
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const handleAuthorize = async () => {
    try {
      setAuthorizing(true);

      await authorizeTrello();

      alert(
        "✅ Autorisation Trello réussie !\n\nVous pouvez maintenant créer automatiquement les cartes QSE."
      );
    } catch (error) {
      console.error(
        "Erreur autorisation Trello :",
        error
      );

      alert(
        `❌ L'autorisation Trello n'a pas abouti.

${error?.message || String(error)}`
      );
    } finally {
      setAuthorizing(false);
    }
  };

  const saveEvents = async (updatedEvents) => {
    setDayEvents(updatedEvents);

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
  };

  const selectEvent = async (event) => {
    if (selectedDay === null) {
      return;
    }

    const day = selectedDay;

    const updatedEvents = {
      ...dayEvents,
      [day]: event
    };

    setSelectedDay(null);

    try {
      await saveEvents(updatedEvents);

      if (event.color !== "green") {
        try {
          const card = await createQseEventCard({
            day,
            event,
            indicator: "Sécurité"
          });

          if (card) {
            alert(
              `✅ Carte Trello créée avec succès !

${card.name}`
            );
          }
        } catch (error) {
          console.error(
            "Erreur création carte QSE :",
            error
          );

          alert(
            `La couleur a bien été enregistrée.

La carte Trello n'a pas pu être créée.

${error?.message || String(error)}

Si Trello n'est pas encore autorisé, cliquez sur le bouton « 🔐 Autoriser Trello ».`
          );
        }
      }
    } catch (error) {
      console.error(
        "Erreur enregistrement sécurité :",
        error
      );

      alert(
        `Impossible d'enregistrer l'événement.

${error?.message || String(error)}`
      );
    }
  };

  const resetDay = async () => {
    if (selectedDay === null) {
      return;
    }

    const updatedEvents = {
      ...dayEvents
    };

    delete updatedEvents[selectedDay];

    try {
      await saveEvents(updatedEvents);
      setSelectedDay(null);
    } catch (error) {
      console.error(
        "Erreur remise en vert :",
        error
      );

      alert(
        `Impossible de remettre le jour en vert.

${error?.message || String(error)}`
      );
    }
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

      {trello && (
        <div
          style={{
            marginBottom: "16px",
            textAlign: "center"
          }}
        >
          <button
            type="button"
            onClick={handleAuthorize}
            disabled={authorizing}
            style={{
              padding: "10px 16px",
              cursor: authorizing
                ? "wait"
                : "pointer",
              fontWeight: "600"
            }}
          >
            {authorizing
              ? "Autorisation..."
              : "🔐 Autoriser Trello"}
          </button>
        </div>
      )}

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