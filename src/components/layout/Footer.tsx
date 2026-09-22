import { contact, navigation, siteConfig } from '@/data/site';
import { homeContent } from '@/data/home';
import { TLink } from './PageTransition';
import { Marquee } from '../ui/Marquee';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <Marquee items={['Un projet ?', 'Une idée absurde ?', 'Un bug ?', 'Écrivez-nous']} tone="tomato" />

      <div className="footer__inner container">
        <div className="footer__cta">
          <p className="footer__eyebrow">{homeContent.cta.label}</p>
          <a className="footer__mail" href={`mailto:${contact.email}`} data-cursor="Écrire">
            <span className="roll roll--big">
              <span className="roll__a">{contact.email}</span>
              <span className="roll__b" aria-hidden="true">
                {contact.email}
              </span>
            </span>
          </a>
        </div>

        <div className="footer__cols">
          <nav aria-label="Pied de page" className="footer__col">
            <h2 className="footer__title">Naviguer</h2>
            <ul>
              <li>
                <TLink href="/">Accueil</TLink>
              </li>
              {navigation.map((item) => (
                <li key={item.href}>
                  <TLink href={item.href}>{item.label}</TLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer__col">
            <h2 className="footer__title">L’atelier</h2>
            <address>
              {contact.address.street}
              <br />
              {contact.address.zip} {contact.address.city}
              <br />
              <a href={`tel:${contact.phoneHref}`}>{contact.phone}</a>
            </address>
          </div>

          <div className="footer__col">
            <h2 className="footer__title">Suivre</h2>
            <ul>
              {contact.socials.map((social) => (
                <li key={social.label}>
                  <a href={social.href} target="_blank" rel="noopener noreferrer">
                    {social.label}
                    <span className="sr-only"> (nouvel onglet)</span>
                  </a>
                </li>
              ))}
              {/* Remplace l'ancien lien Mastodon : le mini-jeu de l'atelier */}
              <li>
                <TLink href="/undercover" className="footer__game">
                  Undercover
                  <span className="footer__game-tag" aria-hidden="true">
                    Jeu
                  </span>
                  <span className="sr-only"> (mini-jeu multijoueur)</span>
                </TLink>
              </li>
            </ul>
          </div>
        </div>

        <p className="footer__word" aria-hidden="true">
          Atelier<span>404</span>
        </p>

        <div className="footer__legal">
          <p>
            © {year} {siteConfig.name}. Fait main à {siteConfig.city}, avec trop de café.
          </p>
          <p>Agence fictive · Photos : Unsplash · Coordonnées à remplacer avant mise en ligne.</p>
        </div>
      </div>
    </footer>
  );
}
