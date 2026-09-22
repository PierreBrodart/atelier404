import { homeContent } from '@/data/home';
import { team } from '@/data/team';
import { TeamCard } from '../team/TeamCard';
import { ButtonLink } from '../ui/Button';
import { SectionHead } from '../ui/SectionHead';

const TILTS = [-4, 3, -2];

export function TeamTeaser() {
  return (
    <section className="team-teaser" aria-labelledby="team-title">
      <div className="container team-teaser__grid">
        <div className="team-teaser__intro">
          <SectionHead id="team-title" label={homeContent.team.label} title={homeContent.team.title} />
          <p className="team-teaser__text" data-reveal="fade">
            {homeContent.team.text}
          </p>
          <div data-reveal="fade">
            <ButtonLink href="/equipe" variant="ink">
              Rencontrer l’équipe
            </ButtonLink>
          </div>
        </div>

        <div className="team-teaser__cards">
          {team.map((member, index) => (
            <TeamCard
              key={member.id}
              member={member}
              tilt={TILTS[index % TILTS.length]}
              sizes="(min-width: 1024px) 22vw, 60vw"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
