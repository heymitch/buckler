import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Signal',
  robots: 'noindex, nofollow',
};

export default function SignalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Jura:wght@300;400;600&family=JetBrains+Mono:wght@400;500;700&family=Silkscreen&display=swap" rel="stylesheet" />
      {children}
    </>
  );
}
