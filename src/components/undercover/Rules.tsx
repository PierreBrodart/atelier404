import { SectionHead } from '../ui/SectionHead';

const ROLES = [
  {
    key: 'civil',
    name: 'Civil',
    text: 'Tu reçois le mot principal. Ta mission : démasquer les imposteurs sans trop en dire.',
  },
  {
    key: 'under',
    name: 'Undercover',
    text: 'Ton mot ressemble presque au leur. Ta mission : passer inaperçu jusqu’au bout.',
  },
  {
    key: 'white',
    name: 'Mr White',
    text: 'Tu n’as aucun mot. Ta mission : bluffer, écouter… et deviner le mot si on t’élimine.',
  },
];

const STEPS = [
  'Chacun reçoit un mot secret sur son téléphone (ou aucun, si vous êtes Mr White).',
  'À tour de rôle, chacun donne un indice sur son mot, sans le dire.',
  'On débat, puis on vote : le joueur le plus voté est éliminé et son rôle est révélé.',
  'La manche continue jusqu’à la victoire d’un camp. Les points s’additionnent d’une manche à l’autre.',
];

/** Règles du jeu, en version courte (contenu statique, rendu côté serveur). */
export function Rules() {
  return (
    <section className="uc-rules" aria-labelledby="rules-title">
      <div className="container">
        <SectionHead id="rules-title" label="Les règles" title="Trois rôles, un seul bluff." />

        <ul className="uc-rules__roles" data-reveal="stagger">
          {ROLES.map((role) => (
            <li key={role.key} className={`uc-rules__role uc-rules__role--${role.key}`}>
              <h3>{role.name}</h3>
              <p>{role.text}</p>
            </li>
          ))}
        </ul>

        <ol className="uc-rules__steps" data-reveal="stagger">
          {STEPS.map((step, index) => (
            <li key={step}>
              <span aria-hidden="true">0{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>

        <p className="uc-rules__note" data-reveal="fade">
          De 3 à 10 joueurs · les Civils gagnent en éliminant tous les imposteurs · les imposteurs gagnent s’ils restent aussi
          nombreux que les Civils · Mr White gagne aussi en devinant le mot.
        </p>
      </div>
    </section>
  );
}
