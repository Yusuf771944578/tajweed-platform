import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'منصة التجويد التفاعلية', description: 'تعلم أحكام التجويد بأسلوب اللعب' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri+Quran&family=IBM+Plex+Sans+Arabic:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
