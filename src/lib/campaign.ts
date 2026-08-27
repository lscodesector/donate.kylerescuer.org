/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  O CONTADOR DA CAMPANHA                                               ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * ⚠️ **LEIA ISTO ANTES DE MEXER** ⚠️
 *
 * Os números que este arquivo produz - arrecadado, porcentagem e apoiadores -
 * **não vêm do gateway**. Eles são calculados a partir da data: a campanha
 * começa em `INITIAL_RAISED` e ganha um valor por dia decorrido. Não há
 * consulta a lugar nenhum, e ninguém aqui sabe quanto entrou de verdade.
 *
 * Isto é a transcrição literal do que a página em produção
 * (`doe.caioprotetor.org`) já faz - mesmas constantes, mesmo gerador
 * pseudoaleatório, mesma conta -, para que as duas mostrem o mesmo número no
 * mesmo dia. Um valor diferente em cada endereço da mesma campanha seria pior
 * do que o que já existe.
 *
 * Se um dia a arrecadação real for exposta por uma API, é este arquivo que
 * some: `CampaignProgress` passa a ler de lá e nada mais muda.
 *
 * ── Por que é determinístico ──────────────────────────────────────────────
 * `mulberry32` semeado com o número do dia: o mesmo dia devolve sempre o mesmo
 * valor, em qualquer navegador. Sem isso o número mudaria a cada F5, e um
 * contador que anda para trás quando a pessoa recarrega denuncia a si mesmo.
 *
 * ── Por que o cálculo é só no navegador ───────────────────────────────────
 * O site é exportado estático (ver `next.config.ts`): o HTML é congelado no
 * build e enviado por FTP. Um número calculado no build ficaria parado no dia
 * em que o build rodou. Por isso `CampaignProgress` só calcula depois de
 * montar - e é também o que evita erro de hidratação, já que servidor e
 * cliente nunca chegariam ao mesmo valor.
 */

/**
 * ⚠️ CONFERIR ANTES DE PUBLICAR ⚠️
 *
 * As constantes são as mesmas do `CP_CONFIG` da página em WordPress. Mudar
 * qualquer uma aqui **descasa** as duas páginas.
 */
export type CampaignState = {
  /** Em reais, já arredondado aos centavos. */
  raised: number;
  goal: number;
  /** Inteiro de 1 a 100. Nunca 0 enquanto houver algum valor. */
  percent: number;
  supporters: number;
};

export type CampaignParams = {
  startDate: string;
  initialRaised: number;
  dailyMin: number;
  dailyMax: number;
  updateEveryDays: number;
  goal: number;
  avgTicket: number;
  ticketJitterMin: number;
  ticketJitterMax: number;
};

export const campaign: CampaignParams = {
  /** Início da campanha, em UTC. É o dia zero da conta. */
  startDate: "2026-06-15",
  /** Valor de partida, em reais. */
  initialRaised: 60,
  /** Faixa do incremento diário, em reais - sorteado dentro dela. */
  dailyMin: 100,
  dailyMax: 300,
  /** De quantos em quantos dias o valor anda. */
  updateEveryDays: 1,
  /** Meta, em reais. É a mesma soma de `monthlyCosts` (R$ 58.000). */
  goal: 58000,
  /** Ticket médio usado para estimar quantos apoiadores dariam aquele total. */
  avgTicket: 30,
  /** Variação aplicada ao ticket médio, para ele não ser redondo demais. */
  ticketJitterMin: 0.05,
  ticketJitterMax: 0.2,
} as const;

/** O gerador do original, byte a byte. Semente igual, sequência igual. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randBetween(rng: () => number, min: number, max: number) {
  return min + rng() * (max - min);
}

/** Dias inteiros desde o início da campanha. Nunca negativo. */
/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  UMA CAMPANHA = UM FECHO                                              ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * O contador nasceu como singleton de módulo, quando só existia uma campanha.
 * Hoje existe mais de uma (`/urgencia-remedios` tem meta e data de início
 * próprias), e cada uma precisa do **seu** retrato: se as duas dividissem o
 * `retrato` deste arquivo, a segunda a montar leria o número da primeira.
 *
 * Por isso `createCampaign` devolve um conjunto fechado sobre os seus próprios
 * parâmetros **e sobre o seu próprio estado** - `retrato` e `ouvintes` moram
 * dentro do fecho, não no módulo. A lógica continua uma só: o gerador
 * pseudoaleatório, a conta e a correção pelo relógio do servidor são o mesmo
 * código para todas as campanhas, e continuam sendo a transcrição literal do
 * que a página em produção faz.
 *
 * Os exports nomeados logo abaixo são a campanha padrão - a raiz e
 * `/ajude-sempre` importam exatamente os mesmos nomes de antes.
 */
export function createCampaign(p: CampaignParams) {
function daysElapsed(nowMs: number) {
  const start = new Date(`${p.startDate}T00:00:00Z`).getTime();
  return Math.max(0, Math.floor((nowMs - start) / 86_400_000));
}

/**
 * O total "arrecadado" naquele instante, em reais.
 *
 * Soma um sorteio por dia decorrido, cada um semeado pelo índice do dia - por
 * isso o histórico nunca muda: o dia 12 vale hoje o mesmo que valia ontem. Para
 * quando bate a meta.
 */
function raisedAt(nowMs: number) {
  const steps = Math.floor(daysElapsed(nowMs) / p.updateEveryDays);
  let total: number = p.initialRaised;

  for (let i = 1; i <= steps; i++) {
    total += randBetween(mulberry32(i), p.dailyMin, p.dailyMax);
    if (total >= p.goal) {
      total = p.goal;
      break;
    }
  }

  return Math.round(total * 100) / 100;
}

/** Quantos apoiadores aquele total representaria, ao ticket médio do dia. */
function supportersAt(raised: number, nowMs: number) {
  if (raised <= 0) return 0;

  const rng = mulberry32(daysElapsed(nowMs) || 1);
  const sign = rng() < 0.5 ? -1 : 1;
  const jitter = randBetween(
    rng,
    p.ticketJitterMin,
    p.ticketJitterMax,
  );

  return Math.max(1, Math.round(raised / (p.avgTicket * (1 + sign * jitter))));
}


function campaignStateAt(nowMs: number): CampaignState {
  const raised = raisedAt(nowMs);
  let percent = Math.round((raised / p.goal) * 100);

  /* Arredondar para baixo daria "0% da meta" com dinheiro já na conta - o
     original força o piso em 1% pelo mesmo motivo. */
  if (raised > 0 && percent < 1) percent = 1;
  if (percent > 100) percent = 100;

  return {
    raised,
    goal: p.goal,
    percent,
    supporters: supportersAt(raised, nowMs),
  };
}

/**
 * O relógio do servidor, para o contador não depender da data do aparelho.
 *
 * Celular com a data errada mostraria outro valor - e, se estivesse adiantado,
 * um valor que ninguém mais vê. A resposta do próprio host traz o cabeçalho
 * `Date`; a diferença para o relógio local é guardada na sessão para as
 * próximas telas não repetirem a consulta.
 *
 * Falha em silêncio: sem rede, ou sem o cabeçalho, fica valendo o relógio
 * local. Um contador levemente fora é melhor do que um contador ausente.
 */

const OFFSET_KEY = "cp_config_server_time_offset";

async function serverTimeOffset(): Promise<number> {
  try {
    const cached = sessionStorage.getItem(OFFSET_KEY);
    if (cached !== null) return Number.parseInt(cached, 10) || 0;
  } catch {
    /* sessionStorage bloqueado (modo privado, cookies desligados). */
  }

  try {
    const res = await fetch(window.location.origin + "/", {
      method: "HEAD",
      cache: "no-store",
    });
    const header = res.headers.get("Date");
    if (!header) return 0;

    const offset = new Date(header).getTime() - Date.now();
    if (!Number.isFinite(offset)) return 0;

    try {
      sessionStorage.setItem(OFFSET_KEY, String(offset));
    } catch {
      /* idem */
    }
    return offset;
  } catch {
    return 0;
  }
}

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  A fonte que o React lê (`useSyncExternalStore`)                      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * O contador é um valor que **só existe no navegador**: ele depende do relógio,
 * e o HTML sai congelado do build. `useSyncExternalStore` é a peça feita para
 * exatamente isso - ela tem um retorno próprio para o servidor (`null`, aqui) e
 * outro para o cliente, e o React sabe trocar de um para o outro na hidratação
 * sem acusar divergência.
 *
 * A alternativa - `useEffect` + `setState` - também funcionaria, mas é uma
 * renderização em cascata (a regra `react-hooks/set-state-in-effect` reclama
 * dela com razão): o componente monta com um valor, o efeito roda e ele monta
 * de novo com outro.
 *
 * ── Por que o retrato precisa ser guardado ────────────────────────────────
 * `getSnapshot` é chamado várias vezes por render, e o React compara o
 * resultado **por identidade**. Se ele devolvesse um objeto novo a cada
 * chamada, seriam sempre "diferentes" e o React renderizaria em laço até
 * estourar. Por isso o objeto é calculado uma vez e reaproveitado, e só é
 * trocado quando o valor muda de verdade.
 */

let retrato: CampaignState | null = null;
let refinando = false;
const ouvintes = new Set<() => void>();

function subscribeCampaign(aoMudar: () => void) {
  ouvintes.add(aoMudar);

  /* A correção pelo relógio do servidor roda **uma vez por página**, não uma
     por componente: se um dia a barra aparecer no hero e numa barra fixa ao
     mesmo tempo, as duas dividem a mesma consulta e o mesmo número. */
  if (!refinando) {
    refinando = true;
    void serverTimeOffset().then((offset) => {
      if (offset === 0) return;
      const novo = campaignStateAt(Date.now() + offset);
      if (retrato && novo.raised === retrato.raised) return;
      retrato = novo;
      ouvintes.forEach((ouvinte) => ouvinte());
    });
  }

  return () => {
    ouvintes.delete(aoMudar);
  };
}

function getCampaignSnapshot(): CampaignState {
  retrato ??= campaignStateAt(Date.now());
  return retrato;
}

/** No servidor não há relógio que valha: quem lê recebe o esqueleto. */
function getCampaignServerSnapshot(): CampaignState | null {
  return null;
}


  return {
    daysElapsed,
    raisedAt,
    supportersAt,
    campaignStateAt,
    subscribeCampaign,
    getCampaignSnapshot,
    getCampaignServerSnapshot,
  };
}

/**
 * A campanha padrão - a da raiz e a de `/ajude-sempre`.
 *
 * Os nomes exportados aqui são os mesmos de quando este arquivo era um
 * singleton, de propósito: nenhum bloco precisou mudar por causa da fábrica.
 */
export const {
  daysElapsed,
  raisedAt,
  supportersAt,
  campaignStateAt,
  subscribeCampaign,
  getCampaignSnapshot,
  getCampaignServerSnapshot,
} = createCampaign(campaign);
