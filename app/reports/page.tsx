import React from "react";

const dummyReports = [
  { id: 1, resident: "S. Jansen", date: "2025-05-07", type: "Onderhoud", text: "Lamp in de gang is stuk op de 2e verdieping." },
  { id: 2, resident: "A. Bakker", date: "2025-05-08", type: "Overlast", text: "Luidruchtig feestje in appartement 12B tot laat in de nacht." },
  { id: 3, resident: "L. de Boer", date: "2025-05-08", type: "Onderhoud", text: "Waterlekkage bij de voordeur van 5A." },
];

export default function ReportsPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Meldingen</h1>
      <div className="space-y-4">
        {dummyReports.map(report => (
          <div key={report.id} className="bg-white rounded shadow p-4 border-l-4 border-yellow-400">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-yellow-700">{report.type}</span>
              <span className="text-xs text-gray-500">{report.date}</span>
            </div>
            <div className="text-gray-700 italic mb-1">Gemeld door: {report.resident}</div>
            <div className="text-gray-700">{report.text}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
