import type { Metadata } from "next";
import localFont from "next/font/local";
import { Syne } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Quizzard — AI Quiz Generator",
  description: "Turn any PDF into a live interactive quiz, like magic.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s===null&&p))document.documentElement.classList.add('dark');})()`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
