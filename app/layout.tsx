import "./globals.css";
import Header from "../components/Header";
import AuthGate from "../components/auth/AuthGate";
import Script from "next/script";

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

      <body className="min-h-screen">
        <Header />
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
