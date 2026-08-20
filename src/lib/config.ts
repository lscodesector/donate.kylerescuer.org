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
 * As funções de formatação (`formatBRL`, `formatBRLCurto`) estão em
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
 * A seção "Pix direto" está **ligada**.
 *
 * No site da SOS Animal Help ela estava desligada, porque a chave solta no meio
 * da página competia com o checkout. Aqui ela volta porque a campanha do Caio a
 * tem, em destaque, e porque a chave é dela (`caioprotetor@sosanimalhelp.org`)
 * e não do CNPJ genérico: quem prefere pagar pelo app do banco consegue, e a
 * doação ainda cai identificada na campanha certa.
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
 * até onde a campanha do Caio vai.
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
 * `doe.caioprotetor.org` a grade começa em R$ 15 (mensal) ou R$ 20
 * (única), sempre.
 */
export const testAmount: DonationAmount = {
  cents: 1,
  popular: false,
  teste: true,
};

/** Doação **única** - R$ 20 a R$ 1.000. */
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

/** Doação **mensal** - R$ 15 a R$ 500, a escada que a campanha pratica. */
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
 * `monthlyCosts`), que é o que o Caio publica como destino do dinheiro.
 *
 * `txid` vai no BR Code do Pix estático e é o que separa uma frente da outra no
 * extrato. Só letras e números, sem acento: o padrão do Pix não aceita mais.
 */
export const causes = [
  {
    id: "racao",
    icon: "bowl",
    title: "Ração dos abrigos",
    text: "Alimentar os mais de 400 animais que o Caio acompanha.",
    txid: "CAIORACAO",
  },
  {
    id: "veterinario",
    icon: "pulse",
    title: "Consultas e cirurgias",
    text: "Tratamento veterinário e medicamentos para quem está doente.",
    txid: "CAIOVET",
  },
  {
    id: "estrutura",
    icon: "home",
    title: "Aluguel dos abrigos",
    text: "Manter as portas abertas - foi o que quase fechou o Salve Cão.",
    txid: "CAIOESTRUTURA",
  },
  {
    id: "urgente",
    icon: "alert",
    title: "Onde for mais urgente",
    text: "O Caio direciona para o abrigo que estiver mais apertado no mês.",
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
 * Quem é o Caio e por onde falar com ele. O WhatsApp e as redes são os da
 * campanha; o CNPJ é o da SOS Animal Help, que é quem recebe as doações e faz o
 * repasse - por isso os dois nomes convivem aqui.
 */
export const org = {
  /** O nome da campanha, que é o que a página inteira assina. */
  name: "Caio Protetor",
  /**
   * Quem recebe o dinheiro e emite o comprovante.
   *
   * ⚠️ Daqui para baixo, **os dados são da SOS Animal Help, não do Caio**: o
   * CNPJ, o e-mail e o endereço são os da organização que recebe as doações e
   * faz o repasse. É isso que a seção de documentação publica, e é isso que a
   * pessoa confere na Receita Federal antes de doar. O Caio é um protetor
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
  cnpj: "63.153.881/0001-09",
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
  /* O WhatsApp, as redes e as políticas voltam a ser da campanha do Caio. */
  whatsapp: "5585997934599",
  whatsappDisplay: "(85) 99793-4599",
  whatsappMessage: "Tenho uma dúvida sobre o Caio Protetor",
  instagram: "@caio.protetor",
  instagramHref: "https://www.instagram.com/caio.protetor/",
  facebookHref: "https://www.facebook.com/caioprotetor",
  /**
   * As três políticas, **nesta página**.
   *
   * Eram links para `caioprotetor.org`, o site institucional - um destino fora
   * daqui para um documento que fala das doações feitas aqui. Agora cada uma é
   * uma rota própria (`app/politica-*`), com o texto em `content/legal.ts`.
   *
   * ⚠️ Caminho relativo, sem domínio: quem monta o `<Link>` é o Next, que
   * prefixa o `basePath` sozinho (o site é publicado em `/v2`). Escrever a URL
   * inteira aqui quebraria os três links no dia em que o caminho mudasse.
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
  "Olá! Quero ajudar o Caio Protetor todo mês. Como faço?",
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
 * recalcula a cada doação - nada de "+ R$ 4,99" escrito na tela.
 *
 * R$ 4,99 fixo é o valor que a campanha do Caio pratica, e é o mesmo texto que
 * ela usa ("Cubra os custos de R$ 4,99 do pix e garanta que sua doação chegue
 * completa"). `percent` fica em zero: ele existe para o dia em que a conta virar
 * "1,2% + R$ 0,99".
 *
 * `defaultChecked` está **desligado**: a caixa abre desmarcada e quem soma os
 * R$ 4,99 é quem quer somar. Marcada por padrão, o valor que a pessoa escolheu
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
 * ⚠️ CONFERIR ANTES DE PUBLICAR ⚠️
 *
 * Chave Pix da campanha. Errar aqui manda o dinheiro de quem doa para a conta
 * errada - é o único dado desta página que não dá para corrigir depois.
 *
 * É a chave **da campanha do Caio** (e-mail), e não o CNPJ da SOS Animal Help:
 * é assim que a doação cai identificada na campanha certa. O recebedor continua
 * sendo a SOS Animal Help, que é quem tem o CNPJ.
 */
export const pix = {
  key: "caioprotetor@sosanimalhelp.org",
  keyType: "E-mail",
  receiver: "SOS Animal Help",
};

/**
 * O cartão CNPJ de **quem recebe as doações** - o documento oficial que
 * qualquer pessoa pode conferir. O de cada abrigo está em `Shelter.cnpjDoc`.
 */
export const cnpjDocument: Documento = {
  src: "/documentos/cnpj-animal.webp",
  alt: "Cartão CNPJ da SOS Animal Help emitido pela Receita Federal",
  title: "Cartão CNPJ · SOS Animal Help",
  subtitle: "Documento oficial da Receita Federal",
  caption: `CNPJ ${org.cnpj}`,
};
