import React from "react";

const dummyDocs = [
  { id: 1, name: "Huishoudelijk Reglement.pdf", type: "PDF" },
  { id: 2, name: "Aanvraagformulier Parkeerplaats.docx", type: "Word" },
  { id: 3, name: "Handleiding Brandveiligheid.pdf", type: "PDF" },
];

export default function DocumentsPage() {
  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b-2 border-blue-200 pb-2">Documenten & Formulieren</h1>
      <div className="space-y-4">
        {dummyDocs.map(doc => (
          <div key={doc.id} className="bg-white rounded-lg shadow-md p-5 flex items-center justify-between border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-blue-700 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <span className="font-semibold text-gray-900">{doc.name}</span>
                <span className="ml-2 text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded-full font-medium">({doc.type})</span>
              </div>
            </div>
            <button className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition font-medium shadow-sm border border-blue-800/30">
              Download
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
