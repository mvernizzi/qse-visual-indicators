import { useEffect, useState } from "react";
import EventDialog from "./EventDialog";
import { qualityEvents } from "../data/quality";
import { trello } from "../trello";
import { createQseEventCard } from "../trelloEvents";
import "./QualityDiamond.css";

const rows = [
  [null, null, null, 1, null, null, null],
  [null, null, 2, 3, 4, null, null],
  [null, 5, 6, 7, 8, 9, null],
  [10, 11, 12, 13, 14, 15, 16],
  [null, 17, 18, 19, 20, 21, null],
  [null, null, 22, 23, 24, null, null],
  [null, null, null, 25, null, null, null],
  [null, null, 26, 27, 28, null, null],
  [null, null, null, 29, null, null, null],
  [null, null, null, 30, null, null, null],
  [null, null, null, 31, null, null, null]
];

function QualityDiamond() {
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
            "qualityEvents",
            {}
          );

          setDayEvents(savedEvents || {});
        } else {
          const savedData = localStorage.getItem(
            "qse-quality-events"
          );

          setDayEvents(
            savedData ? JSON.parse(savedData) : {}
          );
        }
      } catch (error) {
        console.error(
          "Erreur chargement événements qualité :",
          error
        );

        setDayEvents({});
        setErrorMessage(
          "Impossible de charger les événements qualité."
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
        "qualityEvents",
        updatedEvents
      );
    } else {
      localStorage.setItem(
        "qse-quality-events",
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
            indicator: "Qualité"
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
        "Erreur enregistrement événement qualité :",
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
      <section className="quality-indicator">
        <h2>💎 Diamant Qualité</h2>
        <p>Chargement...</p>
      </section>
    );
  }

  return (
    <section className="quality-indicator">

      <h2>💎 Diamant Qualité</h2>

      <div className="quality-diamond">
        {rows.flatMap((row, rowIndex) =>
          row.map((day, columnIndex) => {

            if (day === null) {
              return (
                <div
                  key={`empty-${rowIndex}-${columnIndex}`}
                  className="quality-empty"
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
                className={`quality-day quality-day-${cellColor}`}
                onClick={() => {
                  setErrorMessage("");
                  setSelectedDay(day);
                }}
                title={
                  selectedEvent?.label ||
                  "Clients et riverains satisfaits"
                }
              >
                {day}
              </button>
            );
          })
        )}
      </div>

      <div className="quality-legend">
        {qualityEvents.map((event) => (
          <div
            className="quality-legend-item"
            key={event.label}
          >
            <span
              className={`quality-legend-color quality-legend-${event.color}`}
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
            ? `Événement qualité — Jour ${selectedDay}`
            : ""
        }
        options={qualityEvents}
        onSelect={selectEvent}
        onClose={() => setSelectedDay(null)}
      />

      {selectedDay !== null &&
        dayEvents[selectedDay] && (
          <button
            type="button"
            className="quality-reset-button"
            onClick={resetDay}
          >
            Remettre le jour {selectedDay} en vert
          </button>
        )}

    </section>
  );
}

export default QualityDiamond;