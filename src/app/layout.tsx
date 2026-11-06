import type { Metadata, Viewport } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { SwRegister } from "@/components/sw-register";
import { WelcomeGate } from "@/components/welcome-gate";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Workbrook Memory",
    template: "%s · Workbrook Memory",
  },
  description:
    "A free public record of who helped people land work. No accounts, no passwords.",
};

export const viewport: Viewport = {
  themeColor: "#3b6fd8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <WelcomeGate>
          <AppShell>{children}</AppShell>
        </WelcomeGate>
        <SwRegister />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
