"use client";

import NextImage, { type ImageProps } from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from "react";
import { withBasePath } from "@/lib/base-path";
import { whatsappWith, type Documento } from "@/lib/config";
import { openDocumentoModal, openDonationModal } from "@/lib/modais";
import { useScrollLock } from "@/lib/scroll-lock";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  05 · ABRIGOS - quem recebe a ajuda                                   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado: os cinco abrigos, a ficha que abre no clique, o slide de
 * fotos, a cabeça de seção e os ícones moram aqui. De fora entram só `lib/` -
 * o WhatsApp da campanha, os gatilhos dos modais e a trava de rolagem.
 */

/* ─────────────────────────────────────────────────── conteúdo do bloco ──── */

const copyAbrigos = {
  eyebrow: "Quem recebe",
  title: "Abrigos que o Caio ajuda",
  /* Sem `lead`: a linha de apoio que ficava aqui ("A ajuda não fica com a
     gente...") prometia por escrito exatamente o que a lista logo abaixo
     mostra - nome, cidade e ficha aberta em cada card. Ler a promessa antes
     de ver a prova só adiava a prova. */
  ctaProfile: "Saiba mais",
  ctaCnpj: "Ver o cartão CNPJ do abrigo",
  ctaShelter: "Doar agora",
  ctaInstagram: "Ver o dia a dia no Instagram",
  ctaWhatsapp: "Pedir os dados no WhatsApp",
  profileEmpty:
    "Os dados cadastrais completos deste abrigo ainda não estão publicados aqui. Se quiser conferir antes de doar, é só pedir para a equipe.",
};

/**
 * Ficha de um abrigo - o que abre quando a pessoa clica no card.
 *
 * ⚠️ **Todo campo aqui é opcional e o que estiver vazio não aparece na tela.**
 * Preencha só o que der para comprovar. Enquanto `cnpj` e `address` estiverem
 * vazios, a ficha mostra sozinha um aviso de que os dados cadastrais ainda não
 * estão publicados, com o WhatsApp para quem quiser pedir.
 */
type ShelterProfile = {
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

type Shelter = {
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
  /**
   * As fotos do abrigo, no formato que o `PhotoSlideshow` desenha.
   *
   * A forma é repetida aqui, e não importada de `components/ui/PhotoSlideshow`,
   * porque este arquivo é só conteúdo e não importa nada - nem tipo. Quem
   * manda no `focusY` (o ponto do rosto que o recorte tem de preservar) é a
   * documentação de lá; aqui ficam os números de cada foto.
   */
  photos: { src: string; alt: string; focusY?: number }[];
  profile: ShelterProfile;
  /**
   * O cartão CNPJ **do abrigo**, quando ele já tem um emitido e o arquivo está
   * em `public/documentos/`. Sem esta linha, a ficha não mostra o botão "ver o
   * cartão CNPJ" - é o caso do Abrigo Dona Rose, que está em processo de
   * legalização. Botão que abre um quadro vazio é pior do que botão ausente.
   */
  cnpjDoc?: Documento;
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
 *
 * ── Os cartões CNPJ dos abrigos ───────────────────────────────────────────
 * Quatro dos cinco têm `cnpjDoc`, e o arquivo de cada um mora em
 * `public/documentos/cnpj-<id do abrigo>.webp`. O Abrigo Dona Rose não tem:
 * ele está sendo legalizado e o cartão ainda não foi emitido, então a ficha
 * dele abre sem o botão - ver `Shelter.cnpjDoc`.
 */
const shelters: Shelter[] = [
  {
    id: "siulsan-resgate",
    name: "Siulsan Resgate",
    location: "Tatuí, São Paulo",
    description:
      "53 cães resgatados. Recebe apoio mensal do Caio para ração, medicamentos e cirurgias veterinárias.",
    instagram: "@siulsanresgate",
    instagramHref: "https://www.instagram.com/siulsanresgate/",
    siteHref: "https://siulsanresgate.org/",
    photos: [
      {
        src: "/caio/abrigos/siulsan-resgate.webp",
        alt: "Cães resgatados no abrigo Siulsan Resgate, em Tatuí",
        /* Siulsan e a esposa, os dois com um cão no colo: rostos de 20% a
           40% da altura. Ver `focusY` no tipo `Photo`. */
        focusY: 30,
      },
    ],
    profile: {
      responsible: "Siulsan Garcia",
      /* Razão social no cartão: ASSOCIACAO PROTETORA DOS ANIMAIS DE TATUI
         "PRO-ANIMAL" - o nome de fantasia é que é "Siulsan Resgate". */
      cnpj: "16.836.217/0001-76",
      address: {
        line1: "Rua Maria Pontes Fernandes, 140",
        line2: "Vale dos Lagos",
        city: "Tatuí – SP",
        zip: "18.277-800",
      },
      mapsHref:
        "https://www.google.com/maps/search/?api=1&query=Rua+Maria+Pontes+Fernandes,+140,+Vale+dos+Lagos,+Tatui+SP",
      animals: "53 cães resgatados",
      since: "",
      about:
        "Recebe apoio mensal do Caio para ração, medicamentos e cirurgias veterinárias.",
    },
    cnpjDoc: {
      src: "/documentos/cnpj-siulsan-resgate.webp",
      alt: "Cartão CNPJ do abrigo Siulsan Resgate emitido pela Receita Federal",
      title: "Cartão CNPJ · Siulsan Resgate",
      caption: "CNPJ 16.836.217/0001-76 · situação ativa",
      aspect: "1354 / 1510",
    },
  },
  {
    id: "sos-joana-darc",
    name: "SOS Joana Darc",
    location: "Santa Luzia, Minas Gerais",
    description:
      "200 animais. Foco em cães e gatos vítimas de maus-tratos. Depende inteiramente de doações.",
    instagram: "@sosjoanadarc",
    instagramHref: "https://www.instagram.com/sosjoanadarc/",
    siteHref: "https://sosjoanadarc.org/",
    photos: [
      {
        src: "/caio/abrigos/sos-joana-darc.webp",
        alt: "Gatos e cães resgatados no abrigo SOS Joana Darc, em Santa Luzia",
        /* Selfie da Joana com a filha: a filha ocupa 20% a 38%, a Joana 28%
           a 48%. O foco no meio das duas segura os dois rostos. */
        focusY: 34,
      },
    ],
    profile: {
      responsible: "Joana Darc",
      cnpj: "65.975.512/0001-19",
      address: {
        line1: "Rua Alto do Tanque, 1925",
        line2: "Vila Íris",
        city: "Santa Luzia – MG",
        zip: "33.040-210",
      },
      mapsHref:
        "https://www.google.com/maps/search/?api=1&query=Rua+Alto+do+Tanque,+1925,+Vila+Iris,+Santa+Luzia+MG",
      animals: "200 animais",
      since: "",
      about:
        "Foco em cães e gatos vítimas de maus-tratos. Depende inteiramente de doações para continuar funcionando.",
    },
    cnpjDoc: {
      src: "/documentos/cnpj-sos-joana-darc.webp",
      alt: "Cartão CNPJ do abrigo SOS Joana Darc emitido pela Receita Federal",
      title: "Cartão CNPJ · SOS Joana Darc",
      caption: "CNPJ 65.975.512/0001-19 · situação ativa",
      aspect: "1494 / 1608",
    },
  },
  {
    id: "abrigo-salve-cao",
    name: "Abrigo Salve Cão",
    location: "Floresta Azul, Bahia",
    description:
      "92 animais. Em maio quase fechou por surto de cinomose. Segue aberto graças às doações mensais.",
    instagram: "@abrigosalvecao",
    instagramHref: "https://www.instagram.com/abrigosalvecao/",
    siteHref: "https://salvecaoabrigo.org/",
    photos: [
      {
        src: "/caio/abrigos/abrigo-salve-cao.webp",
        alt: "Cães resgatados no Abrigo Salve Cão, em Floresta Azul",
        /* Andrezza de pé com o cão no colo, rosto colado no dele: 10% a 30%. */
        focusY: 20,
      },
    ],
    profile: {
      responsible: "Andrezza Monteiro",
      cnpj: "65.940.924/0001-13",
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
        "Em maio de 2026 quase fechou por um surto de cinomose. Segue aberto graças às doações mensais.",
    },
    cnpjDoc: {
      src: "/documentos/cnpj-abrigo-salve-cao.webp",
      alt: "Cartão CNPJ do Abrigo Salve Cão emitido pela Receita Federal",
      title: "Cartão CNPJ · Abrigo Salve Cão",
      caption: "CNPJ 65.940.924/0001-13 · situação ativa",
      aspect: "1354 / 1510",
    },
  },
  {
    id: "casa-da-mili",
    name: "Casa da Mili",
    location: "Tambaú, São Paulo",
    description:
      "74 animais. Está em situação crítica de estrutura, mantido com apoio de doações voluntárias.",
    instagram: "@milenaefernanda.ong",
    instagramHref: "https://www.instagram.com/milenaefernanda.ong/",
    photos: [
      {
        src: "/caio/abrigos/casa-da-mili.webp",
        alt: "Cães e gatos resgatados na Casa da Mili, em Tambaú",
        /* Milena e Fernanda lado a lado, cada uma com um cão: os dois rostos
           entre 10% e 30%. */
        focusY: 20,
      },
    ],
    profile: {
      responsible: "Milena Aparecida",
      /* Razão social no cartão: ABRIGO VOLUNTARIO MILENA E FERNANDA - "Casa da
         Mili" é como a campanha o chama. */
      cnpj: "65.538.453/0001-11",
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
        "Está em situação crítica de estrutura, mantido com apoio de doações voluntárias para ração e veterinário.",
    },
    cnpjDoc: {
      src: "/documentos/cnpj-casa-da-mili.webp",
      alt: "Cartão CNPJ da Casa da Mili emitido pela Receita Federal",
      title: "Cartão CNPJ · Casa da Mili",
      caption: "CNPJ 65.538.453/0001-11 · situação ativa",
      aspect: "1494 / 1608",
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
        /* A mais alta das cinco (0,80) e a de rosto mais alto: a Dona Rose
           está de pé, cercada de cães, com o rosto entre 6% e 15%. Recorte
           central aqui mostrava só os cães e o chão. */
        focusY: 11,
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

const IconClock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IconClose = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const IconFile = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v5h5" />
  </svg>
);

const IconInstagram = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="3.8" />
    <path d="M17.2 6.8h.01" />
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

const IconPin = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconUsers = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
    <path d="M16 3.1a4 4 0 0 1 0 7.8" />
  </svg>
);

const IconWhatsApp = ({ size = 28, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.65-1.24-1.46-1.38-1.71-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.14.17-.24.25-.41.09-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.23.24-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.66 4.21 3.73.59.25 1.05.4 1.4.52.59.19 1.13.16 1.55.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
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

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

/**
 * Cabeça de seção: eyebrow, título e linha de apoio.
 *
 * ── O padrão da página é sem ícone e centralizado ─────────────────────────
 * O ícone em quadrado colorido e o alinhamento à esquerda saíram de todas as
 * seções: o ícone não dizia nada que o título já não dissesse e, alinhado à
 * esquerda, empurrava o texto criando uma margem diferente da do conteúdo logo
 * abaixo. Uma página com dez seções alinhadas do mesmo jeito lê como uma coisa
 * só. Por isso os defaults são estes - quem não passa nada recebe o padrão.
 *
 * `icon` e `align` existem para a exceção: hoje só a seção de transparência,
 * que reproduz o layout da v1 (ícone de barras + título à esquerda, sobre a
 * tabela de custos). Antes de usar em outra seção, vale lembrar que cada uso
 * é uma cabeça a menos alinhada com o resto da página.
 *
 * O conteúdo *abaixo* da cabeça continua livre para alinhar como fizer
 * sentido - e a maioria alinha à esquerda a partir de `sm`.
 */
function SectionHead({
  icon: Icon,
  eyebrow,
  title,
  lead,
  align = "center",
  className = "",
}: {
  icon?: IconComponent;
  eyebrow?: string;
  title: ReactNode;
  lead?: string;
  align?: "left" | "center";
  className?: string;
}) {
  const centered = align === "center";

  return (
    <Reveal
      className={`flex flex-col gap-3 ${centered ? "items-center text-center" : ""} ${className}`}
    >
      {/* Centralizado, o ícone fica acima do título (coluna); à esquerda, ele
          fica ao lado (linha) - é o que o layout da v1 desenha. */}
      <div className={`flex gap-3 ${centered ? "flex-col items-center" : "items-center"}`}>
        {Icon && (
          <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-sm bg-accent-soft text-accent">
            <Icon size={22} />
          </span>
        )}

        <div className={`flex flex-col gap-1 ${centered ? "items-center" : ""}`}>
          {eyebrow && (
            <p className="text-fs13 font-extrabold uppercase tracking-[0.12em] text-accent">
              {eyebrow}
            </p>
          )}
          <h2 className="text-[clamp(1.279rem,0.977rem+1.209vw,1.976rem)] font-extrabold leading-[1.15] text-ink-900">
            {title}
          </h2>
        </div>
      </div>

      {lead && (
        <p
          className={`max-w-[62ch] text-fs16 leading-[1.6] text-ink-600 ${centered ? "mx-auto" : ""}`}
        >
          {lead}
        </p>
      )}
    </Reveal>
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
 * Quem recebe a ração: os abrigos, com nome, cidade e perfil aberto.
 *
 * Esta seção ocupa o lugar das antigas "histórias reais" - três legendas
 * genéricas sobre fotos do acervo, que a página não tinha como comprovar.
 * Abrigo com nome, estado e perfil aberto é a mesma prova social, só que
 * verificável: a pessoa confere o trabalho sozinha, sem depender do que esta
 * página afirma.
 *
 * O card mostra o essencial e um botão só, "Saiba mais". O que dá para
 * conferir - endereço, CNPJ, responsável, Instagram e o WhatsApp da equipe -
 * está na ficha que abre no clique, sem sair da página. A lista mora em
 * `AbrigosLista` porque é ela que precisa de estado; esta seção continua sendo
 * Server Component.
 */
export default function Abrigos() {
  return (
    <section id="abrigos" className="surface-alt py-[clamp(2.5rem,6vh,4.5rem)]">
      {/* #ui:abrigos */}
      <div className="container-narrow flex max-w-[660px] flex-col gap-6">
        {/* Sem `lead`: a linha de apoio que ficava aqui dizia por escrito o que
            a lista logo abaixo mostra - nome, cidade e ficha aberta em cada
            card. Ler a promessa antes de ver a prova só adiava a prova. */}
        <SectionHead eyebrow={copyAbrigos.eyebrow} title={copyAbrigos.title} />

        <AbrigosLista />
      </div>
    </section>
  );
}

/**
 * A lista de abrigos e a ficha que abre no clique.
 *
 * Está separada de `Abrigos` porque só ela precisa de estado: a seção continua
 * sendo Server Component e manda para o cliente apenas a lista e o modal.
 *
 * ── O card tem um botão só ────────────────────────────────────────────────
 * "Saiba mais", e mais nada. O Instagram e o "Doar agora" que ficavam aqui
 * foram para dentro da ficha: o Instagram tirava a pessoa da página antes de
 * ela saber quem era o abrigo, e dois botões lado a lado num card de quatro
 * linhas disputavam o mesmo clique. Com um controle só, o card inteiro é
 * clicável sem nenhum truque de `z-index` - não há mais link por baixo do
 * botão que cobre o card.
 *
 * O botão visível é um `<span>`, não um `<button>`: quem recebe o clique e o
 * foco é o botão que cobre o card inteiro, e dois controles para a mesma ação
 * dariam duas paradas de teclado por abrigo.
 */
function AbrigosLista({
  /**
   * Rótulo do botão de cada card, por `id` de abrigo. Sem isso, todos usam o
   * "Saiba mais" de `copyAbrigos.ctaProfile`, que é o da página principal.
   *
   * Existe por causa da `/alternativa`, cuja régua de copy pede que cada card
   * convide pelo nome ("Conhecer a Siulsan"). É um objeto, e não uma função,
   * porque quem passa a prop é um Server Component - função não atravessa a
   * fronteira do servidor para o cliente.
   */
  ctaLabels,
}: {
  ctaLabels?: Record<string, string>;
} = {}) {
  const [aberto, setAberto] = useState<Shelter | null>(null);

  // Quem abriu a ficha recebe o foco de volta quando ela fecha - sem isso, o
  // teclado volta para o começo da página e a pessoa perde o lugar na lista.
  const gatilho = useRef<HTMLButtonElement | null>(null);

  const fechar = useCallback(() => {
    setAberto(null);
    gatilho.current?.focus();
  }, []);


  return (
    <>
      <ul className="flex flex-col gap-4">
        {shelters.map((shelter, i) => {
          const ctaProfile = ctaLabels?.[shelter.id] ?? copyAbrigos.ctaProfile;
          return (
          <Reveal
            as="li"
            key={shelter.id}
            delay={(i % 3) as 0 | 1 | 2}
            className="relative flex flex-col overflow-hidden rounded-md border border-ink-900/10 bg-surface shadow transition-colors hover:border-accent/50 sm:flex-row"
          >
            {/* Sem `controls`: quem recebe o clique no card é o botão que cobre
                tudo e abre a ficha, e seta dentro dele disputaria esse clique.
                Aqui as fotos só passam; a ficha é que dá o comando.

                `4/3` no celular, e não a faixa larga de antes: num 16/10 o
                `object-cover` comia a parte de cima da foto - que é justo onde
                estão os rostos de quem segura o animal. A partir de `sm` a
                altura é a da coluna de texto ao lado.

                O quadro sozinho não resolve, porque as fotos não têm todas a
                mesma forma (de 0,80 a 1,04): quem garante que o rosto
                sobrevive ao recorte é o `focusY` de cada uma, em
                `content/landing.ts`. O `focus="top"` abaixo é só a rede para
                uma foto nova que entre sem ponto focal declarado. */}
            <PhotoSlideshow
              photos={shelter.photos}
              label={shelter.name}
              focus="top"
              sizes="(min-width: 640px) 210px, 92vw"
              className="aspect-[4/3] w-full shrink-0 sm:aspect-auto sm:w-[210px] sm:self-stretch"
            />

            {/* No celular o card é uma coluna só e tudo fica centralizado;
                a partir de `sm` a foto entra ao lado e o texto volta a
                alinhar à esquerda, que é onde a leitura começa. */}
            <div className="flex flex-1 flex-col items-center gap-3 p-4 text-center sm:items-start sm:p-5 sm:text-left">
              <div className="flex flex-col gap-1">
                <h3 className="text-fs17 font-extrabold leading-[1.25] text-ink-900 sm:text-fs18">
                  {shelter.name}
                </h3>

                <p className="flex items-center justify-center gap-1.5 text-fs13 font-semibold text-accent sm:justify-start">
                  <IconPin size={14} className="shrink-0" />
                  {shelter.location}
                </p>

                <p className="text-fs14 leading-[1.5] text-ink-600">
                  {shelter.description}
                </p>
              </div>

              {/* `mt-auto`: as descrições têm alturas diferentes e o botão
                  precisa alinhar na mesma base em toda a lista. */}
              <span
                aria-hidden="true"
                className="mt-auto inline-flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-action px-5 text-center text-fs13 font-extrabold uppercase tracking-[0.02em] text-action-ink"
              >
                {ctaProfile}
                <IconArrowRight size={15} className="shrink-0" />
              </span>
            </div>

            <button
              type="button"
              aria-haspopup="dialog"
              aria-label={`${ctaProfile}: ${shelter.name}`}
              onClick={(e) => {
                gatilho.current = e.currentTarget;
                setAberto(shelter);
              }}
              /*
                O contorno entra para dentro (`-outline-offset`) porque o card
                tem `overflow-hidden` e cortaria um anel desenhado por fora.

                `z-40` porque as fotos do slide empilham em `z-10`/`z-20` para a
                troca não piscar (ver `PhotoSlideshow`). Sem z-index nenhum,
                este botão ficava **debaixo** da foto: o card se dizia todo
                clicável, mas o terço de cima - justamente a foto, que é o que a
                pessoa mira - não abria a ficha. `elementFromPoint` no meio da
                foto devolvia o `<img>`, não este botão.
              */
              className="absolute inset-0 z-40 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            />
          </Reveal>
          );
        })}
      </ul>

      {aberto && <FichaAbrigo shelter={aberto} onClose={fechar} />}
    </>
  );
}

/**
 * A ficha do abrigo.
 *
 * Mostra **apenas** o que estiver preenchido em `profile` (ver
 * `ShelterProfile`): linha vazia não vira campo em branco na tela. O endereço
 * cai para a cidade do card e o texto cai para a descrição, então a ficha nunca
 * abre vazia, mesmo em abrigo recém-cadastrado.
 *
 * Os botões do rodapé, na ordem em que respondem à dúvida de quem chegou até
 * aqui: conferir o documento (o cartão CNPJ do abrigo, quando ele já tem um),
 * conferir por fora (Instagram), perguntar para alguém (WhatsApp da equipe, já
 * com o nome do abrigo na mensagem) e doar. O documento vem primeiro porque é a
 * prova mais dura das quatro - as outras se checam por fora, essa está aqui.
 */
function FichaAbrigo({
  shelter,
  onClose,
}: {
  shelter: Shelter;
  onClose: () => void;
}) {
  const fecharRef = useRef<HTMLButtonElement>(null);

  /* A mesma trava do checkout e do popup de documento, e não mais um
     `overflow: hidden` local: ela conta quantos modais estão abertos, o que
     importa aqui porque esta ficha pode abrir o cartão CNPJ por cima de si
     mesma. Com duas travas independentes, fechar a de cima devolvia a rolagem
     - e a página escapava para o topo por trás da ficha. Ver `lib/scroll-lock`. */
  useScrollLock(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      /* `defaultPrevented`: o popup do cartão CNPJ abre por cima desta ficha e
         trata o Esc antes (fase de captura). Sem a guarda, um Esc só fechava os
         dois de uma vez e quem foi ver o documento voltava para a lista, e não
         para a ficha de onde saiu. */
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
    };
    window.addEventListener("keydown", onKey);
    fecharRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { profile, cnpjDoc } = shelter;

  // Cada linha do endereço é opcional: monta com o que existir e, sem nada,
  // cai para a cidade do card - que é sempre melhor do que campo em branco.
  const endereco = [
    profile.address?.line1,
    profile.address?.line2,
    [profile.address?.city, profile.address?.zip].filter(Boolean).join(" · "),
  ].filter(Boolean) as string[];

  const dados = [
    { icon: IconUsers, label: "Responsável", value: profile.responsible },
    { icon: IconFile, label: "CNPJ", value: profile.cnpj },
    { icon: IconPaw, label: "Animais acolhidos", value: profile.animals },
    { icon: IconClock, label: "Atuando desde", value: profile.since },
    /*
     * O @ do perfil é dado da ficha, e não mais um pedaço do botão.
     *
     * Ele ficava dentro do próprio botão do Instagram, que por isso precisava
     * de `flex-wrap` para quebrar em duas linhas num celular estreito - rótulo
     * em cima, arroba embaixo. Nenhum CTA da página quebra linha, e rótulo mais
     * arroba não cabem numa só: aqui ele é uma linha de dado como o CNPJ, com
     * `break-words` de graça, e o botão fica com o rótulo limpo.
     */
    { icon: IconInstagram, label: "Instagram", value: shelter.instagram },
  ].filter((linha) => linha.value);

  // Sem CNPJ e sem endereço, a ficha não tem o que a pessoa veio conferir:
  // avisa em vez de deixar parecer omissão. O botão do WhatsApp fica de todo
  // jeito, logo abaixo.
  const semCadastro = !profile.cnpj && !endereco.length;

  /*
   * ── Doar aqui abre o checkout, não a seção de doação ──────────────────────
   * Ele fechava a ficha e **rolava** a página até `#doar`, onde a pessoa tinha
   * de achar o botão de novo e clicar uma segunda vez para chegar na tela de
   * valores. Quem clicou em "doar agora" dentro da ficha de um abrigo já
   * decidiu: agora a tela de valores abre no lugar da ficha, e dali o caminho
   * segue direto para o Pix.
   *
   * Sem `causeId`: a doação entra na campanha e o Caio direciona a ajuda, que é
   * o que a própria linha embaixo do botão diz. Marcar uma frente aqui seria
   * prometer que o dinheiro vai para este abrigo.
   */
  const doar = () => {
    onClose();
    openDonationModal();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-night/70 p-0 anim-fade-in sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ficha-abrigo-titulo"
        className="max-h-[92svh] w-full max-w-[520px] overflow-y-auto rounded-t-lg bg-surface shadow-xl sm:rounded-lg"
      >
        <div className="relative">
          {/* Na ficha o slide ganha seta e pontinho clicável: aqui não há botão
              por cima, e é este o lugar de olhar o abrigo com calma - inclusive
              voltando numa foto que já passou.

              ⚠️ `7/6` foi escolhido quando as fotos chegavam todas em 742×642,
              e o comentário aqui dizia que elas apareciam inteiras. **Não é
              mais verdade**: as cinco atuais vão de 0,80 (Dona Rose, a mais
              alta) a 1,04 (Siulsan), então todas perdem alguma coisa em cima e
              embaixo - a Dona Rose perde 31% da altura. O que segura os rostos
              é o `focusY` de cada foto (ver `content/landing.ts`), não a
              proporção do quadro.

              O slide também anda mais devagar do que no card - quem abriu a
              ficha está olhando, não passando o olho. */}
          <PhotoSlideshow
            photos={shelter.photos}
            label={shelter.name}
            controls
            focus="top"
            interval={4000}
            sizes="(min-width: 640px) 520px, 100vw"
            className="aspect-[7/6] w-full"
          />

          {/*
            ── "Voltar", à esquerda, e o X à direita ────────────────────────
            Os dois fecham a ficha e devolvem a pessoa para a página, e existem
            os dois de propósito: o X é o gesto de quem já sabe que está num
            modal, e o "Voltar" escrito é para quem chegou aqui pelo card e lê a
            ficha como se fosse outra página - sem ele, o caminho de saída
            depende de reconhecer um ícone.

            Fundo sólido atrás dos dois: sobre foto clara, ícone claro some.

            ⚠️ `z-30` nos dois, e não é enfeite: a foto do slide desenha em
            `z-20` (ver `PhotoSlideshow`), e sem uma camada acima dela os botões
            ficavam **debaixo** da imagem - visíveis, porque a foto começa
            abaixo deles, mas surdos ao clique na área sobreposta. O X já vivia
            assim antes de o "Voltar" existir.
          */}
          <button
            type="button"
            onClick={onClose}
            className="absolute left-3 top-3 z-30 flex h-[40px] items-center gap-1.5 rounded-full bg-surface/90 px-3.5 text-fs14 font-extrabold text-ink-900 shadow backdrop-blur transition-colors hover:bg-surface"
          >
            <IconArrowLeft size={18} />
            Voltar
          </button>

          <button
            ref={fecharRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 z-30 flex h-[40px] w-[40px] items-center justify-center rounded-full bg-surface/90 text-ink-900 shadow backdrop-blur transition-colors hover:bg-surface"
          >
            <IconClose size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <span className="text-fs12 font-extrabold uppercase tracking-[0.08em] text-accent">
              {copyAbrigos.eyebrow}
            </span>
            <h2
              id="ficha-abrigo-titulo"
              className="text-fs21 font-extrabold leading-[1.2] text-ink-900"
            >
              {shelter.name}
            </h2>
            <p className="text-fs14 leading-[1.55] text-ink-600">
              {profile.about || shelter.description}
            </p>
          </div>

          <dl className="flex flex-col divide-y divide-ink-900/[.07] overflow-hidden rounded-md border border-ink-900/10">
            {dados.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-3.5">
                <Icon size={17} className="mt-0.5 shrink-0 text-accent" />
                <div className="flex min-w-0 flex-col">
                  <dt className="text-fs12 font-extrabold uppercase tracking-[0.06em] text-ink-600">
                    {label}
                  </dt>
                  {/* `break-words`: CNPJ e nome comprido não podem estourar a
                      largura da ficha no celular. */}
                  <dd className="break-words text-fs14 leading-[1.45] text-ink-900">
                    {value}
                  </dd>
                </div>
              </div>
            ))}

            {/* O endereço é a última linha e tem tratamento próprio: são várias
                linhas (rua com número, complemento, cidade e CEP) e pode levar
                o link do mapa junto. */}
            <div className="flex items-start gap-3 p-3.5">
              <IconPin size={17} className="mt-0.5 shrink-0 text-accent" />
              <div className="flex min-w-0 flex-col">
                <dt className="text-fs12 font-extrabold uppercase tracking-[0.06em] text-ink-600">
                  Endereço
                </dt>
                <dd className="break-words text-fs14 leading-[1.45] text-ink-900">
                  {endereco.length ? (
                    <address className="not-italic">
                      {endereco.map((linha) => (
                        <span key={linha} className="block">
                          {linha}
                        </span>
                      ))}
                    </address>
                  ) : (
                    shelter.location
                  )}

                  {profile.mapsHref && (
                    <a
                      href={profile.mapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-fs13 font-extrabold text-action transition-colors hover:text-accent"
                    >
                      Ver no mapa
                      <IconArrowRight size={14} className="shrink-0" />
                    </a>
                  )}
                </dd>
              </div>
            </div>
          </dl>

          {semCadastro && (
            <p className="rounded-md bg-surface-alt p-3.5 text-fs13 leading-[1.5] text-ink-600">
              {copyAbrigos.profileEmpty}
            </p>
          )}

          <div className="flex flex-col gap-2">
            {/* O cartão CNPJ **do abrigo**, quando ele já tem um emitido: abre
                no mesmo popup do documento da SOS Animal Help, por cima desta
                ficha. Some inteiro no abrigo que ainda está sendo legalizado
                (Abrigo Dona Rose) - ver `Shelter.cnpjDoc`.

                O `cnpjDoc` desestruturado lá em cima, e não `shelter.cnpjDoc`
                aqui: sendo uma `const`, o TypeScript mantém a garantia de que
                ele existe dentro do `onClick`. */}
            {cnpjDoc && (
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => openDocumentoModal(cnpjDoc)}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-md border border-action/30 px-4 text-center text-fs14 font-extrabold text-action transition-colors hover:bg-action/[.06]"
              >
                <IconFile size={17} className="shrink-0" />
                {copyAbrigos.ctaCnpj}
              </button>
            )}

            {/* Some inteiro quando o abrigo não tem perfil publicado - é o caso
                do Abrigo Dona Rose. Um botão de Instagram com `href=""`
                recarrega a própria página, que é pior do que não ter botão. */}
            {shelter.instagramHref && (
              <a
                href={shelter.instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                /* Só o rótulo, numa linha: o @ do perfil é agora uma linha da
                   ficha, logo acima (ver `dados`). */
                className="inline-flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-md border border-ink-900/10 px-4 text-center text-fs14 font-extrabold text-ink-900 transition-colors hover:border-accent/50 hover:text-accent"
              >
                <IconInstagram size={17} className="shrink-0" />
                {copyAbrigos.ctaInstagram}
              </a>
            )}

            {/* A mensagem já vai com o nome do abrigo: do outro lado, a equipe
                sabe de qual deles a pessoa está falando sem ter que perguntar. */}
            <a
              href={whatsappWith(
                `Olá! Queria saber mais sobre o abrigo ${shelter.name}, que aparece na campanha do Caio Protetor.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-md border border-donate/30 px-4 text-fs14 font-extrabold text-donate-text transition-colors hover:bg-donate/[.06]"
            >
              <IconWhatsApp size={17} className="shrink-0" />
              {copyAbrigos.ctaWhatsapp}
            </a>

            <button
              type="button"
              onClick={doar}
              className="mt-1 inline-flex min-h-[56px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-donate px-6 text-fs15 font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow transition-colors hover:bg-donate-hover"
            >
              {copyAbrigos.ctaShelter}
              <IconArrowRight size={17} />
            </button>

            {/* A doação é para a campanha, não para este abrigo - dizer isso
                aqui, onde a pessoa acabou de se afeiçoar a um nome, evita a
                promessa que a página não cumpre. */}
            <p className="text-center text-fs12 leading-[1.5] text-ink-600">
              A doação entra na campanha e o Caio direciona a ajuda conforme a
              necessidade de cada abrigo no mês.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
