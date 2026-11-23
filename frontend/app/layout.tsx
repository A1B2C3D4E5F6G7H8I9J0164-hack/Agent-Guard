import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentGuard — AI-Native Cybersecurity & Red Team Platform",
  description: "Production AI application security, real-time LLM firewall, agent behaviour monitoring, and authorized adversarial testing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full bg-[#080B10] text-slate-200 antialiased selection:bg-[#39FF88]/20 selection:text-[#39FF88]">
        {children}
      </body>
    </html>
  );
}
