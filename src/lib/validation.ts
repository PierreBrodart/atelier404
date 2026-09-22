export interface ContactValues {
  name: string;
  email: string;
  topic: string;
  message: string;
  consent: boolean;
}

export type ContactErrors = Partial<Record<keyof ContactValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Valide un champ isolé (ou tout le formulaire via `validateContact`). */
export function validateField<K extends keyof ContactValues>(
  field: K,
  value: ContactValues[K],
): string | undefined {
  switch (field) {
    case 'name':
      return String(value).trim().length < 2 ? 'Dites-nous comment vous appeler (2 caractères minimum).' : undefined;
    case 'email':
      if (!String(value).trim()) return 'Indiquez votre adresse e-mail pour que nous puissions répondre.';
      return EMAIL_PATTERN.test(String(value).trim())
        ? undefined
        : "Cette adresse e-mail semble incomplète (exemple : prenom@domaine.fr).";
    case 'topic':
      return value ? undefined : 'Choisissez le sujet qui se rapproche le plus de votre demande.';
    case 'message':
      return String(value).trim().length < 20
        ? 'Racontez-nous un peu plus (20 caractères minimum) : contexte, envies, délais…'
        : undefined;
    case 'consent':
      return value ? undefined : 'Merci de cocher la case pour que nous puissions traiter votre message.';
    default:
      return undefined;
  }
}

export function validateContact(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {};
  (Object.keys(values) as (keyof ContactValues)[]).forEach((field) => {
    const message = validateField(field, values[field]);
    if (message) errors[field] = message;
  });
  return errors;
}
