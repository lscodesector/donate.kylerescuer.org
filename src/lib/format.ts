/**
 * Formatação de campo de formulário: o telefone e o CPF do checkout.
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

/* ------------------------------------------------------------------ */

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  Valor em reais - o campo "o que o seu coração mandar"                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * O campo aceitava só dígitos e multiplicava por 100: quem quisesse doar
 * R$ 12,50 não tinha como, e quem fosse testar a recorrência com centavos
 * também não. Com a máscara, o campo lê "1.234,56" e devolve centavos.
 *
 * Milhares agrupados enquanto se digita; a vírgula é a única pontuação que
 * sobrevive à limpeza, porque é ela que separa os centavos.
 */
function agruparMilhares(digitos: string) {
  const partes: string[] = [];
  let resto = digitos;
  while (resto.length > 3) {
    partes.unshift(resto.slice(-3));
    resto = resto.slice(0, -3);
  }
  if (resto.length) partes.unshift(resto);
  return partes.join(".");
}

/** Máscara progressiva: `1234,5` → `1.234,5`. */
export function maskBRL(input: string): string {
  const limpo = input.trim().replace(/[^\d,]/g, "");
  if (!limpo) return "";

  if (limpo.includes(",")) {
    const [inteiroCru, decimalCru = ""] = limpo.split(",");
    const inteiro = inteiroCru.replace(/\D/g, "") || "0";
    const decimal = decimalCru.replace(/\D/g, "").slice(0, 2);
    return agruparMilhares(inteiro) + (decimal ? `,${decimal}` : ",");
  }
  return agruparMilhares(limpo.replace(/\D/g, "") || "0");
}

/** `1.234,56` → `123456` (centavos). Campo vazio vale zero. */
export function centsFromBRL(input: string): number {
  if (!input) return 0;
  const normalizado = input.replace(/\./g, "").replace(",", ".");
  const centavos = Math.round(parseFloat(normalizado || "0") * 100);
  return Number.isNaN(centavos) ? 0 : centavos;
}

/* ------------------------------------------------------------------ */

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  CPF - só a doação mensal precisa                                     ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * O Pix Automático autoriza o banco a debitar a conta de alguém nos próximos
 * meses, e o Banco Central exige devedor identificado para criar esse mandato:
 * sem CPF válido, a ONZ/Infopago recusa a recorrência. A doação única não pede
 * nada disso - por isso o campo só aparece na mensal (ver `CheckoutModal`).
 *
 * ⚠️ O CPF vai **só** no corpo da cobrança, nunca no evento de tracking: o
 * payload de tracking é espalhado para fora (Meta, planilha, CRM), e CPF ali
 * dentro vira dado pessoal entregue a terceiro. O aviso está repetido em
 * `createRecurringCharge` porque é lá que o erro seria cometido.
 */
export function cpfDigits(input: string): string {
  return input.replace(/\D/g, "").slice(0, 11);
}

/** `123.456.789-01`, aplicada enquanto a pessoa digita. */
export function maskCpf(input: string): string {
  const d = cpfDigits(input);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Dígito verificador de verdade, não só a contagem de 11 dígitos.
 *
 * Espelha o `isValidCpf` do backend (`OnzInfopagoController`). Validar aqui não
 * substitui o servidor - serve para a pessoa ver o erro **antes** de esperar o
 * Pix ser gerado e voltar recusado, que é o pior momento para descobrir que
 * digitou um número errado.
 */
export function isValidCpf(input: string): boolean {
  const c = cpfDigits(input);
  /* Sequências como 111.111.111-11 passam na conta dos dígitos, mas não são
     CPF - o próprio algoritmo da Receita as exclui. */
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;

  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(c[i]) * (t + 1 - i);
    let digito = (soma * 10) % 11;
    if (digito === 10) digito = 0;
    if (digito !== Number(c[t])) return false;
  }
  return true;
}

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * O mesmo valor, **sem os centavos quando eles são zero**: `R$ 30`, e não
 * `R$ 30,00`.
 *
 * É a forma das telas de escolha e de conferência de valor. Numa grade de nove
 * degraus, nove vírgulas seguidas de dois zeros são só ruído entre a pessoa e o
 * número que ela está lendo - e o número é a única coisa que importa ali.
 *
 * Centavo que existe continua aparecendo (`R$ 4,99`, `R$ 34,99`): esconder
 * centavo real seria mentir sobre quanto vai sair da conta de quem doa.
 */
export function formatBRLCurto(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

/**
 * O mesmo valor, **sempre sem centavos** - `R$ 12.845`, nunca `R$ 12.845,02`.
 *
 * É a barra de meta (hero e a fixa embaixo da tela): arrecadado e meta são
 * números calculados, não uma conta de doação específica, e o centavo ali
 * não diz nada - só ocupa espaço numa faixa que já é curta.
 */
export function formatBRLInteiro(reais: number) {
  return Math.round(reais).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
