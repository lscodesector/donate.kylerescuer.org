"use client";

import NextImage, { type ImageProps } from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from "react";
import { withBasePath } from "@/lib/base-path";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  04 · QUEM É O CAIO - a história                                      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado: a história, os realces, as fotos e o slide moram aqui.
 *
 * ⚠️ `historiaPhotos` é a mesma lista do bloco 02 (a dobra a usa como plano B
 * quando não há vídeo). São **duas cópias**, e é o preço do bloco isolado:
 * trocar uma foto da história obriga a mexer nos dois arquivos. O `focusY` de
 * cada foto foi medido nela - copiar sem remedir é como não ter número nenhum.
 */

/* ─────────────────────────────────────────────────── conteúdo do bloco ──── */

/**
 * "Quem é o Caio" - a história, que é o miolo desta campanha.
 *
 * O texto é o da página original, palavra por palavra, incluindo a citação em
 * destaque. `quote` é `<blockquote>` na tela: é o dado mais duro da página
 * (22 vidas perdidas) e ele não pode ser lido como mais um parágrafo.
 */
const missao = {
  eyebrow: "Quem é o Caio",
  statement: "Um protetor. Uma missão. +500 vidas precisam de socorro.",
  paragraphs: [
    "Meu nome é Caio, sou protetor e hoje luto para fazer a ajuda chegar aos animais que mais precisam.",
    "Através da SOS Animal Help, eu acompanho de perto abrigos em crise e vejo animais doentes, feridos e sem forças, precisando de veterinário, exames, medicação e cuidados urgentes para continuar vivos.",
  ],
  quote:
    "ENTRE A VIDA E A MORTE: muitos animais estão em estado grave, sofrendo sem tratamento e esperando socorro imediato. Cada doação ajuda a pagar consultas, exames, medicamentos e atendimento veterinário.",
  paragraphsAfter: [
    "Se a ajuda não chegar agora, muitos podem não resistir. Eu preciso da sua ajuda para garantir socorro, tratamento e a chance de salvar essas vidas.",
    "Sua ajuda pode ser a diferença entre a vida e a morte.",
  ],
  /**
   * Os trechos que saem em **vermelho** no meio dos parágrafos - o vermelho
   * da marca (`--sos-action`), o mesmo dos selos e dos links.
   *
   * São procurados dentro de `paragraphs` e `paragraphsAfter` como texto
   * literal: cada item precisa bater **caractere por caractere** com um
   * pedaço do parágrafo, acentos e vírgulas inclusive. O que não bater é
   * simplesmente ignorado - mexer na história acima nunca quebra a tela, no
   * máximo apaga um realce, e é por isso que a lista mora aqui junto do
   * texto em vez de dentro do componente.
   *
   * A citação (`quote`) não entra na lista: o texto dela sai em preto e quem
   * a destaca é a moldura vermelha do `<blockquote>` em `Missao`.
   */
  realces: [
    "aos animais que mais precisam.",
    "SOS Animal Help",
    "abrigos em crise",
    "precisando de veterinário, exames, medicação e cuidados urgentes",
    "muitos podem não resistir",
    "Sua ajuda pode ser a diferença entre a vida e a morte.",
  ],
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
    caption: "Um protetor. Uma missão. +500 vidas precisam de socorro.",
    /* Agachado, de frente: cabeça 9%, queixo 31%. */
    focusY: 20,
  },
  {
    src: "/caio/historia/caio-2.webp",
    alt: "Caio entre os animais de que cuida todos os dias",
    caption: "Caio com os animais que cuida todo dia · socorro na hora certa",
    /* O cabelo começa a 3% da borda de cima: qualquer corte no topo
       decapita. Daí o número mais baixo das seis - num 4:3 ele deixa a
       faixa visível começar em 2,8%, com folga de sobra para a cabeça. O
       preço é a barriga do cão sair embaixo, que é o que se pode perder. */
    focusY: 10,
  },
  {
    src: "/caio/historia/caio-3.webp",
    alt: "Cão resgatado recebendo cuidado depois do resgate",
    caption: "Atendimento a tempo é uma segunda chance de vida",
    /* A única em que o rosto está na metade de baixo (55% a 80%), com o cão
       no ombro logo acima - o par ocupa de 20% a 80%. */
    focusY: 55,
  },
  {
    src: "/caio/historia/caio-4.webp",
    alt: "Abrigo lotado, com animais aguardando atendimento",
    caption: "Abrigos no limite · animais esperando tratamento urgente",
    /* Rosto grande e centralizado na largura: cabelo 6,6%, queixo 48%. O 22
       (e não 27) é o que mantém o topo do cabelo dentro num quadro 4:3. */
    focusY: 22,
  },
  {
    src: "/caio/historia/caio-5.webp",
    alt: "Sacos de ração e medicamentos entregues no abrigo",
    caption:
      "Consulta, exame e medicação · sua doação vira tratamento no abrigo",
    /* Sentado no chão, rosto pequeno e alto no quadro: 12% a 27%. */
    focusY: 20,
  },
  {
    src: "/caio/historia/caio-6.webp",
    alt: "Cães resgatados no pátio de um dos abrigos apoiados",
    caption: "500+ animais que não teriam atendimento sem o seu apoio",
    /* De lado, beijando o cão preto: cabeça 19%, queixo 33%. */
    focusY: 26,
  },
];

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

/* ──────────────────────────────────────────────────────────── o bloco ──── */

/**
 * "Quem é o Caio" - a história, logo depois da dobra.
 *
 * É a pergunta que uma campanha pessoal responde antes de qualquer pedido:
 * quem está pedindo, e por quê. A ordem é rótulo → frase → fotos → história →
 * citação → desfecho. Sem botão no fim: o CTA verde já está na dobra acima e no
 * botão flutuante, e "Conheça os abrigos" competia com os dois por um clique que
 * esta seção não precisa pedir.
 *
 * ── Não é um cartão ───────────────────────────────────────────────────────
 * Já foi: bloco creme (`bg-surface-alt`) com cantos arredondados e preenchimento
 * generoso, desenhado como um cartão sobre o branco da página. O fundo saiu -
 * a história do Caio é o corpo da página, não um aparte dentro dela, e a moldura
 * a empurrava para longe do texto que vem antes e depois. O único bloco com
 * moldura própria aqui passa a ser a citação, e é isso que a destaca.
 *
 * ── Por que as fotos vêm antes do texto ───────────────────────────────────
 * Porque a história é dele, e ver o rosto de quem pede muda o que se lê depois.
 * No site institucional este cartão era só texto - lá quem pedia era uma
 * organização, e organização não tem rosto.
 *
 * ── A citação é `<blockquote>`, e não mais um parágrafo ───────────────────
 * Ela carrega o dado mais duro da página inteira (22 vidas perdidas). Em corpo
 * de parágrafo, no meio de outros cinco, ela passaria batida - que é
 * exatamente o que não pode acontecer com o número que justifica a urgência.
 *
 * ── Os realces em vermelho ────────────────────────────────────────────────
 * Seis trechos saem no vermelho da marca, no meio do parágrafo cinza: o que o
 * Caio faz, quem é a organização, e as frases que dizem o tamanho da urgência.
 * Quais são eles é decisão de conteúdo e está em `copy.missao.realces` - aqui
 * só mora a mecânica de pintá-los (`comRealces`, no fim do arquivo).
 *
 * O texto vem inteiro de `copy.missao` - trocar a história é trocar o conteúdo,
 * nunca este componente.
 */
export default function QuemE() {

  return (
    <section id="missao" className="py-[clamp(2.5rem,6vh,4.5rem)]">
      {/* #ui:quem-e */}
      <div className="container-narrow">
        {/* Sem fundo e sem preenchimento próprios: a seção assenta direto no
            branco da página. O respiro lateral já vem do `container-narrow`
            (20px, 32px no desktop) e o vertical do `py` da `<section>` - por
            isso tirar o `p-6/sm:p-8/md:p-12` daqui não cola o texto na borda
            da tela nem encosta na seção de cima. */}
        <Reveal className="mx-auto flex max-w-[760px] flex-col items-center gap-5 text-center">
          <p className="text-fs13 font-extrabold uppercase tracking-[0.12em] text-accent">
            {missao.eyebrow}
          </p>

          <h2 className="max-w-[24ch] text-balance text-[clamp(1.279rem,0.977rem+1.209vw,1.86rem)] font-extrabold leading-[1.2] text-ink-900">
            {missao.statement}
          </h2>

          {/* Quadro 4:3: é o formato em que as seis fotos da campanha foram
              enquadradas, então nenhuma perde rosto no `object-cover`. */}
          <PhotoSlideshow
            photos={historiaPhotos}
            label="Caio Protetor"
            controls
            interval={4200}
            sizes="(min-width: 760px) 640px, 100vw"
            className="aspect-[4/3] w-full max-w-[640px] rounded-md border border-ink-900/10 shadow"
          />

          <div className="flex w-full max-w-[640px] flex-col gap-3">
            {missao.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-fs16 leading-[1.65] text-ink-600"
              >
                {comRealces(paragraph, missao.realces)}
              </p>
            ))}
          </div>

          {/* Barra à esquerda e fundo quente: é o único bloco de texto da
              página com moldura própria, e é de propósito - ver acima.

              O texto sai em preto, e o vermelho ficou só na moldura (barra e
              fundo). Ele já era vermelho por dentro também, e isso disputava
              com os seis realces dos parágrafos: numa seção em que vermelho
              significa "leia esta frase", um bloco inteiro vermelho tira o
              sentido da marcação. A moldura sozinha já destaca a citação. */}
          <blockquote className="w-full max-w-[640px] rounded-md border-l-4 border-action bg-action/[.06] p-4 text-left text-fs15 font-semibold leading-[1.6] text-ink-900 sm:p-5">
            {missao.quote}
          </blockquote>

          <div className="flex w-full max-w-[640px] flex-col gap-3">
            {missao.paragraphsAfter.map((paragraph) => (
              <p
                key={paragraph}
                className="text-fs16 leading-[1.65] text-ink-600"
              >
                {comRealces(paragraph, missao.realces)}
              </p>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * Pinta em vermelho os trechos de `realces` que aparecerem em `texto`.
 *
 * Procura cada trecho como texto literal (`indexOf`), na ordem em que eles
 * aparecem no parágrafo, e devolve a mistura de string crua e `<strong>`. O que
 * não for encontrado é ignorado em silêncio: a lista de realces cobre a seção
 * inteira e cada parágrafo casa só com uma parte dela - e, mais importante,
 * reescrever a história em `content/landing.ts` nunca pode quebrar a tela, no
 * máximo apagar um realce.
 *
 * `<strong>`, e não `<span>`: o trecho está em destaque porque *importa*, que é
 * exatamente o que a tag significa. O peso vem em `font-semibold` para não
 * chegar ao 700 do padrão do navegador - dentro de um parágrafo de 16px, o
 * vermelho já separa o trecho sozinho, e negrito cheio junto viraria grito.
 *
 * Trechos que se sobrepõem: vale o que começa antes; o outro é descartado.
 * Não há caso assim hoje, e a alternativa seria aninhar `<strong>` dentro de
 * `<strong>`, que não pinta nada de novo e complica a montagem.
 */
function comRealces(texto: string, realces: readonly string[]) {
  const marcas = realces
    .map((trecho) => ({ trecho, inicio: texto.indexOf(trecho) }))
    .filter(({ inicio }) => inicio !== -1)
    .sort((a, b) => a.inicio - b.inicio);

  const partes: ReactNode[] = [];
  let cursor = 0;

  for (const { trecho, inicio } of marcas) {
    if (inicio < cursor) continue;
    if (inicio > cursor) partes.push(texto.slice(cursor, inicio));
    partes.push(
      <strong key={inicio} className="font-semibold text-action">
        {trecho}
      </strong>,
    );
    cursor = inicio + trecho.length;
  }

  // Nenhum realce neste parágrafo: devolve a string, e não um array de uma
  // posição só - é um nó de texto a menos para o React reconciliar.
  if (!partes.length) return texto;

  if (cursor < texto.length) partes.push(texto.slice(cursor));
  return partes;
}
