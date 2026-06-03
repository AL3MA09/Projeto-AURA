import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "AURA — Assistente Universitária · FATEC Zona Sul",
  description:
    "AURA é a assistente virtual inteligente da secretaria acadêmica da FATEC Zona Sul. " +
    "Tire dúvidas, solicite documentos e gerencie sua vida acadêmica com facilidade.",
  keywords: ["FATEC", "Zona Sul", "assistente virtual", "secretaria acadêmica", "IA universitária"],
  authors: [{ name: "FATEC Zona Sul" }],
  themeColor: "#0A0A0A",
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "AURA — Assistente Universitária FATEC Zona Sul",
    description: "Sua assistente virtual acadêmica inteligente",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen text-white antialiased" style={{ backgroundColor: "#0A0A0A" }}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1c1f52",
              color: "#fff",
              border: "1px solid rgba(97,113,243,0.3)",
              borderRadius: "12px",
            },
            success: { iconTheme: { primary: "#6171f3", secondary: "#fff" } },
            error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
