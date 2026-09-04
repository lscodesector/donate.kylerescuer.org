/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  O FUNIL DA LUSA - rastreio e configuração, não mais cobrança         ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * ⚠️ **Este arquivo já foi o gateway de pagamento, e não é mais.** Até a troca
 * para o PayPal ele criava a cobrança Pix na Lusa Payments/InfoPago, consultava
 * o status de 5 em 5 segundos, montava o mandato do Pix Automático e conferia a
 * planilha no retorno do app do banco. Tudo isso saiu junto com o Pix: a
 * campanha cobra em dólar e quem cobra é o PayPal, pelas rotas REST do
 * GiveWP (ver `lib/payments/givewp.ts` e
 * `components/payments/givewp-paypal.tsx`).
 *
 * O que sobrou - e o motivo de o arquivo continuar existindo - é a
 * configuração do **funil**, que nunca foi do Pix: os pixels da Meta servidos
 * pelo Nest, a rota onde o InitiateCheckout é gravado e o piso do valor livre
 * da mensal. Esses três continuam sendo da Lusa, e é `lib/payments/tracking.ts`
 * quem os usa.
 *
 * Se um dia o Pix voltar, ele volta como um módulo novo ao lado do PayPal - o
 * código antigo está no histórico do git, inteiro.
 */

import { withBasePath } from "@/lib/base-path";

/**
 * ⚠️ CONFERIR ANTES DE PUBLICAR ⚠️
 */
export const payments = {
  /**
   * Para onde ir depois do pagamento confirmado. Em produção o WordPress manda
   * para `https://sosanimalhelp.org/obrigado`; aqui a página de obrigado é
   * interna, e é ela que recebe.
   *
   * `withBasePath`, e não `"/obrigado"` puro: quem lê este valor é
   * `window.location.href` no checkout, uma troca de página pelo navegador que
   * não passa pelo Next - sem o prefixo, publicado em
   * `donate.kylerescuer.org/v2` a pessoa que acabou de pagar cairia em
   * `donate.kylerescuer.org/obrigado`, que é o WordPress, não esta página.
   */
  successUrl: withBasePath("/obrigado"),

  /** Respiro entre a confirmação na tela e o redirecionamento. */
  redirectDelayMs: 2500,

  /**
   * ╔════════════════════════════════════════════════════════════════════╗
   * ║  Pixels da Meta - servidos pelo Nest, nunca chumbados aqui          ║
   * ╚════════════════════════════════════════════════════════════════════╝
   *
   * `GET` devolve `{ ok, slug, pixels: ["1329196859189821"] }`. É o mesmo
   * endereço que a página em WordPress consulta: o ID do pixel mora no funil,
   * do lado do backend, e a regra por `utm_campaign` é aplicada lá - por isso
   * a chamada leva a `utm_campaign` da URL. Trocar de pixel é mexer no funil,
   * não em código publicado.
   *
   * ⚠️ O slug do fim do caminho é o mesmo `recurring.funnelSlug`, repetido
   * porque um literal não consegue se referenciar. Mudou lá, muda aqui.
   */
  // Ponte temporaria via Laravel (rota /api/nest-relay/{path} em routes/api.php,
  // tunel SSH pro Nest), enquanto o aaPanel de origem estiver com bloqueio de
  // rede. Reverter para 'https://track.lusapayments.com/api/funnels/caio-protetor-us/web-pixels'
  // quando o bloqueio for removido.
  //
  // ⚠️ O slug e `caio-protetor-us`, NAO `cp-caio-protetor`. Sao dois funis
  // diferentes, e cada um devolve um pixel proprio:
  //   caio-protetor-us  -> 2245127186276414  (Kyle Rescuer, esta campanha)
  //   cp-caio-protetor  -> 1329196859189821  (Caio Protetor, doe.caioprotetor.org)
  // Este repositorio foi forkado da campanha brasileira e carregou o slug dela
  // ate 04/09/2026 - o site estava treinando o pixel errado.
  webPixelsUrl:
    process.env.NEXT_PUBLIC_NEST_WEB_PIXELS_URL ??
    "https://lusapayments.com/api/nest-relay/funnels/caio-protetor-us/web-pixels",

  /**
   * ╔════════════════════════════════════════════════════════════════════╗
   * ║  DOAÇÃO MENSAL - o que sobrou dela aqui                             ║
   * ╚════════════════════════════════════════════════════════════════════╝
   *
   * ⚠️ A recorrência **não passa mais por este arquivo**. Ela era o Pix
   * Automático (Jornada 3 da Infopago), com mandato, CPF e bind ao lead; hoje
   * está desligada porque nem as rotas do GiveWP nem o form conectado fecham
   * recorrência - ver o bloco 🔁 em `overlays/18-checkout.tsx`.
   *
   * O que continua aqui é o que sempre foi do funil, e não do meio de
   * pagamento: o piso do valor e onde o lead é gravado.
   */
  recurring: {
    /**
     * Piso do valor livre da mensal, em centavos - $5.00.
     *
     * Era o piso que o gateway do Pix aceitava para criar o mandato; virou o
     * piso da campanha, e é o que as telas de valor publicam. Abaixo disso a
     * taxa fixa do processador come uma fatia grande demais da doação.
     */
    minCents: 500,

    /**
     * ⚠️ **NÃO é o slug da URL, e a diferença é de propósito.**
     *
     * Este valor vai no campo `campaign` do CORPO do InitiateCheckout. Quem
     * escolhe o funil é o slug da URL (`icUrl`, logo abaixo), que é
     * `caio-protetor-us`.
     *
     * O WordPress em produção faz exatamente isso, e foi de lá que veio a
     * confirmação:
     *
     *     const US_SLUG  = 'caio-protetor-us';   // vai na URL
     *     const CAMPAIGN = 'cp-caio-protetor';   // vai no corpo
     *
     * Igualar os dois muda o funil de destino. Conferido em 04/09/2026.
     */
    funnelSlug: process.env.NEXT_PUBLIC_NEST_FUNNEL_SLUG ?? "cp-caio-protetor",

    /**
     * Onde o InitiateCheckout é gravado - a linha da planilha que o Purchase
     * completa depois (ver `tracking.ts`).
     * Ponte temporaria via Laravel (rota /api/nest-relay/{path}, tunel SSH pro
     * Nest), enquanto o aaPanel de origem estiver com bloqueio de rede.
     * Reverter para 'https://track.lusapayments.com/api/ic/caio-protetor-us'
     * quando resolvido.
     *
     * ⚠️ **É o slug da URL que escolhe o funil** - `caio-protetor-us`, o do
     * Kyle Rescuer (id 11, tabela `ic_caio_protetor_us`). Até 04/09/2026 aqui
     * estava `cp-caio-protetor`, o funil do `doe.caioprotetor.org`: todo lead
     * desta campanha caía na campanha brasileira.
     *
     * ⚠️ Um `/api/` só. A ponte concatena o dela sozinha
     * (`/api/nest-relay/{path}` -> `127.0.0.1:3000/api/{path}`, ver
     * `routes/api.php` do Laravel), então escrever `/api/nest-relay/api/ic/...`
     * chega no Nest como `/api/api/ic/...` e devolve 404. O preflight
     * `OPTIONS` responde 204 nas duas formas, então o erro só aparece no POST -
     * quem nao olha a resposta conclui "mandei e nao chegou". */
    icUrl:
      process.env.NEXT_PUBLIC_NEST_IC_URL ??
      "https://lusapayments.com/api/nest-relay/ic/caio-protetor-us",
  },
} as const;

/**
 * Um e-mail de doador, quando não há um.
 *
 * O checkout não pede e-mail, mas a linha do funil espera o campo. Um endereço
 * inventado por doação é o que a página em produção manda hoje - e é preferível
 * a mandar vazio, que já foi motivo de recusa em integrações irmãs.
 */
export function placeholderEmail() {
  return `doadoranonimo${String(Date.now()).slice(-5)}@gmail.com`;
}
