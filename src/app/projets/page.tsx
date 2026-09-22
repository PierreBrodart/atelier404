import type { Metadata } from 'next';
import { ProjectIndex } from '@/components/projects/ProjectIndex';
import { CtaBand } from '@/components/ui/CtaBand';
import { PageIntro } from '@/components/ui/PageIntro';
import { projectsPageContent } from '@/data/home';
import { projects } from '@/data/projects';

export const metadata: Metadata = {
  title: 'Projets',
  description: 'Sites, boutiques et expériences interactives fabriqués à la main par Atelier 404.',
  alternates: { canonical: '/projets' },
};

export default function ProjectsPage() {
  return (
    <div className="page" data-accent="blue">
      <PageIntro
        accent="blue"
        label={`Projets · ${projects.length} histoires`}
        title={projectsPageContent.title}
        intro={projectsPageContent.intro}
      />
      <section className="pindex-section" aria-label="Liste des projets">
        <div className="container">
          <ProjectIndex projects={projects} />
        </div>
      </section>
      <CtaBand tone="blue" />
    </div>
  );
}
