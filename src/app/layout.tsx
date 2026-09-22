import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Space_Mono } from 'next/font/google';
import { Cursor } from '@/components/layout/Cursor';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { HideOnRoute } from '@/components/layout/HideOnRoute';
import { MotionProvider } from '@/components/layout/MotionProvider';
import { TransitionProvider } from '@/components/layout/PageTransition';
import { TabTitle } from '@/components/layout/TabTitle';
import { siteConfig } from '@/data/site';
import '@/styles/main.scss';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz', 'wdth'],
  variable: '--nf-display',
  display: 'swap',
});

const mono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--nf-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.baseline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: { icon: { url: '/favicon/favicon.png', type: 'image/png', sizes: '48x48' } },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.baseline}`,
    description: siteConfig.description,
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#FFF3DC',
  colorScheme: 'light',
};

/** Active les états « masqués » des révélations uniquement si le mouvement est autorisé. */
const MOTION_SCRIPT = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('motion-ok')}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${display.variable} ${mono.variable}`}
      // Le CSS met `scroll-behavior: smooth` : sans cet attribut, Next 16 anime aussi
      // le retour en haut à chaque changement de page au lieu de l'appliquer d'un coup.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Aller au contenu
        </a>
        <TransitionProvider>
          {/* Pas d'en-tête pendant Undercover : la partie tient sur un écran de téléphone,
              chaque centimètre compte (voir aussi le footer ci-dessous). */}
          <HideOnRoute prefix="/undercover">
            <Header />
          </HideOnRoute>
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          {/* Pas de footer pendant le jeu : la partie tient sur un écran de téléphone. */}
          <HideOnRoute prefixes={['/undercover', '/kahoot']}>
            <Footer />
          </HideOnRoute>
        </TransitionProvider>
        <MotionProvider />
        <TabTitle />
        <Cursor />
      </body>
    </html>
  );
}
