/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  TEMPLATE · Icons - a fábrica e o conjunto base                       ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * ── A regra ───────────────────────────────────────────────────────────────
 * Todo ícone é SVG inline, `24×24`, desenhado em traço com `currentColor`.
 * Nenhum vem de biblioteca: são poucos, mudam pouco e uma dependência de
 * ícones custa mais bundle do que o conjunto inteiro daqui.
 *
 * ── Onde este arquivo vive ────────────────────────────────────────────────
 * No padrão desta rede, **cada bloco carrega os ícones que usa, dentro do
 * próprio arquivo** (ver `ESTRUTURA.md`). Este arquivo é o *catálogo*: copie
 * daqui para dentro do bloco os três ou quatro que ele precisa, junto da
 * função `base`.
 *
 * Se o projeto novo preferir importar de um lugar só, copie o arquivo inteiro
 * para `src/components/ui/Icons.tsx` - mas escolha uma das duas formas e siga
 * até o fim.
 *
 * ── As convenções ─────────────────────────────────────────────────────────
 *  • `aria-hidden` sempre. O ícone acompanha um rótulo, nunca o substitui.
 *    Botão só-ícone ganha `aria-label` no **botão**, não no svg.
 *  • `currentColor` sempre: a cor vem do `text-*` do elemento pai.
 *  • `shrink-0` na classe quando o ícone estiver num flex ao lado de texto -
 *    sem isso ele amassa quando a linha aperta.
 *  • Traço (`fill="none"` + `stroke`) é o padrão. As exceções são desenhos que
 *    só existem cheios: a patinha e as marcas de rede social.
 *  • `size` é a única prop de conveniência; qualquer outro atributo de svg
 *    passa direto pelo spread.
 */

import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/**
 * Os atributos comuns de todo ícone em traço.
 *
 * O spread de `rest` vem **por último** de propósito: quem chamar pode
 * sobrescrever qualquer padrão daqui (um `strokeWidth` mais fino, um
 * `viewBox` diferente) sem precisar de outro componente.
 */
export function base({ size = 20, ...rest }: IconProps) {
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

/* ──────────────────────────────────────────────── navegação e interface ──── */

export const IconArrowLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
);
export const IconArrowRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
    <path d="m13 5 7 7-7 7" />
  </svg>
);
export const IconArrowUpRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </svg>
);
export const IconBowl = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2.5 12.5h19" />
    <path d="M3.2 12.5a8.8 8.8 0 0 0 17.6 0" />
    <path d="M12 12.5V7" />
    <path d="M9 8.2c0-1.4.9-2.6 2-2.9" />
    <path d="M15 8.2c0-1.4-.9-2.6-2-2.9" />
  </svg>
);
export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);
export const IconChevron = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const IconClock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const IconClose = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
export const IconCopy = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
export const IconDollar = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2v20" />
    <path d="M17 6.5c0-1.93-2.24-3.5-5-3.5s-5 1.57-5 3.5S9.24 10 12 10s5 1.57 5 3.5-2.24 3.5-5 3.5-5-1.57-5-3.5" />
  </svg>
);
export const IconFacebook = ({ size = 20, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
  </svg>
);
export const IconFile = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v5h5" />
  </svg>
);
export const IconHeart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
  </svg>
);
export const IconHome = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </svg>
);
export const IconInstagram = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="3.8" />
    <path d="M17.2 6.8h.01" />
  </svg>
);
export const IconMail = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2.8" y="5" width="18.4" height="14" rx="2" />
    <path d="m3.4 6.6 8.6 6 8.6-6" />
  </svg>
);
export const IconMenu = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const IconMonitor = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2.8" y="4" width="18.4" height="12.5" rx="2" />
    <path d="M9 20.5h6" />
    <path d="M12 16.5v4" />
  </svg>
);
export const IconPaw = ({ size = 20, ...rest }: IconProps) => (
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
export const IconPin = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
export const IconPixMark = ({ size = 20, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z" />
    <path d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z" />
  </svg>
);
export const IconPlay = ({ size = 20, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <path d="M8.4 5.6a1 1 0 0 1 1.52-.85l8.2 5.1a1.2 1.2 0 0 1 0 2.04l-8.2 5.1a1 1 0 0 1-1.52-.85V5.6Z" />
  </svg>
);
export const IconQrCode = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <path d="M14 14h3v3h-3z" />
    <path d="M20.5 14v.01M20.5 20.5v.01M17 20.5v.01" />
  </svg>
);
export const IconQuestion = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9.2" />
    <path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.6" />
    <path d="M12 17.1h.01" />
  </svg>
);
export const IconShare = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
  </svg>
);
export const IconShield = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
export const IconStar = ({ size = 20, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <path d="m12 2.6 2.9 6.2 6.7.7-5 4.6 1.4 6.7L12 17.7 5.9 20.8l1.4-6.7-5-4.6 6.7-.7L12 2.6Z" />
  </svg>
);
export const IconUsers = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
    <path d="M16 3.1a4 4 0 0 1 0 7.8" />
  </svg>
);
export const IconWhatsApp = ({ size = 28, ...rest }: IconProps) => (
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
