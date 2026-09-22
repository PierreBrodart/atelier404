import type { CSSProperties } from 'react';
import type { Project } from '@/data/types';
import { cx } from '@/lib/cx';
import { TLink } from '../layout/PageTransition';
import { Media } from '../ui/Media';

interface ProjectCardProps {
  project: Project;
  /** Cadrage de l'image */
  shape?: 'landscape' | 'portrait';
  sizes: string;
  priority?: boolean;
  className?: string;
}

const RATIOS = { landscape: 4 / 3, portrait: 4 / 5 };

/** Carte projet : image encadrée, couleur propre au projet, légende décalée. */
export function ProjectCard({ project, shape = 'landscape', sizes, priority, className }: ProjectCardProps) {
  const style = {
    '--card-bg': project.theme.background,
    '--card-fg': project.theme.foreground,
  } as CSSProperties;

  return (
    <article className={cx('project-card', `project-card--${shape}`, className)} style={style}>
      <TLink href={`/projets/${project.slug}`} className="project-card__link" data-cursor="Voir">
        <div className="project-card__frame">
          <Media image={project.cover} ratio={RATIOS[shape]} sizes={sizes} parallax={0.1} priority={priority} />
          <span className="project-card__year" aria-hidden="true">
            {project.year}
          </span>
        </div>
        <div className="project-card__body">
          <p className="project-card__meta">{project.category}</p>
          <h3 className="project-card__title">
            <span className="project-card__mark">{project.name}</span>
          </h3>
          <p className="project-card__tagline">{project.tagline}</p>
        </div>
      </TLink>
    </article>
  );
}
