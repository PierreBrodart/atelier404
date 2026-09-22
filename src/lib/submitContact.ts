import type { ContactValues } from './validation';

export interface SubmitResult {
  ok: boolean;
  error?: string;
}

/**
 * Envoi du formulaire de contact.
 *
 * Site statique = pas de backend. Deux modes :
 *  - `NEXT_PUBLIC_FORM_ENDPOINT` défini (Formspree, Getform, Basin…) : POST JSON réel ;
 *  - sinon : envoi SIMULÉ (délai + succès), utile pour développer et présenter.
 * Pour brancher un vrai service, il suffit de renseigner la variable d'environnement.
 */
export async function submitContact(values: ContactValues): Promise<SubmitResult> {
  const endpoint = process.env.NEXT_PUBLIC_FORM_ENDPOINT;

  if (!endpoint) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { ok: true };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(values),
    });
    return response.ok ? { ok: true } : { ok: false, error: "Le serveur n'a pas accepté le message." };
  } catch {
    return { ok: false, error: 'Impossible de joindre le serveur. Vérifiez votre connexion.' };
  }
}
