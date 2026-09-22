import type { ReactNode } from 'react';
// Le style du jeu n'est chargé que sur les pages /undercover (le reste du site n'est pas alourdi).
import '@/styles/undercover/main.scss';

export default function UndercoverLayout({ children }: { children: ReactNode }) {
  return children;
}
