import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import NavBar from "./NavBar";
import ProtectedRoute from "./ProtectedRoute";

export const metadata: Metadata = {
  title: "Bewonersplatform Weerwolfhuizen",
  description: "Online portaal voor bewoners van Weerwolfhuizen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="bg-white min-h-screen antialiased">
        <NavBar />
        <ProtectedRoute>{children}</ProtectedRoute>
      </body>
    </html>
  );
}

