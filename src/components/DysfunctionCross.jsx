import { useEffect, useState } from "react";
import EventDialog from "./EventDialog";
import { dysfunctionEvents } from "../data/dysfunction";
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

function DysfunctionCross() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayEvents, setDayEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setErrorMessage("");

        if (trello) {
          const savedEvents = await trello.get(
            "card",
            "shared",
            "dysfunctionEvents",
            {}
          );

          setDayEvents(savedEvents || {});
        } else {
          const savedData = localStorage.getItem(
            "qse-dysfunction-events"
          );

          setDayEvents(
            savedData ? JSON.parse(savedData) : {}
          );
        }
      } catch (error) {
        console.error(
          "Erreur chargement dysfonctionnements :",
          error
        );

        setDayEvents({});
        setErrorMessage(
          "Impossible de charger les dysfonctionnements."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const saveEvents = async (updatedEvents) => {
    setDayEvents(updatedEvents);

    if (trello) {
      await trello.set(
        "card",
        "shared",
        "dysfunctionEvents",
        updatedEvents
      );
    } else {
      localStorage.setItem(
        "qse-dysfunction-events",
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
    setErrorMessage("");

    try {
      await saveEvents(updatedEvents);

      if (event.color !== "green") {
        try {
          await createQseEventCard({
            day,
            event,
            indicator: "Dysfonctionnement"
          });

          console.log(
            `Carte Événements QSE créée pour le jour ${day}.`
          );
        } catch (error) {
          console.error(
            "Erreur création carte Événements QSE :",
            error
          );

          setErrorMessage(
            "La couleur a été enregistrée, mais la carte Événements QSE n'a pas pu être créée."
          );
        }
      }
    } catch (error) {
      console.error(
        "Erreur enregistrement dysfonctionnement :",
        error
      );

      setErrorMessage(
        "Impossible d'enregistrer cet événement."
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

  if (loading) {
    return (
      <section className="security-indicator">
        <h2>♻️ Dysfonctionnements</h2>
        <p>Chargement...</p>
      </section>
    );
  }

  return (
    <section className="security-indicator">

      <h2>♻️ Dysfonctionnements</h2>

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
                onClick={() => {
                  setErrorMessage("");
                  setSelectedDay(day);
                }}
                title={
                  selectedEvent?.label ||
                  "Aucun dysfonctionnement"
                }
              >
                {day}
              </button>
            );
          })
        )}
      </div>

      <div className="security-legend">
        {dysfunctionEvents.map((event) => (
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

      <EventDialog
        isOpen={selectedDay !== null}
        title={
          selectedDay !== null
            ? `Dysfonctionnement — Jour ${selectedDay}`
            : ""
        }
        options={dysfunctionEvents}
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

export default DysfunctionCross;