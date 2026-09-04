/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  DADOS DA CAMPANHA - CAIO PROTETOR                                    ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * O que mora aqui é **dado de campanha**, não texto de bloco: chave Pix,
 * CNPJ, contatos, taxa do checkout, valores da grade de doação e as frentes.
 *
 * ── Por que isto não foi distribuído nos blocos ───────────────────────────
 * Cada seção da página é um bloco isolado e carrega o próprio texto - a
 * história, o FAQ, os abrigos, os depoimentos moram todos dentro do arquivo
 * do bloco que os desenha. Estes campos aqui são a exceção, e por um motivo
 * só: eles são lidos por mais de um lugar ao mesmo tempo (o bloco do Pix, o
 * checkout, a página `/doar/valor`, a de obrigado, as políticas) e errar um
 * deles manda dinheiro para a conta errada. Uma chave Pix copiada em cinco
 * arquivos é uma chave Pix que um dia vai divergir em quatro.
 *
 * Nenhum bloco deve reescrever o que está aqui - importe daqui.
 *
 * As funções de formatação (`formatUSD`, `formatUSDCurto`) estão em
 * `lib/format.ts`, junto das outras máscaras.
 */

/**
 * Âncora do bloco de doação.
 *
 * Era `#racao` quando a página vendia saco de ração. Virou `#doar` porque o
 * que mora lá agora é o pedido de doação por valor - cabeçalho, hero, rodapé e
 * fechamento apontam todos para cá.
 */
export const DOAR_HREF = "#doar";

/**
 * Checkout de valor livre em página: o modal manda o valor em centavos pela
 * URL. `freq=mensal` marca a intenção de recorrência.
 *
 * É o `href` de verdade dos CTAs de doação - com JavaScript o modal intercepta
 * o clique e ninguém chega lá. Ver `app/doar/valor/CheckoutValor.tsx`.
 */
export function checkoutValorHref(cents: number, mensal = false) {
  const freq = mensal ? "&freq=mensal" : "";
  return `/doar/valor?cents=${cents}${freq}`;
}

/**
 * Os valores do modal de doação, em centavos - **uma escada por frequência**.
 *
 * São nove degraus em cada uma, na grade de 3×3. Nenhum abre marcado: quem
 * escolhe é quem doa, e o campo logo abaixo da grade recebe o que for clicado
 * (e aceita qualquer outro número - é o que mais converte neste checkout).
 *
 * ── Por que as duas escadas são diferentes ────────────────────────────────
 * Não é o mesmo pedido. Doar R$ 100 uma vez é um gesto; R$ 100 todo mês é um
 * compromisso, e uma escada avulsa oferecida na mensal pede alto demais - a
 * mensal começa mais baixo e sobe mais devagar. A única vai a R$ 1.000, que é
 * até onde a campanha do Kyle vai.
 *
 * `popular` marca **R$ 30** nas duas: é o valor que a campanha aponta como o
 * mais escolhido, e ele existe nas duas escadas.
 *
 * ⚠️ O selo fica pendurado na borda **de cima** do cartão (ver `DonationModal`),
 * então o degrau marcado precisa continuar na **primeira fileira** - entre os
 * três primeiros de cada lista.
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
 * da recorrência - sem gastar o valor de um degrau real por tentativa. Ele entra na frente da
 * escada, nas duas frequências, e vem marcado como "teste" na tela para não
 * ser confundido com um valor de campanha.
 *
 * ⚠️ Quem decide se ele aparece é `isLocalhost()` (`lib/test-mode.ts`), pelo
 * endereço de quem está servindo a página - não por variável de build. Em
 * `donate.kylerescuer.org` a grade começa em R$ 15 (mensal) ou R$ 20
 * (única), sempre.
 */
export const testAmount: DonationAmount = {
  cents: 1,
  popular: false,
  teste: true,
};

/**
 * Piso do **valor livre da doação única**, em centavos - $10.00.
 *
 * A grade da única começa em $20, mas o campo de valor livre aceita qualquer
 * número: sem este piso, quem digita "0.01" fecha uma doação de um centavo. É o
 * equivalente, na única, ao `payments.recurring.minCents` da mensal.
 *
 * ⚠️ Em `localhost` quem manda é o `testAmount` ($0.01) - ver
 * `DonationModal`. Fora de `localhost` este é o piso, sempre.
 */
export const donationMinCentsUnica = 1000;

/** Doação **única** - $20 a $1,000. */
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

/** Doação **mensal** - $15 a $500, a escada que a campanha pratica. */
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
 * O menu que o botão flutuante abre. Elas não foram inventadas: são as quatro
 * maiores linhas da **tabela de custos** da própria campanha (ver
 * `monthlyCosts`), que é o que o Kyle publica como destino do dinheiro.
 *
 * `txid` vai no BR Code do Pix estático e é o que separa uma frente da outra no
 * extrato. Só letras e números, sem acento: o padrão do Pix não aceita mais.
 */
export const causes = [
  {
    id: "racao",
    icon: "bowl",
    title: "Food for the shelters",
    text: "Feeding the 400+ animals Kyle looks after.",
    txid: "CAIORACAO",
  },
  {
    id: "veterinario",
    icon: "pulse",
    title: "Vet visits and surgeries",
    text: "Veterinary treatment and medicine for the ones who are sick.",
    txid: "CAIOVET",
  },
  {
    id: "estrutura",
    icon: "home",
    title: "Shelter rent",
    text: "Keeping the doors open - it is what almost closed Save Dog Shelter.",
    txid: "CAIOESTRUTURA",
  },
  {
    id: "urgente",
    icon: "alert",
    title: "Wherever it is most urgent",
    text: "Kyle sends it to whichever shelter is tightest that month.",
    txid: "CAIOURGENTE",
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
 * Quem é o Kyle e por onde falar com ele. O WhatsApp e as redes são os da
 * campanha; o CNPJ é o da SOS Animal Help, que é quem recebe as doações e faz o
 * repasse - por isso os dois nomes convivem aqui.
 */
export const org = {
  /** O nome da campanha, que é o que a página inteira assina. */
  name: "Kyle Rescuer",
  /**
   * Quem recebe o dinheiro e emite o comprovante.
   *
   * ⚠️ Daqui para baixo, **os dados são da SOS Animal Help, não do Kyle**: o
   * CNPJ, o e-mail e o endereço são os da organização que recebe as doações e
   * faz o repasse. É isso que a seção de documentação publica, e é isso que a
   * pessoa confere na Receita Federal antes de doar. O Kyle é um protetor
   * independente apoiado por ela - ele não tem CNPJ próprio nesta campanha.
   */
  supporter: "SOS Animal Help",
  supporterHref: "https://sosanimalhelp.org/sobre-nos/",
  /**
   * O site da **SOS Animal Help**, que o menu publica como o único destino fora
   * desta página.
   *
   * ⚠️ Não é quem recebe as doações desta campanha - quem recebe é a SOS Animal
   * Help, com o CNPJ logo abaixo. O rótulo aqui é só o nome, sem "parceira" nem
   * "mantenedora": a página não tem como comprovar vínculo nenhum, e afirmar um
   * ao lado de um pedido de dinheiro é o que não se conserta depois.
   */
  humanHelp: {
    label: "SOS Animal Help",
    href: "https://sosanimalhelp.org/pt-br/",
  },
  cnpj: "41-4770760",
  email: "support@sosanimalhelp.org",
  address: {
    line1: "Av. Francisco de Paula Leite, 487",
    line2: "Jardim Santa Cruz",
    city: "Indaiatuba – SP",
    zip: "13344-115",
  },
  mapsHref:
    "https://www.google.com/maps/search/?api=1&query=Av.+Francisco+de+Paula+Leite,+487,+Jardim+Santa+Cruz,+Indaiatuba+SP",
  mapsEmbedSrc:
    "https://www.google.com/maps?q=Av.+Francisco+de+Paula+Leite,+487,+Jardim+Santa+Cruz,+Indaiatuba+SP&output=embed",
  /* O WhatsApp, as redes e as políticas voltam a ser da campanha do Kyle. */
  whatsapp: "5585997934599",
  whatsappDisplay: "(85) 99793-4599",
  whatsappMessage: "I have a question about Kyle Rescuer",
  instagram: "@kylerescuer",
  instagramHref: "https://www.instagram.com/kylerescuer",
  facebookHref: "http://facebook.com/kylerescuer",
  /**
   * As três políticas, no site institucional.
   *
   * Não são rota própria aqui - o texto legal completo mora em
   * `kylerescuer.org` (WordPress), não nesta campanha. Link absoluto e
   * externo: o `Footer` já abre em aba nova (`target="_blank"`) qualquer
   * `href` que comece com `http`.
   */
  policies: [
    {
      label: "Privacy Policy",
      href: "https://kylerescuer.org/privacy-policy",
    },
    { label: "Terms of Use", href: "https://kylerescuer.org/terms-of-use" },
    {
      label: "Donation Policy",
      href: "https://kylerescuer.org/donation-policy",
    },
  ],
};

export const whatsappHref = `https://wa.me/${org.whatsapp}?text=${encodeURIComponent(org.whatsappMessage)}`;

/**
 * Monta um link de WhatsApp com mensagem própria.
 *
 * `phone` é opcional e existe para quem já buscou o número atual do abrigo
 * (ver `useShelterPhone`, em `lib/hooks/`) - sem ele, cai no `org.whatsapp`
 * fixo, como sempre foi.
 */
export function whatsappWith(message: string, phone: string = org.whatsapp) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Doação recorrente pelo WhatsApp - usada só **depois** da doação (página de
 * obrigado). Na página, quem quer ajudar todo mês usa o modal mensal, que gera
 * o Pix na hora; mandar para o WhatsApp ali seria trocar um caminho que
 * funciona por um que depende de alguém responder.
 */
export const recurringHref = whatsappWith(
  "Hi! I want to help Kyle Rescuer every month. How do I do it?",
);

/**
 * Um documento que a página publica para ser conferido.
 *
 * Hoje são o cartão CNPJ de quem recebe as doações (`cnpjDocument`) e o de cada
 * abrigo (`Shelter.cnpjDoc`). Todos abrem no mesmo popup (`DocumentoModal`),
 * por cima da página - quem foi conferir um documento não sai do fluxo da
 * doação para isso.
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
 * ⚠️ **É configuração, não número no componente.** O checkout lê o valor daqui e
 * recalcula a cada doação - nada de "+ $4.99" escrito na tela.
 *
 * $4.99 fixo é o valor que a campanha do Kyle pratica ("Cover the $4.99
 * processing cost and make sure your donation reaches Kyle in full").
 * `percent` fica em zero: ele existe para o dia em que a conta do PayPal for
 * repassada como ela é de verdade - "2.99% + $0.49" na doação internacional.
 *
 * `defaultChecked` está **desligado**: a caixa abre desmarcada e quem soma os
 * $4.99 é quem quer somar. Marcada por padrão, o valor que a pessoa escolheu
 * na tela anterior não era o valor que ela via no total da tela seguinte - e
 * doação em que o número muda sozinho entre uma tela e outra é a que volta como
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
 * O cartão CNPJ de **quem recebe as doações** - o documento oficial que
 * qualquer pessoa pode conferir. O de cada abrigo está em `Shelter.cnpjDoc`.
 */
export const cnpjDocument: Documento = {
  src: "/documentos/ein-sos-animal-help.webp",
  alt: "EIN document of SOS Animal Help issued by the US Internal Revenue Service",
  title: "EIN · SOS Animal Help",
  subtitle: "Official US Employer Identification Number document",
  caption: `EIN: ${org.cnpj}`,
  /* Medida no arquivo: 948 x 1073. Sem isto a moldura assumiria o A4 em pe do
     antigo cartao da Receita e sobrariam tarjas em volta do documento. */
  aspect: "948 / 1073",
};
