import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextProject, ProjectFacts, ProjectGallery, ProjectHero, ProjectStory } from '@/components/projects/ProjectDetail';
import { getNextProject, getProject, projects } from '@/data/projects';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

/** Une page par projet, générée au build à partir de `src/data/projects.ts`. */
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

// Tout slug inconnu → 404 (aucune génération à la demande).
export const dynamicParams = false;

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return {
    title: project.name,
    description: project.summary,
    alternates: { canonical: `/projets/${project.slug}` },
    openGraph: {
      title: `${project.name} — Atelier 404`,
      description: project.summary,
      images: [{ url: project.cover.src, width: project.cover.width, height: project.cover.height, alt: project.cover.alt }],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <div className="page">
      <ProjectHero project={project} />
      <ProjectFacts project={project} />
      <ProjectStory project={project} />
      <ProjectGallery project={project} />
      <NextProject project={getNextProject(project.slug)} />
    </div>
  );
}
