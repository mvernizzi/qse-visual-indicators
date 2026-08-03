import { useEffect, useState } from "react";
import EventDialog from "./EventDialog";
import { dysfunctionEvents } from "../data/dysfunction";
import { trello } from "../trello";
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

  useEffect(() => {
    const loadEvents = async () => {
      try {
        if (trello) {
          const savedEvents = await trello.get(
            "card",
            "shared",
            "dysfunctionEvents",
            {}
          );

          setDayEvents(savedEvents);
        } else {
          const saved = localStorage.getItem("qse-dysfunction-events");
          setDayEvents(saved ? JSON.parse(saved) : {});
        }
      } catch (error) {
        console.error(error);
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
          "dysfunctionEvents",
          updatedEvents
        );
      } else {
        localStorage.setItem(
          "qse-dysfunction-events",
          JSON.stringify(updatedEvents)
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const selectEvent = async (event) => {
    const updated = {
      ...dayEvents,
      [selectedDay]: event
    };

    setSelectedDay(null);

    await saveEvents(updated);
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
                  key={`${rowIndex}-${columnIndex}`}
                  className="security-empty"
                />
              );
            }

            const selected = dayEvents[day];
            const color = selected?.color || "green";

            return (
              <button
                key={day}
                className={`security-day security-day-${color}`}
                onClick={() => setSelectedDay(day)}
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

            {event.label}

          </div>

        ))}

      </div>

      <EventDialog
        isOpen={selectedDay !== null}
        title={`Événement dysfonctionnement — Jour ${selectedDay}`}
        options={dysfunctionEvents}
        onSelect={selectEvent}
        onClose={() => setSelectedDay(null)}
      />

    </section>
  );
}

export default DysfunctionCross;