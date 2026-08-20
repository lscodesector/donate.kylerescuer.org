/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  TEMPLATE · Image - next/image com o basePath do build                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * ⚠️ **Use este envelope, nunca o `next/image` cru.**
 *
 * Com `images.unoptimized: true` - obrigatório num export estático, ver
 * `next.config.ts` - o `next/image` passa o `src` adiante sem tocar nele. É
 * comportamento documentado: o prefixo de `basePath` só acontece na URL do
 * otimizador (`/_next/image?url=…`), e sem otimizador não há essa URL para
 * prefixar.
 *
 * Sem este envelope, um site publicado em `dominio.org/v2` aponta **toda**
 * imagem para a raiz do domínio - que costuma ser outro site - e nenhuma
 * carrega. O defeito não aparece em `localhost`, onde o `basePath` é vazio:
 * ele só nasce no build de produção.
 *
 * Só cobre `src` em string, que é o único formato usado nesta rede de sites.
 */

import NextImage, { type ImageProps } from "next/image";
import { withBasePath } from "@/lib/base-path";

export default function Image({ src, ...props }: ImageProps) {
  const prefixado = typeof src === "string" ? withBasePath(src) : src;
  return <NextImage src={prefixado} {...props} />;
}
