import type { Metadata } from 'next';
// import { Rules } from '@/components/undercover/Rules';
import { UndercoverEntry } from '@/components/undercover/UndercoverEntry';
import { CtaBand } from '@/components/ui/CtaBand';
import { PageIntro } from '@/components/ui/PageIntro';

export const metadata: Metadata = {
  title: 'Undercover',
  description:
    'Undercover, le jeu de bluff multijoueur d’Atelier 404 : crée une room, invite tes amis et démasquez l’imposteur depuis vos téléphones.',
  alternates: { canonical: '/undercover' },
};

export default function UndercoverPage() {
  return (
    <div className="page" data-accent="pink">
      <PageIntro
        accent="pink"
        label="Le jeu de l’atelier · 3 à 10 joueurs"
        title="Undercover. Qui ment ?"
        intro="Un mot presque identique, un imposteur qui bluffe, un vote qui tourne mal. Crée une room, partage le code, jouez chacun sur votre téléphone."
      />

      <section className="uc-start" aria-label="Créer ou rejoindre une partie">
        <div className="container">
          <UndercoverEntry />
        </div>
      </section>

      {/* <Rules /> */}
      <CtaBand tone="pink" title="Une idée de mini-jeu ?" text="On adore les projets qui sortent du cadre. Racontez-nous." />
    </div>
  );
}
