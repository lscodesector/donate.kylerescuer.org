import Script from "next/script";
import { prefetchDNS, preload } from "react-dom";

/** Os quatro domínios que o player toca: scripts, vídeo, imagens e licença. */
const DOMINIOS = [
  "https://cdn.converteai.net",
  "https://scripts.converteai.net",
  "https://images.converteai.net",
  "https://license.vturb.com",
];

/**
 * O VSL da campanha, hospedado no VTurb (SmartPlayer).
 *
 * É o embed que o VTurb entrega, traduzido para JSX sem mudar o que ele faz.
 * Server Component: não há estado nem evento aqui, só marcação que sai pronta
 * no HTML - é o próprio `player.js` que assume a partir daí.
 *
 * ── As três peças do embed, e por que cada uma existe ─────────────────────
 * 1. `preload` e `prefetchDNS`: o player carrega dois scripts e um `.m3u8` de
 *    domínios que o navegador ainda não conhece. Sem as dicas, a resolução de
 *    DNS e o download só começam depois que o `player.js` roda - e num VSL o
 *    tempo até o primeiro quadro é o que decide se a pessoa fica. As chamadas
 *    viram `<link>` no `<head>`, mesmo declaradas aqui dentro.
 *
 * 2. O `_plt` inline (o instante em que a página começou a carregar) mora no
 *    layout raiz (`app/layout.tsx`), não aqui - `beforeInteractive` só é
 *    aceito lá. Ver o comentário no layout para o motivo completo.
 *
 * 3. `<vturb-smartplayer>`: o Web Component em si (ver `types/vturb.d.ts`).
 *    O `<div>` de dentro é o espaço reservado do VTurb: ele segura a altura
 *    pelo `padding-top` enquanto o player não bootou, para a dobra não pular
 *    quando o vídeo entra.
 *
 * ── Por que `next/script`, e não um `<script async>` solto no JSX ─────────
 * Já foi um `<script async src={scriptSrc} />` puro, e dava dois problemas
 * juntos: (1) React avisava "scripts inside React components are never
 * executed when rendering on the client" - um `<script>` como elemento JSX
 * só executa quando sai pronto no HTML da primeira carga; numa navegação
 * client-side ele nunca roda; e (2) erro de hidratação, porque nada impedia o
 * `player.js` de terminar de carregar e registrar o Web Component **antes**
 * de o React acabar de hidratar essa árvore - quando isso acontece, o
 * navegador já reescreveu o conteúdo do `<vturb-smartplayer>` (troca a classe
 * do placeholder, injeta a miniatura, adiciona variáveis CSS) e o React
 * encontra um DOM diferente do que ele mesmo gerou no servidor.
 *
 * `next/script` com `strategy="afterInteractive"` resolve os dois: o
 * Next.js gerencia a inserção do `<script>` (funciona em navegação
 * client-side) e adia a execução para depois que a hidratação termina - o
 * `player.js` só reescreve o conteúdo quando o React já entregou a árvore
 * para o navegador, então a mutação vira um evento comum de terceiro sobre um
 * DOM que o React não está mais comparando.
 *
 * ── Trocar o vídeo da campanha ────────────────────────────────────────────
 * Nada aqui é editável: os ids, as URLs e a proporção vêm de `heroVideo.vturb`
 * no arquivo de conteúdo. Cole o novo embed do VTurb lá e esta parte não muda.
 */
export function VturbPlayer({
  playerId,
  scriptSrc,
  smartplayerSrc,
  streamSrc,
  ratio,
}: {
  /** `id` do elemento, no formato `vid-<id do player>`. */
  playerId: string;
  /** `player.js` da conta - é ele que monta o player. */
  scriptSrc: string;
  /** Runtime compartilhado do SmartPlayer, carregado pelo `player.js`. */
  smartplayerSrc: string;
  /** Playlist HLS do vídeo. */
  streamSrc: string;
  /** Altura em % da largura - o mesmo número do `padding-top` do embed. */
  ratio: number;
}) {
  /*
   * `preload`/`prefetchDNS` do `react-dom`, e não `<link>` escrito no JSX: o
   * React de-duplica estas chamadas por URL antes de escrever o `<head>`.
   * Com as tags soltas no JSX, o mesmo `preload` saía duas vezes no HTML -
   * inofensivo para o navegador, mas é lixo no `<head>` de uma página cujo
   * argumento é carregar rápido.
   */
  preload(scriptSrc, { as: "script" });
  preload(smartplayerSrc, { as: "script" });
  // Sem `crossOrigin` de propósito: é o que o VTurb entrega, e um modo
  // diferente do que o player usa na hora de buscar faria o navegador baixar
  // o `.m3u8` duas vezes em vez de aproveitar o preload.
  preload(streamSrc, { as: "fetch" });
  // `forEach((href) => prefetchDNS(href))`, e não `forEach(prefetchDNS)`:
  // `forEach` chama o callback com `(item, índice, array)`, e passar
  // `prefetchDNS` direto fazia o índice do domínio virar o segundo argumento
  // da função - que `prefetchDNS` só aceita um.
  DOMINIOS.forEach((href) => prefetchDNS(href));

  return (
    <>
      <vturb-smartplayer
        id={playerId}
        style={{ display: "block", margin: "0 auto", width: "100%" }}
      >
        <div
          className="vturb-player-placeholder"
          style={{
            position: "relative",
            width: "100%",
            padding: `${ratio}% 0 0`,
            zIndex: 0,
            backgroundColor: "black",
          }}
        />
      </vturb-smartplayer>

      <Script id={`vturb-player-${playerId}`} src={scriptSrc} strategy="afterInteractive" />
    </>
  );
}
