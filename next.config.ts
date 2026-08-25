import type { NextConfig } from "next";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  EXPORT ESTÁTICO - sem PM2, sem processo Node em pé                   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * `next build` gera `out/`, que é publicado como arquivo estático puro
 * (nginx serve direto, sem proxy pra porta nenhuma) - é assim que
 * `doe-caio-next` está publicado hoje em produção. Um commit anterior
 * ("deploy", 20/08) tentou trocar para modo servidor (PM2 atrás de
 * nginx/aaPanel) mas o processo/vhost nunca foram criados no servidor - o
 * `output: "export"` volta porque nada no código usa Route Handler, Server
 * Action ou `redirect()` de servidor: não há razão pra exigir um processo
 * Node rodando. O gateway de Pix é chamado direto do navegador (ver
 * `lib/payments/lusa.ts`), sem depender do servidor.
 *
 * Quando este Next passar a viver dentro de `doe.caioprotetor.org` (as
 * páginas WordPress migrando pra cá), decidir de novo se export estático
 * ainda basta ou se alguma rota nova vai pedir servidor - ver skill
 * `configurar-next-aapanel` se for esse o caminho.
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
  output: "export",
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
