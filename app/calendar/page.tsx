import React from "react";

const dummyEvents = [
  { id: 1, date: "2025-05-13", title: "Bingo-avond in de lounge" },
  { id: 2, date: "2025-05-16", title: "Wekelijkse koffieochtend" },
  { id: 3, date: "2025-05-20", title: "Informatiebijeenkomst energiebesparing" },
];

export default function CalendarPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Community Kalender</h1>
      <div className="space-y-4">
        {dummyEvents.map(event => (
          <div key={event.id} className="bg-white rounded shadow p-4 border-l-4 border-green-400 flex items-center gap-4">
            <span className="text-green-800 font-mono font-bold w-24">{event.date}</span>
            <span className="text-gray-800">{event.title}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
