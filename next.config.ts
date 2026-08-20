import type { NextConfig } from "next";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  SERVIDOR NODE (PM2) - `next build` + `next start`, sem export        ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Existe um processo Next rodando (PM2 atrás de nginx/aaPanel), então rotas
 * de servidor (Route Handlers, Server Actions, `redirect()`/`rewrites`)
 * voltam a ser possíveis - mas nada disso foi adicionado nesta mudança, só
 * removido o que impedia. O gateway de Pix continua chamado direto do
 * navegador (ver `lib/payments/lusa.ts`), sem depender do servidor.
 *
 * O endereço público entra por `NEXT_PUBLIC_SITE_URL` **no momento do build**
 * - é ele que vira a base das URLs de metadata (`app/layout.tsx`). Buildar sem
 * essa variável publica og:image apontando para `localhost`.
 *
 * ── Publicando fora da raiz do domínio ─────────────────────────────────────
 * `NEXT_PUBLIC_BASE_PATH` (ex.: `/v2`) publica o site numa subpasta em vez da
 * raiz - útil se um dia esse Next dividir domínio com outro site na raiz.
 * Com a variável setada, o Next prefixa sozinho todo `<Link>`, `next/image` e
 * o próprio `<script>`/`<link>` dos assets; o que ele **não** alcança é
 * navegação feita por `window.location` puro - esses pontos leem o mesmo
 * valor por `lib/base-path.ts` (ver o comentário lá). Sem a variável, o build
 * sai para a raiz, exatamente como antes.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  basePath,

  experimental: {
    /*
     * CSS dentro do `<head>`, em vez de um `<link>` que bloqueia a renderização.
     *
     * O navegador precisava baixar o HTML, achar o `<link>`, pedir o CSS e só
     * então pintar - uma ida e volta inteira antes do primeiro pixel, que no 4G
     * do relatório custa caro. Inline, o estilo chega junto com o HTML.
     *
     * A contrapartida documentada é o CSS deixar de ser cacheado em separado,
     * o que pesa para quem volta muitas vezes e navega entre páginas. Aqui é o
     * contrário disso: é uma página só, e o tráfego vem de anúncio - quase todo
     * mundo chega pela primeira vez. Com Tailwind o arquivo é pequeno
     * (~61 KB crus, ~10 KB comprimidos), então o HTML engorda pouco.
     */
    inlineCss: true,
  },

  /*
   * Mantido do layout de export (`/doar/5kg/` em vez de `/doar/5kg`) para não
   * quebrar links já publicados/indexados apontando pra URL com barra final.
   */
  trailingSlash: true,

  images: {
    /*
     * O otimizador de imagem do Next já roda aqui (servidor em pé), mas as
     * fotos já estão em .webp no repositório - `unoptimized` mantém o
     * comportamento atual (serve o arquivo de `public/` como está) em vez de
     * ligar uma otimização que não foi pedida nesta mudança.
     */
    unoptimized: true,
  },
};

export default nextConfig;
