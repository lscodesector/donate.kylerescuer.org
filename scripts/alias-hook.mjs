/**
 * Resolve `@/...` fora do Next, para os testes conseguirem importar os módulos
 * reais em vez de uma cópia da lógica.
 *
 * O apelido `@/` é do `tsconfig.json`, e quem o entende é o bundler - o Node,
 * rodando o arquivo direto, só veria um pacote chamado "@" e desistiria. Sem
 * este gancho, testar `lib/payments/lusa.ts` exigiria duplicar as funções no
 * teste, que é o contrário do que um teste serve.
 */
const RAIZ = new URL("../src/", import.meta.url);

export async function resolve(especificador, contexto, proximo) {
  if (!especificador.startsWith("@/")) return proximo(especificador, contexto);

  const alvo = new URL(especificador.slice(2), RAIZ).href;
  /* O TypeScript importa sem extensão (`@/lib/base-path`); o Node exige o
     arquivo com nome e sobrenome, senão não acha nada. */
  const comExtensao = /\.[mc]?[jt]sx?$/.test(alvo) ? alvo : `${alvo}.ts`;
  return proximo(comExtensao, contexto);
}
