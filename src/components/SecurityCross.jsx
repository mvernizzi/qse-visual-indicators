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
  const [errorMessage, setErrorMessage] = useState("");

  // Chargement des événements enregistrés
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setErrorMessage("");

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
        setErrorMessage(
          "Impossible de charger les événements enregistrés."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Enregistrement des couleurs / événements
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

  // Lorsqu'un événement est choisi
  const selectEvent = async (event) => {
    if (selectedDay === null) {
      return;
    }

    const day = selectedDay;

    const updatedEvents = {
      ...dayEvents,
      [day]: event
    };

    // On ferme immédiatement la fenêtre de sélection
    setSelectedDay(null);
    setErrorMessage("");

    try {
      // 1. Enregistrement de la couleur
      await saveEvents(updatedEvents);

      // 2. Si événement différent du vert :
      // création de la carte dans "Événements QSE"
      if (event.color !== "green") {
        try {
          await createQseEventCard({
            day,
            event,
            indicator: "Sécurité"
          });

          console.log(
            `Carte Événements QSE créée pour le jour ${day}.`
          );
        } catch (error) {
          console.error(
            "Erreur création carte Événements QSE :",
            error
          );

          // Pas de popup :
          // on affiche simplement un message sous l'indicateur
          setErrorMessage(
            "La couleur a été enregistrée, mais la carte Événements QSE n'a pas pu être créée."
          );
        }
      }
    } catch (error) {
      console.error(
        "Erreur enregistrement événement sécurité :",
        error
      );

      setErrorMessage(
        "Impossible d'enregistrer cet événement."
      );
    }
  };

  // Remise d'un jour en vert
  const resetDay = async () => {
    if (selectedDay === null) {
      return;
    }

    const updatedEvents = {
      ...dayEvents
    };

    delete updatedEvents[selectedDay];

    setErrorMessage("");

    try {
      await saveEvents(updatedEvents);
      setSelectedDay(null);
    } catch (error) {
      console.error(
        "Erreur remise en vert :",
        error
      );

      setErrorMessage(
        "Impossible de remettre ce jour en vert."
      );
    }
  };

  // Affichage pendant le chargement
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

      {/* Croix Sécurité */}
      <div className="security-cross">
        {rows.flatMap((row, rowIndex) =>
          row.map((day, columnIndex) => {

            // Cases vides servant à dessiner la croix
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
                onClick={() => {
                  setErrorMessage("");
                  setSelectedDay(day);
                }}
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

      {/* Légende */}
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

      {/* Message uniquement en cas d'erreur */}
      {errorMessage && (
        <p
          style={{
            marginTop: "12px",
            fontWeight: "600"
          }}
        >
          ⚠️ {errorMessage}
        </p>
      )}

      {/* Fenêtre normale de sélection de l'événement */}
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

      {/* Remise en vert */}
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