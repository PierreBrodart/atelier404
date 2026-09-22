import { parseCode } from '@/lib/undercover/parse';
import { subscribe } from '@/lib/undercover/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEARTBEAT_MS = 20_000;

/**
 * GET /api/undercover/stream?code=A4X7K&token=…
 * Flux Server-Sent Events : à chaque changement de la room, le joueur reçoit SA vue
 * (publique + privée). Le jeton identifie le joueur ; un jeton invalide reçoit 401.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = parseCode(url.searchParams.get('code'));
  const token = url.searchParams.get('token') ?? '';
  if (!code || !token) return new Response('Requête invalide', { status: 400 });

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const shutdown = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe?.();
        try {
          controller.close();
        } catch {
          // flux déjà fermé
        }
      };

      unsubscribe = subscribe(
        code,
        token,
        (view) => {
          if (closed) return;
          controller.enqueue(encoder.encode(`event: state\ndata: ${JSON.stringify(view)}\n\n`));
        },
        shutdown,
      );

      // Jeton invalide : rien n'est démarré, la réponse 401 est renvoyée plus bas.
      if (!unsubscribe) {
        closed = true;
        return;
      }

      // Commentaire SSE périodique : garde la connexion ouverte à travers les proxys.
      heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(': ping\n\n'));
      }, HEARTBEAT_MS);

      request.signal.addEventListener('abort', shutdown);
    },
    cancel() {
      if (closed) return;
      closed = true;
      clearInterval(heartbeat);
      unsubscribe?.();
    },
  });

  // `start` s'exécute de façon synchrone : le jeton a déjà été vérifié ici (401 propre côté client).
  if ((unsubscribe as (() => void) | null) === null) return new Response('Non autorisé', { status: 401 });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
