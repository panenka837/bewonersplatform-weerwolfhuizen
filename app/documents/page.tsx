"use client";
import React, { useState, useEffect } from "react";

type Document = {
  id: string;
  name: string;
  type: string;
  description?: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [name, setName] = useState("");
  
  // Haal documenten op uit de database
  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await fetch('/api/documents');
        
        if (!response.ok) {
          throw new Error('Fout bij het ophalen van documenten');
        }
        
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        console.error('Error fetching documents:', err);
      }
    }
    
    fetchDocuments();
  }, []);
  const [type, setType] = useState("PDF");
  const [file, setFile] = useState<File | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const role = typeof window !== "undefined" ? localStorage.getItem("user_role") : null;
    setIsAdmin(role === "beheerder");
  }, []);

  async function handleAddDocument(e: React.FormEvent) {
    e.preventDefault();
    if (name && type && file) {
      try {
        // In een echte app zou je hier de file uploaden naar een storage service
        // en de URL opslaan in de database
        const filePath = `/uploads/${file.name}`; // Dit is een placeholder
        
        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            type,
            description: '',
            filePath,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Fout bij het toevoegen van document');
        }
        
        const newDoc: Document = await response.json();
        setDocuments([...documents, newDoc]);
        setName("");
        setType("PDF");
        setFile(null);
      } catch (err) {
        console.error('Error adding document:', err);
      }
    }
  };

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b-2 border-blue-200 pb-2">
        Documenten & Formulieren
      </h1>

      {isAdmin && (
        <form
          onSubmit={handleAddDocument}
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