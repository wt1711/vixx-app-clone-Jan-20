import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Persona - Let your AI introduce you",
  description: "Create an AI version of yourself. Share your link. Let people get to know you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-white">
        {children}
      </body>
    </html>
  );
}
