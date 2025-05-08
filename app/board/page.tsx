import React from "react";

const dummyBoard = [
  { id: 1, user: "M. Visser", date: "2025-05-06", title: "Gratis plantenstekjes!", text: "Af te halen bij appartement 7C, zolang de voorraad strekt." },
  { id: 2, user: "P. van Leeuwen", date: "2025-05-07", title: "Boeken te ruil", text: "Diverse romans en thrillers beschikbaar om te ruilen. Interesse? Stuur een berichtje!" },
  { id: 3, user: "S. de Groot", date: "2025-05-08", title: "Hulp gevraagd met verhuizen", text: "Wie kan mij zaterdagmiddag helpen dozen tillen?" },
];

export default function BoardPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Prikbord / Marktplaats</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {dummyBoard.map(post => (
          <div key={post.id} className="bg-white rounded shadow p-4 border-l-4 border-pink-400 flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-pink-700">{post.title}</span>
              <span className="text-xs text-gray-500">{post.date}</span>
            </div>
            <div className="text-gray-700 mb-2">{post.text}</div>
            <div className="text-xs text-gray-500 text-right">Geplaatst door: {post.user}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
