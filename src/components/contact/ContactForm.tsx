'use client';

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { contactTopics } from '@/data/site';
import { submitContact } from '@/lib/submitContact';
import {
  validateContact,
  validateField,
  type ContactErrors,
  type ContactValues,
} from '@/lib/validation';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const INITIAL: ContactValues = { name: '', email: '', topic: '', message: '', consent: false };

const FIELD_LABELS: Record<keyof ContactValues, string> = {
  name: 'Nom',
  email: 'E-mail',
  topic: 'Sujet',
  message: 'Message',
  consent: 'Consentement',
};

/**
 * Formulaire de contact accessible : labels explicites, validation à la soumission
 * puis à la volée, erreurs reliées aux champs (`aria-describedby`, `aria-invalid`),
 * résumé d'erreurs focalisé, état de succès annoncé.
 * L'envoi passe par `submitContact` (simulé tant qu'aucun service n'est configuré).
 */
export function ContactForm() {
  const [values, setValues] = useState<ContactValues>(INITIAL);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState('');
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  const setField = <K extends keyof ContactValues>(field: K, value: ContactValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    // Une erreur déjà affichée se corrige en direct.
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: validateField(field, value) }));
    }
  };

  const onChange =
    (field: 'name' | 'email' | 'topic' | 'message') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setField(field, event.target.value);

  const onBlur = (field: keyof ContactValues) => () => {
    setErrors((current) => ({ ...current, [field]: validateField(field, values[field]) }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'submitting') return;

    const found = validateContact(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus('idle');
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    // Anti-spam : un robot remplit le champ caché, pas un humain.
    if (honeypot.current?.value) {
      setStatus('success');
      return;
    }

    setStatus('submitting');
    const result = await submitContact(values);
    if (result.ok) {
      setStatus('success');
      setValues(INITIAL);
      requestAnimationFrame(() => successRef.current?.focus());
    } else {
      setServerError(result.error ?? 'Une erreur est survenue.');
      setStatus('error');
      requestAnimationFrame(() => summaryRef.current?.focus());
    }
  };

  if (status === 'success') {
    return (
      <div ref={successRef} className="form-success" role="status" tabIndex={-1}>
        <p className="form-success__title">Message reçu !</p>
        <p>
          Merci, on vous répond sous 48 h ouvrées. En attendant, un conseil : ne redémarrez pas votre ordinateur, ça ne
          changera rien.
        </p>
        <Button type="button" variant="ink" onClick={() => setStatus('idle')}>
          Envoyer un autre message
        </Button>
      </div>
    );
  }

  const errorEntries = Object.entries(errors) as [keyof ContactValues, string][];
  const hasSummary = errorEntries.length > 0 || status === 'error';
  const busy = status === 'submitting';

  return (
    <form className="form" onSubmit={onSubmit} noValidate aria-busy={busy}>
      {hasSummary && (
        <div ref={summaryRef} className="form__summary" role="alert" tabIndex={-1}>
          {status === 'error' && errorEntries.length === 0 ? (
            <p>{serverError}</p>
          ) : (
            <>
              <p className="form__summary-title">
                {errorEntries.length > 1
                  ? `${errorEntries.length} champs sont à corriger :`
                  : 'Un champ est à corriger :'}
              </p>
              <ul>
                {errorEntries.map(([field, message]) => (
                  <li key={field}>
                    <a href={`#field-${field}`}>
                      {FIELD_LABELS[field]} — {message}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className={`field${errors.name ? ' field--error' : ''}`}>
        <label htmlFor="field-name">Votre nom</label>
        <input
          id="field-name"
          name="name"
          type="text"
          autoComplete="name"
          value={values.name}
          onChange={onChange('name')}
          onBlur={onBlur('name')}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'error-name' : undefined}
          required
        />
        {errors.name && (
          <p id="error-name" className="field__error">
            {errors.name}
          </p>
        )}
      </div>

      <div className={`field${errors.email ? ' field--error' : ''}`}>
        <label htmlFor="field-email">Votre e-mail</label>
        <input
          id="field-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={onChange('email')}
          onBlur={onBlur('email')}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'error-email' : 'hint-email'}
          required
        />
        <p id="hint-email" className="field__hint">
          Uniquement pour vous répondre. Pas de newsletter surprise.
        </p>
        {errors.email && (
          <p id="error-email" className="field__error">
            {errors.email}
          </p>
        )}
      </div>

      <div className={`field${errors.topic ? ' field--error' : ''}`}>
        <label htmlFor="field-topic">Votre projet, c’est plutôt…</label>
        <Select
          id="field-topic"
          name="topic"
          value={values.topic}
          onChange={onChange('topic')}
          onBlur={onBlur('topic')}
          aria-invalid={Boolean(errors.topic)}
          aria-describedby={errors.topic ? 'error-topic' : undefined}
          required
        >
          <option value="">Choisir un sujet</option>
          {contactTopics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </Select>
        {errors.topic && (
          <p id="error-topic" className="field__error">
            {errors.topic}
          </p>
        )}
      </div>

      <div className={`field${errors.message ? ' field--error' : ''}`}>
        <label htmlFor="field-message">Racontez-nous</label>
        <textarea
          id="field-message"
          name="message"
          rows={6}
          value={values.message}
          onChange={onChange('message')}
          onBlur={onBlur('message')}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'error-message' : undefined}
          required
        />
        {errors.message && (
          <p id="error-message" className="field__error">
            {errors.message}
          </p>
        )}
      </div>

      {/* Piège à robots : masqué visuellement et pour les technologies d'assistance */}
      <div className="form__trap" aria-hidden="true">
        <label htmlFor="field-website">Ne pas remplir ce champ</label>
        <input id="field-website" ref={honeypot} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={`field field--check${errors.consent ? ' field--error' : ''}`}>
        <input
          id="field-consent"
          name="consent"
          type="checkbox"
          checked={values.consent}
          onChange={(event) => setField('consent', event.target.checked)}
          onBlur={onBlur('consent')}
          aria-invalid={Boolean(errors.consent)}
          aria-describedby={errors.consent ? 'error-consent' : undefined}
          required
        />
        <label htmlFor="field-consent">
          J’accepte qu’Atelier 404 utilise ces informations pour me répondre (et rien d’autre).
        </label>
        {errors.consent && (
          <p id="error-consent" className="field__error">
            {errors.consent}
          </p>
        )}
      </div>

      <div className="form__actions">
        <Button type="submit" disabled={busy}>
          {busy ? 'Envoi en cours…' : 'Envoyer le message'}
        </Button>
        <p className="sr-only" role="status">
          {busy ? 'Envoi du message en cours' : ''}
        </p>
      </div>
    </form>
  );
}
