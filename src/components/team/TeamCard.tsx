import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { TeamMember } from '@/data/types';
import { accentVar, onAccentVar } from '@/lib/accent';
import { cx } from '@/lib/cx';

interface TeamCardProps {
  member: TeamMember;
  /** `polaroid` : version compacte (accueil) ; `profile` : bio + détail décalé (page équipe) */
  variant?: 'polaroid' | 'profile';
  tilt?: number;
  sizes: string;
}

export function TeamCard({ member, variant = 'polaroid', tilt = 0, sizes }: TeamCardProps) {
  const style = {
    '--member-accent': accentVar(member.accent),
    '--member-on': onAccentVar(member.accent),
    '--tilt': `${tilt}deg`,
  } as CSSProperties;

  return (
    <article className={cx('team-card', `team-card--${variant}`)} style={style} data-reveal="fade">
      <div className="team-card__photo">
        <Image src={member.photo.src} alt={member.photo.alt} fill sizes={sizes} className="team-card__img" />
      </div>
      <div className="team-card__body">
        <h3 className="team-card__name">{member.name}</h3>
        <p className="team-card__role">{member.role}</p>
        {variant === 'profile' && (
          <>
            <p className="team-card__bio">{member.bio}</p>
            <p className="team-card__fun">
              <span>{member.funFact.label}</span>
              {member.funFact.value}
            </p>
          </>
        )}
        {member.placeholder && <p className="team-card__flag">Profil provisoire — à remplacer</p>}
      </div>
    </article>
  );
}
