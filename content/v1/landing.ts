/**
 * Toda a informação editável desta página vive aqui: valores, kg, impacto,
 * abrigos, contatos. Trocar uma campanha é trocar este arquivo — nenhum
 * componente precisa mudar.
 */

/** Endereço do checkout interno de uma faixa de doação. */
export function checkoutHref(tierId: string) {
  return `/doar/${tierId}`;
}

/**
 * Checkout de valor livre: o modal manda o valor em centavos pela URL, porque
 * ele não é uma faixa fixa de ração e não tem `id` próprio. `freq=mensal`
 * marca a intenção de recorrência (ver aviso abaixo).
 */
export function checkoutValorHref(cents: number, mensal = false) {
  const freq = mensal ? "&freq=mensal" : "";
  return `/doar/valor?cents=${cents}${freq}`;
}

/**
 * Valores do modal de doação, em centavos. `popular` destaca um cartão.
 */
export const donationAmounts = [
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

export const org = {
  name: "SOS Animal Help",
  cnpj: "63.153.881/0001-09",
  whatsapp: "5585997634409",
  whatsappDisplay: "(85) 99763-4409",
  whatsappMessage:
    "Olá! Vim pela página de doação de ração e queria saber mais.",
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
  donateHref: "https://wa.me/5585997634409?text=Quero%20doar%20ra%C3%A7%C3%A3o",
};

export const whatsappHref = `https://wa.me/${org.whatsapp}?text=${encodeURIComponent(org.whatsappMessage)}`;

/** Monta um link de WhatsApp com mensagem própria. */
export function whatsappWith(message: string) {
  return `https://wa.me/${org.whatsapp}?text=${encodeURIComponent(message)}`;
}

/**
 * Doação recorrente: hoje é combinada com a equipe pelo WhatsApp, porque a
 * página não tem checkout com recorrência. O botão aponta para o canal que a
 * organização realmente usa — não para uma funcionalidade que não existe.
 */
export const recurringHref = whatsappWith(
  "Olá! Quero ajudar a SOS Animal Help com uma doação recorrente, todo mês. Como faço?",
);

export const customAmountHref = whatsappWith(
  "Olá! Quero fazer uma doação para a SOS Animal Help com um valor diferente das opções da página.",
);

/** Copy das seções, para o texto não ficar espalhado pelos componentes. */
export const copy = {
  stories: {
    eyebrow: "Histórias reais",
    title: "Quem recebe a sua ajuda",
  },
  racao: {
    eyebrow: "Doe ração",
    title: "Transforme sua doação em ração",
    lead: "Escolha quanto você quer colocar nos potes. Mostramos de forma simples quanto cada contribuição representa.",
  },
  outroValor: {
    title: "Quer ajudar de outra forma?",
    text: "Você também pode escolher outro valor ou conversar com nossa equipe para ajudar de forma recorrente.",
    ctaCustom: "Escolher outro valor",
    ctaRecurring: "Quero ajudar todo mês",
  },
  pix: {
    eyebrow: "Pix direto",
    title: "Prefere doar direto pelo Pix?",
    text: "Você pode fazer sua contribuição diretamente para a SOS Animal Help pelo aplicativo do seu banco.",
    steps: [
      "Copie a chave acima.",
      "Abra o aplicativo do seu banco e escolha Pix.",
      "Cole a chave, confira o recebedor e conclua a doação.",
    ],
  },
  transparencia: {
    eyebrow: "Transparência",
    title: "Para onde vai o dinheiro",
    lead: "Manter centenas de animais seguros exige alimentação, atendimento veterinário e uma estrutura que funciona todos os dias.",
    totalLabel: "Necessidade mensal total",
  },
  documentacao: {
    eyebrow: "Documentação",
    title: "Antes de doar, confira quem está por trás da campanha",
    lead: "Transparência também significa facilitar o acesso às informações da organização.",
  },
  faq: {
    eyebrow: "Dúvidas comuns",
    title: "Dúvidas antes de doar?",
  },
  final: {
    title: "O próximo pote cheio pode começar com você.",
    text: "São centenas de animais dependendo de pessoas que decidiram não virar as costas para eles. Sua contribuição ajuda esses protetores a continuar oferecendo alimento, cuidado e segurança todos os dias.",
    ctaPrimary: "Quero ajudar agora",
    ctaSecondary: "Tenho uma dúvida antes de doar",
    seal: "Doação segura · CNPJ verificável · Atendimento direto com a equipe",
  },
  footerAbout:
    "Uma rede de apoio a abrigos e protetores independentes que transforma doações em alimentação, tratamento e estrutura para animais resgatados.",
};

/** Copy da primeira dobra. */
export const heroCopy = {
  headline: "Cinco abrigos estão no limite.",
  headlineAccent: "Mais de 400 animais precisam comer todos os dias.",
  // Curta de propósito: é a primeira dobra e ela precisa fechar em uma tela.
  // Cada linha a mais aqui é altura que sai do vídeo, que é o que converte.
  subheadline:
    "Sustentamos uma rede de protetores que cuida de centenas de cães e gatos resgatados. A necessidade mais urgente é simples: manter os potes cheios até o fim do mês.",
  ctaPrimary: "Quero ajudar agora",
  ctaSecondary: "Ver como minha doação ajuda",
  seal: "Doação segura · Organização com CNPJ verificável",
};

/**
 * ⚠️ NÚMEROS DE EXEMPLO — TROCAR ANTES DE PUBLICAR ⚠️
 *
 * Barra de meta da campanha. Estes valores são placeholders: publicar total
 * arrecadado falso numa página de doação engana quem doa. Ligue na fonte real
 * (gateway, planilha, API) antes de subir.
 *
 * Não tem número confiável ainda? Troque por `export const campaign = null` —
 * a barra some sozinha e o resto da dobra continua funcionando.
 */
export const campaign: {
  raisedCents: number;
  goalCents: number;
  supporters: number;
  isMock: boolean;
} | null = {
  raisedCents: 1_850_000,
  /* Meta da campanha: R$ 58.000, a mesma cifra que o vídeo fala e a
     mesma soma de `monthlyCosts` abaixo. A porcentagem da barra é calculada
     de `raisedCents / goalCents` em `CampaignProgress` — mudar a meta aqui
     reajusta a barra sozinha, sem porcentagem escrita em componente. */
  goalCents: 5_800_000,
  supporters: 236,
  isMock: true,
};

/**
 * Vídeo do hero — ainda sem arquivo. `url` vazio mantém o card só como
 * espaço reservado (poster + selo de play); preenchendo `url`, o player
 * entra no lugar do poster.
 */
export const heroVideo: {
  vturb: {
    playerId: string;
    scriptSrc: string;
    smartplayerSrc: string;
    streamSrc: string;
    ratio: number;
  } | null;
  url: string;
  poster: { src: string; alt: string };
  label: string;
  aspect: string;
} = {
  /**
   * O mesmo VSL da v2 — as duas versões mostram o vídeo da campanha; o que
   * muda entre elas é o resto da página. Trocar o vídeo exige trocar aqui
   * **e** em `content/landing.ts`: são dois arquivos de conteúdo separados de
   * propósito, para uma versão não alterar a outra.
   *
   * Cada campo sai do bloco de embed que o VTurb entrega: `playerId` é o `id`
   * do `<vturb-smartplayer>`, `scriptSrc` é o `player.js` do fim do bloco,
   * `smartplayerSrc` e `streamSrc` são os dois `<link rel="preload">`, e
   * `ratio` é o número do `padding` do placeholder, sem o "%".
   */
  vturb: {
    playerId: "vid-6a1233c6c05df7ec67bf26c9",
    scriptSrc:
      "https://scripts.converteai.net/25b0cdcd-2b93-4910-aa45-91b9a6275957/players/6a1233c6c05df7ec67bf26c9/v4/player.js",
    smartplayerSrc:
      "https://scripts.converteai.net/lib/js/smartplayer-wc/v4/smartplayer.js",
    streamSrc:
      "https://cdn.converteai.net/25b0cdcd-2b93-4910-aa45-91b9a6275957/6a1233bf87b3af3be2d2ae07/main.m3u8",
    ratio: 78.14761215629522,
  },
  url: "",
  poster: {
    src: "/sos-animal/abrigo-patio-caes.webp",
    alt: "Cuidadora cercada por dezenas de cães resgatados no pátio de terra do abrigo",
  },
  label: "Veja como sua doação vira ração",
  /**
   * Formato do vídeo, em `largura / altura`. O vídeo da campanha é quadrado
   * (1/1). Trocando para "9 / 16" ou "16 / 9" o slot inteiro se reajusta
   * sozinho — a altura vem da janela e a largura sai daqui.
   */
  aspect: "1 / 1",
};

/**
 * Tiers de ração — valores de referência, fáceis de ajustar. `popular`
 * marca o cartão em destaque ("mais escolhido"). `image` é a foto do saco de
 * ração daquele tier — `null` deixa o cartão com um slot reservado (sem
 * inventar imagem) até existir a foto real de cada produto.
 */
export const rationTiers = [
  {
    id: "5kg",
    kg: 5,
    priceCents: 3379,
    animals: 5,
    days: 3,
    popular: false,
    image: null as { src: string; alt: string } | null,
  },
  {
    id: "10kg",
    kg: 10,
    priceCents: 6490,
    animals: 7,
    days: 5,
    popular: false,
    image: null as { src: string; alt: string } | null,
  },
  {
    id: "15kg",
    kg: 15,
    priceCents: 9145,
    animals: 9,
    days: 6,
    popular: true,
    image: null as { src: string; alt: string } | null,
  },
  {
    id: "30kg",
    kg: 30,
    priceCents: 17732,
    animals: 15,
    days: 8,
    popular: false,
    image: null as { src: string; alt: string } | null,
  },
  {
    id: "75kg",
    kg: 75,
    priceCents: 41675,
    animals: 28,
    days: 12,
    popular: false,
    image: null as { src: string; alt: string } | null,
  },
  {
    id: "150kg",
    kg: 150,
    priceCents: 74290,
    animals: 45,
    days: 18,
    popular: false,
    image: null as { src: string; alt: string } | null,
  },
] as const;

/**
 * ⚠️ CONFERIR ANTES DE PUBLICAR ⚠️
 *
 * Chave Pix da campanha. Errar aqui manda o dinheiro de quem doa para a conta
 * errada — é o único dado desta página que não dá para corrigir depois.
 */
export const pix = {
  key: org.cnpj,
  keyType: "CNPJ",
  receiver: "SOS Animal Help",
};

/**
 * Prova rápida de confiança — faixa escaneável logo depois da arrecadação.
 * Só afirmações que a própria página sustenta: o CNPJ está no documento, o
 * WhatsApp e o Pix existem, e a quebra de custos está na transparência.
 */
export const trustStrip = {
  title: "Sua ajuda chega onde é necessária.",
  items: [
    { icon: "shield", label: "CNPJ verificável" },
    { icon: "file", label: "Prestação de contas" },
    { icon: "whatsapp", label: "Atendimento no WhatsApp" },
    { icon: "pix", label: "Doação via Pix" },
    { icon: "bowl", label: "Valor convertido em ração e cuidado" },
  ],
};

/** O contraste que dá urgência: o que acontece sem apoio, e com você. */
export const impactCompare = {
  title: "O que está em jogo todos os dias",
  intro:
    "Quando um abrigo cuida de dezenas de animais ao mesmo tempo, faltar recurso não significa adiar uma compra. Significa escolher qual necessidade será atendida primeiro.",
  withoutTitle: "Sem apoio suficiente",
  without: [
    "A ração pode acabar antes do próximo ciclo de compras.",
    "Consultas e tratamentos precisam ser adiados.",
    "Protetores ficam sem espaço para receber novos resgates.",
    "Toda a estrutura do abrigo fica mais vulnerável.",
  ],
  withTitle: "Com a sua ajuda",
  with: [
    "Os potes continuam cheios.",
    "Tratamentos podem acontecer no momento certo.",
    "Os abrigos conseguem continuar recebendo animais.",
    "Os protetores ganham estrutura para continuar salvando vidas.",
  ],
  closing:
    "Uma doação não resolve apenas uma conta. Ela mantém toda essa rede funcionando por mais um dia.",
};

/**
 * ⚠️ VALORES DE EXEMPLO — TROCAR PELOS CUSTOS REAIS ⚠️
 *
 * Quebra de custos mensais da rede. O total é somado a partir dos itens, então
 * ele nunca fica fora de sincronia com a lista. Idealmente bate com a meta da
 * campanha (`campaign.goalCents`).
 */
export const monthlyCosts = {
  isMock: true,
  items: [
    { label: "Ração para os animais", cents: 2_300_000, dot: "bg-action" },
    { label: "Consultas e cirurgias", cents: 1_500_000, dot: "bg-warning" },
    { label: "Estrutura e aluguel dos abrigos", cents: 1_000_000, dot: "bg-donate" },
    { label: "Medicamentos", cents: 600_000, dot: "bg-progress" },
    { label: "Luz, água e manutenção", cents: 400_000, dot: "bg-ink-300" },
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

export const faq = [
  {
    q: "A SOS Animal Help é uma organização registrada?",
    a: "Sim. O CNPJ 63.153.881/0001-09 é público e pode ser conferido no site da Receita Federal. O cartão CNPJ emitido pela Receita fica disponível nesta própria página, na seção de transparência.",
  },
  {
    q: "Minha doação vai para um abrigo específico?",
    a: "Não. A contribuição entra na rede de apoio aos abrigos parceiros, e a equipe direciona o recurso conforme a necessidade de cada um no mês — priorizando quem está mais apertado. Se você quiser destinar a doação a um projeto específico, fale com a equipe pelo WhatsApp antes de doar.",
  },
  {
    q: "Como sei que minha doação virou ração ou atendimento?",
    a: "A quebra dos custos mensais da rede está publicada nesta página, e a equipe responde pelo WhatsApp e por e-mail sobre a aplicação dos recursos. Para pedir detalhes de um repasse específico, é só entrar em contato pelos canais oficiais.",
    // TODO: quando houver um relatório periódico publicado (link, PDF ou
    // página), citá-lo aqui e apontar o link — é o que fecha esta resposta.
  },
  {
    q: "Posso doar um valor diferente das opções?",
    a: "Pode. As faixas de ração são uma referência para visualizar o impacto, mas qualquer valor ajuda. Use o Pix com a chave desta página ou fale com a equipe pelo WhatsApp para combinar o valor.",
  },
  {
    q: "Posso ajudar todos os meses?",
    a: "Sim. A doação recorrente é combinada diretamente com a equipe pelo WhatsApp — hoje ela não é automatizada por esta página, então o contato é o caminho para organizar a contribuição mensal.",
  },
  {
    q: "Como posso falar com a equipe?",
    a: "Pelo WhatsApp (85) 99763-4409 ou pelo e-mail support@sosanimalhelp.org. Os dois canais servem para dúvidas, prestação de contas e parcerias.",
  },
] as const;

/**
 * Avaliação do Google — DESATIVADA porque não há dado confirmado.
 *
 * Exibir nota e número de avaliações inventados numa página de doação é
 * enganar quem doa, então o card não é renderizado enquanto `enabled` for
 * `false`. Para ativar: confirme os números reais, preencha `rating` e
 * `reviewCount`, aponte `href` para o perfil no Google e vire `enabled` para
 * `true` — o card volta sozinho, sem mexer em componente.
 */
export const googleReviews = {
  enabled: false,
  rating: 0,
  reviewCount: 0,
  href: "",
};

/**
 * Três histórias curtas sobre as fotos reais do acervo.
 *
 * O `alt` descreve a foto para quem usa leitor de tela; o título e o texto são
 * a narrativa visível. São coisas diferentes de propósito — legenda não é
 * texto alternativo.
 *
 * TODO: se a organização confirmar o nome e a história real de cada animal,
 * trocar por elas. Estes textos descrevem o que a foto mostra, sem atribuir
 * fatos que não temos como confirmar.
 */
export const stories = [
  {
    image: {
      src: "/sos-animal/voluntario-cao-colo.webp",
      alt: "Protetor da SOS Animal Help com um cão resgatado apoiado no ombro",
    },
    title: "Ele chegou sem confiar em ninguém.",
    text: "Hoje procura colo sempre que alguém se aproxima.",
  },
  {
    image: {
      src: "/sos-animal/voluntarias-filhote-resgatado.webp",
      alt: "Duas voluntárias segurando um filhote recém-resgatado",
    },
    title: "Da rua para um lugar seguro.",
    text: "Um filhote acolhido, alimentado e cuidado enquanto espera por uma família.",
  },
  {
    image: {
      src: "/sos-animal/abrigo-patio-caes.webp",
      alt: "Dezenas de cães resgatados no pátio de terra do abrigo",
    },
    title: "Um pote parece pouco até você multiplicá-lo por centenas.",
    text: "São animais diferentes, histórias diferentes e uma necessidade que se repete todos os dias: comida.",
  },
] as const;

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
