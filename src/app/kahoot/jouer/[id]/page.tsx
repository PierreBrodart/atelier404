import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PlayRunner } from '@/components/kahoot/play/PlayRunner';
import { ButtonLink } from '@/components/ui/Button';
import { getKahoot } from '@/lib/kahoot/store';
import { isValidKahootId } from '@/lib/kahoot/validate';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const kahoot = isValidKahootId(id) ? await getKahoot(id) : null;
  return { title: kahoot ? kahoot.title : 'Kahoot introuvable' };
}

export default async function PlayKahootPage({ params }: Props) {
  const { id } = await params;
  const kahoot = isValidKahootId(id) ? await getKahoot(id) : null;

  if (!kahoot) {
    notFound();
  }

  return (
    <div className="page kh-play-page" data-accent={kahoot.settings.accent}>
      <div className="container kh-play-page__inner">
        <header className="kh-play-page__top">
          <ButtonLink href="/kahoot" variant="ghost">
            ← Kahoot
          </ButtonLink>
        </header>
        <PlayRunner kahoot={kahoot} />
      </div>
    </div>
  );
}
