import type { Metadata } from 'next';
import Image from 'next/image';
import { Process } from '@/components/services/Process';
import { ServiceBand } from '@/components/services/ServiceBand';
import { CtaBand } from '@/components/ui/CtaBand';
import { PageIntro } from '@/components/ui/PageIntro';
import { servicesImages, servicesPageContent } from '@/data/home';
import { services } from '@/data/services';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Sites web, expériences interactives, e-commerce, direction artistique, développement sur mesure et maintenance : les services d’Atelier 404.',
  alternates: { canonical: '/services' },
};

export default function ServicesPage() {
  return (
    <div className="page" data-accent="sun">
      <PageIntro
        accent="sun"
        label="Services · 6 métiers, 1 équipe"
        title={servicesPageContent.title}
        intro={servicesPageContent.intro}
        aside={
          <div className="page-intro__collage" aria-hidden="false">
            {servicesImages.map((image, index) => (
              <div key={image.src} className={`page-intro__shot page-intro__shot--${index + 1}`} data-reveal="pop" data-reveal-delay={0.3 + index * 0.15}>
                <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 20vw, 40vw" />
              </div>
            ))}
          </div>
        }
      />
      <div className="service-bands">
        {services.map((service) => (
          <ServiceBand key={service.slug} service={service} />
        ))}
      </div>
      <Process />
      <CtaBand tone="sun" title="Un besoin qui n’est pas dans la liste ?" text={servicesPageContent.cta} />
    </div>
  );
}
