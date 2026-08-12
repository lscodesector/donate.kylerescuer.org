/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  CAMPANHA CAIO PROTETOR                                               ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Toda a informação editável desta página vive aqui: história, abrigos,
 * valores, custos, depoimentos, contatos. Trocar a campanha é trocar este
 * arquivo - nenhum componente precisa mudar.
 *
 * ── De onde veio este conteúdo ────────────────────────────────────────────
 * De `doe.caioprotetor.org`, a página em WordPress + Elementor da campanha,
 * transcrita seção por seção. O que mudou foi a casca: o desenho, a estrutura
 * de seções e o fluxo de doação são os do site da SOS Animal Help. O texto, os
 * links, a chave Pix e as fotos são os do Caio.
 *
 * ── O que ficou pelo caminho ──────────────────────────────────────────────
 * As faixas de ração por kg (`rationTiers`), o menu de adoção (`adoption`) e a
 * fileira de logos de parceiros (`partners`). Nenhum dos três existe na
 * campanha do Caio: a doação aqui é por **valor**, não por saco de ração, e
 * inventar preço de kg ou logo de parceiro numa página que pede dinheiro é o
 * tipo de erro que não se conserta depois. Os componentes correspondentes
 * saíram junto (ver o histórico do git se um dia voltarem a fazer sentido).
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
 * Os valores do modal de doação, em centavos.
 *
 * São **os mesmos da campanha do Caio**, na mesma ordem e com o mesmo destaque:
 * R$ 30 é o "popular" lá e continua sendo aqui. A escada vai até R$ 1.000
 * porque é até onde ela vai na página original.
 *
 * `donationAmounts` (mensal) começa mais baixo que a avulsa pelo motivo de
 * sempre: o que sustenta os abrigos é o valor se repetir todo mês, não ser alto
 * uma vez.
 */
export const donationAmounts = [
  { cents: 2000, popular: false },
  { cents: 3000, popular: true },
  { cents: 5000, popular: false },
  { cents: 10000, popular: false },
  { cents: 15000, popular: false },
  { cents: 20000, popular: false },
] as const;

/** Os mesmos valores para quem escolhe doar **uma vez só**. */
export const donationAmountsUnica = [
  { cents: 3000, popular: false },
  { cents: 5000, popular: false },
  { cents: 10000, popular: true },
  { cents: 15000, popular: false },
  { cents: 25000, popular: false },
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
  /** Políticas publicadas no site institucional da campanha. */
  policies: [
    {
      label: "Política de Privacidade",
      href: "https://caioprotetor.org/politica-de-privacidade",
    },
    { label: "Termos de Uso", href: "https://caioprotetor.org/termos-de-uso" },
    {
      label: "Política de Doação",
      href: "https://caioprotetor.org/politica-de-doacao",
    },
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
 * ⚠️ CONFERIR ANTES DE PUBLICAR ⚠️
 *
 * Os números da campanha. Cada um é sustentado por outra parte desta mesma
 * página - se um deles deixar de ser, tire o item da lista em vez de arredondar.
 *
 *   +400 vidas    é o número que a campanha publica ("400+ animais dependem
 *                 de cada doação"); a soma das fichas dos cinco abrigos dá 514,
 *                 então o "+" é conservador de propósito.
 *   5 abrigos     os cinco listados em `shelters`, com nome e endereço.
 *   4 estados     SP, MG, BA e ES - os estados desses cinco abrigos.
 *
 * `value` é número, e não texto, porque ele é contado do zero na tela (ver
 * `CountUp`). O que não é número vive em `prefix`/`suffix`.
 */
export const impactNumbers = [
  {
    prefix: "+",
    value: 400,
    suffix: "",
    label: "vidas acolhidas",
    note: "Animais nos abrigos que o Caio acompanha.",
  },
  {
    prefix: "",
    value: 5,
    suffix: "",
    label: "abrigos apoiados",
    note: "Cada um com nome e endereço abertos.",
  },
  {
    prefix: "",
    value: 4,
    suffix: "",
    label: "estados alcançados",
    note: "São Paulo, Minas Gerais, Bahia e Espírito Santo.",
  },
] as const;

/** Copy das seções, para o texto não ficar espalhado pelos componentes. */
export const copy = {
  causas: {
    title: "Escolha onde ajudar",
    lead: "Sua doação vai direto para a frente que você escolher.",
    floatingCta: "Doe agora",
    mensalTitle: "Prefere ajudar todo mês?",
    mensalText:
      "É a doação que sustenta os abrigos: sabendo com quanto contar, o Caio compra ração em quantidade e não espera a próxima campanha.",
    mensalCta: "Quero doar todo mês",
  },
  /**
   * "Quem é o Caio" - a história, que é o miolo desta campanha.
   *
   * O texto é o da página original, palavra por palavra, incluindo a citação em
   * destaque. `quote` é `<blockquote>` na tela: é o dado mais duro da página
   * (22 vidas perdidas) e ele não pode ser lido como mais um parágrafo.
   */
  missao: {
    eyebrow: "Quem é o Caio",
    statement:
      "Um protetor. Uma missão. 400 vidas que dependem da sua ajuda.",
    paragraphs: [
      "Meu nome é Caio, sou protetor e faço a ajuda chegar até abrigos que cuidam de animais em estado crítico.",
      "Através da SOS Animal Help, eu visito projetos que estão no limite, conheço de perto a realidade dos protetores e levo apoio financeiro para ração, remédios, veterinário e cuidados urgentes, para que esses animais tenham a chance de continuar vivos.",
    ],
    quote:
      "Fome e dívidas: nos últimos meses, as doações diminuíram muito e a situação piorou. Já foram 22 vidas perdidas, e outros animais ainda estão doentes, esperando por cuidado urgente.",
    paragraphsAfter: [
      "Mesmo diante de tanta dificuldade, eu não consigo virar as costas. Se a gente não ajudar agora, muitos desses animais continuarão sofrendo sem socorro, sem alimento e sem ninguém por eles.",
      "Abandonar esses animais não é uma opção...",
    ],
    cta: "Conheça os abrigos que o Caio ajuda",
  },
  abrigos: {
    eyebrow: "Quem recebe",
    title: "Abrigos que o Caio ajuda",
    lead: "A ajuda não fica com a gente. Ela chega nos abrigos que já estão com os animais na mão - cada um com nome, endereço e perfil aberto para você conferir.",
    ctaProfile: "Saiba mais",
    ctaShelter: "Doar agora",
    ctaInstagram: "Ver o dia a dia no Instagram",
    ctaWhatsapp: "Pedir os dados no WhatsApp",
    profileEmpty:
      "Os dados cadastrais completos deste abrigo ainda não estão publicados aqui. Se quiser conferir antes de doar, é só pedir para a equipe.",
  },
  /** O bloco de doação: o argumento (o contraste) e o pedido, num botão só. */
  doar: {
    eyebrow: "Como ajudar",
    title: "Cada doação é a diferença entre um animal ter ou não ter uma chance",
    lead: "O Caio não consegue fazer isso sozinho. O que entra aqui vira ração, remédio, veterinário e aluguel pago - nos cinco abrigos que ele acompanha.",
    cta: "Quero ajudar agora",
    seal: "Doação segura · Pix na hora · CNPJ verificável",
  },
  /** Cabeça da grade de valores, dentro do modal de doação. */
  valores: {
    eyebrow: "Doe agora",
    title: "Qual valor deseja doar?",
    lead: "Qualquer valor é bem-vindo. Toda ajuda mantém vivas as mais de 400 vidas que dependem do Caio.",
  },
  /** "Atualizações" - a linha do tempo da campanha. */
  atualizacoes: {
    eyebrow: "Atualizações",
    title: "O que aconteceu até aqui",
    lead: "A campanha não começou hoje, e nem tudo nela é boa notícia. Esta é a linha do tempo como ela é.",
  },
  /** "Depoimentos" - os vídeos gravados pelos próprios abrigos. */
  depoimentos: {
    eyebrow: "Depoimentos",
    title: "Quem recebe, falando por si",
    lead: "Cinco protetores, cinco abrigos. Cada vídeo foi gravado por quem está com os animais na mão.",
  },
  mensal: {
    title: "Quer garantir a ajuda todo mês?",
    text: "Doação avulsa resolve a semana. Doação mensal é o que permite planejar: sabendo com quanto contar, os abrigos compram ração em quantidade e nenhum animal fica esperando.",
    cta: "Quero ajudar todo mês",
  },
  comoFunciona: {
    eyebrow: "Como funciona",
    title: "Três passos, menos de um minuto",
    seal: "Doação 100% segura",
    steps: [
      {
        icon: "bowl",
        title: "Você escolhe quanto doar",
        text: "Escolha um dos valores ou digite o que o seu coração mandar. Não existe valor mínimo.",
      },
      {
        icon: "pix",
        title: "Faz o pagamento via Pix",
        text: "O código é gerado na hora, sem sair desta página. Pagamento rápido, seguro e direto para o CNPJ da SOS Animal Help.",
      },
      {
        icon: "heart",
        title: "O Caio leva a ajuda até o abrigo",
        text: "A doação vira ração, remédio e veterinário nos abrigos que ele acompanha - e o Caio publica os comprovantes.",
      },
    ],
  },
  pix: {
    eyebrow: "Pix direto",
    title: "Prefere doar direto pelo Pix?",
    text: "Você pode contribuir diretamente pelo aplicativo do seu banco, no valor que quiser.",
    steps: [
      "Copie a chave acima.",
      "Abra o aplicativo do seu banco e escolha Pix.",
      "Cole a chave, confira o recebedor e conclua a doação.",
    ],
  },
  transparencia: {
    eyebrow: "Transparência",
    title: "Para onde vai cada real",
    lead: "Manter mais de 400 animais seguros exige alimentação, atendimento veterinário e uma estrutura que funciona todos os dias.",
    costsCaption: "Custos mensais dos abrigos que o Caio Protetor acompanha",
    totalLabel: "Total necessário por mês",
  },
  documentacao: {
    eyebrow: "Documentação",
    title: "Antes de doar, confira quem está por trás da campanha",
    lead: "Transparência também significa facilitar o acesso às informações da organização que recebe as doações.",
  },
  faq: {
    eyebrow: "Dúvidas frequentes",
    title: "Perguntas e respostas",
    lead: "Tire suas dúvidas sobre a campanha e sobre as doações.",
    help: "Não achou o que procurava?",
    ctaWhatsapp: "Falar no WhatsApp",
  },
  final: {
    title: "Abandonar esses animais não é uma opção.",
    text: "São mais de 400 vidas em cinco abrigos que dependem de gente que decidiu não virar as costas. Cada doação, por menor que seja, é a diferença entre um animal ter ou não ter uma chance.",
    ctaPrimary: "Quero ajudar agora",
    ctaSecondary: "Tenho uma dúvida antes de doar",
    seal: "Doação segura · CNPJ verificável · Atendimento direto no WhatsApp",
  },
  footerAbout:
    "Resgatando vidas em SP, ES, MG e BA com o apoio da SOS Animal Help e de pessoas como você. São 400+ animais que dependem de cada doação.",
};

/**
 * Copy da primeira dobra.
 *
 * `headline` e `headlineAccent` são lidos como **uma frase só** - o componente
 * junta os dois com um espaço e pinta o segundo de vermelho. A frase é a da
 * campanha, sem edição: ela é o que dá o tom da página inteira.
 */
export const heroCopy = {
  headline: "Um protetor desesperado.",
  headlineAccent:
    "400 filhinhos que sofrem todos os dias.",
  /** Linha de apoio, logo abaixo da manchete. */
  lead: "Ajude o Caio a levar ajuda antes que seja tarde.",
  ctaPrimary: "Quero ajudar agora",
  ctaSecondary: "Conheça os abrigos",
  seal: "Projeto 100% seguro e verificado",
};

/**
 * As fotos da história do Caio - o carrossel da seção "Quem é o Caio".
 *
 * São as seis fotos da campanha original, na mesma ordem, com as legendas que
 * elas tinham lá. Baixadas para `/public/caio/historia/`: o site é exportado
 * estático e enviado por FTP, então depender do WordPress da campanha para
 * servir imagem é depender de um servidor que não é nosso.
 */
export const historiaPhotos = [
  {
    src: "/caio/historia/caio-1.webp",
    alt: "Caio Protetor com um cão resgatado no colo",
    caption: "Um protetor. Uma missão. 400 vidas que dependem da sua ajuda.",
  },
  {
    src: "/caio/historia/caio-2.webp",
    alt: "Caio entre os animais de que cuida todos os dias",
    caption: "Caio com os animais que cuida todo dia · ração, remédios e amor",
  },
  {
    src: "/caio/historia/caio-3.webp",
    alt: "Cão resgatado recebendo cuidado depois do resgate",
    caption: "Cada resgate é uma segunda chance de vida",
  },
  {
    src: "/caio/historia/caio-4.webp",
    alt: "Abrigo lotado, com animais aguardando atendimento",
    caption: "Abrigos no limite · animais esperando por cuidado urgente",
  },
  {
    src: "/caio/historia/caio-5.webp",
    alt: "Sacos de ração e medicamentos entregues no abrigo",
    caption:
      "Ração, remédios e veterinário · cada doação chega direta aos animais",
  },
  {
    src: "/caio/historia/caio-6.webp",
    alt: "Cães resgatados no pátio de um dos abrigos apoiados",
    caption: "400+ animais que não teriam outra chance sem o seu apoio",
  },
];

/**
 * O VSL da campanha, no VTurb.
 *
 * Os valores saem do embed que o VTurb entrega. Ao trocar o vídeo:
 *
 *   playerId       o `id` do `<vturb-smartplayer>` ("vid-…")
 *   scriptSrc      o `player.js` da conta, no fim do bloco
 *   smartplayerSrc o `smartplayer.js` do `<link rel="preload">`
 *   streamSrc      o `main.m3u8` - se o embed não trouxer, ele está dentro do
 *                  próprio `player.js` (o id do vídeo é diferente do id do
 *                  player, então não dá para deduzir)
 *   ratio          o número do `padding` do placeholder, sem o "%"
 *
 * Com `vturb: null` a dobra cai para o slide de fotos, sem mexer em componente.
 */
export const heroVideo: {
  vturb: {
    playerId: string;
    scriptSrc: string;
    smartplayerSrc: string;
    streamSrc: string;
    ratio: number;
  } | null;
  aspect: string;
} = {
  vturb: {
    playerId: "vid-6a3dcba6fcb54795331ecb9f",
    scriptSrc:
      "https://scripts.converteai.net/25b0cdcd-2b93-4910-aa45-91b9a6275957/players/6a3dcba6fcb54795331ecb9f/v4/player.js",
    smartplayerSrc:
      "https://scripts.converteai.net/lib/js/smartplayer-wc/v4/smartplayer.js",
    streamSrc:
      "https://cdn.converteai.net/25b0cdcd-2b93-4910-aa45-91b9a6275957/6a3dc9676e2c9c5a5916f3ba/main.m3u8",
    ratio: 78.125,
  },
  /**
   * Formato do player, em `largura / altura`. 78,125% de padding é
   * `1 / 0.78125` - um formato levemente deitado, que é o do vídeo da campanha.
   */
  aspect: "1 / 0.78125",
};

/**
 * Ficha de um abrigo - o que abre quando a pessoa clica no card.
 *
 * ⚠️ **Todo campo aqui é opcional e o que estiver vazio não aparece na tela.**
 * Preencha só o que der para comprovar. Enquanto `cnpj` e `address` estiverem
 * vazios, a ficha mostra sozinha um aviso de que os dados cadastrais ainda não
 * estão publicados, com o WhatsApp para quem quiser pedir.
 */
export type ShelterProfile = {
  /** Quem responde pelo abrigo - nome da pessoa ou da ONG. */
  responsible?: string;
  /** Só se o abrigo tiver CNPJ próprio. O de quem recebe está em `org.cnpj`. */
  cnpj?: string;
  /**
   * Endereço exato - rua **com número**, complemento, cidade/UF e CEP. A ficha
   * monta as linhas com o que existir e pula o que faltar.
   */
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    zip?: string;
  };
  /** Link do Google Maps. Sem ele o endereço aparece como texto simples. */
  mapsHref?: string;
  /** Quantos animais o abrigo mantém hoje, por extenso: "92 cães e gatos". */
  animals?: string;
  /** Ano ou tempo de atuação: "2008", "mais de 20 anos". */
  since?: string;
  /** Um ou dois parágrafos sobre o trabalho. Vazio cai para `description`. */
  about?: string;
};

export type Shelter = {
  id: string;
  name: string;
  /** Cidade e estado - é o que aparece no card, ao lado do alfinete. */
  location: string;
  /** Uma linha, a que resume o abrigo no card. */
  description: string;
  /** Perfil público, quando existe. Vazio some do card e da ficha. */
  instagram: string;
  instagramHref: string;
  /** Site próprio do abrigo, quando ele tem um. */
  siteHref?: string;
  photos: { src: string; alt: string }[];
  profile: ShelterProfile;
};

/**
 * Os cinco abrigos que o Caio acompanha.
 *
 * Nome, cidade, endereço e contagem de animais vêm da campanha original, campo
 * a campo. Os endereços são publicados **com número** de propósito: é o que
 * separa "um abrigo em Tatuí" de um lugar que a pessoa pode conferir.
 *
 * ⚠️ O Instagram só está preenchido onde ele foi confirmado. O Abrigo Dona Rose
 * está sem perfil e sem site aqui porque a campanha não publica nenhum dos dois
 * - link inventado numa página que pede doação é pior do que link ausente.
 */
export const shelters: Shelter[] = [
  {
    id: "siulsan-resgate",
    name: "Siulsan Resgate",
    location: "Tatuí, São Paulo",
    description:
      "53 cães resgatados. Recebe apoio mensal para ração, medicamentos e cirurgias veterinárias.",
    instagram: "@siulsanresgate",
    instagramHref: "https://www.instagram.com/siulsanresgate/",
    siteHref: "https://siulsanresgate.org/",
    photos: [
      {
        src: "/caio/abrigos/siulsan-resgate.webp",
        alt: "Cães resgatados no abrigo Siulsan Resgate, em Tatuí",
      },
    ],
    profile: {
      responsible: "Siulsan",
      cnpj: "",
      address: {
        line1: "Rua Maria Pontes Fernandes, 140",
        line2: "Vale dos Lagos",
        city: "Tatuí – SP",
        zip: "",
      },
      mapsHref:
        "https://www.google.com/maps/search/?api=1&query=Rua+Maria+Pontes+Fernandes,+140,+Vale+dos+Lagos,+Tatui+SP",
      animals: "53 cães resgatados",
      since: "",
      about:
        "Recebe apoio mensal do Caio para ração, medicamentos e cirurgias veterinárias.",
    },
  },
  {
    id: "sos-joana-darc",
    name: "SOS Joana Darc",
    location: "Santa Luzia, Minas Gerais",
    description:
      "200 animais, com foco em gatos resgatados de maus-tratos. Depende inteiramente de doações.",
    instagram: "@sosjoanadarc",
    instagramHref: "https://www.instagram.com/sosjoanadarc/",
    siteHref: "https://sosjoanadarc.org/",
    photos: [
      {
        src: "/caio/abrigos/sos-joana-darc.webp",
        alt: "Gatos e cães resgatados no abrigo SOS Joana Darc, em Santa Luzia",
      },
    ],
    profile: {
      responsible: "Joana",
      cnpj: "",
      address: {
        line1: "Rua Alto do Tanque, 1925",
        line2: "Vila Íris",
        city: "Santa Luzia – MG",
        zip: "",
      },
      mapsHref:
        "https://www.google.com/maps/search/?api=1&query=Rua+Alto+do+Tanque,+1925,+Vila+Iris,+Santa+Luzia+MG",
      animals: "200 animais",
      since: "",
      about:
        "Foco em gatos resgatados de maus-tratos. Depende inteiramente de doações para continuar funcionando.",
    },
  },
  {
    id: "abrigo-salve-cao",
    name: "Abrigo Salve Cão",
    location: "Floresta Azul, Bahia",
    description:
      "92 animais. Em maio quase fechou por falta de aluguel. Segue aberto graças às doações mensais.",
    instagram: "@abrigosalvecao",
    instagramHref: "https://www.instagram.com/abrigosalvecao/",
    siteHref: "https://salvecaoabrigo.org/",
    photos: [
      {
        src: "/caio/abrigos/abrigo-salve-cao.webp",
        alt: "Cães resgatados no Abrigo Salve Cão, em Floresta Azul",
      },
    ],
    profile: {
      responsible: "Andrezza",
      cnpj: "",
      address: {
        line1: "Almadina, 3",
        line2: "Zona Rural",
        city: "Floresta Azul – BA",
        zip: "",
      },
      mapsHref:
        "https://www.google.com/maps/search/?api=1&query=Almadina,+3,+Zona+Rural,+Floresta+Azul+BA",
      animals: "92 animais",
      since: "",
      about:
        "Em maio de 2026 quase fechou por falta de aluguel. Segue aberto graças às doações mensais.",
    },
  },
  {
    id: "casa-da-mili",
    name: "Casa da Mili",
    location: "Tambaú, São Paulo",
    description:
      "74 animais entre cães e gatos resgatados, mantidos com voluntários e doações mensais.",
    instagram: "@milenaefernanda.ong",
    instagramHref: "https://www.instagram.com/milenaefernanda.ong/",
    photos: [
      {
        src: "/caio/abrigos/casa-da-mili.webp",
        alt: "Cães e gatos resgatados na Casa da Mili, em Tambaú",
      },
    ],
    profile: {
      responsible: "Milena",
      cnpj: "",
      address: {
        line1: "Av. Sebastião José Bething, 672",
        line2: "Jardim Nova Cidade",
        city: "Tambaú – SP",
        zip: "",
      },
      mapsHref:
        "https://www.google.com/maps/search/?api=1&query=Av.+Sebastiao+Jose+Bething,+672,+Jardim+Nova+Cidade,+Tambau+SP",
      animals: "74 cães e gatos",
      since: "",
      about:
        "A Milena mantém o abrigo com voluntários e doações mensais para ração e veterinário.",
    },
  },
  {
    id: "abrigo-dona-rose",
    name: "Abrigo Dona Rose",
    location: "Serra, Espírito Santo",
    description:
      "95 animais em Jacaraípe. Sem apoio público, depende inteiramente de doações.",
    /* Sem perfil publicado na campanha - ver o aviso acima. */
    instagram: "",
    instagramHref: "",
    photos: [
      {
        src: "/caio/abrigos/abrigo-dona-rose.webp",
        alt: "Cães resgatados no Abrigo Dona Rose, em Jacaraípe",
      },
    ],
    profile: {
      responsible: "Rose",
      cnpj: "",
      address: {
        line1: "Rua Jacob Dala, 37",
        line2: "Enseada de Jacaraípe",
        city: "Serra – ES",
        zip: "",
      },
      mapsHref:
        "https://www.google.com/maps/search/?api=1&query=Rua+Jacob+Dala,+37,+Enseada+de+Jacaraipe,+Serra+ES",
      animals: "95 animais",
      since: "",
      about:
        "A Rose cuida de 95 animais em Jacaraípe. Sem apoio público, depende inteiramente de doações para manter o abrigo de pé.",
    },
  },
];

/**
 * Depoimentos - os vídeos gravados pelos próprios protetores.
 *
 * Os arquivos foram baixados da campanha para `/public/caio/depoimentos/` (ver
 * o motivo em `historiaPhotos`). São ~52 MB somados, e é por isso que o
 * componente usa `preload="none"`: nenhum byte de vídeo é baixado antes de a
 * pessoa apertar o play - o que aparece na tela é o `poster`, que pesa ~30 KB.
 */
export const depoimentos = [
  {
    id: "joana",
    src: "/caio/depoimentos/joana.mp4",
    poster: "/caio/depoimentos/joana.webp",
    name: "Joana",
    shelter: "SOS Joana Darc",
    detail: "200 animais · Santa Luzia, MG",
  },
  {
    id: "salvecao",
    src: "/caio/depoimentos/salvecao.mp4",
    poster: "/caio/depoimentos/salvecao.webp",
    name: "Andrezza",
    shelter: "Abrigo Salve Cão",
    detail: "92 animais · Floresta Azul, BA",
  },
  {
    id: "milena",
    src: "/caio/depoimentos/milena.mp4",
    poster: "/caio/depoimentos/milena.webp",
    name: "Milena",
    shelter: "Casa da Mili",
    detail: "74 animais · Tambaú, SP",
  },
  {
    id: "siulsan",
    src: "/caio/depoimentos/siulsan.mp4",
    poster: "/caio/depoimentos/siulsan.webp",
    name: "Siulsan",
    shelter: "Siulsan Resgate",
    detail: "53 cães · Tatuí, SP",
  },
  {
    id: "rose",
    src: "/caio/depoimentos/rose.mp4",
    poster: "/caio/depoimentos/rose.webp",
    name: "Rose",
    shelter: "Abrigo Dona Rose",
    detail: "95 animais · Serra, ES",
  },
];

/**
 * A linha do tempo da campanha.
 *
 * ⚠️ **Nem toda entrada é boa notícia, e é assim de propósito.** Duas delas são
 * derrota (20 animais que não resistiram, prefeitura que negou apoio pela
 * terceira vez). Elas vêm da campanha original e ficam: uma linha do tempo em
 * que só há vitória é publicidade, não prestação de contas.
 *
 * `tone` decide a cor do marcador: `now` é a entrada atual (dourada), `done` é
 * o que já aconteceu com desfecho, `open` é o que ficou em aberto.
 */
export const timeline = [
  {
    date: "Jun 2026 · Campanha lançada",
    title: "A história do Caio chegou à internet",
    text: "Mais de 1.000 compartilhamentos em 24 horas, mas ainda muito longe do necessário para manter os 400+ animais dos abrigos.",
    tone: "now" as const,
  },
  {
    date: "Mai 2026 · Crise na Bahia",
    title: "Abrigo Salve Cão quase fecha por falta de aluguel",
    text: "Caio negociou 30 dias de prazo. 92 animais dependiam dessa decisão. Com a ajuda dos doadores o abrigo se manteve.",
    tone: "done" as const,
  },
  {
    date: "Mar 2026",
    title: "20 animais não resistiram este ano",
    text: "Por falta de remédios e ração a tempo. Cada vida perdida é uma batalha que poderia ter sido vencida com recursos suficientes.",
    tone: "done" as const,
  },
  {
    date: "Dez 2025",
    title: "Prefeitura nega apoio pela 3ª vez",
    text: "Caio segue lutando para conseguir doações. Sem patrocínio público, a campanha é a única alternativa.",
    tone: "open" as const,
  },
];

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
 * `defaultChecked` deixa a caixa marcada ao abrir a etapa de dados - como na
 * campanha original. A contrapartida está na tela: o valor aparece em destaque,
 * o motivo é explicado e o total logo abaixo já vem somado. O que gera
 * contestação não é a taxa, é a pessoa descobrir depois.
 */
export const checkoutFee = {
  enabled: true,
  percent: 0,
  fixedCents: 499,
  defaultChecked: true,
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
 * Prova rápida de confiança - faixa escaneável logo depois do hero.
 * Só afirmações que a própria página sustenta.
 */
export const trustStrip = {
  title: "Da sua doação até o abrigo, sem escala.",
  items: [
    { icon: "shield", label: "CNPJ verificável" },
    { icon: "home", label: "5 abrigos identificados" },
    { icon: "bowl", label: "Ração, remédio e veterinário" },
    { icon: "pix", label: "Doação via Pix" },
    { icon: "whatsapp", label: "Atendimento no WhatsApp" },
  ],
};

/**
 * O contraste que dá urgência: o que acontece sem apoio, e o que muda com você.
 *
 * São os seis cards da seção "O impacto da sua doação" da campanha, divididos
 * nos dois lados que eles já formavam lá (três "sem", três "com").
 */
export const impactCompare = {
  title: "O impacto da sua doação",
  intro:
    "Num abrigo com dezenas de animais, ração acabando não é uma compra adiada. É um protetor decidindo quem come a porção inteira hoje.",
  withoutTitle: "Sem apoio",
  without: [
    "A ração acaba antes do fim do mês e os animais passam fome.",
    "Doenças avançam porque não há dinheiro para tratamento.",
    "Abrigos fecham as portas e os animais voltam para as ruas.",
  ],
  withTitle: "Com você",
  with: [
    "Nenhum animal dorme com fome ou sem cuidado.",
    "Tratamentos e cirurgias acontecem quando os animais mais precisam.",
    "Os abrigos ficam de pé e cada vida tem um lar.",
  ],
  closing:
    "Cada doação, por menor que seja, é a diferença entre um animal ter ou não ter uma chance. O Caio não consegue fazer isso sozinho.",
};

/**
 * ⚠️ CONFERIR ANTES DE PUBLICAR ⚠️
 *
 * A conta mensal dos abrigos, em reais - os cinco itens da tabela
 * "Custos mensais" da campanha, com os mesmos valores. A soma dá **R$ 58.000**,
 * que é a meta que o vídeo fala em voz alta.
 *
 * O total é somado a partir dos itens (`monthlyCostsTotal`), então a linha final
 * nunca fica fora de sincronia com a lista. **Número em reais só continua
 * verdadeiro se alguém revisar.**
 */
export const monthlyCosts = {
  items: [
    { label: "Ração para os animais", cents: 1_740_000, dot: "bg-action" },
    { label: "Consultas e cirurgias", cents: 2_030_000, dot: "bg-warning" },
    { label: "Aluguel dos abrigos", cents: 1_160_000, dot: "bg-donate" },
    { label: "Medicamentos", cents: 580_000, dot: "bg-progress" },
    { label: "Luz, água e estrutura", cents: 290_000, dot: "bg-ink-300" },
  ],
};

export const monthlyCostsTotal = monthlyCosts.items.reduce(
  (sum, item) => sum + item.cents,
  0,
);

/** Cartão CNPJ, o documento oficial que qualquer pessoa pode conferir. */
export const cnpjDocument = {
  src: "/documentos/cnpj-animal.webp",
  alt: "Cartão CNPJ da SOS Animal Help emitido pela Receita Federal",
  title: "Cartão CNPJ · SOS Animal Help",
  subtitle: "Documento oficial da Receita Federal",
};

/**
 * As dúvidas - **cinco, e só cinco**.
 *
 * São as cinco perguntas da campanha do Caio, com as mesmas respostas.
 *
 * ⚠️ Se for acrescentar uma pergunta, tire outra. Cinco é o limite acordado.
 */
export const faq = [
  {
    q: "A doação é segura?",
    a: "Sim. Os pagamentos são processados com segurança via Pix, um dos métodos de pagamento mais confiáveis do Brasil, com criptografia de ponta a ponta. Nenhum dado bancário é armazenado neste site.",
  },
  {
    q: "Existe valor mínimo?",
    a: "Não. Qualquer valor é bem-vindo. Toda ajuda mantém vivas as mais de 400 vidas que dependem do Caio.",
  },
  {
    q: "Para onde vai o dinheiro exatamente?",
    a: "Direto para os cuidados dos animais: ração, resgates, tratamento veterinário, medicamentos e manutenção dos abrigos. O Caio publica comprovantes mensais no Instagram.",
  },
  {
    q: "Quem é a SOS Animal Help?",
    a: "Organização brasileira de proteção animal que apoia protetores independentes como o Caio. É ela quem recebe as doações e faz o repasse com rastreabilidade, sob o CNPJ 63.153.881/0001-09.",
  },
  {
    q: "Vou receber um comprovante da minha doação?",
    a: "Sim. Assim que o Pix é confirmado, o comprovante fica disponível automaticamente no aplicativo do seu banco.",
  },
] as const;

/**
 * Avaliação do Google - DESATIVADA porque não há dado confirmado.
 *
 * Exibir nota e número de avaliações inventados numa página de doação é enganar
 * quem doa, então o card não é renderizado enquanto `enabled` for `false`.
 */
export const googleReviews = {
  enabled: false,
  rating: 0,
  reviewCount: 0,
  href: "",
};

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
