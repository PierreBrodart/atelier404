'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { NAME_KEY, storage } from '@/lib/undercover/client';
import { LIMITS } from '@/lib/undercover/rules';
import type { ClientAction, RoomView } from '@/lib/undercover/types';

interface RoomMenuProps {
  view: RoomView;
  /** Envoie une action ; retourne le message d'erreur du serveur, ou null */
  send: (action: ClientAction) => Promise<string | null>;
  onLeave: () => Promise<void>;
}

/**
 * Menu personnel de la barre du haut (« Pierre ▾ ») : changer de prénom, passer le lead (host) et
 * quitter la partie. Accessible à toutes les phases, au même endroit.
 */
export function RoomMenu({ view, send, onLeave }: RoomMenuProps) {
  const { room, me } = view;
  const people = [...room.players.filter((player) => !player.left), ...room.spectators];
  const myName = people.find((person) => person.id === me.playerId)?.name ?? '';
  const others = people.filter((person) => person.id !== me.playerId);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(myName);
  const [leadTo, setLeadTo] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Fermeture au clic en dehors et à la touche Échap
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      // Le formulaire repart de l'état courant à chaque ouverture
      setName(myName);
      setLeadTo('');
      setConfirmLeave(false);
      setMessage(null);
    }
    setOpen((value) => !value);
  };

  const rename = async (event: FormEvent) => {
    event.preventDefault();
    const clean = name.trim();
    if (clean === myName) return;
    const error = await send({ type: 'rename', name: clean });
    if (error) {
      setMessage({ text: error, error: true });
      return;
    }
    storage.set(NAME_KEY, clean);
    setMessage({ text: 'Prénom changé.', error: false });
  };

  const giveLead = async (event: FormEvent) => {
    event.preventDefault();
    if (!leadTo) return;
    const target = others.find((person) => person.id === leadTo);
    const error = await send({ type: 'giveLead', targetId: leadTo });
    if (error) {
      setMessage({ text: error, error: true });
      return;
    }
    setLeadTo('');
    setMessage({ text: `${target?.name ?? 'Cette personne'} est maintenant host.`, error: false });
  };

  return (
    <div className="uc-menu" ref={rootRef}>
      <button
        ref={toggleRef}
        type="button"
        className="uc-menu__toggle"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggle}
      >
        <span className="uc-menu__name">{myName}</span>
        {me.isHost && <span className="uc-tag uc-tag--host">Host</span>}
        <span aria-hidden="true">▾</span>
      </button>

      {open && (
        <div id={panelId} className="uc-menu__panel" role="group" aria-label="Mon profil et la room">
          <form className="uc-menu__section" onSubmit={rename}>
            <label htmlFor={`${panelId}-name`} className="uc-menu__label">
              Ton prénom
            </label>
            <div className="uc-menu__row">
              <input
                id={`${panelId}-name`}
                type="text"
                value={name}
                minLength={LIMITS.nameMin}
                maxLength={LIMITS.nameMax}
                autoComplete="given-name"
                onChange={(event) => setName(event.target.value)}
              />
              <button
                type="submit"
                className="uc-menu__action"
                disabled={name.trim().length < LIMITS.nameMin || name.trim() === myName}
              >
                Renommer
              </button>
            </div>
          </form>

          {me.isHost && (
            <form className="uc-menu__section" onSubmit={giveLead}>
              <label htmlFor={`${panelId}-lead`} className="uc-menu__label">
                Passer le lead à
              </label>
              {others.length > 0 ? (
                <div className="uc-menu__row">
                  <select id={`${panelId}-lead`} value={leadTo} onChange={(event) => setLeadTo(event.target.value)}>
                    <option value="">Choisir quelqu’un…</option>
                    {others.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="uc-menu__action" disabled={!leadTo}>
                    Passer
                  </button>
                </div>
              ) : (
                <p className="uc-hint">Personne d’autre dans la room pour l’instant.</p>
              )}
            </form>
          )}

          {message && (
            <p className={message.error ? 'uc-menu__error' : 'uc-menu__ok'} role={message.error ? 'alert' : 'status'}>
              {message.text}
            </p>
          )}

          <div className="uc-menu__section uc-menu__section--leave">
            {confirmLeave ? (
              <div className="uc-menu__row">
                <button type="button" className="uc-menu__action uc-menu__action--danger" onClick={onLeave}>
                  Oui, quitter
                </button>
                <button type="button" className="uc-link-button" onClick={() => setConfirmLeave(false)}>
                  Rester
                </button>
              </div>
            ) : (
              <button type="button" className="uc-link-button" onClick={() => setConfirmLeave(true)}>
                Quitter la partie
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
