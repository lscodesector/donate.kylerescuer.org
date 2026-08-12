import type { NextConfig } from "next";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  SITE ESTÁTICO - `next build` gera a pasta `out/` para subir por FTP  ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Não existe servidor Node do outro lado: o que sobe é HTML, CSS, JS e as
 * imagens de `public/`. Isso define o que a página pode ou não fazer:
 *
 *  • nada de `redirect()`, `rewrites`, `headers`, Server Actions ou Route
 *    Handlers que leiam a requisição - por isso `/doar/valor` lê o valor da
 *    URL no navegador (ver o comentário lá);
 *  • o gateway de Pix continua funcionando: ele é chamado direto do navegador
 *    (ver `lib/payments/lusa.ts`), sem passar por rota nossa.
 *
 * O endereço público entra por `NEXT_PUBLIC_SITE_URL` **no momento do build**
 * - é ele que vira a base das URLs de metadata (`app/layout.tsx`). Buildar sem
 * essa variável publica og:image apontando para `localhost`.
 *
 * ── Publicando fora da raiz do domínio ─────────────────────────────────────
 * `NEXT_PUBLIC_BASE_PATH` (ex.: `/v2`) publica o site numa subpasta em vez da
 * raiz - é o caso de `doe.caioprotetor.org/v2`, onde a raiz do domínio já é
 * outro site (WordPress). Com a variável setada, o Next prefixa sozinho todo
 * `<Link>`, `next/image` e o próprio `<script>`/`<link>` dos assets; o que ele
 * **não** alcança é navegação feita por `window.location` puro - esses pontos
 * leem o mesmo valor por `lib/base-path.ts` (ver o comentário lá). Sem a
 * variável, o build sai para a raiz, exatamente como antes.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,

  /*
   * `/doar/5kg` vira `out/doar/5kg/index.html` em vez de `out/doar/5kg.html`.
   * É o formato que qualquer hospedagem burra (Apache, nginx, cPanel, S3)
   * serve sem configuração nenhuma: a pasta tem um índice. Com o padrão
   * `.html`, o mesmo endereço daria 404 na maioria delas.
   */
  trailingSlash: true,

  images: {
    /*
     * O otimizador de imagem é um serviço em runtime - não existe aqui.
     * `unoptimized` faz `next/image` servir o arquivo de `public/` como está,
     * mantendo o resto do componente (tamanho, `priority`, layout) igual.
     * As fotos já estão em .webp no repositório.
     */
    unoptimized: true,
  },
};

export default nextConfig;
