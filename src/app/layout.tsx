import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Examaker - Trợ lý AI tạo đề thi Tiếng Anh',
  description: 'Examaker là trợ lý AI đắc lực, giúp giáo viên tiểu học tạo ra các bài kiểm tra ngôn ngữ sáng tạo, phù hợp và hấp dẫn chỉ trong vài phút.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-background font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
