import { useEffect, useState } from "react";
import EventDialog from "./EventDialog";
import { qualityEvents } from "../data/quality";
import {
  loadQseEvents,
  saveQseEvents
} from "../qseStorage";
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

  // Chargement des événements enregistrés sur le tableau Trello
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setErrorMessage("");

        const savedEvents = await loadQseEvents("quality");

        setDayEvents(savedEvents || {});
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

  // Enregistrement des événements sur le tableau Trello
  const saveEvents = async (updatedEvents) => {
    await saveQseEvents("quality", updatedEvents);
    setDayEvents(updatedEvents);
  };

  // Sélection d'un événement
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

      // Création d'une carte pour les événements non verts
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
            "L'événement est enregistré, mais la carte Événements QSE n'a pas pu être créée. Vérifiez que la liste « Événements QSE » existe sur ce tableau."
          );
        }
      }
    } catch (error) {
      console.error(
        "Erreur enregistrement événement qualité :",
        error
      );

      setErrorMessage(
        "Impossible d'enregistrer cet événement. Vérifiez les autorisations du Power-Up Trello."
      );
    }
  };

  // Réinitialisation : la case redevient blanche
  const resetDay = async () => {
    if (selectedDay === null) {
      return;
    }

    const day = selectedDay;
    const updatedEvents = { ...dayEvents };

    delete updatedEvents[day];

    setErrorMessage("");

    try {
      await saveEvents(updatedEvents);
      setSelectedDay(null);
    } catch (error) {
      console.error(
        "Erreur réinitialisation jour qualité :",
        error
      );

      setErrorMessage(
        "Impossible de réinitialiser ce jour."
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
            const cellColor = selectedEvent?.color || "white";

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
                  "Aucun événement sélectionné"
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

      {selectedDay !== null && dayEvents[selectedDay] && (
        <button
          type="button"
          className="quality-reset-button"
          onClick={resetDay}
        >
          Remettre le jour {selectedDay} en blanc
        </button>
      )}
    </section>
  );
}

export default QualityDiamond;