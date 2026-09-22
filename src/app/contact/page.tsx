import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact/ContactForm';
import { LazyStage } from '@/components/three/LazyStage';
import { PageIntro } from '@/components/ui/PageIntro';
import { contactPageContent } from '@/data/home';
import { contact } from '@/data/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Un projet, une question, une idée absurde ? Écrivez à Atelier 404, on répond sous 48 h.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="page" data-accent="mint">
      <PageIntro accent="mint" label="Contact · réponse sous 48 h" title={contactPageContent.title} intro={contactPageContent.intro} />

      <section className="contact" aria-label="Coordonnées et formulaire">
        <div className="container contact__grid">
          <div className="contact__info">
            <LazyStage scene="mouse" className="contact__stage" />

            <div className="contact__block" data-reveal="fade">
              <h2 className="contact__title">Écrire</h2>
              <p>
                <a className="contact__link" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              </p>
            </div>
            <div className="contact__block" data-reveal="fade">
              <h2 className="contact__title">Appeler</h2>
              <p>
                <a className="contact__link" href={`tel:${contact.phoneHref}`}>
                  {contact.phone}
                </a>
              </p>
              <p className="contact__small">{contact.hours}</p>
            </div>
            <div className="contact__block" data-reveal="fade">
              <h2 className="contact__title">Passer boire un café</h2>
              <address className="contact__address">
                {contact.address.street}
                <br />
                {contact.address.zip} {contact.address.city}, {contact.address.country}
              </address>
            </div>
            <div className="contact__block" data-reveal="fade">
              <h2 className="contact__title">Suivre</h2>
              <ul className="contact__socials">
                {contact.socials.map((social) => (
                  <li key={social.label}>
                    <a href={social.href} target="_blank" rel="noopener noreferrer">
                      {social.label} <span className="contact__handle">{social.handle}</span>
                      <span className="sr-only"> (nouvel onglet)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="contact__form" data-reveal="fade">
            <h2 className="contact__form-title">{contactPageContent.formTitle}</h2>
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
