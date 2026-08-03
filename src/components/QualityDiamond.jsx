import { useEffect, useState } from "react";
import EventDialog from "./EventDialog";
import { qualityEvents } from "../data/quality";
import { trello } from "../trello";
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

  useEffect(() => {
    const loadEvents = async () => {
      try {
        if (trello) {
          const savedEvents = await trello.get(
            "card",
            "shared",
            "qualityEvents",
            {}
          );

          setDayEvents(savedEvents);
        } else {
          const savedData = localStorage.getItem("qse-quality-events");
          setDayEvents(savedData ? JSON.parse(savedData) : {});
        }
      } catch (error) {
        console.error("Erreur de chargement qualité :", error);
        setDayEvents({});
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const openDialog = (day) => {
    setSelectedDay(day);
  };

  const closeDialog = () => {
    setSelectedDay(null);
  };

  const saveEvents = async (updatedEvents) => {
    setDayEvents(updatedEvents);

    try {
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
    } catch (error) {
      console.error("Erreur d'enregistrement qualité :", error);
      alert("Impossible d'enregistrer la modification dans Trello.");
    }
  };

  const selectEvent = async (event) => {
    const updatedEvents = {
      ...dayEvents,
      [selectedDay]: event
    };

    closeDialog();
    await saveEvents(updatedEvents);
  };

  const resetDay = async () => {
    const updatedEvents = { ...dayEvents };

    delete updatedEvents[selectedDay];

    closeDialog();
    await saveEvents(updatedEvents);
  };

  if (loading) {
    return (
      <section className="quality-indicator">
        <h2>💎 Diamant Qualité</h2>
        <p>Chargement…</p>
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
            const cellColor = selectedEvent?.color || "green";

            return (
              <button
                key={day}
                type="button"
                className={`quality-day quality-day-${cellColor}`}
                onClick={() => openDialog(day)}
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
          <div className="quality-legend-item" key={event.label}>
            <span
              className={`quality-legend-color quality-legend-${event.color}`}
            />
            <span>{event.label}</span>
          </div>
        ))}
      </div>

      <EventDialog
        isOpen={selectedDay !== null}
        title={
          selectedDay !== null
            ? `Événement qualité — Jour ${selectedDay}`
            : ""
        }
        options={qualityEvents}
        onSelect={selectEvent}
        onClose={closeDialog}
      />

      {selectedDay !== null && dayEvents[selectedDay] && (
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
