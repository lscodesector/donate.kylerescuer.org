/**
 * Toda a informação editável desta página vive aqui: valores, kg, impacto,
 * abrigos, animais para adoção, contatos. Trocar uma campanha é trocar este
 * arquivo — nenhum componente precisa mudar.
 */

/**
 * Âncora da seção de ração.
 *
 * É o destino de **todo** CTA de doação da página — cabeçalho, hero, impacto,
 * barra fixa e fechamento. A decisão é deliberada: a doação desta página é
 * ração, e ração se escolhe por faixa de kg, não por um valor digitado num
 * modal. A única exceção é o botão de doação mensal (ver `MonthlyDonateButton`).
 */
export const RACAO_HREF = "#racao";

/** Âncora do bloco de doação mensal, dentro da seção de ração. */
export const MENSAL_HREF = "#mensal";

/** Endereço do checkout interno de uma faixa de ração. */
export function checkoutHref(tierId: string) {
  return `/doar/${tierId}`;
}

/**
 * Checkout de valor livre: o modal manda o valor em centavos pela URL, porque
 * ele não é uma faixa fixa de ração e não tem `id` próprio. `freq=mensal`
 * marca a intenção de recorrência (ver aviso no checkout).
 */
export function checkoutValorHref(cents: number, mensal = false) {
  const freq = mensal ? "&freq=mensal" : "";
  return `/doar/valor?cents=${cents}${freq}`;
}

/**
 * Valores do modal de doação mensal, em centavos. `popular` destaca um cartão.
 *
 * A faixa é mais baixa que a das doações avulsas de propósito: o que sustenta
 * a compra de ração é o valor se repetir todo mês, não ser alto uma vez.
 */
export const donationAmounts = [
  { cents: 2000, popular: false },
  { cents: 3000, popular: true },
  { cents: 5000, popular: false },
  { cents: 10000, popular: false },
  { cents: 15000, popular: false },
  { cents: 25000, popular: false },
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
};

export const whatsappHref = `https://wa.me/${org.whatsapp}?text=${encodeURIComponent(org.whatsappMessage)}`;

/** Monta um link de WhatsApp com mensagem própria. */
export function whatsappWith(message: string) {
  return `https://wa.me/${org.whatsapp}?text=${encodeURIComponent(message)}`;
}

/**
 * Doação recorrente pelo WhatsApp — usada só depois da doação (página de
 * obrigado). Na landing, quem quer ajudar todo mês usa o modal mensal, que
 * gera o Pix na hora; mandar para o WhatsApp ali seria trocar um caminho que
 * funciona por um que depende de alguém responder.
 */
export const recurringHref = whatsappWith(
  "Olá! Quero ajudar a SOS Animal Help com ração todo mês. Como faço?",
);

/**
 * ⚠️ CONFERIR ANTES DE PUBLICAR ⚠️
 *
 * Números de impacto da rede. Eles substituíram a barra de meta em reais que
 * ficava no hero: uma página que pede ração não precisa publicar quanto já
 * arrecadou — precisa mostrar quantos animais dependem daquilo. Se um destes
 * números não puder ser sustentado, tire o item da lista em vez de arredondar.
 *
 * `value` é número, e não texto, porque ele é contado do zero na tela (ver
 * `CountUp`). O que não é número vive em `prefix`/`suffix`: o "+" de "+400" e
 * o "t" de "+20t" são rótulo, e animá-los daria "2t, 7t, 13t…".
 */
export const impactNumbers = [
  {
    prefix: "+",
    value: 400,
    suffix: "",
    label: "vidas acolhidas",
    note: "Animais nos abrigos que apoiamos.",
  },
  {
    prefix: "",
    value: 5,
    suffix: "",
    label: "abrigos apoiados",
    note: "Em diferentes estados do Brasil.",
  },
  {
    prefix: "+",
    value: 20,
    suffix: "t",
    label: "de ração distribuída",
    note: "Entregues direto nos abrigos.",
  },
  {
    prefix: "+",
    value: 180,
    suffix: "",
    label: "castrações custeadas",
    note: "Cirurgias pagas pela rede.",
  },
] as const;

/** Copy das seções, para o texto não ficar espalhado pelos componentes. */
export const copy = {
  abrigos: {
    eyebrow: "Quem recebe",
    title: "Os abrigos que recebem a ração",
    lead: "A ração não fica com a gente. Ela é entregue nos abrigos que já estão com os animais na mão — cada um com nome, endereço e perfil aberto para você conferir.",
    /* Único botão do card, e o rótulo que o leitor de tela anuncia no lugar
       dele ("Saiba mais sobre Siulsan Resgate"). O card não tem mais link de
       Instagram nem de doação: os dois estão dentro da ficha. */
    ctaProfile: "Saiba mais",
    /* Botões da ficha. O de doar continua apontando para a seção de ração —
       a doação é para a rede, não para aquele abrigo. */
    ctaShelter: "Doar ração",
    ctaInstagram: "Ver o dia a dia no Instagram",
    /* Manda para o WhatsApp da equipe com o nome do abrigo já na mensagem.
       Aparece sempre: mesmo com a ficha completa, "falar com alguém sobre
       este abrigo" é uma pergunta que os campos não respondem. */
    ctaWhatsapp: "Pedir os dados no WhatsApp",
    /* Já a explicação só aparece enquanto a ficha estiver sem CNPJ e sem
       endereço — ver `ShelterProfile`. Dizer que o dado ainda não está
       publicado é melhor do que a pessoa achar que a página está escondendo. */
    profileEmpty:
      "Os dados cadastrais completos deste abrigo ainda não estão publicados aqui. Se quiser conferir antes de doar, é só pedir para a equipe.",
  },
  adocao: {
    eyebrow: "Adoção",
    title: "Adote um deles",
    lead: "Alguns dos cães que estão nesses abrigos, publicados no app da Lusa. Dá para conhecer cada um e levar um para casa — enquanto isso não acontece, é a ração que os mantém de pé.",
  },
  racao: {
    eyebrow: "Doe ração",
    title: "Escolha quantos quilos você quer entregar",
    lead: "Cada faixa é um saco de ração que sai daqui e chega no abrigo. Você escolhe o tamanho; a gente mostra quantos animais aquilo alimenta e por quantos dias.",
  },
  mensal: {
    title: "Quer garantir a ração todo mês?",
    text: "Doação avulsa resolve a semana. Doação mensal é o que permite planejar: sabendo com quanto contar, os abrigos compram ração em quantidade e nenhum animal fica esperando o próximo mutirão.",
    cta: "Quero ajudar todo mês",
  },
  pix: {
    eyebrow: "Pix direto",
    title: "Prefere doar direto pelo Pix?",
    text: "Você pode contribuir com a ração diretamente para a SOS Animal Help pelo aplicativo do seu banco, no valor que quiser.",
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
    /* `<caption>` da tabela de custos, só para leitor de tela — na tela quem
       dá esse contexto é a linha de apoio acima. Sem ela, quem navega por
       tabelas ouve cinco valores sem saber de que conta eles são. */
    costsCaption:
      "Custos mensais da rede de abrigos apoiada pela SOS Animal Help",
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
    text: "São mais de 400 animais em cinco abrigos que dependem de gente que decidiu não virar as costas. Um saco de ração é a diferença entre um abrigo passar a semana tranquilo e um protetor ter que escolher quem come hoje.",
    ctaPrimary: "Quero doar ração",
    ctaSecondary: "Tenho uma dúvida antes de doar",
    seal: "Doação segura · CNPJ verificável · Atendimento direto com a equipe",
  },
  footerAbout:
    "Uma rede de apoio a cinco abrigos em diferentes estados do Brasil. O que entra aqui vira ração entregue direto para quem já está cuidando dos animais.",
};

/**
 * Copy da primeira dobra.
 *
 * `headline` e `headlineAccent` são lidos como **uma frase só** — o componente
 * junta os dois com um espaço e pinta o segundo de vermelho. Escreva pensando
 * nisso: "Mais de 400 animais precisam comer todo santo dia."
 *
 * A versão anterior era "Cinco abrigos, mais de 400 animais. A ração precisa
 * chegar todo mês." Duas frases sem verbo na primeira, começando pela estrutura
 * da organização (quantos abrigos ela tem) em vez de por quem está com fome. E
 * "precisa chegar" não diz quem faz chegar. Agora a frase tem sujeito, verbo e
 * urgência, e os cinco abrigos desceram para a linha de apoio — que é onde
 * cabe explicar a operação.
 */
export const heroCopy = {
  headline: "Mais de 400 animais precisam comer",
  headlineAccent: "todo santo dia.",
  // Curta de propósito: é a primeira dobra e ela precisa fechar em uma tela.
  // Cada linha a mais aqui é altura que sai do vídeo, que é o que converte.
  subheadline:
    "A SOS Animal Help leva ração para cinco abrigos em diferentes estados do Brasil. Você escolhe quantos quilos quer mandar.",
  ctaPrimary: "Quero doar ração",
  ctaSecondary: "Conheça os abrigos",
  seal: "Doação segura · Organização com CNPJ verificado",
};

/**
 * Vídeo do hero, em três estados, nesta ordem de precedência:
 *
 *   1. `vturb` preenchido → o player do VTurb (o VSL da campanha)
 *   2. `vturb: null` e `url` preenchida → um `<video>` comum
 *   3. os dois vazios → só o poster com o selo de play
 *
 * Para tirar o vídeo do ar sem apagar nada, basta `vturb: null`: a dobra volta
 * para o poster sozinha, sem mexer em componente.
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
   * O embed do VTurb, campo a campo. Ao trocar o vídeo da campanha, o VTurb
   * entrega um bloco de HTML novo — é de lá que saem estes valores:
   *
   *   playerId       o `id` do `<vturb-smartplayer>` ("vid-…")
   *   scriptSrc      o `player.js` da conta, no fim do bloco
   *   smartplayerSrc o `smartplayer.js` do `<link rel="preload">`
   *   streamSrc      o `main.m3u8` do `<link rel="preload" as="fetch">`
   *   ratio          o número do `padding` do placeholder, sem o "%"
   *
   * `ratio` é a altura do vídeo em porcentagem da largura (78.14 ≈ um formato
   * levemente deitado). Ele governa duas coisas ao mesmo tempo: o espaço que
   * o placeholder reserva e o `aspect-ratio` do slot no hero — por isso é um
   * número só, e não dois valores que podem sair de sincronia.
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
   * Formato do player, em `largura / altura` — o mesmo valor que o VSL do
   * VTurb estiver usando. Trocar esta linha reajusta o slot inteiro sozinho.
   *
   * "1 / 1" (quadrado) é o que melhor preenche esta dobra. A conta: a dobra
   * tem altura travada em uma tela, e o que sobra para o vídeo depois do
   * texto e dos botões é ~510px num celular de 844px e ~560px num notebook de
   * 900px. Como o player é dimensionado pela largura, um quadrado dá ~390px de
   * altura no celular e ~556px no notebook — praticamente a sobra inteira.
   *
   * "16 / 9" também funciona e é o outro padrão de VSL, mas com a mesma
   * largura ele rende só ~219px de altura no celular: sobra um vão grande
   * entre o vídeo e o botão. Vale se o vídeo da campanha for deitado mesmo —
   * é melhor ter espaço vazio do que o vídeo cortado.
   *
   * ⚠️ Formato em pé ("9 / 16") **não** cabe nesta dobra: mais alto que largo,
   * ele bate no teto de altura e é aparado. Se a campanha for de vídeo
   * vertical, o hero precisa de outro layout — vídeo ao lado do texto, não
   * embaixo dele.
   */
  aspect: "1 / 1",
};

/**
 * Ficha de um abrigo — o que abre quando a pessoa clica no card.
 *
 * ⚠️ **Todo campo aqui é opcional e o que estiver vazio não aparece na tela.**
 * Preencha só o que der para comprovar. Protetor pequeno muitas vezes não tem
 * CNPJ e trabalha da própria casa: deixar o campo em branco é a resposta certa
 * nesse caso — publicar número ou endereço inventado numa página que pede
 * doação é o tipo de erro que não se conserta depois.
 *
 * Enquanto `cnpj` e `address` estiverem vazios, a ficha mostra sozinha um aviso
 * de que os dados cadastrais ainda não estão publicados, com o WhatsApp da
 * equipe para quem quiser pedir. O aviso some quando os dois forem preenchidos.
 */
export type ShelterProfile = {
  /** Quem responde pelo abrigo — nome da pessoa ou da ONG. */
  responsible?: string;
  /** Só se o abrigo tiver CNPJ próprio. O da rede está em `org.cnpj`. */
  cnpj?: string;
  /**
   * Endereço exato, no mesmo formato de `org.address` — rua **com número**,
   * complemento, cidade/UF e CEP. A ficha monta as linhas com o que existir e
   * pula o que faltar; com tudo vazio, ela cai para a cidade/estado do card.
   *
   * "Tatuí, SP" aqui não serve: isso o card já mostra. O que esta linha
   * acrescenta é o lugar onde a ração é entregue de fato.
   */
  address?: {
    /** Rua e número: "Rua das Acácias, 187". */
    line1?: string;
    /** Complemento e bairro: "Fundos — Jardim Santa Cruz". */
    line2?: string;
    /** Cidade e UF: "Tatuí – SP". */
    city?: string;
    /** CEP: "18270-000". */
    zip?: string;
  };
  /** Link do Google Maps. Sem ele o endereço aparece como texto simples. */
  mapsHref?: string;
  /** Quantos animais o abrigo mantém hoje, por extenso: "90 cães e gatos". */
  animals?: string;
  /** Ano ou tempo de atuação: "2008", "mais de 20 anos". */
  since?: string;
  /** Um ou dois parágrafos sobre o trabalho. Vazio cai para `description`. */
  about?: string;
};

export type Shelter = {
  id: string;
  name: string;
  /** Cidade e estado — é o que aparece no card, ao lado do alfinete. */
  location: string;
  /** Uma linha, a que resume o abrigo no card. */
  description: string;
  instagram: string;
  instagramHref: string;
  image: { src: string; alt: string };
  profile: ShelterProfile;
};

/**
 * Os abrigos que recebem a ração.
 *
 * O card mostra o essencial — foto, nome, cidade e uma linha — e um botão só,
 * "Saiba mais", que abre a ficha. Instagram, endereço, CNPJ e o WhatsApp da
 * equipe ficam **dentro** da ficha: no card eles competiam com o botão e
 * tiravam a pessoa da página antes de ela saber quem era o abrigo.
 *
 * `instagram` e `instagramHref` continuam aqui porque a ficha e o rodapé usam
 * os dois — o que saiu foi o link no card, não o dado.
 */
export const shelters: Shelter[] = [
  {
    id: "siulsan-resgate",
    name: "Siulsan Resgate",
    location: "Tatuí, São Paulo",
    description: "Mais de 20 anos resgatando cães e gatos.",
    instagram: "@siulsanresgate",
    instagramHref: "https://www.instagram.com/siulsanresgate/",
    image: {
      src: "/sos-animal/protetora-caes-acolhimento.webp",
      alt: "Protetora agachada, cercada por cães resgatados que se aproximam dela",
    },
    profile: {
      responsible: "",
      cnpj: "",
      address: { line1: "", line2: "", city: "", zip: "" },
      mapsHref: "",
      animals: "",
      since: "mais de 20 anos",
      about: "",
    },
  },
  {
    id: "abrigo-salve-cao",
    name: "Abrigo Salve Cão",
    location: "Floresta Azul, Bahia",
    description: "Mais de 90 cães e gatos abrigados e protegidos.",
    instagram: "@abrigosalvecao",
    instagramHref: "https://www.instagram.com/abrigosalvecao/",
    image: {
      src: "/sos-animal/canil-voluntario-caes.webp",
      alt: "Voluntário agachado no canil, com dois cães no colo e outros ao redor das casinhas de concreto",
    },
    profile: {
      responsible: "",
      cnpj: "",
      address: { line1: "", line2: "", city: "", zip: "" },
      mapsHref: "",
      animals: "mais de 90 cães e gatos",
      since: "",
      about: "",
    },
  },
  {
    id: "sos-joana-darc",
    name: "SOS Joana Darc",
    location: "Santa Luzia, Minas Gerais",
    description: "Mais de 90 cães e gatos acolhidos.",
    instagram: "@sosjoanadarc",
    instagramHref: "https://www.instagram.com/sosjoanadarc/",
    image: {
      src: "/sos-animal/protetora-cao-carinho.webp",
      alt: "Protetora recebendo o carinho de um cão resgatado na área externa do abrigo",
    },
    profile: {
      responsible: "",
      cnpj: "",
      address: { line1: "", line2: "", city: "", zip: "" },
      mapsHref: "",
      animals: "mais de 90 cães e gatos",
      since: "",
      about: "",
    },
  },
  {
    id: "milena-e-fernanda",
    name: "Milena e Fernanda",
    location: "Tambaú, São Paulo",
    description: "Desde 2008 salvando vidas animais.",
    instagram: "@milenaefernanda.ong",
    instagramHref: "https://www.instagram.com/milenaefernanda.ong/",
    image: {
      src: "/sos-animal/voluntario-tres-caes.webp",
      alt: "Protetor sentado no chão com três cães resgatados ao seu redor",
    },
    profile: {
      responsible: "",
      cnpj: "",
      address: { line1: "", line2: "", city: "", zip: "" },
      mapsHref: "",
      animals: "",
      since: "2008",
      about: "",
    },
  },
];

/**
 * Adoção — os animais publicados no app da Lusa.
 *
 * `appHref` é o **único** destino dos cards: um link só para a publicação da
 * SOS Animal Help no app. Quando existir link por animal, preencha o `href`
 * daquele bicho e ele passa a mandar para a página dele — o `appHref` continua
 * valendo para todos os outros, sem mexer em componente.
 *
 * **Bicho sem foto entra assim mesmo**, com uma moldura de patinha no lugar da
 * imagem: nome, idade e abrigo são o que a pessoa lê primeiro, e o card já vale
 * sem ela. O que não pode acontecer é pôr a foto de outro animal para tapar o
 * buraco — foto trocada em card de adoção é o erro que não dá para consertar
 * depois. Para ativar a foto real, jogue o arquivo em
 * `/public/sos-animal/adocao/` e preencha `image`.
 */
export const adoption = {
  appHref: "https://doar.lusapayments.app/p/6a2c6d5ca9a2eccd93a3378b",
  cta: "Ver mais no Lusa App",
  animals: [
    {
      id: "costelinha",
      name: "Costelinha",
      age: "5 anos",
      weight: "9 kg",
      breed: "SRD",
      shelter: "SOS Animal Help",
      urgent: true,
    },
    {
      id: "logan",
      name: "Logan",
      age: "6 anos",
      weight: "8 kg",
      breed: "SRD",
      shelter: "SOS Animal Help",
      urgent: true,
    },
    {
      id: "trafi",
      name: "Tráfi",
      age: "10 anos",
      weight: "9 kg",
      breed: "SRD",
      shelter: "Casa da Mili",
      urgent: false,
    },
    {
      id: "lila",
      name: "Líla",
      age: "5 meses",
      weight: "2 kg",
      breed: "SRD",
      shelter: "Abrigo Salve Cão",
      urgent: false,
    },
    {
      id: "joel",
      name: "Joel",
      age: "3 anos",
      weight: "12 kg",
      breed: "SRD",
      shelter: "SOS Joana Darc",
      urgent: false,
    },
    {
      id: "velentina",
      name: "Velentina",
      age: "2 anos",
      weight: "7 kg",
      breed: "SRD",
      shelter: "SOS Animal Help",
      urgent: false,
    },
    {
      id: "connor",
      name: "Connor",
      age: "5 anos",
      weight: "25 kg",
      breed: "SRD",
      shelter: "Siulsan Resgate Animal",
      urgent: false,
    },
    {
      id: "maria",
      name: "Maria",
      age: "6 anos",
      weight: "12 kg",
      breed: "SRD",
      shelter: "Casa da Mili",
      urgent: false,
    },
    {
      id: "oliver",
      name: "Oliver",
      age: "14 anos",
      weight: "15 kg",
      breed: "SRD",
      shelter: "SOS Animal Help",
      urgent: false,
    },
    {
      id: "trigemeos",
      name: "Trigêmeos",
      age: "3 meses",
      weight: "0,5 kg",
      breed: "SRD",
      shelter: "SOS Joana Darc",
      urgent: false,
    },
  ].map((a) => ({
    ...a,
    image: null as { src: string; alt: string } | null,
    href: null as string | null,
  })),
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
 * Prova rápida de confiança — faixa escaneável logo depois do hero.
 * Só afirmações que a própria página sustenta: o CNPJ está no documento, os
 * abrigos estão listados com Instagram, o WhatsApp e o Pix existem.
 */
export const trustStrip = {
  title: "Da sua doação até o pote, sem escala.",
  items: [
    { icon: "shield", label: "CNPJ verificável" },
    { icon: "home", label: "5 abrigos identificados" },
    { icon: "bowl", label: "Ração entregue no abrigo" },
    { icon: "pix", label: "Doação via Pix" },
    { icon: "whatsapp", label: "Atendimento no WhatsApp" },
  ],
};

/** O contraste que dá urgência: o que acontece sem ração, e com você. */
export const impactCompare = {
  title: "O que muda quando a ração chega",
  intro:
    "Num abrigo com dezenas de animais, ração acabando não é uma compra adiada. É um protetor decidindo quem come a porção inteira hoje.",
  withoutTitle: "Quando a ração falta",
  without: [
    "A porção de cada animal é reduzida para o saco durar mais.",
    "O protetor tira do próprio bolso ou pede fiado no mercado.",
    "Filhotes e animais doentes, que precisam comer mais, são os primeiros a sentir.",
    "Novos resgates precisam ser recusados por falta de comida.",
  ],
  withTitle: "Quando a ração chega",
  with: [
    "Todo animal come a porção certa, todos os dias.",
    "O protetor volta a usar o dinheiro dele em remédio e veterinário.",
    "Filhote e animal em recuperação recebem o reforço que precisam.",
    "O abrigo tem folga para acolher o próximo resgate.",
  ],
  closing:
    "Um saco de ração não alimenta um animal. Alimenta o abrigo inteiro por alguns dias — e é isso que se compra aqui.",
};

/**
 * ⚠️ VALORES DE EXEMPLO — TROCAR PELOS CUSTOS REAIS ANTES DE PUBLICAR ⚠️
 *
 * Quebra de custos mensais da rede, em reais. `isMock` marca que os números
 * ainda são de exemplo: enquanto ele for `true`, a seção está publicando uma
 * necessidade mensal de R$ 60.000 que ninguém sustenta com planilha.
 *
 * O total é somado a partir dos itens (`monthlyCostsTotal`), então a linha
 * final nunca fica fora de sincronia com a lista.
 *
 * Esta lista já esteve fora da v2, trocada por uma divisão em porcentagem — o
 * argumento era que total em reais envelhece e precisa de manutenção, enquanto
 * proporção é estável. Voltou por decisão de campanha: o valor em reais é o que
 * dá tamanho ao problema ("faltam R$ 60 mil por mês"), e é o que a v1 usava. O
 * preço é este comentário: **número em reais só continua verdadeiro se alguém
 * revisar.** A versão em porcentagem está em `components/v1` do histórico
 * (`git log -S allocation`) se um dia valer a pena voltar.
 */
export const monthlyCosts = {
  isMock: true,
  items: [
    { label: "Ração para os animais", cents: 2_400_000, dot: "bg-action" },
    { label: "Consultas e cirurgias", cents: 1_600_000, dot: "bg-warning" },
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
    a: "Sim. O CNPJ 63.153.881/0001-09 é público e pode ser conferido no site da Receita Federal. O cartão CNPJ emitido pela Receita fica disponível nesta própria página, na seção de documentação.",
  },
  {
    q: "Quais abrigos recebem a ração?",
    a: "Cinco abrigos em diferentes estados do Brasil. Quatro deles estão listados nesta página com cidade, estado e o Instagram do próprio abrigo — dá para abrir o perfil e conferir o trabalho antes de doar.",
  },
  {
    q: "Posso escolher para qual abrigo vai a minha ração?",
    a: "Por aqui, não. A doação entra na rede e a equipe direciona a ração conforme a necessidade de cada abrigo no mês, priorizando quem está mais apertado. Se você quiser destinar a um abrigo específico, fale com a equipe pelo WhatsApp antes de doar.",
  },
  {
    q: "Como sei que a ração realmente chegou?",
    a: "As entregas são registradas e publicadas nos perfis dos abrigos e da SOS Animal Help. Para pedir o comprovante de uma entrega específica, é só falar com a equipe pelo WhatsApp ou por e-mail.",
  },
  {
    q: "Posso doar um valor diferente das faixas de ração?",
    a: "Pode. As faixas de kg existem para você enxergar o impacto, mas qualquer valor ajuda: use o Pix com a chave desta página, no valor que quiser.",
  },
  {
    q: "Como funciona a doação mensal?",
    a: "Na seção de ração há o botão “Quero ajudar todo mês”: você escolhe o valor e recebe o Pix na hora. Esse primeiro Pix cobre o primeiro mês — a cobrança ainda não é automática, então a equipe combina os meses seguintes com você pelo WhatsApp.",
  },
  {
    q: "Posso adotar um dos animais?",
    /* Sem "na seção Adote um deles": essa seção saiu da página (ver
       `app/v2/page.tsx`). O caminho agora é o app, e o link está no rodapé. */
    a: "Pode. Os animais dos abrigos que apoiamos ficam publicados no app da Lusa, com as informações de cada um — idade, peso e em que abrigo estão. O link “Adotar um animal”, no rodapé desta página, abre a lista direto no app.",
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

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
