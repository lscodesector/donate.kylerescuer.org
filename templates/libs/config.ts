/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  TEMPLATE · config.ts - o molde do dado de campanha                   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Copie para `src/lib/config.ts` e preencha. Cada `⚠️ PREENCHER` abaixo é um
 * campo que **precisa** ser trocado antes de publicar; os que estão marcados
 * com `⚠️ CONFERIR ANTES DE PUBLICAR` são os que mandam dinheiro para o lugar
 * errado se estiverem errados.
 *
 * ── O que mora aqui, e o que não mora ─────────────────────────────────────
 * Aqui: **dado de campanha** - chave Pix, CNPJ, contatos, taxa do checkout,
 * valores da grade de doação e as frentes.
 *
 * Aqui **não**: texto de bloco. Cada seção da página carrega o próprio texto -
 * a história, o FAQ, os abrigos, os depoimentos moram todos dentro do arquivo
 * do bloco que os desenha (ver `ESTRUTURA.md`).
 *
 * ── Por que estes campos são a exceção ────────────────────────────────────
 * Eles são lidos por mais de um lugar ao mesmo tempo - o bloco do Pix, o
 * checkout, a página `/doar/valor`, a de obrigado, as políticas - e errar um
 * deles manda dinheiro para a conta errada. Uma chave Pix copiada em cinco
 * arquivos é uma chave Pix que um dia vai divergir em quatro.
 *
 * Nenhum bloco deve reescrever o que está aqui - importe daqui.
 *
 * As funções de formatação (`formatBRL`, `formatBRLCurto`) ficam em
 * `lib/format.ts`, junto das outras máscaras.
 */

/**
 * Âncora do bloco de doação. Cabeçalho, hero, rodapé e fechamento apontam
 * todos para cá, e o `id` precisa existir na seção correspondente.
 */
export const DOAR_HREF = "#doar";

/**
 * A seção "Pix direto" (bloco 08) aparece ou não.
 *
 * Ligue quando a campanha tem chave própria e a divulga - assim quem prefere
 * pagar pelo app do banco consegue, e a doação ainda cai identificada.
 * Desligue quando a chave for genérica: solta no meio da página ela compete
 * com o checkout sem trazer nada em troca.
 */
export const showPixSection = true;

/**
 * Checkout de valor livre sem JavaScript: o modal manda o valor em centavos
 * pela URL. `freq=mensal` marca a intenção de recorrência.
 */
export function checkoutValorHref(cents: number, mensal = false) {
  const freq = mensal ? "&freq=mensal" : "";
  return `/doar/valor?cents=${cents}${freq}`;
}

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  OS VALORES DO MODAL - uma escada por frequência                      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * São nove degraus em cada uma, na grade de 3×3. Nenhum abre marcado: quem
 * escolhe é quem doa, e o campo logo abaixo da grade recebe o que for clicado
 * (e aceita qualquer outro número - é o que mais converte neste checkout).
 *
 * ── Por que as duas escadas são diferentes ────────────────────────────────
 * Não é o mesmo pedido. Doar R$ 100 uma vez é um gesto; R$ 100 todo mês é um
 * compromisso, e uma escada avulsa oferecida na mensal pede alto demais - a
 * mensal começa mais baixo e sobe mais devagar.
 *
 * `popular` marca o valor que a campanha aponta como o mais escolhido, e ele
 * deve existir nas duas escadas.
 *
 * ⚠️ O selo "mais escolhido" fica pendurado na borda **de cima** do cartão,
 * então o degrau marcado precisa continuar na **primeira fileira** - entre os
 * três primeiros de cada lista. Fora dela, a pílula encosta no cartão acima.
 */
export type DonationAmount = {
  cents: number;
  popular: boolean;
  /** Degrau de teste - ver `testAmount`. Nunca aparece no site publicado. */
  teste?: boolean;
};

/**
 * O degrau de **R$ 0,01**, que só existe em `localhost`.
 *
 * Serve para fechar o fluxo inteiro - Pix gerado, webhook, planilha, mandato
 * da recorrência - sem gastar o valor de um degrau real por tentativa. Ele
 * entra na frente da escada, nas duas frequências, e vem marcado como "teste"
 * na tela para não ser confundido com um valor de campanha.
 *
 * ⚠️ Quem decide se ele aparece é `isLocalhost()` (`lib/test-mode.ts`), pelo
 * endereço de quem está servindo a página - **não** por variável de build.
 * Em produção a grade começa no primeiro degrau real, sempre.
 */
export const testAmount: DonationAmount = {
  cents: 1,
  popular: false,
  teste: true,
};

/** ⚠️ PREENCHER · Doação **única**. Nove degraus, do menor ao maior. */
export const donationAmountsUnica: readonly DonationAmount[] = [
  { cents: 2000, popular: false },
  { cents: 3000, popular: true },
  { cents: 5000, popular: false },
  { cents: 10000, popular: false },
  { cents: 15000, popular: false },
  { cents: 20000, popular: false },
  { cents: 25000, popular: false },
  { cents: 50000, popular: false },
  { cents: 100000, popular: false },
] as const;

/** ⚠️ PREENCHER · Doação **mensal**. Começa mais baixo e sobe mais devagar. */
export const donationAmountsMensal: readonly DonationAmount[] = [
  { cents: 1500, popular: false },
  { cents: 3000, popular: true },
  { cents: 3500, popular: false },
  { cents: 5000, popular: false },
  { cents: 6500, popular: false },
  { cents: 8000, popular: false },
  { cents: 12000, popular: false },
  { cents: 30000, popular: false },
  { cents: 50000, popular: false },
] as const;

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  AS FRENTES - "escolha onde ajudar"                                   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * ⚠️ PREENCHER. Elas não se inventam: devem ser as maiores linhas da **tabela
 * de custos** da própria campanha (o bloco 09, de transparência), que é o que
 * a campanha publica como destino do dinheiro. Uma frente que não aparece na
 * tabela é uma promessa que a página não sustenta.
 *
 * `txid` vai no BR Code do Pix estático e é o que separa uma frente da outra
 * no extrato. **Só letras e números, sem acento** - o padrão do Pix não aceita
 * mais que isso.
 */
export const causes = [
  {
    id: "racao",
    icon: "bowl",
    title: "Ração",
    text: "⚠️ PREENCHER - o que esta frente compra, em uma linha.",
    txid: "CAMPANHARACAO",
  },
  {
    id: "veterinario",
    icon: "pulse",
    title: "Consultas e cirurgias",
    text: "⚠️ PREENCHER",
    txid: "CAMPANHAVET",
  },
  {
    id: "estrutura",
    icon: "home",
    title: "Estrutura",
    text: "⚠️ PREENCHER",
    txid: "CAMPANHAESTRUTURA",
  },
  {
    id: "urgente",
    icon: "alert",
    title: "Onde for mais urgente",
    text: "⚠️ PREENCHER",
    txid: "CAMPANHAURGENTE",
  },
] as const;

export type Cause = (typeof causes)[number];

/** A frente de `id`, ou `null` - usado pelos modais para se intitular. */
export function causeById(id: string | null | undefined): Cause | null {
  return causes.find((c) => c.id === id) ?? null;
}

/**
 * ⚠️ CONFERIR ANTES DE PUBLICAR ⚠️
 *
 * Quem é a campanha e por onde falar com ela.
 *
 * ── Campanha e recebedor podem ser dois ───────────────────────────────────
 * `name` é quem a página assina; `supporter` é quem **recebe** o dinheiro e
 * emite o comprovante. Quando um protetor independente é apoiado por uma ONG,
 * os dois nomes convivem aqui: o CNPJ, o e-mail e o endereço são os da
 * organização, porque é isso que a pessoa confere na Receita Federal antes de
 * doar. Quando são a mesma entidade, repita o nome nos dois campos.
 */
export const org = {
  /** ⚠️ PREENCHER · O nome da campanha, que a página inteira assina. */
  name: "",
  /** ⚠️ PREENCHER · Quem recebe o dinheiro e emite o comprovante. */
  supporter: "",
  supporterHref: "",
  /**
   * O destino fora desta página que o menu publica.
   *
   * ⚠️ O rótulo é só o nome - sem "parceira", "mantenedora" ou qualquer
   * palavra de vínculo. A página não tem como comprovar vínculo nenhum, e
   * afirmar um ao lado de um pedido de dinheiro é o que não se conserta
   * depois.
   */
  humanHelp: {
    label: "",
    href: "",
  },
  /** ⚠️ CONFERIR · CNPJ de quem recebe, com máscara. */
  cnpj: "",
  email: "",
  address: {
    line1: "",
    line2: "",
    city: "",
    zip: "",
  },
  mapsHref: "",
  mapsEmbedSrc: "",
  /** ⚠️ PREENCHER · Só dígitos, com o 55 do país na frente. */
  whatsapp: "",
  whatsappDisplay: "",
  whatsappMessage: "Tenho uma dúvida sobre a campanha",
  instagram: "",
  instagramHref: "",
  facebookHref: "",
  /**
   * As três políticas, **nesta página**.
   *
   * ⚠️ Caminho relativo, sem domínio: quem monta o `<Link>` é o Next, que
   * prefixa o `basePath` sozinho. Escrever a URL inteira aqui quebraria os
   * três links no dia em que o caminho mudasse.
   */
  policies: [
    { label: "Política de Privacidade", href: "/politica-de-privacidade" },
    { label: "Termos de Uso", href: "/termos-de-uso" },
    { label: "Política de Doação", href: "/politica-de-doacao" },
  ],
};

export const whatsappHref = `https://wa.me/${org.whatsapp}?text=${encodeURIComponent(org.whatsappMessage)}`;

/** Monta um link de WhatsApp com mensagem própria. */
export function whatsappWith(message: string) {
  return `https://wa.me/${org.whatsapp}?text=${encodeURIComponent(message)}`;
}

/**
 * Doação recorrente pelo WhatsApp - usada só **depois** da doação (página de
 * obrigado). Na página, quem quer ajudar todo mês usa o modal mensal, que gera
 * o Pix na hora; mandar para o WhatsApp ali seria trocar um caminho que
 * funciona por um que depende de alguém responder.
 */
export const recurringHref = whatsappWith(
  "Olá! Quero ajudar todo mês. Como faço?",
);

/**
 * Um documento que a página publica para ser conferido.
 *
 * Todos abrem no mesmo popup (bloco 19), por cima da página - quem foi
 * conferir um documento não sai do fluxo da doação para isso.
 *
 * ⚠️ **Só entra aqui documento que existe em `public/`.** Uma linha apontando
 * para um arquivo que não foi enviado vira um botão que abre um quadro vazio
 * numa página que pede dinheiro, que é pior do que não ter o botão.
 */
export type Documento = {
  /** Caminho dentro de `public/`. O `basePath` do build entra na renderização. */
  src: string;
  alt: string;
  /** Título do popup - e do card, onde houver card. */
  title: string;
  /** Linha de apoio, só no card do documento. */
  subtitle?: string;
  /** Legenda sob a imagem, dentro do popup: o número, quando ele é público. */
  caption?: string;
  /**
   * Proporção do arquivo (`largura / altura`), para a moldura já nascer do
   * tamanho certo e a página não pular quando a imagem carrega. O padrão é o
   * A4 em pé do cartão da Receita; documento em outro formato declara o seu.
   * A imagem aparece inteira de todo jeito (`object-contain`) - o que a
   * proporção errada custa são tarjas em volta, nunca recorte.
   */
  aspect?: string;
};

/**
 * Taxa de processamento que o checkout oferece cobrir.
 *
 * ⚠️ **É configuração, não número no componente.** O checkout lê o valor daqui
 * e recalcula a cada doação - nada de "+ R$ 4,99" escrito na tela.
 *
 * `percent` fica em zero enquanto a taxa for fixa: ele existe para o dia em
 * que a conta virar "1,2% + R$ 0,99".
 *
 * `defaultChecked` **desligado**: a caixa abre desmarcada e quem soma a taxa é
 * quem quer somar. Marcada por padrão, o valor que a pessoa escolheu na tela
 * anterior não é o valor que ela vê no total da tela seguinte - e doação em
 * que o número muda sozinho entre uma tela e outra é a que volta como
 * contestação.
 */
export const checkoutFee = {
  enabled: true,
  percent: 0,
  fixedCents: 499,
  defaultChecked: false,
};

/** Quanto a taxa custa para um valor de doação. `0` quando desligada. */
export function feeCentsFor(amountCents: number) {
  if (!checkoutFee.enabled) return 0;
  return (
    Math.round(amountCents * (checkoutFee.percent / 100)) +
    checkoutFee.fixedCents
  );
}

/**
 * ⚠️ CONFERIR ANTES DE PUBLICAR ⚠️
 *
 * Chave Pix da campanha. Errar aqui manda o dinheiro de quem doa para a conta
 * errada - é o único dado desta página que não dá para corrigir depois.
 *
 * Quando a campanha tem chave própria (um e-mail, por exemplo) e o recebedor é
 * outra entidade, use a **da campanha**: é assim que a doação cai identificada
 * na campanha certa, com o CNPJ do recebedor continuando por trás.
 */
export const pix = {
  key: "",
  keyType: "E-mail",
  receiver: "",
};

/**
 * O cartão CNPJ de **quem recebe as doações** - o documento oficial que
 * qualquer pessoa pode conferir.
 */
export const cnpjDocument: Documento = {
  src: "/documentos/cnpj.webp",
  alt: "Cartão CNPJ emitido pela Receita Federal",
  title: `Cartão CNPJ · ${org.supporter}`,
  subtitle: "Documento oficial da Receita Federal",
  caption: `CNPJ ${org.cnpj}`,
};
