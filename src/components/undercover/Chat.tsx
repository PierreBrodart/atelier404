'use client';

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { cx } from '@/lib/cx';
import { LIMITS } from '@/lib/undercover/rules';
import type { ClientAction, RoomView } from '@/lib/undercover/types';
import { toneOf } from './parts';

interface ChatProps {
  view: RoomView;
  /** Envoie une action ; retourne le message d'erreur du serveur, ou null */
  send: (action: ClientAction) => Promise<string | null>;
}

/**
 * Chat de la room : un bouton flottant (avec le nombre de messages non lus) qui ouvre un panneau.
 * Pendant une manche, un éliminé ou un spectateur écrit « hors jeu » : seuls les autres éliminés et
 * spectateurs le lisent jusqu'à la fin de la manche (c'est le serveur qui trie, voir view.ts).
 */
export function Chat({ view, send }: ChatProps) {
  const { chat, me, room } = view;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const panelId = useId();
  const listRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Non lus : ce qui est arrivé depuis la dernière ouverture (l'historique déjà là à l'arrivée ne compte pas).
  const lastId = chat.at(-1)?.id ?? 0;
  const [seenId, setSeenId] = useState(lastId);
  if (open && seenId !== lastId) setSeenId(lastId);
  const unread = open ? 0 : chat.filter((message) => message.id > seenId && message.playerId !== me.playerId).length;

  const playing = room.phase !== 'LOBBY' && room.phase !== 'GAME_OVER';
  const self = room.players.find((player) => player.id === me.playerId);
  const offside = playing && !self?.alive;

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const list = listRef.current;
    if (open && list) list.scrollTop = list.scrollHeight;
  }, [open, lastId]);

  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    const failure = await send({ type: 'chat', text: message });
    setBusy(false);
    setError(failure);
    if (!failure) setText('');
    inputRef.current?.focus();
  };

  return (
    <div className="uc-chat">
      {open && (
        <section id={panelId} className="uc-chat__panel" aria-labelledby={`${panelId}-title`} onKeyDown={onKeyDown}>
          <header className="uc-chat__head">
            <h2 id={`${panelId}-title`} className="uc-chat__title">
              Chat
            </h2>
            <button type="button" className="uc-chat__close" aria-label="Fermer le chat" onClick={close}>
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <ol ref={listRef} className="uc-chat__list" role="log" aria-label="Messages">
            {chat.length === 0 && <li className="uc-chat__empty">Aucun message pour l’instant. Lance la discussion !</li>}
            {chat.map((message) => (
              <li
                key={message.id}
                className={cx(
                  'uc-chat__msg',
                  message.playerId === me.playerId && 'uc-chat__msg--me',
                  message.ghost && 'uc-chat__msg--ghost',
                )}
              >
                <span className={`uc-avatar uc-avatar--${toneOf(message.playerId)}`} aria-hidden="true">
                  {message.name.slice(0, 1).toUpperCase()}
                </span>
                <p className="uc-chat__bubble">
                  <span className="uc-chat__author">
                    {message.playerId === me.playerId ? 'Toi' : message.name}
                    {message.ghost && <span className="uc-tag uc-tag--off">Hors jeu</span>}
                  </span>
                  <span className="sr-only"> : </span>
                  <span className="uc-chat__text">{message.text}</span>
                </p>
              </li>
            ))}
          </ol>

          <form className="uc-chat__form" onSubmit={submit}>
            {offside && (
              <p className="uc-chat__note" id={`${panelId}-note`}>
                {me.seat === 'player' ? 'Tu es éliminé' : 'Tu es spectateur'} : jusqu’à la fin de la manche, seuls les éliminés
                et les spectateurs lisent tes messages.
              </p>
            )}
            <div className="uc-chat__row">
              <label htmlFor={`${panelId}-input`} className="sr-only">
                Ton message
              </label>
              <input
                ref={inputRef}
                id={`${panelId}-input`}
                type="text"
                value={text}
                maxLength={LIMITS.chatMax}
                autoComplete="off"
                placeholder={offside ? 'Message hors jeu…' : 'Écris un message…'}
                onChange={(event) => setText(event.target.value)}
                aria-describedby={offside ? `${panelId}-note` : undefined}
              />
              <button type="submit" className="uc-chat__send" disabled={busy || !text.trim()}>
                Envoyer
              </button>
            </div>
            {error && (
              <p className="uc-chat__error" role="alert">
                {error}
              </p>
            )}
          </form>
        </section>
      )}

      <button
        ref={toggleRef}
        type="button"
        className="uc-chat__toggle"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span aria-hidden="true">💬</span> Chat
        {unread > 0 && (
          <span className="uc-chat__badge">
            {unread > 9 ? '9+' : unread}
            <span className="sr-only"> {unread > 1 ? 'nouveaux messages' : 'nouveau message'}</span>
          </span>
        )}
      </button>
    </div>
  );
}
