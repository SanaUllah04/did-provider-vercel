import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DID Movie Site',
  description: 'Decentralized ID Signup Demo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}