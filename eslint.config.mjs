import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // A biblioteca de templates é material de consulta, não código deste site.
    "templates/**",
    // O site antigo em HTML cru é a FONTE do porte de `/antiga`, não código
    // deste projeto - não passa por lint nem por build.
    "clone-sites-antigos/**",
  ]),

  {
    /**
     * `/antiga` usa `<img>` em vez de `next/image`, e é decisão, não descuido.
     *
     * A rota é o porte do site antigo (ver `src/app/antiga/page.tsx`), e o
     * layout de cada imagem é definido pelo CSS que veio junto - `width: 100%`
     * com `height: 100%` e `object-fit: cover` dentro de um slide com
     * `aspect-ratio`, `height: 120px` com `width: auto` no logo do rodapé.
     * `next/image` exige `width`/`height` ou `fill`; `fill` ainda pede
     * `position: relative` no pai, que só alguns desses contêineres têm.
     * Encaixar os dois modelos significaria reescrever o CSS portado - trocar
     * uma coisa que funciona por uma tradução com chance de errar.
     *
     * E o ganho seria zero: com `images.unoptimized: true` (obrigatório no
     * export estático, ver `next.config.ts`), `next/image` já entrega um
     * `<img>` comum, sem otimização nenhuma.
     */
    files: ["src/app/antiga/**/*.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
]);

export default eslintConfig;
