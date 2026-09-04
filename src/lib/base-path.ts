/**
 * O `basePath` do build, para o código que navega **fora** do que o Next
 * já sabe prefixar sozinho.
 *
 * `<Link>` e `useRouter()` (`next/navigation`) prefixam o `basePath`
 * automaticamente em qualquer `href` que comece com `/` - é configuração do
 * framework, não algo que este arquivo precise fazer. O que ele resolve é o
 * resto: `window.location.href = "/obrigado"` é uma troca de página feita
 * pelo navegador puro, sem passar pelo Next, então o navegador não tem como
 * saber que o site está publicado em `/v2` e não na raiz do domínio.
 *
 * ── Por que isto é uma variável de build, e não uma flag no repositório ───
 * A mesma página pode ser publicada em endereços diferentes: hoje ela é
 * `donate.kylerescuer.org/v2` porque o domínio já serve um WordPress na raiz;
 * amanhã pode ganhar domínio próprio, e aí o `basePath` é vazio. Trocar o
 * endereço é trocar `NEXT_PUBLIC_BASE_PATH` no comando de build - nenhum
 * arquivo muda.
 *
 * ⚠️ Este valor precisa **casar exatamente** com o `basePath` de
 * `next.config.ts`, que lê a mesma variável. Os dois existem porque servem
 * momentos diferentes do build: um é lido pelo Next em `next build`, o outro
 * é lido pelo bundle no navegador - não dá para ler `next.config.ts` a partir
 * daqui.
 */
export const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(
  /\/+$/,
  "",
);

/**
 * Prefixa um caminho absoluto (`/algo`) com o `basePath` do build.
 *
 * Uso: qualquer navegação que não passe por `<Link>`/`useRouter()` -
 * `window.location.href`, `window.location.assign`, redirecionamento após
 * pagamento confirmado.
 */
export function withBasePath(path: string) {
  return `${basePath}${path}`;
}
