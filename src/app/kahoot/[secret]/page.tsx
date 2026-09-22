import { notFound } from 'next/navigation';
import { Dashboard } from '@/components/kahoot/editor/Dashboard';
import { KAHOOT_EDITOR_SLUG } from '@/lib/kahoot/editorSlug';
import { listKahoots } from '@/lib/kahoot/store';

export const dynamic = 'force-dynamic';
// Jamais indexée, jamais dans le sitemap (voir sitemap.ts) : c'est l'adresse secrète de l'éditeur.
export const metadata = { robots: { index: false, follow: false } };

export default async function KahootSecretPage({ params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  if (secret !== KAHOOT_EDITOR_SLUG) notFound();

  const kahoots = await listKahoots();
  return (
    <div className="page kh-editor-page" data-editor-shell>
      <div className="container">
        <Dashboard editorKey={secret} kahoots={kahoots} />
      </div>
    </div>
  );
}
