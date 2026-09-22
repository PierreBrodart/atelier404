import type { Metadata } from 'next';
import Image from 'next/image';
import { TeamCard } from '@/components/team/TeamCard';
import { ButtonLink } from '@/components/ui/Button';
import { PageIntro } from '@/components/ui/PageIntro';
import { SectionHead } from '@/components/ui/SectionHead';
import { teamPageContent } from '@/data/home';
import { team, values } from '@/data/team';

export const metadata: Metadata = {
  title: 'Équipe',
  description: 'Les personnes derrière Atelier 404 : design, développement créatif et gestion de projet.',
  alternates: { canonical: '/equipe' },
};

const TILTS = [-1.5, 1.2, -0.8];

export default function TeamPage() {
  return (
    <div className="page" data-accent="pink">
      <PageIntro accent="pink" label="Équipe · 3 personnes" title={teamPageContent.title} intro={teamPageContent.intro} />

      <section className="team-list" aria-label="Les membres de l’équipe">
        <div className="container team-list__grid">
          {team.map((member, index) => (
            <TeamCard
              key={member.id}
              member={member}
              variant="profile"
              tilt={TILTS[index % TILTS.length]}
              sizes="(min-width: 1024px) 30vw, 90vw"
            />
          ))}
        </div>
      </section>

      <section className="values" aria-labelledby="values-title">
        <div className="container">
          <SectionHead id="values-title" label="Nos règles du jeu" title={teamPageContent.valuesTitle} />
          <ol className="values__list" data-reveal="stagger">
            {values.map((value, index) => (
              <li key={value.title} className="values__item">
                <span className="values__num" aria-hidden="true">
                  0{index + 1}
                </span>
                <h3 className="values__title">{value.title}</h3>
                <p className="values__text">{value.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="join" aria-labelledby="join-title">
        <div className="container join__inner">
          <div className="join__photo">
            <Image
              src={teamPageContent.photo.src}
              alt={teamPageContent.photo.alt}
              width={teamPageContent.photo.width}
              height={teamPageContent.photo.height}
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
          <div className="join__text" data-reveal="fade">
            <h2 id="join-title" className="join__title">
              {teamPageContent.join.title}
            </h2>
            <p>{teamPageContent.join.text}</p>
            <ButtonLink href="/contact" variant="ink">
              Candidature spontanée
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
