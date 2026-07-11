import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

const interV = localFont({
  src: [
    { path: "../../public/fonts/InterV/regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/InterV/medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

const rebondGrotesque = localFont({
  src: [
    { path: "../../public/fonts/RebondGrotesque/bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-rebond",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SolveX · Codeforces Performance Intelligence",
  description: "SolveX analyzes your public Codeforces submissions to detect friction areas, find blind spots, and generate a focused 7-day training plan. No login required.",
  icons: {
    icon: "/seo/favicon-light.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${interV.variable} ${rebondGrotesque.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-white" style={{ backgroundColor: "#050A08" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
