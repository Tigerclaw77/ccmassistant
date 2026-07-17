import "./globals.css";
import Header from "../components/Header";
import AuthGate from "../components/auth/AuthGate";
import DevelopmentAuditBar from "../components/dev/DevelopmentAuditBar";
import { isDevelopmentAuditEnabled } from "../lib/development-audit";
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
        {isDevelopmentAuditEnabled() ? <DevelopmentAuditBar /> : null}
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
