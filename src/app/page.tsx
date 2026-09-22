import type { Metadata } from 'next';
import { FeaturedProjects } from '@/components/home/FeaturedProjects';
import { Hero } from '@/components/home/Hero';
import { Manifesto } from '@/components/home/Manifesto';
import { ServiceIndex } from '@/components/home/ServiceIndex';
import { TeamTeaser } from '@/components/home/TeamTeaser';
import { CtaBand } from '@/components/ui/CtaBand';
import { Marquee } from '@/components/ui/Marquee';
import { homeContent } from '@/data/home';
import { services } from '@/data/services';
import { siteConfig } from '@/data/site';

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} — ${siteConfig.baseline}` },
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <div className="page" data-accent="tomato">
      <Hero />
      <Marquee items={homeContent.marquee} tone="sun" className="marquee--tilt" />
      <Manifesto />
      <ServiceIndex services={services} />
      <FeaturedProjects />
      <TeamTeaser />
      <CtaBand />
    </div>
  );
}
