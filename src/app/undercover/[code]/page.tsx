import type { Metadata } from 'next';
import { RoomClient } from '@/components/undercover/RoomClient';
import { themeInfos } from '@/data/undercover';
import { parseCode } from '@/lib/undercover/parse';

export const metadata: Metadata = {
  title: 'Partie Undercover',
  robots: { index: false, follow: false },
};

interface RoomPageProps {
  params: Promise<{ code: string }>;
}

/**
 * Page d'une room. Serveur : ne transmet au client que la liste des thèmes SANS leurs mots
 * (`themeInfos`), la banque de mots reste côté serveur.
 */
export default async function RoomPage({ params }: RoomPageProps) {
  const { code } = await params;
  const clean = parseCode(code) ?? code.toUpperCase().slice(0, 5);

  return (
    <div className="page" data-accent="pink">
      <RoomClient code={clean} themes={themeInfos} />
    </div>
  );
}
