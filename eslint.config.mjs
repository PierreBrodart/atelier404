import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  // 'deploy/' : paquet de déploiement (build standalone reconstitué), jamais du code source.
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'deploy/**'] },
];

export default eslintConfig;
