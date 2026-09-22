import type { ReactNode } from 'react';
// Le style du module n'est chargé que sur les pages /kahoot (même logique que /undercover).
import '@/styles/kahoot/main.scss';

export default function KahootLayout({ children }: { children: ReactNode }) {
  return children;
}
