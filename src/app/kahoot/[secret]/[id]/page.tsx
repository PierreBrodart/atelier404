import { notFound } from 'next/navigation';
import { Editor } from '@/components/kahoot/editor/Editor';
import { KAHOOT_EDITOR_SLUG } from '@/lib/kahoot/editorSlug';
import { getKahoot } from '@/lib/kahoot/store';
import { isValidKahootId } from '@/lib/kahoot/validate';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function EditKahootPage({ params }: { params: Promise<{ secret: string; id: string }> }) {
  const { secret, id } = await params;
  if (secret !== KAHOOT_EDITOR_SLUG) notFound();
  if (!isValidKahootId(id)) notFound();

  const kahoot = await getKahoot(id);
  if (!kahoot) notFound();

  return (
    <div className="page kh-editor-page" data-editor-shell>
      <div className="container">
        <Editor editorKey={secret} initial={kahoot} />
      </div>
    </div>
  );
}
