import React, { useState, useEffect } from "react";

type Document = {
  id: number;
  name: string;
  type: string;
};

const dummyDocs: Document[] = [
  { id: 1, name: "Huishoudelijk Reglement.pdf", type: "PDF" },
  { id: 2, name: "Aanvraagformulier Parkeerplaats.docx", type: "Word" },
  { id: 3, name: "Handleiding Brandveiligheid.pdf", type: "PDF" },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(dummyDocs);
  const [name, setName] = useState("");
  const [type, setType] = useState("PDF");
  const [file, setFile] = useState<File | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const role = typeof window !== "undefined" ? localStorage.getItem("user_role") : null;
    setIsAdmin(role === "beheerder");
  }, []);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !file) return;
    setDocuments([
      ...documents,
      {
        id: Date.now(),
        name,
        type,
      },
    ]);
    setName("");
    setType("PDF");
    setFile(null);
  };

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b-2 border-blue-200 pb-2">
        Documenten & Formulieren
      </h1>

      {isAdmin && (
        <form
          onSubmit={handleUpload}
          className="mb-8 bg-blue-50 p-6 rounded-lg border border-blue-200 shadow-sm flex flex-col md:flex-row gap-4 items-center"
        >
          <input
            type="text"
            placeholder="Documentnaam"
            value={name}
            onChange={e => setName(e.target.value)}
            className="border rounded px-3 py-2"
            required
          />
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="PDF">PDF</option>
            <option value="Word">Word</option>
            <option value="Excel">Excel</option>
          </select>
          <input
            type="file"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="border rounded px-3 py-2"
            required
          />
          <button
            type="submit"
            className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition font-medium shadow-sm border border-blue-800/30"
          >
            Uploaden
          </button>
        </form>
      )}

      <div className="space-y-4">
        {documents.map(doc => (
          <div
            key={doc.id}
            className="bg-white rounded-lg shadow-md p-5 flex items-center justify-between border-l-4 border-blue-500 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <svg
                className="w-6 h-6 text-blue-700 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div>
                <span className="font-semibold text-gray-900">{doc.name}</span>
                <span className="ml-2 text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded-full font-medium">
                  ({doc.type})
                </span>
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