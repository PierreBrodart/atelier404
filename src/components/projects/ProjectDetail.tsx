import type { CSSProperties } from 'react';
import type { Project } from '@/data/types';
import { TLink } from '../layout/PageTransition';
import { Media } from '../ui/Media';
import { Split } from '../ui/Split';

const themeStyle = (project: Project) =>
  ({ '--p-bg': project.theme.background, '--p-fg': project.theme.foreground }) as CSSProperties;

/** En-tête de la page projet : titre géant sur la couleur du projet + cadre d'image. */
export function ProjectHero({ project }: { project: Project }) {
  return (
    <section className="p-hero" style={themeStyle(project)}>
      <div className="container p-hero__inner">
        <TLink href="/projets" className="p-hero__back">
          <span aria-hidden="true">←</span> Tous les projets
        </TLink>
        <p className="p-hero__meta" data-reveal="fade">
          {project.category} · {project.year}
        </p>
        <h1 className="p-hero__title">
          <Split text={project.name} />
        </h1>
        <p className="p-hero__tagline" data-reveal="fade" data-reveal-delay="0.3">
          {project.tagline}
        </p>
      </div>
      <div className="container p-hero__cover">
        <Media
          image={project.cover}
          ratio={16 / 9}
          ratioSmall={4 / 5}
          sizes="(min-width: 1680px) 1600px, 100vw"
          parallax={0.12}
          priority
        />
      </div>
    </section>
  );
}

/** Fiche technique : client, rôle, technologies + chiffres marquants. */
export function ProjectFacts({ project }: { project: Project }) {
  return (
    <section className="p-facts" aria-label="Fiche du projet">
      <div className="container p-facts__inner">
        <dl className="p-facts__list" data-reveal="stagger">
          <div>
            <dt>Client</dt>
            <dd>{project.client}</dd>
          </div>
          <div>
            <dt>Année</dt>
            <dd>{project.year}</dd>
          </div>
          <div>
            <dt>Ce qu’on a fait</dt>
            <dd>{project.role.join(' · ')}</dd>
          </div>
          <div>
            <dt>Technologies</dt>
            <dd>
              <ul className="tags">
                {project.technologies.map((tech) => (
                  <li key={tech} className="tag">
                    {tech}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

/** Récit du projet : brief, approche, résultat + chiffres. */
export function ProjectStory({ project }: { project: Project }) {
  const blocks = [
    { title: 'Le brief', text: project.story.brief },
    { title: 'Notre approche', text: project.story.approach },
    { title: 'Le résultat', text: project.story.result },
  ];

  return (
    <section className="p-story" aria-label="Le récit du projet">
      <div className="container p-story__inner">
        {blocks.map((block, index) => (
          <div key={block.title} className="p-story__block" data-reveal="fade">
            <p className="p-story__num" aria-hidden="true">
              0{index + 1}
            </p>
            <h2 className="p-story__title">{block.title}</h2>
            <p className="p-story__text">{block.text}</p>
          </div>
        ))}
      </div>

      <div className="container">
        <ul className="p-highlights" style={themeStyle(project)} data-reveal="stagger">
          {project.highlights.map((item) => (
            <li key={item.label} className="p-highlights__item">
              <span className="p-highlights__value">{item.value}</span>
              <span className="p-highlights__label">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Deux visuels en composition décalée. */
export function ProjectGallery({ project }: { project: Project }) {
  return (
    <section className="p-gallery" aria-label="Galerie">
      <div className="container p-gallery__grid">
        {project.gallery.map((image, index) => (
          <Media
            key={image.src}
            image={image}
            ratio={index === 0 ? 4 / 3 : 1}
            sizes="(min-width: 1024px) 50vw, 100vw"
            parallax={0.1}
            className={`p-gallery__item p-gallery__item--${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

/** Lien géant vers le projet suivant, sur sa propre couleur. */
export function NextProject({ project }: { project: Project }) {
  return (
    <section className="p-next" style={themeStyle(project)} aria-labelledby="next-project-title">
      <TLink href={`/projets/${project.slug}`} className="p-next__link" data-cursor="Suivant">
        <div className="container p-next__inner">
          <p className="p-next__label">Projet suivant</p>
          <p id="next-project-title" className="p-next__title">
            {project.name}
          </p>
          <p className="p-next__meta">
            {project.category} · {project.year} <span aria-hidden="true">→</span>
          </p>
        </div>
      </TLink>
    </section>
  );
}
