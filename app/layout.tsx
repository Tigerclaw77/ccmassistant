import "./globals.css";
import Header from "../components/Header";
import AuthGate from "../components/auth/AuthGate";
import DeveloperPersonaToolbar from "../components/dev/DeveloperPersonaToolbar";
import { isDevelopmentPersonaEnabled } from "../lib/development-persona";
import Script from "next/script";

export const metadata = {
  title: {
    default: "CCM Assistant",
    template: "%s | CCM Assistant",
  },
  description: "Evidence-first chronic care management for coordinated practice teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var saved = localStorage.getItem("theme");
                var theme = saved || "clinical";
                document.documentElement.setAttribute("data-theme", theme);
              } catch (e) {}
            })();
          `}
        </Script>
      </head>

      <body className="min-h-screen antialiased">
        <Header />
        <AuthGate>{children}</AuthGate>
        {isDevelopmentPersonaEnabled() ? <DeveloperPersonaToolbar /> : null}
      </body>
    </html>
  );
}
