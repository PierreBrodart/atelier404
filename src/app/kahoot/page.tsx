import type { Metadata } from 'next';
import { Hub } from '@/components/kahoot/Hub';
import { CtaBand } from '@/components/ui/CtaBand';
import { PageIntro } from '@/components/ui/PageIntro';
import { listKahoots } from '@/lib/kahoot/store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Kahoot',
  description: 'Les quiz de l’atelier : questions à choix multiples, curseurs et cartes interactives. Joue depuis ton téléphone.',
  alternates: { canonical: '/kahoot' },
};

export default async function KahootPage() {
  const kahoots = await listKahoots();

  return (
    <div className="page" data-accent="sun">
      <PageIntro
        accent="sun"
        label="Le quiz de l’atelier"
        title="Kahoot. Qui sait tout ?"
        intro="Des quiz maison : QCM, curseurs de précision et cartes à pointer du doigt. Choisis-en un et lance la partie."
      />

      <section className="kh-section" aria-label="Kahoot">
        <div className="container">
          <Hub kahoots={kahoots} />
        </div>
      </section>

      <CtaBand tone="sun" title="Une idée de quiz ?" text="Racontez-nous ce que vous voulez tester, on adore ça." />
    </div>
  );
}
