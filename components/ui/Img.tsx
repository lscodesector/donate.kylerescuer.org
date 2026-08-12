import NextImage, { type ImageProps } from "next/image";
import { withBasePath } from "@/lib/base-path";

/**
 * `next/image`, com o `basePath` do build prefixado no `src`.
 *
 * ⚠️ **Por que isto existe e não é o `next/image` direto** ⚠️
 *
 * Com `images.unoptimized: true` (obrigatório num export estático - ver
 * `next.config.ts`), o `next/image` passa o `src` adiante sem tocar nele. É
 * comportamento documentado do Next, não bug: o prefixo de `basePath` só
 * acontece na URL do otimizador (`/_next/image?url=…`), e sem otimizador não
 * há essa URL para prefixar. `<Link>` e `useRouter()` prefixam sozinhos por um
 * caminho diferente (o roteador); este componente é o equivalente para
 * imagem.
 *
 * Sem isto, publicado em `doe.caioprotetor.org/v2`, toda imagem apontaria
 * para a raiz do domínio (`/caio/…`) em vez da subpasta
 * (`/v2/caio/…`) - e a raiz é outro site (WordPress). A imagem simplesmente
 * não carregaria.
 *
 * Importe este componente como `Image` no lugar de `next/image` em qualquer
 * arquivo novo: `import { Img as Image } from "@/components/ui/Img"`. Quando
 * o build não tem `basePath` (o caso comum - site na raiz do domínio),
 * `withBasePath` devolve o `src` inalterado, então nada muda.
 *
 * Só cobre `src` em string (`/pasta/arquivo.webp`) - é o único formato usado
 * neste projeto. Um `src` importado como módulo (`StaticImageData`) passaria
 * batido, sem quebrar nada, mas também sem ganhar o prefixo.
 */
export function Img({ src, ...props }: ImageProps) {
  const prefixado = typeof src === "string" ? withBasePath(src) : src;
  return <NextImage src={prefixado} {...props} />;
}
