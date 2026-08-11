/**
 * Formatação de campo de formulário - hoje só o telefone do checkout.
 */

/**
 * Máscara brasileira de telefone, aplicada enquanto a pessoa digita.
 *
 * Aceita fixo e celular e troca de formato sozinha no 11º dígito:
 *
 *   (85) 3333-4444     10 dígitos - fixo
 *   (85) 99763-4409    11 dígitos - celular
 *
 * Tudo que não é dígito é descartado antes, então colar "+55 (85) 99763-4409"
 * do WhatsApp funciona. O corte em 11 dígitos é o que impede o DDI colado
 * junto de empurrar o número para fora da máscara.
 *
 * A função é chamada a cada tecla e devolve o valor já mascarado - inclusive
 * quando a pessoa apaga, porque ela mascara o que sobrou em vez de tentar
 * adivinhar a posição do cursor.
 */
export function maskPhoneBR(input: string): string {
  const d = input.replace(/\D/g, "").slice(0, 11);

  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Só os dígitos - é o que vale para validar e para guardar. */
export function phoneDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Telefone válido é o que tem DDD + 8 ou 9 dígitos. Campo vazio é válido:
 * o WhatsApp do checkout é opcional, e barrar quem não quer dar o número
 * seria transformar um campo opcional em obrigatório.
 */
export function isValidPhoneBR(input: string): boolean {
  const d = phoneDigits(input);
  return d.length === 0 || d.length === 10 || d.length === 11;
}
