import { homeContent } from '@/data/home';
import { getFeaturedProjects } from '@/data/projects';
import { ProjectCard } from '../projects/ProjectCard';
import { ButtonLink } from '../ui/Button';
import { SectionHead } from '../ui/SectionHead';

/** Sélection de projets en composition décalée (grille 12 colonnes, rythme paysage / portrait). */
export function FeaturedProjects() {
  const projects = getFeaturedProjects();
  const shapes = ['landscape', 'portrait', 'portrait', 'landscape'] as const;

  return (
    <section className="featured" aria-labelledby="featured-title">
      <div className="container">
        <SectionHead id="featured-title" label={homeContent.projects.label} title={homeContent.projects.title} />

        <div className="featured__grid">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.slug}
              project={project}
              shape={shapes[index % shapes.length]}
              className={`featured__item featured__item--${index + 1}`}
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          ))}
        </div>

        <div className="featured__more" data-reveal="fade">
          <ButtonLink href="/projets">Tous les projets</ButtonLink>
        </div>
      </div>
    </section>
  );
}
