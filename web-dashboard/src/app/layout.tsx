import type { Metadata } from "next";
import "./globals.css";

import { SettingsProvider } from "@/providers/SettingsProvider";
import { AuthProvider } from "@/context/AuthContext";
import { Analytics } from "@vercel/analytics/next";




export const metadata: Metadata = {
  title: "VultaCore",
  description: "Advanced Developer & Cybersecurity Dashboard",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

import { NavigationEvents } from "@/components/NavigationEvents";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Total suppression of MetaMask extension noise
                const suppress = (msg) => msg && typeof msg === 'string' && (msg.includes('MetaMask') || msg.includes('nkbihfbeogaeaoehlefnkodbefgpgknn'));
                
                const _error = console.error;
                console.error = function(...args) {
                  if (suppress(args[0]) || suppress(args[1])) return;
                  _error.apply(console, args);
                };

                const _warn = console.warn;
                console.warn = function(...args) {
                  if (suppress(args[0]) || suppress(args[1])) return;
                  _warn.apply(console, args);
                };

                window.addEventListener('unhandledrejection', (event) => {
                  const reason = event.reason;
                  if (reason && (suppress(reason.message) || suppress(reason.stack) || suppress(reason))) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                  }
                }, true);

                window.addEventListener('error', (event) => {
                  if (suppress(event.message) || suppress(event.filename)) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
<body
        className={`antialiased`}
      >
        <AuthProvider>
          <SettingsProvider>
            <Suspense fallback={null}>
              <NavigationEvents />
            </Suspense>
            {children}
            <Analytics />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

