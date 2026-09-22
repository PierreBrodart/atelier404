import { notFound } from 'next/navigation';
import { Editor } from '@/components/kahoot/editor/Editor';
import { KAHOOT_EDITOR_SLUG } from '@/lib/kahoot/editorSlug';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function NewKahootPage({ params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  if (secret !== KAHOOT_EDITOR_SLUG) notFound();

  return (
    <div className="page kh-editor-page" data-editor-shell>
      <div className="container">
        <Editor editorKey={secret} initial={null} />
      </div>
    </div>
  );
}
