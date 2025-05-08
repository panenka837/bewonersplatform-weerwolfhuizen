import React from "react";

const dummyNotices = [
  { id: 1, title: "Brandalarmtest", date: "2025-05-10", text: "Op vrijdag 10 mei wordt om 10:00 uur het brandalarm getest. U hoeft niets te doen." },
  { id: 2, title: "Schoonmaak trappenhuis", date: "2025-05-12", text: "Het trappenhuis wordt maandag grondig schoongemaakt. Houd rekening met natte vloeren." },
  { id: 3, title: "Nieuwe huismeester", date: "2025-05-15", text: "Vanaf 15 mei is onze nieuwe huismeester, Jan de Vries, aanwezig voor vragen en hulp." },
];

export default function NoticesPage() {
  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b-2 border-blue-200 pb-2">Mededelingen</h1>
      <div className="space-y-4">
        {dummyNotices.map(notice => (
          <div key={notice.id} className="bg-white rounded-lg shadow-md p-5 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-blue-900 text-lg">{notice.title}</span>
              <span className="text-sm bg-blue-50 text-blue-800 px-2 py-1 rounded-full font-medium">{notice.date}</span>
            </div>
            <div className="text-gray-800 leading-relaxed">{notice.text}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
