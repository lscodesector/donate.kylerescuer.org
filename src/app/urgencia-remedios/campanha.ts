/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  O CONTADOR DE /urgencia-remedios                                     ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Vale aqui tudo o que está escrito em `lib/campaign.ts`, inclusive o aviso
 * grande: estes números **não vêm do gateway**, são calculados a partir da
 * data. O que muda são só os parâmetros - a lógica é a mesma fábrica, para as
 * duas campanhas não divergirem no gerador.
 *
 * Os valores são os do repositório `doe.caioprotetor.medicamentos.org`, que é
 * onde esta campanha já roda hoje. Mudar qualquer um aqui **descasa** as duas
 * páginas enquanto aquele site continuar no ar.
 *
 * A meta é a soma da tabela de custos veterinários do bloco 09 desta rota -
 * não a da campanha padrão. É por causa dela que esta rota precisa de campanha
 * própria: `goal` alimenta a barra de progresso do hero e a porcentagem, e um
 * número não bate com a tabela logo abaixo se vier da outra campanha.
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  ⚠️ REVISAR: ESTES NÚMEROS SÃO DE REAL E ESTÃO SENDO LIDOS EM DÓLAR   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * `42653.85` e `71.71` foram copiados do site irmão em real. Desde a troca do
 * Pix pelo PayPal o site inteiro formata em dólar (`lib/format.ts`), e é
 * **"$42,653.85"** que esta rota publica hoje - a tabela de custos do bloco 09
 * desta pasta tem o mesmo problema.
 *
 * A campanha padrão foi conferida contra a produção e está certa; esta não
 * tinha referência em dólar para conferir, e converter por um câmbio inventado
 * seria pior do que deixar o aviso. **Antes de publicar `/urgencia-remedios`,
 * decida os valores em dólar desta campanha** - aqui e no bloco 09.
 */
import { createCampaign } from "@/lib/campaign";

export const {
  daysElapsed,
  raisedAt,
  supportersAt,
  campaignStateAt,
  subscribeCampaign,
  getCampaignSnapshot,
  getCampaignServerSnapshot,
} = createCampaign({
  /** Início da campanha de medicamentos, em UTC. */
  startDate: "2026-07-28",
  initialRaised: 71.71,
  dailyMin: 100,
  dailyMax: 300,
  updateEveryDays: 1,
  /** Soma dos custos veterinários mensais do bloco 09 desta rota. */
  goal: 42653.85,
  avgTicket: 14.4,
  ticketJitterMin: 0.05,
  ticketJitterMax: 0.2,
});
