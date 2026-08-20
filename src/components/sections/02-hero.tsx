"use client";

import NextImage, { type ImageProps } from "next/image";
import Script from "next/script";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from "react";
import { prefetchDNS, preload } from "react-dom";
import { withBasePath } from "@/lib/base-path";
import {
  getCampaignServerSnapshot,
  getCampaignSnapshot,
  subscribeCampaign,
} from "@/lib/campaign";
import { DOAR_HREF } from "@/lib/config";
import { formatBRL } from "@/lib/format";
import { openDonationModal } from "@/lib/modais";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  02 · HERO - a primeira dobra                                         ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado: o texto da dobra, o embed do VSL, as fotos da história, o
 * slide, a barra de meta, o rastro de patinhas e os ícones moram todos aqui.
 * De fora entram só `lib/` - `basePath`, os números da campanha, a âncora de
 * doação e o gatilho do modal.
 *
 * ⚠️ O arquivo é `"use client"` inteiro, porque os pedaços interativos moram
 * dentro dele. Antes a seção era Server Component e só as peças hidratavam.
 */

/* ─────────────────────────────────────────────────── conteúdo do bloco ──── */

/**
 * Copy da primeira dobra.
 *
 * `headline` e `headlineAccent` são lidos como **uma frase só** - o componente
 * junta os dois com um espaço e pinta o segundo de vermelho. A frase é a da
 * campanha, sem edição: ela é o que dá o tom da página inteira.
 */
const heroCopy = {
  headline: "Um protetor desesperado!",
  headlineAccent: "400 filhinhos que sofrem todos os dias.",
  /** Linha de apoio, logo abaixo da manchete. */
  lead: "Ajude o Caio a levar ajuda antes que seja tarde.",
  ctaPrimary: "Quero ajudar agora",
  seal: "Projeto 100% seguro e verificado",
};

/**
 * As fotos da história do Caio - o carrossel da seção "Quem é o Caio".
 *
 * São as seis fotos da campanha original, na mesma ordem, com as legendas que
 * elas tinham lá. Baixadas para `/public/caio/historia/`: o site é exportado
 * estático e enviado por FTP, então depender do WordPress da campanha para
 * servir imagem é depender de um servidor que não é nosso.
 *
 * ── `focusY`: onde está o rosto ───────────────────────────────────────────
 * As seis são quase quadradas (0,93 a 1,00) e aparecem em quadros bem mais
 * largos - 4:3 na seção da missão, 16:10 na página de obrigado. O
 * `object-cover` recorta pelo centro geométrico, e nestas fotos o centro cai
 * no peito de quem está agachado: sobra chão, corta testa.
 *
 * O número de cada uma foi medido na própria foto (topo da cabeça e queixo em
 * % da altura) e aponta para o meio do rosto. Trocar a foto do arquivo sem
 * remedir este número é como não ter número nenhum. A conta está no tipo
 * `Photo`, em `PhotoSlideshow`.
 */
const historiaPhotos = [
  {
    src: "/caio/historia/caio-1.webp",
    alt: "Caio Protetor com um cão resgatado no colo",
    caption: "Um protetor. Uma missão. 400 vidas que dependem da sua ajuda.",
    /* Agachado, de frente: cabeça 9%, queixo 31%. */
    focusY: 20,
  },
  {
    src: "/caio/historia/caio-2.webp",
    alt: "Caio entre os animais de que cuida todos os dias",
    caption: "Caio com os animais que cuida todo dia · ração, remédios e amor",
    /* O cabelo começa a 3% da borda de cima: qualquer corte no topo
       decapita. Daí o número mais baixo das seis - num 4:3 ele deixa a
       faixa visível começar em 2,8%, com folga de sobra para a cabeça. O
       preço é a barriga do cão sair embaixo, que é o que se pode perder. */
    focusY: 10,
  },
  {
    src: "/caio/historia/caio-3.webp",
    alt: "Cão resgatado recebendo cuidado depois do resgate",
    caption: "Cada resgate é uma segunda chance de vida",
    /* A única em que o rosto está na metade de baixo (55% a 80%), com o cão
       no ombro logo acima - o par ocupa de 20% a 80%. */
    focusY: 55,
  },
  {
    src: "/caio/historia/caio-4.webp",
    alt: "Abrigo lotado, com animais aguardando atendimento",
    caption: "Abrigos no limite · animais esperando por cuidado urgente",
    /* Rosto grande e centralizado na largura: cabelo 6,6%, queixo 48%. O 22
       (e não 27) é o que mantém o topo do cabelo dentro num quadro 4:3. */
    focusY: 22,
  },
  {
    src: "/caio/historia/caio-5.webp",
    alt: "Sacos de ração e medicamentos entregues no abrigo",
    caption:
      "Ração, remédios e veterinário · cada doação chega direta aos animais",
    /* Sentado no chão, rosto pequeno e alto no quadro: 12% a 27%. */
    focusY: 20,
  },
  {
    src: "/caio/historia/caio-6.webp",
    alt: "Cães resgatados no pátio de um dos abrigos apoiados",
    caption: "400+ animais que não teriam outra chance sem o seu apoio",
    /* De lado, beijando o cão preto: cabeça 19%, queixo 33%. */
    focusY: 26,
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
const heroVideo: {
  vturb: {
    playerId: string;
    scriptSrc: string;
    smartplayerSrc: string;
    streamSrc: string;
    ratio: number;
    /**
     * O primeiro quadro do vídeo, **hospedado por nós** em `public/`.
     *
     * Não é enfeite: é o elemento que marca a LCP da página (ver o comentário
     * no `VturbPlayer`). Ao trocar o vídeo, baixe o pôster novo do player -
     * ele está no `player.js`, como `.../poster.jpg` - e substitua o arquivo,
     * reduzido para 1120px de largura.
     */
    poster: string;
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
    poster: "/caio/vsl-poster.webp",
  },
  /**
   * Formato do player, em `largura / altura`. 78,125% de padding é
   * `1 / 0.78125` - um formato levemente deitado, que é o do vídeo da campanha.
   */
  aspect: "1 / 0.78125",
};

/* ─────────────────────────────────────────────────────────── ícones ──── */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...rest,
  };
}

const IconArrowLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
);

const IconArrowRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
    <path d="m13 5 7 7-7 7" />
  </svg>
);

const IconHeart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
  </svg>
);

const IconPaw = ({ size = 20, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <ellipse cx="7" cy="8.2" rx="2.1" ry="2.7" />
    <ellipse cx="12" cy="6.4" rx="2.1" ry="2.8" />
    <ellipse cx="17" cy="8.2" rx="2.1" ry="2.7" />
    <ellipse cx="19.6" cy="13.2" rx="1.9" ry="2.3" />
    <ellipse cx="4.4" cy="13.2" rx="1.9" ry="2.3" />
    <path d="M12 12.2c2.8 0 5.2 2 5.2 4.4 0 2-1.6 3.2-3.4 3.2-.8 0-1.3-.3-1.8-.3s-1 .3-1.8.3c-1.8 0-3.4-1.2-3.4-3.2 0-2.4 2.4-4.4 5.2-4.4Z" />
  </svg>
);

const IconShield = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

/* ────────────────────────────────────────────── utilitários do bloco ──── */

/**
 * `next/image` com o `basePath` do build prefixado no `src`.
 *
 * ⚠️ Com `images.unoptimized: true` (obrigatório num export estático - ver
 * `next.config.ts`), o `next/image` passa o `src` adiante sem tocar nele. É
 * comportamento documentado: o prefixo de `basePath` só acontece na URL do
 * otimizador (`/_next/image?url=…`), e sem otimizador não há essa URL para
 * prefixar. Sem este envelope, publicado em `doe.caioprotetor.org/v2`, toda
 * imagem apontaria para a raiz do domínio - que é outro site (WordPress) - e
 * simplesmente não carregaria.
 *
 * Só cobre `src` em string, que é o único formato usado aqui.
 */
function Image({ src, ...props }: ImageProps) {
  const prefixado = typeof src === "string" ? withBasePath(src) : src;
  return <NextImage src={prefixado} {...props} />;
}

/**
 * Revelação ao entrar na viewport. Sem biblioteca: IntersectionObserver +
 * uma classe CSS. Dispara uma vez e desconecta.
 *
 * O estado começa em `false` nos dois lados - servidor e cliente. Já esteve
 * começando em `typeof IntersectionObserver === 'undefined'`, que no servidor
 * dá `true` e no navegador dá `false`: o HTML saía com `data-visible="true"` e
 * a hidratação reclamava do atributo que não batia. Como o React não corrige
 * atributo divergente, o elemento ficava preso no estado "já revelado" e a
 * animação inteira não acontecia.
 *
 * Quem cobre o caso de JavaScript desligado é o `<noscript>` do layout, que
 * força `.reveal` a ficar visível - a lógica de exibir sem JS é do CSS, não
 * deste componente.
 */
function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
  id,
  style,
}: {
  children: ReactNode;
  delay?: 0 | 1 | 2 | 3;
  as?: "div" | "section" | "li" | "article";
  className?: string;
  id?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Navegador sem IntersectionObserver: mostra tudo. A escrita é direta no
    // DOM, e não `setVisible`, porque chamar setState no corpo do efeito
    // dispara uma renderização em cascata (e a regra de lint que a proíbe).
    if (typeof IntersectionObserver === "undefined") {
      node.dataset.visible = "true";
      return;
    }

    /*
     * Já dentro da primeira tela quando a página carrega: revela na hora, sem
     * passar pelo observer.
     *
     * O `rootMargin` abaixo tira 12% da borda de baixo da área de detecção
     * para o bloco só acender quando já entrou de verdade na tela - o que é o
     * comportamento certo para quem está rolando, e o errado para quem acabou
     * de chegar. Numa janela de 800px, esses 12% viram uma faixa morta de
     * 96px: o botão de doar do hero caía dentro dela, nunca intersectava, e
     * ficava em `opacity: 0` até a pessoa rolar - numa dobra em que ele já
     * estava visível o tempo todo, só que transparente.
     *
     * A comparação é com `window.innerHeight` puro, sem a margem, porque a
     * pergunta aqui é outra: não é "já entrou o bastante ao rolar?", é "está
     * na tela agora?".
     */
    if (node.getBoundingClientRect().top < window.innerHeight) {
      node.dataset.visible = "true";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const delayClass = delay ? `reveal-delay-${delay}` : "";

  return (
    <Tag
      // @ts-expect-error: ref polimórfico entre div/section/li/article
      ref={ref}
      id={id}
      style={style}
      data-visible={visible}
      className={`reveal ${delayClass} ${className}`}
    >
      {children}
    </Tag>
  );
}

/**
 * Rastro decorativo de patinhas andando, igual ao fundo do hero institucional.
 * Nada translada de fato - cada pata acende e apaga na sua vez via CSS
 * (`.paw-step`, `sos-paw-step` em globals.css); só opacidade e transform, sem
 * custo de layout.
 */

const PASSO = 0.14;
const PROPORCAO = 2.6;
const AVANCO_PAR = 23;
const AVANCO_PE = 8;
const LARGURA_PASSADA = 4.5;
const ABERTURA = 12;

type Rastro = {
  x: number;
  y: number;
  angulo: number;
  curva: number;
  pares: number;
  avanco?: number;
  tamanho: number;
  opacidade: number;
  ciclo: number;
  offset: number;
  soDesktop?: boolean;
};

/*
 * O bando. Rumos para todo lado - horizontais cruzando de ponta a ponta,
 * verticais subindo e descendo, diagonais saindo dos cantos e arcos fechados -,
 * cada um no seu ciclo e entrando numa hora diferente. Como os ciclos não são
 * múltiplos entre si, o conjunto nunca repete o mesmo arranjo.
 *
 * Os doze primeiros aparecem em qualquer tela; o resto é `soDesktop`, porque no
 * celular a mesma quantidade de patas numa coluna estreita vira poluição em
 * cima do texto em vez de textura atrás dele.
 *
 * As opacidades ficam entre 0.14 e 0.24: com o bando três vezes maior, manter
 * a força de antes tiraria a legibilidade da manchete, que é o que a dobra
 * existe para fazer ler. Quem dá a sensação de "cheio" aqui é a quantidade e a
 * variedade de rumos, não o peso de cada pata.
 */
const RASTROS: Rastro[] = [
  // --- Sempre visíveis ------------------------------------------------
  // Ponta a ponta pelo topo.
  { x: -4, y: 12, angulo: 4, curva: -0.3, pares: 7, avanco: 32, tamanho: 26, opacidade: 0.2, ciclo: 9, offset: 0 },
  // Da direita para a esquerda, mais abaixo.
  { x: 104, y: 80, angulo: 184, curva: 0.6, pares: 7, avanco: 31, tamanho: 28, opacidade: 0.18, ciclo: 10.5, offset: 0.2 },
  // Descendo pela canaleta da esquerda.
  { x: 8, y: -8, angulo: 80, curva: 1.4, pares: 6, avanco: 24, tamanho: 22, opacidade: 0.22, ciclo: 8, offset: 0.45 },
  // Subindo pela direita.
  { x: 92, y: 106, angulo: -94, curva: -1.2, pares: 6, avanco: 24, tamanho: 24, opacidade: 0.2, ciclo: 11, offset: 0.65 },
  // Horizontal baixa, da esquerda.
  { x: -6, y: 92, angulo: -3, curva: 0.3, pares: 6, avanco: 30, tamanho: 24, opacidade: 0.18, ciclo: 11.7, offset: 0.15 },
  // Descendo no terço direito.
  { x: 72, y: -8, angulo: 88, curva: -1.1, pares: 6, avanco: 25, tamanho: 22, opacidade: 0.2, ciclo: 8.9, offset: 0.7 },
  // Subindo pela esquerda.
  { x: 20, y: 108, angulo: -88, curva: 1.0, pares: 6, avanco: 25, tamanho: 24, opacidade: 0.19, ciclo: 12.9, offset: 0.35 },
  // Diagonal curta no alto à direita.
  { x: 68, y: -6, angulo: 38, curva: 0.6, pares: 6, avanco: 27, tamanho: 20, opacidade: 0.17, ciclo: 9.3, offset: 0.9 },
  // Diagonal subindo do canto inferior esquerdo.
  { x: -2, y: 104, angulo: -48, curva: -0.4, pares: 6, avanco: 27, tamanho: 26, opacidade: 0.18, ciclo: 13.4, offset: 0.5 },
  // Arco fechado na esquerda: sobe, vira e desce.
  { x: 4, y: 66, angulo: -58, curva: 9, pares: 6, avanco: 22, tamanho: 22, opacidade: 0.21, ciclo: 8.3, offset: 0.25 },
  // Arco fechado descendo pela direita.
  { x: 96, y: 14, angulo: 120, curva: -7.5, pares: 6, avanco: 21, tamanho: 24, opacidade: 0.19, ciclo: 10.1, offset: 0.6 },
  // Atravessa o miolo de cima a baixo - some atrás do texto e reaparece.
  { x: 50, y: -8, angulo: 96, curva: -2.2, pares: 6, avanco: 25, tamanho: 20, opacidade: 0.19, ciclo: 7.6, offset: 0.85 },
  // Sobe pelo centro-esquerda, no contrafluxo do anterior.
  { x: 30, y: 108, angulo: -86, curva: 1.8, pares: 4, avanco: 26, tamanho: 22, opacidade: 0.18, ciclo: 14.3, offset: 0.08 },

  // --- Só do tablet para cima ------------------------------------------
  // Segunda horizontal, na altura do meio.
  { x: -6, y: 52, angulo: 8, curva: 0.4, pares: 6, avanco: 30, tamanho: 24, opacidade: 0.16, ciclo: 12.5, offset: 0.3, soDesktop: true },
  // Contramão, na faixa alta.
  { x: 106, y: 26, angulo: 176, curva: -0.5, pares: 6, avanco: 30, tamanho: 26, opacidade: 0.17, ciclo: 9.8, offset: 0.55, soDesktop: true },
  // Diagonal caindo do canto superior esquerdo.
  { x: 26, y: -6, angulo: 52, curva: 0, pares: 6, avanco: 26, tamanho: 22, opacidade: 0.15, ciclo: 10.8, offset: 0.75, soDesktop: true },
  // Diagonal subindo do canto inferior direito.
  { x: 78, y: 106, angulo: -128, curva: 0, pares: 6, avanco: 26, tamanho: 28, opacidade: 0.16, ciclo: 12, offset: 0.1, soDesktop: true },
  // Contramão pelo pé da seção.
  { x: 108, y: 96, angulo: 188, curva: 0.5, pares: 6, avanco: 29, tamanho: 22, opacidade: 0.15, ciclo: 13.9, offset: 0.4, soDesktop: true },
  // Horizontal no terço alto, indo para a direita.
  { x: -8, y: 30, angulo: -2, curva: -0.4, pares: 6, avanco: 31, tamanho: 20, opacidade: 0.16, ciclo: 11.2, offset: 0.8, soDesktop: true },
  // Descendo bem à direita.
  { x: 98, y: -8, angulo: 84, curva: 1.6, pares: 6, avanco: 24, tamanho: 24, opacidade: 0.17, ciclo: 9.1, offset: 0.05, soDesktop: true },
  // Subindo no centro-direita.
  { x: 60, y: 108, angulo: -92, curva: -1.4, pares: 6, avanco: 24, tamanho: 22, opacidade: 0.16, ciclo: 12.2, offset: 0.62, soDesktop: true },
  // Descendo à esquerda do miolo.
  { x: 34, y: -8, angulo: 92, curva: 1.2, pares: 6, avanco: 26, tamanho: 26, opacidade: 0.15, ciclo: 10.4, offset: 0.28, soDesktop: true },
  // Diagonal cruzando o alto para a esquerda.
  { x: 94, y: -6, angulo: 132, curva: 0.3, pares: 6, avanco: 27, tamanho: 20, opacidade: 0.14, ciclo: 13.1, offset: 0.48, soDesktop: true },
  // Diagonal do pé esquerdo para o alto direito.
  { x: 12, y: 106, angulo: -38, curva: -0.6, pares: 5, avanco: 28, tamanho: 24, opacidade: 0.16, ciclo: 8.7, offset: 0.92, soDesktop: true },
  // Arco no pé do centro.
  { x: 40, y: 100, angulo: -18, curva: 7, pares: 5, avanco: 23, tamanho: 22, opacidade: 0.17, ciclo: 11.9, offset: 0.18, soDesktop: true },
  // Arco no alto do centro, no sentido contrário.
  { x: 58, y: 6, angulo: 150, curva: -8.5, pares: 5, avanco: 22, tamanho: 20, opacidade: 0.15, ciclo: 9.6, offset: 0.72, soDesktop: true },
  // Vertical curta na borda esquerda.
  { x: 2, y: -6, angulo: 86, curva: 0.8, pares: 5, avanco: 26, tamanho: 22, opacidade: 0.14, ciclo: 12.7, offset: 0.38, soDesktop: true },
  // Vertical curta na borda direita, subindo.
  { x: 84, y: 108, angulo: -90, curva: -0.9, pares: 5, avanco: 26, tamanho: 24, opacidade: 0.15, ciclo: 8.1, offset: 0.58, soDesktop: true },
];

function pegadas(rastro: Rastro) {
  const avancoPar = rastro.avanco ?? AVANCO_PAR;
  const patas = rastro.pares * 2;

  let x = rastro.x;
  let y = rastro.y;
  let angulo = rastro.angulo;
  const passos = [];

  for (let i = 0; i < patas; i += 1) {
    const rad = (angulo * Math.PI) / 180;
    const perp = rad + Math.PI / 2;
    const lado = i % 2 === 0 ? -1 : 1;

    passos.push({
      x: x + (Math.cos(perp) * LARGURA_PASSADA * lado) / PROPORCAO,
      y: y + Math.sin(perp) * LARGURA_PASSADA * lado,
      giro: angulo + 90 + lado * ABERTURA,
    });

    const avanco = i % 2 === 0 ? AVANCO_PE : avancoPar - AVANCO_PE;
    angulo += rastro.curva;
    const novoRad = (angulo * Math.PI) / 180;
    x += (Math.cos(novoRad) * avanco) / PROPORCAO;
    y += Math.sin(novoRad) * avanco;
  }

  return passos;
}

function PawTrails() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {RASTROS.map((rastro, r) => (
        <div
          key={r}
          className={`absolute inset-0 ${rastro.soDesktop ? "hidden md:block" : ""}`}
          style={{ "--paw-cycle": `${rastro.ciclo}s` } as CSSProperties}
        >
          {pegadas(rastro).map((pata, i) => (
            <IconPaw
              key={i}
              size={rastro.tamanho}
              className="paw-step"
              style={
                {
                  left: `${pata.x.toFixed(2)}%`,
                  top: `${pata.y.toFixed(2)}%`,
                  marginLeft: -rastro.tamanho / 2,
                  marginTop: -rastro.tamanho / 2,
                  animationDelay: `${(rastro.offset * rastro.ciclo + i * PASSO).toFixed(2)}s`,
                  "--paw-rotate": `rotate(${pata.giro.toFixed(1)}deg)`,
                  "--paw-opacity": rastro.opacidade,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Marca como decorativa a miniatura que o player do VTurb injeta.
 *
 * ── O problema ────────────────────────────────────────────────────────────
 * O `player.js` reescreve o conteúdo do `<vturb-smartplayer>` quando boota e
 * coloca lá dentro um `<img>` com a miniatura do vídeo - **sem `alt`**. É um
 * DOM de terceiro, gerado depois da hidratação, então nada no nosso JSX
 * alcança ele: no HTML que sai do build todas as imagens têm `alt`, e mesmo
 * assim o Lighthouse reprova a página em "elementos de imagem não têm
 * atributos [alt]" (conta em Acessibilidade **e** em SEO).
 *
 * ── O conserto ────────────────────────────────────────────────────────────
 * `alt=""`, e não um texto inventado: a miniatura é o primeiro quadro do
 * mesmo vídeo que a seção já apresenta pela manchete e pelo `aria-label` do
 * player. Descrevê-la de novo faria o leitor de tela anunciar duas vezes a
 * mesma coisa; vazia, ela é pulada, que é o comportamento correto para
 * imagem decorativa.
 *
 * O observador vive enquanto a página viver (o player pode trocar a miniatura
 * ao pausar, ao terminar, ao reabrir), custa uma callback por mutação e não
 * toca em nenhum outro atributo - se o VTurb um dia passar a emitir o `alt`
 * sozinho, isto vira um no-op silencioso.
 */
function PlayerA11y({ playerId }: { playerId: string }) {
  useEffect(() => {
    const alvo = document.getElementById(playerId);
    if (!alvo) return;

    const marcar = () => {
      for (const img of alvo.querySelectorAll("img:not([alt])")) {
        img.setAttribute("alt", "");
      }
    };

    marcar();
    const observador = new MutationObserver(marcar);
    observador.observe(alvo, { childList: true, subtree: true });
    return () => observador.disconnect();
  }, [playerId]);

  return null;
}

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
function VturbPlayer({
  playerId,
  scriptSrc,
  smartplayerSrc,
  streamSrc,
  ratio,
  poster,
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
  /** Primeiro quadro do vídeo, servido por nós - ver o bloco sobre LCP. */
  poster: string;
}) {
  const posterSrc = withBasePath(poster);
  /*
   * `preload`/`prefetchDNS` do `react-dom`, e não `<link>` escrito no JSX: o
   * React de-duplica estas chamadas por URL antes de escrever o `<head>`.
   * Com as tags soltas no JSX, o mesmo `preload` saía duas vezes no HTML -
   * inofensivo para o navegador, mas é lixo no `<head>` de uma página cujo
   * argumento é carregar rápido.
   */
  /*
   * O pôster primeiro, e com prioridade: ele é o maior elemento da primeira
   * dobra, ou seja, é ele que define a LCP da página - ver o bloco sobre isso
   * mais abaixo.
   */
  preload(posterSrc, { as: "image", fetchPriority: "high" });
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
        >
          {/*
            ── O pôster, e por que ele mora aqui ────────────────────────────
            Este quadro é o maior elemento da primeira dobra, então é ele que
            marca a LCP da página. Antes o espaço reservado era um retângulo
            preto, e o primeiro pixel com conteúdo só aparecia quando o
            `player.js` (terceiro, ~10s no 4G lento do Lighthouse) baixava,
            bootava e buscava a própria miniatura - LCP de 10,1s, zero ponto
            dos 25 que ela vale.

            Agora o primeiro quadro do vídeo é um arquivo nosso, pré-carregado
            com prioridade alta no `<head>`: ele pinta junto com o resto da
            dobra e o player entra por cima quando estiver pronto. É a mesma
            imagem que o VTurb usaria - baixada do próprio player e reduzida
            para a maior largura em que ela aparece (1120px = 560 CSS em 2×).

            `alt=""` porque ela é decorativa: quem conta o que está no vídeo é
            a manchete logo acima, e descrever o quadro de novo faria o leitor
            de tela repetir a mesma informação.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterSrc}
            alt=""
            fetchPriority="high"
            decoding="async"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </vturb-smartplayer>

      <Script id={`vturb-player-${playerId}`} src={scriptSrc} strategy="afterInteractive" />

      {/* A miniatura que o player injeta vem sem `alt` - ver `PlayerA11y`. */}
      <PlayerA11y playerId={playerId} />
    </>
  );
}

type Photo = {
  src: string;
  alt: string;
  /**
   * Onde está o rosto, em % da altura da foto - `0` no topo, `100` embaixo.
   *
   * ── Por que por foto, e não por quadro ────────────────────────────────
   * O `object-cover` recorta pelo centro geométrico, que não tem relação
   * nenhuma com onde as pessoas estão na imagem. Numa foto o Caio aparece
   * agachado com o rosto a 20% do topo; na seguinte, de pé, a 45%. Um
   * enquadramento só para as duas erra em uma delas - e o erro é sempre o
   * mesmo: testa cortada.
   *
   * O número é o `object-position` vertical, e a conta que ele resolve é
   * esta: com a foto transbordando `T%` da altura, a faixa visível começa
   * em `T × foco`. Ancorar no rosto (e não no meio) é o que garante que a
   * cabeça sobreviva ao corte em qualquer proporção de quadro.
   *
   * Sem valor, `50` - o comportamento de sempre.
   */
  focusY?: number;
};

/**
 * Fotos de um mesmo assunto passando sozinhas, uma sobre a outra.
 *
 * As fotos ficam empilhadas no mesmo lugar e o que muda é a opacidade - sem
 * trilho que rola, sem largura calculada, e a altura nunca muda no meio da
 * troca: o quadro é do pai (é ele quem traz a proporção) e todas as fotos o
 * preenchem com `fill` + `object-cover`.
 *
 * ── Quando o relógio anda ──────────────────────────────────────────────────
 * Só quando faz sentido, e são quatro condições:
 *
 *  • o bloco está **na tela** (`IntersectionObserver`) - card lá embaixo não
 *    gasta troca nenhuma, e quem chega nele vê o slide começar do começo;
 *  • o ponteiro e o foco estão fora dele - quem parou em cima de uma foto para
 *    olhar não a perde no meio;
 *  • ninguém clicou numa seta - a partir do primeiro clique quem manda é a
 *    pessoa, e voltar a girar sozinho tiraria da mão dela a foto que escolheu;
 *  • `prefers-reduced-motion` não está em `reduce` - trocar conteúdo sozinho é
 *    movimento, mesmo sem deslizar. Nesse caso fica a primeira foto e, onde há
 *    `controls`, a troca acontece no clique.
 *
 * ── Quando as fotos baixam ─────────────────────────────────────────────────
 * Só entram no DOM as fotos até uma à frente da atual: a primeira aparece, a
 * segunda baixa em silêncio enquanto a primeira ainda está no ar, e as outras
 * esperam a vez. São quatro abrigos na mesma seção - montar as doze de uma vez
 * faria a lista puxar ~700 KB de fotos que a pessoa vê uma por vez.
 */
function PhotoSlideshow({
  photos,
  sizes,
  label,
  controls = false,
  interval = 2600,
  priority = false,
  focus = "center",
  className = "",
}: {
  photos: Photo[];
  /** `sizes` do `next/image` - o mesmo para todas, o quadro é um só. */
  sizes: string;
  /** De quem são as fotos, para os rótulos das setas: "Abrigo Salve Cão". */
  label: string;
  /** Setas e pontinhos clicáveis. Sem isso, os pontinhos são só enfeite. */
  controls?: boolean;
  /** Tempo de cada foto no ar, em ms - a troca em si leva 0,4s por cima disso. */
  interval?: number;
  /**
   * Prioriza **só a primeira** foto no carregamento. Ligado no slide da
   * primeira dobra, que é o maior elemento da tela inicial e por isso o
   * candidato natural a LCP; nos cards de abrigo fica desligado, senão
   * quatro slides disputariam a banda da abertura entre si.
   */
  priority?: boolean;
  /**
   * Padrão de enquadramento do quadro, para as fotos que **não** trazem o seu
   * (`focusY`, no tipo `Photo` - é lá que está a explicação completa).
   *
   * `"top"` ancora no topo, para conjuntos de retrato em que o rosto fica no
   * terço de cima. Continua útil como rede: foto nova que entre nos dados sem
   * ponto focal cai num padrão razoável em vez de cortar cabeça.
   */
  focus?: "center" | "top";
  /** Classes do quadro - é aqui que entram a proporção e a largura. */
  className?: string;
}) {
  /*
   * A foto no ar **e** a que estava antes dela, num estado só.
   *
   * As duas são necessárias juntas porque a troca é um fade em camadas, e não
   * um crossfade: quem estava no ar continua opaca, embaixo, até a nova
   * terminar de entrar por cima (ver o bloco das imagens, lá embaixo). Num
   * estado só porque elas mudam sempre no mesmo instante - separadas, um
   * `setState` dentro do updater do outro é o tipo de coisa que o React chama
   * duas vezes em modo estrito e desalinha.
   */
  const [slide, setSlide] = useState({ atual: 0, anterior: 0 });
  const i = slide.atual;
  const [naTela, setNaTela] = useState(false);
  const [parado, setParado] = useState(false);
  const [assumido, setAssumido] = useState(false);
  const quadro = useRef<HTMLDivElement>(null);

  // Marca d'água de quantas fotos já entraram no DOM. É "a maior que já foi"
  // e não `i + 2` direto: ao dar a volta (última → primeira) o cálculo direto
  // desmontaria as fotos do fim e elas baixariam tudo de novo na volta seguinte.
  const [montadas, setMontadas] = useState(2);

  // Uma foto só não é slide: nada de relógio, nada de pontinho.
  const passa = photos.length > 1;

  useEffect(() => {
    const el = quadro.current;
    if (!el || !passa) return;

    // Fica em `false` para sempre com movimento reduzido: é isto que segura o
    // relógio, já que ele só anda com `naTela`.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entrada]) => setNaTela(entrada.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [passa]);

  useEffect(() => {
    if (!naTela || parado || assumido) return;
    const t = setInterval(
      () =>
        setSlide(({ atual }) => ({
          anterior: atual,
          atual: (atual + 1) % photos.length,
        })),
      interval,
    );
    return () => clearInterval(t);
  }, [naTela, parado, assumido, interval, photos.length]);

  useEffect(() => {
    setMontadas((v) => Math.max(v, Math.min(i + 2, photos.length)));
  }, [i, photos.length]);

  const ir = (destino: number) => {
    setAssumido(true);
    setSlide(({ atual }) => ({
      anterior: atual,
      atual: (destino + photos.length) % photos.length,
    }));
  };

  /*
   * Arrastar com o dedo ou o mouse - só as setas e os pontinhos respondiam a
   * clique, e num carrossel de fotos arrastar é o gesto que todo mundo tenta
   * primeiro, antes mesmo de procurar uma seta.
   *
   * Só a posição em X do toque que começou o arrasto: sem estado (não é
   * `useState`) porque nada na tela precisa mudar enquanto o dedo se move -
   * só ao soltar, quando o arrasto vira uma troca de foto ou não vira nada.
   *
   * Ponteiro (`Pointer Events`), não `touch`/`mouse` separados: cobre os três
   * dispositivos (dedo, mouse, caneta) com um único par de manipuladores.
   */
  const arrasto = useRef<number | null>(null);

  const aoPressionar = (e: React.PointerEvent) => {
    if (!passa) return;
    arrasto.current = e.clientX;
    setParado(true);
  };

  const aoSoltar = (e: React.PointerEvent) => {
    const inicio = arrasto.current;
    arrasto.current = null;
    setParado(false);
    if (inicio === null) return;

    // 40px: gesto claro de arrasto, sem confundir com o tremor de um toque
    // parado ou o clique numa seta (que não move o ponteiro quase nada).
    const delta = e.clientX - inicio;
    if (delta > 40) ir(i - 1);
    else if (delta < -40) ir(i + 1);
  };

  /* `z-30`: as fotos agora empilham em `z-10`/`z-20` para a troca não piscar
     (ver o bloco das imagens), e sem uma camada própria as setas e os
     pontinhos ficariam **atrás** delas - vir depois no HTML não basta contra
     um irmão com `z-index`. */
  const seta =
    "z-30 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-surface/90 text-ink-900 shadow backdrop-blur transition-colors hover:bg-surface";

  const ponto = (ativo: boolean) =>
    `h-1.5 rounded-full bg-white transition-all ${ativo ? "w-4 opacity-100" : "w-1.5 opacity-55"}`;

  return (
    <div
      ref={quadro}
      className={`relative touch-pan-y select-none overflow-hidden bg-surface-alt ${className}`}
      /* `focus`/`blur` com captura (`onFocus` no React já sobe do filho) cobrem
         quem chega nas setas pelo Tab - sem isso a foto trocaria debaixo do
         botão que a pessoa acabou de focar. */
      onMouseEnter={() => setParado(true)}
      onMouseLeave={() => setParado(false)}
      onFocus={() => setParado(true)}
      onBlur={() => setParado(false)}
      /*
       * `touch-pan-y` (acima) deixa o dedo continuar rolando a página na
       * vertical - só o eixo horizontal vira gesto do slide. Sem isso, o
       * primeiro `touchmove` horizontal também tentaria rolar a página e os
       * dois gestos brigariam pelo mesmo toque.
       */
      onPointerDown={aoPressionar}
      onPointerUp={aoSoltar}
      onPointerCancel={() => {
        arrasto.current = null;
        setParado(false);
      }}
    >
      {/*
        ── A troca é um fade EM CAMADAS, não um crossfade ──────────────────
        A versão anterior apagava a foto que saía enquanto acendia a que
        entrava, as duas ao mesmo tempo. No meio do caminho as duas estavam a
        50%, e duas camadas de 50% não tapam o que está atrás delas: sobrava
        um quarto do fundo claro do quadro à mostra, e a troca **piscava
        branco**. Não era um defeito de carregamento - era a soma das duas
        opacidades, e acontecia toda vez, com a foto já baixada.

        Aqui a foto que sai **não apaga**: ela continua opaca, uma camada
        abaixo (`z-10`), enquanto a nova entra por cima dela (`z-20`) de 0 a
        100. Como sempre existe uma camada opaca embaixo, o fundo do quadro
        nunca aparece - e a foto anterior só é apagada duas trocas depois,
        quando já está coberta por outras duas e ninguém a vê sumir.

        De quebra isso conserta o caso da foto que ainda não terminou de
        baixar: em vez do quadro vazio, quem espera vê a foto anterior até a
        nova pintar.
      */}
      {photos.slice(0, montadas).map((foto, indice) => {
        const atual = indice === i;
        const saindo = indice === slide.anterior && !atual;

        return (
          <Image
            key={foto.src}
            src={foto.src}
            alt={foto.alt}
            fill
            priority={priority && indice === 0}
            sizes={sizes}
            /*
             * Sem isto, o navegador reconhece o arrasto como o gesto nativo de
             * "arrastar a imagem" (o mesmo que solta uma imagem ghost ao
             * arrastar para outra aba) - e ele **cancela** a sequência de
             * ponteiro no meio do caminho (`pointercancel`, nunca
             * `pointerup`), então `aoSoltar` nunca roda e o slide não troca.
             */
            draggable={false}
            /*
             * O ponto focal da própria foto manda; o `focus` do quadro é só o
             * padrão de quem não declarou o seu (ver o tipo `Photo`).
             *
             * Vai em `style`, e não em classe: `object-[center_18%]` teria de
             * existir escrito no código para o Tailwind gerar a regra, e estes
             * números vêm dos dados. Classe montada por interpolação não
             * chega ao CSS - some no build, sem erro nenhum.
             */
            style={{
              objectPosition: `center ${foto.focusY ?? (focus === "top" ? 0 : 50)}%`,
            }}
            /* `pointer-events-none` em tudo que não é a foto no ar: empilhadas,
               elas roubariam o clique das setas se ficassem no caminho. */
            className={`object-cover transition-opacity duration-400 ${
              atual ? "z-20 opacity-100" : "pointer-events-none"
            } ${saindo ? "z-10 opacity-100" : ""} ${
              !atual && !saindo ? "opacity-0" : ""
            }`}
            aria-hidden={atual ? undefined : true}
          />
        );
      })}

      {passa && controls && (
        <>
          <button
            type="button"
            onClick={() => ir(i - 1)}
            aria-label={`${label}: foto anterior`}
            className={`absolute left-2 top-1/2 -translate-y-1/2 ${seta}`}
          >
            <IconArrowLeft size={17} />
          </button>

          <button
            type="button"
            onClick={() => ir(i + 1)}
            aria-label={`${label}: próxima foto`}
            className={`absolute right-2 top-1/2 -translate-y-1/2 ${seta}`}
          >
            <IconArrowRight size={17} />
          </button>
        </>
      )}

      {passa && (
        /* O degradê é o que garante o contraste dos pontinhos brancos: várias
           dessas fotos são de quintal claro ou piso de cimento. */
        <div
          /* Sem `controls` a fileira é enfeite: some para o leitor de tela e não
             recebe clique, porque no card quem responde ao toque é o botão que
             cobre tudo e abre a ficha. */
          aria-hidden={controls ? undefined : true}
          className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-center gap-1.5 bg-linear-to-t from-night/45 to-transparent pb-2 pt-6"
        >
          {photos.map((foto, indice) =>
            controls ? (
              <button
                key={foto.src}
                type="button"
                onClick={() => ir(indice)}
                aria-label={`${label}: foto ${indice + 1} de ${photos.length}`}
                aria-current={indice === i}
                /* O alvo do toque tem 24px de altura; o que se vê é o pontinho
                   de 6px no meio dele. */
                className="flex h-6 w-4 items-center justify-center"
              >
                <span className={ponto(indice === i)} />
              </button>
            ) : (
              <span key={foto.src} className={ponto(indice === i)} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Linha de impacto, no lugar da barra de meta em R$.
 *
 * Antes esta barra animava "R$ X arrecadados de R$ Y" a partir de
 * `lib/campaign.ts` (um número calculado, não o valor real do gateway - ver o
 * aviso que já existia ali). Trocado por uma frase fixa: nem o dinheiro
 * calculado nem uma barra de progresso, só o que a doação sustenta - os
 * mesmos +400 animais e 5 abrigos que a seção de transparência publica.
 * Estático de propósito: nada aqui depende de montar no cliente.
 */
/**
 * Barra de meta: arrecadado, meta de R$ 58.000, porcentagem e apoiadores.
 *
 * Os números vêm de `lib/campaign.ts` - **não são reais**, são calculados a
 * partir da data (ver o aviso grande lá). `useSyncExternalStore` porque o
 * valor só existe no navegador (depende do relógio) e o HTML sai congelado
 * do build; o retrato do servidor é `null`, então a barra não desenha nada
 * até montar - sem isso o build estático mostraria sempre o dia zero.
 */
function CampaignProgress({ className = "" }: { className?: string }) {
  const state = useSyncExternalStore(
    subscribeCampaign,
    getCampaignSnapshot,
    getCampaignServerSnapshot,
  );

  const percent = state?.percent ?? 0;

  return (
    <div className={`flex w-full flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[clamp(1.1506rem,1.023rem+0.7161vw,1.5345rem)] font-extrabold leading-none text-ink-900 tabular-nums">
          {state ? formatBRL(state.raised * 100) : "—"}
        </span>
        <span className="text-[clamp(0.8954rem,0.8184rem+0.3069vw,1.023rem)] font-extrabold leading-none text-ink-600 tabular-nums">
          {state ? formatBRL(state.goal * 100) : "—"}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3 text-fs12 font-semibold text-ink-600">
        <span>Arrecadados</span>
        <span>Meta</span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso da meta da campanha"
        className="h-[10px] w-full overflow-hidden rounded-full bg-ink-900/10"
      >
        <div
          className="h-full w-full origin-left rounded-full bg-donate transition-transform duration-700 ease-out"
          style={{ transform: `scaleX(${percent / 100})` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-fs12 font-semibold">
        <span className="text-donate-text">
          {state ? `${state.percent}% da meta atingida` : " "}
        </span>
        <span className="inline-flex items-center gap-1.5 text-ink-600">
          <span aria-hidden="true" className="h-[6px] w-[6px] shrink-0 rounded-full bg-donate" />
          {state ? `${state.supporters} apoiadores` : " "}
        </span>
      </div>
    </div>
  );
}

/**
 * O botão "Quero doar" genérico: abre direto a tela de valor (`DonationModal`).
 *
 * É um `<a href="#racao">` de verdade: sem JavaScript o link leva ao bloco de
 * doação da página, que explica o que acontece e traz os canais da equipe.
 * Existe como componente próprio para que as seções que o usam continuem sendo
 * Server Components; a aparência vem toda de `className`.
 */
function DonateMenuButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={DOAR_HREF}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        openDonationModal();
      }}
      className={className}
    >
      {children}
    </a>
  );
}

/* ──────────────────────────────────────────────────────────── o bloco ──── */

/**
 * Primeira dobra da campanha:
 *
 *   manchete → linha de apoio → vídeo → os dois botões → selo
 *
 * ── O VSL voltou para o miolo da dobra ────────────────────────────────────
 * No site institucional este espaço era um slide de fotos: um vídeo de vendas
 * é o argumento de uma *campanha*, e ali a página existia para apresentar a
 * organização. Aqui é campanha de novo, e o vídeo é o argumento - é o Caio
 * contando a própria história, que é o que faz alguém doar. O slide continua
 * como plano B: com `heroVideo.vturb: null` a dobra cai para as fotos sozinha,
 * sem ninguém mexer neste arquivo.
 *
 * ── Altura pelo conteúdo, não pela tela ───────────────────────────────────
 * A seção não trava altura em `svh`/`vh`: ela cresce e encolhe com o que tem
 * dentro, como qualquer outro bloco da página. Já foi `height`/`min-height`
 * amarrada à viewport, e isso quebrava em dois lugares que não são o
 * notebook de referência - zoom reduzido do navegador (a seção continuava do
 * tamanho da tela mesmo sobrando conteúdo bem menor, e sobrava um vão vazio
 * embaixo) e monitor ultrawide/2K (a mesma conta de `svh` não tem relação
 * nenhuma com quanto o conteúdo realmente precisa de altura ali). O vídeo é
 * `width`-driven pelo `--hero-col` (largura da coluna, ver o quadro do
 * player) e a própria proporção do vídeo decide a altura dele - sem
 * depender da altura da seção em nenhum momento.
 */
export default function Hero() {
  const { vturb } = heroVideo;

  return (
    <section
      id="topo"
      /* `pt-` cortado pela metade do `pb-` (era `py-` simétrico): o pedido
         era só o respiro de cima, entre a navbar e a manchete - reduzir os
         dois juntos também apertaria a base, abaixo do selo, que ninguém
         pediu para mudar. */
      className="surface-alt relative flex flex-col items-center overflow-hidden pb-[clamp(1.5rem,4vh,3rem)] pt-[clamp(0.75rem,2vh,1.5rem)]"
    >
      {/* #ui:hero */}
      <PawTrails />

      {/*
        Uma coluna só, e todo mundo na mesma medida: `--hero-col` (definida em
        `globals.css`, com a conta e o porquê). Manchete, vídeo, barra de meta e
        botões saem todos com ela.
      */}
      <div className="container-narrow relative flex w-full max-w-[860px] flex-col items-center gap-[clamp(0.5rem,1.4vh,1rem)] pb-[clamp(0.75rem,2vh,1.5rem)] pt-[clamp(0.375rem,1vh,0.75rem)] text-center">
        <Reveal className="flex flex-col items-center gap-2">
          {/*
            H1 único da página. A escala tem `vw` e `vh` no mesmo termo: a
            largura manda no tamanho do cartaz, mas cada pixel de fonte aqui
            sai da altura do vídeo, então a altura da janela precisa ter voz.
          */}
          {/*
            ── A manchete tem medida própria, e é a única peça que tem ────────
            Ela usa a largura inteira da dobra (860px menos o respiro lateral),
            contra os ~475-594px da coluna. É o que faz a frase fechar em **duas
            linhas** no notebook e no desktop: na medida da coluna, "400
            filhinhos que sofrem todos os dias." não cabe numa linha só com
            fonte de cartaz - só caberia encolhendo a fonte para ~23px, que é
            menor do que ela era. Alargando a manchete, a fonte pôde **crescer**
            (o teto subiu de 2,25rem para 2,4rem) e a frase ainda fecha em duas.

            ⚠️ O teto de 2,4rem é o limite medido: a 2,625rem a frase voltava a
            três linhas em telas de 1440px para cima, porque a fonte crescia
            mais rápido do que a largura disponível. Ao mexer nele, confira as
            duas pontas - 1366 e 1920.

            As duas frases são dois `block`, e não texto corrido com `balance`:
            a quebra cai sempre entre elas ("Um protetor desesperado!" /
            "400 filhinhos que sofrem todos os dias."), que é onde a frase pede
            para respirar. Deixada ao critério do navegador, ela caía no meio da
            segunda oração e a manchete virava três linhas tortas.

            No celular cada uma delas ainda quebra sozinha, porque lá não existe
            largura - e é o que já acontecia antes.
          */}
          <h1 className="w-full text-balance text-[clamp(1.279rem,0.883rem+1.256vw+0.465vh,2.232rem)] font-extrabold leading-[1.12] text-ink-900">
            <span className="block">{heroCopy.headline}</span>
            <span className="block text-action">{heroCopy.headlineAccent}</span>
          </h1>

          {/* Some em tela baixa: é a linha que a manchete já resume, e o espaço
              dela vale mais para o vídeo.

              O limite era 700px de janela, e por isso ela **aparecia** num
              notebook de 768 - onde ela e o selo, somados, comiam 55px que
              faltavam justamente ao player. 820px é a altura a partir da qual
              a dobra comporta os dois sem apertar o vídeo. */}
          <p className="hidden max-w-[46ch] text-[clamp(0.814rem,1.488vh,0.93rem)] leading-[1.5] text-ink-600 [@media(min-height:820px)]:block">
            {heroCopy.lead}
          </p>
        </Reveal>

        {/*
          O slot toma a largura da coluna e a altura sai sozinha do
          `aspect-ratio` do quadro do vídeo logo abaixo - sem `flex-1` nem
          `height` percentual: nenhum dos dois tem uma altura de seção para
          resolver contra, já que a seção não trava mais altura nenhuma (ver
          o comentário no topo do arquivo).
        */}
        <Reveal delay={1} className="flex w-full items-center justify-center">
          {vturb ? (
            /*
              ── O quadro do player: medido pela LARGURA da coluna ────────────
              `width: 100%` até `--hero-col` (mesma largura da manchete, da
              barra e dos botões) + `aspect-ratio`: a altura sai sozinha da
              proporção do vídeo, sem depender da altura de nada acima. O
              player do VTurb segura a própria altura com `padding-top` de
              78,125% da largura, que é a mesma proporção daqui, então ele
              preenche o quadro exatamente.
            */
            <div
              className="mx-auto w-full"
              style={{
                aspectRatio: heroVideo.aspect,
                maxWidth: "var(--hero-col)",
              }}
            >
              <VturbPlayer
                playerId={vturb.playerId}
                scriptSrc={vturb.scriptSrc}
                smartplayerSrc={vturb.smartplayerSrc}
                streamSrc={vturb.streamSrc}
                ratio={vturb.ratio}
                poster={vturb.poster}
              />
            </div>
          ) : (
            <PhotoSlideshow
              photos={historiaPhotos}
              label={heroCopy.headline}
              controls
              priority
              interval={4200}
              sizes="(min-width: 600px) 520px, 100vw"
              className="aspect-square w-full max-w-[520px] rounded-md border border-ink-900/10 shadow"
            />
          )}
        </Reveal>

        <Reveal
          delay={2}
          className="flex w-full flex-col items-center gap-[clamp(0.5rem,1.2vh,0.75rem)]"
        >
          {/* A barra de meta, na mesma largura dos botões logo abaixo: os dois
              formam uma coluna só sob o vídeo. Vem antes deles de propósito -
              é o argumento ("falta isto") que o botão responde. */}
          <CampaignProgress className="max-w-[var(--hero-col)]" />
          {/*
            Os dois botões, na mesma linha e na mesma medida - só a pintura
            muda. No celular eles empilham, porque lado a lado numa largura de
            350px o rótulo quebraria em duas linhas.
          */}
          <div className="flex w-full max-w-[var(--hero-col)] flex-col items-stretch gap-[clamp(0.5rem,1.2vh,0.75rem)] sm:flex-row">
            {/* Abre a tela de valor (`DonationModal`) direto; sem JavaScript
                continua sendo um link para o bloco de doação. */}
            <DonateMenuButton className="inline-flex min-h-[clamp(2.875rem,5.2vh,3.25rem)] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-donate px-5 text-[clamp(0.814rem,1.302vh,0.872rem)] font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow-[0_10px_30px_-8px_rgba(27,138,75,.55)] transition-colors hover:bg-donate-hover">
              <IconHeart size={17} />
              {heroCopy.ctaPrimary}
            </DonateMenuButton>

            {/* Mesma identidade do "Quero ajudar todo mês" da gaveta do menu
                e do fechamento (`CtaFinal`): vermelho cheio (`bg-action`) e
                patinha branca (`IconPaw` - `fill="currentColor"` herda o
                branco de `text-action-ink` sozinho) - é o par de cores da
                marca, e o mesmo pedido em qualquer lugar da página que ele
                apareça. Abre a tela de valor travada na mensal, sem as abas
                de frequência. */}
            <button
              type="button"
              onClick={() =>
                openDonationModal({ freq: "mensal", somenteMensal: true })
              }
              className="inline-flex min-h-[clamp(2.875rem,5.2vh,3.25rem)] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-action px-5 text-[clamp(0.814rem,1.302vh,0.872rem)] font-extrabold uppercase tracking-[0.03em] text-action-ink shadow-[0_10px_30px_-10px_rgba(191,5,33,.5)] transition-colors hover:bg-action-hover"
            >
              <IconPaw size={17} />
              Quero ajudar todo mês
            </button>
          </div>

          {/* Some antes de tudo em tela baixa: é a linha menos essencial da
              dobra, e o CNPJ está publicado na seção de documentação.

              `mt-[5px]` em cima do `gap` da coluna: o selo é uma legenda dos
              botões, não mais um item da pilha, e colado neles lia como um
              terceiro controle. São 5px fixos de propósito - o `gap` já
              encolhe com a altura da tela, e um respiro que também encolhe
              desaparece justo onde ele é mais necessário. */}
          <span className="mt-[5px] hidden items-center gap-1.5 [@media(min-height:800px)]:inline-flex">
            <IconShield size={15} className="shrink-0 text-donate" />
            <span className="text-fs13 font-semibold text-ink-600">
              {heroCopy.seal}
            </span>
          </span>
        </Reveal>
      </div>
    </section>
  );
}
