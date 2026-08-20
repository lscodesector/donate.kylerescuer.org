/**
 * Testes da doação mensal (Pix Automático) e das máscaras do checkout.
 *
 * Roda com `npm run test:recorrencia`. Existe pelo mesmo motivo do
 * `test-pix.mjs`: nada aqui quebra build ou lint - quebra meses depois, no
 * extrato de quem doou.
 *
 *   • `recurrenceStartDate` errada não dá erro nenhum: só faz a recorrência
 *     pular um mês (dia 31) ou cobrar duas vezes no primeiro (data de hoje).
 *   • `buildContrato` passando de 35 caracteres é recusado pelo gateway - e o
 *     que sobra dele **aparece na tela do banco** para quem está doando.
 *   • CPF inválido aceito na tela vira recusa do gateway depois de a pessoa já
 *     ter preenchido tudo.
 */
import { register } from "node:module";
register("./alias-hook.mjs", import.meta.url);

const { recurrenceStartDate, buildContrato, payments } = await import(
  "../src/lib/payments/lusa.ts"
);
const { isValidCpf, maskCpf, maskBRL, centsFromBRL } = await import(
  "../src/lib/format.ts"
);

let falhas = 0;
function checa(nome, real, esperado) {
  const ok = real === esperado;
  if (!ok) falhas += 1;
  console.log(
    `${ok ? "  ok  " : " FALHA"} ${nome}${
      ok ? "" : `\n         esperado: ${esperado}\n         recebido: ${real}`
    }`,
  );
}

console.log("\nDoação mensal / Pix Automático\n");

/* --- A data da primeira parcela automática ---------------------------- */

// O caso comum: um mês à frente, mesmo dia.
checa(
  "12/08/2026 → 12/09/2026",
  recurrenceStartDate(new Date(2026, 7, 12)),
  "2026-09-12",
);

// Vira o ano sem pular nada.
checa(
  "20/12/2026 → 20/01/2027",
  recurrenceStartDate(new Date(2026, 11, 20)),
  "2027-01-20",
);

// O caso que a função existe para resolver: dia 31 não existe em fevereiro, e
// somar um mês na marra levaria a recorrência para março - pulando fevereiro.
checa(
  "31/01/2027 → 28/02/2027 (não pula fevereiro)",
  recurrenceStartDate(new Date(2027, 0, 31)),
  "2027-02-28",
);

// Ano bissexto: 2028 tem 29 de fevereiro.
checa(
  "31/01/2028 → 29/02/2028 (bissexto)",
  recurrenceStartDate(new Date(2028, 0, 31)),
  "2028-02-29",
);

// 31 de maio cai em 30 de junho, pelo mesmo motivo.
checa(
  "31/05/2026 → 30/06/2026",
  recurrenceStartDate(new Date(2026, 4, 31)),
  "2026-06-30",
);

// Nunca hoje: o QR de hoje já é a parcela deste mês.
const hoje = new Date();
const iso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
checa(
  "a data nunca é a de hoje",
  recurrenceStartDate(hoje) === iso ? "é hoje" : "está à frente",
  "está à frente",
);

/* --- O contrato (visível para o doador, no banco) --------------------- */

checa(
  "contrato sem o prefixo 'lead_'",
  buildContrato("lead_1784234392236_szdeou"),
  "CAIOPROTETOR1784234392236SZDEOU",
);

checa(
  "contrato só com letras e números",
  /^[A-Z0-9]+$/.test(buildContrato("lead_1784234392236_szdeou"))
    ? "sim"
    : "não",
  "sim",
);

checa(
  "contrato respeita o teto de 35 caracteres",
  String(
    buildContrato("lead_muito_longo_1784234392236_szdeoufz_extra").length,
  ),
  "35",
);

/* --- O piso do gateway ------------------------------------------------ */

/* O piso de produção, R$ 10,00 - o mesmo que a página em WordPress do Caio
   pratica (`FORM_ENV='prod'` → `MIN_CENTS=1000`). Esteve em 1 centavo durante o
   desenvolvimento, para conferir o mandato pagando de verdade; se voltar para
   lá, este teste e o de "0,01" logo abaixo têm de voltar junto - são eles que
   impedem a mensal de ir ao ar aceitando um centavo por mês. */
checa(
  "piso da mensal é o de produção (R$ 10,00)",
  String(payments.recurring.minCents),
  "1000",
);

checa(
  "profile da recorrência é o da campanha do Caio",
  payments.recurring.chargeUrl.includes("sos_animal_help_caio_protetor")
    ? "sim"
    : "não",
  "sim",
);

/* --- CPF -------------------------------------------------------------- */

// Dois CPFs de teste com dígito verificador correto.
checa("CPF válido passa", String(isValidCpf("529.982.247-25")), "true");
checa("CPF válido sem máscara passa", String(isValidCpf("52998224725")), "true");
checa("CPF com dígito errado é barrado", String(isValidCpf("529.982.247-26")), "false");
checa("CPF curto é barrado", String(isValidCpf("5299822472")), "false");
// Passa na conta dos dígitos, mas não é CPF - o algoritmo da Receita exclui.
checa("111.111.111-11 é barrado", String(isValidCpf("111.111.111-11")), "false");
checa("campo vazio é barrado", String(isValidCpf("")), "false");

checa("máscara de CPF", maskCpf("52998224725"), "529.982.247-25");
checa("máscara parcial", maskCpf("529982"), "529.982");
checa("máscara ignora letras", maskCpf("529abc982"), "529.982");

/* --- Valor em reais --------------------------------------------------- */

checa("máscara agrupa milhares", maskBRL("1234567"), "1.234.567");
checa("máscara aceita centavos", maskBRL("1234,5"), "1.234,5");
checa("máscara corta a terceira casa", maskBRL("10,999"), "10,99");
checa("máscara ignora letras", maskBRL("R$ 30x"), "30");

checa("30 vira 3000 centavos", String(centsFromBRL("30")), "3000");
checa("12,50 vira 1250 centavos", String(centsFromBRL("12,50")), "1250");
checa("1.234,56 vira 123456 centavos", String(centsFromBRL("1.234,56")), "123456");
checa("vazio vira 0", String(centsFromBRL("")), "0");
// O que a máscara de centavos destravou: sem ela, "0,01" era impossível de
// digitar e a mensal só podia ser testada em múltiplos de R$ 1,00.
checa("0,01 vira 1 centavo", String(centsFromBRL("0,01")), "1");
/* O campo de valor livre é o único caminho até aqui: a escada da mensal começa
   em R$ 15. Estas duas linhas são o que garante que digitar um valor simbólico
   não vire um débito automático de centavos. */
checa(
  "1 centavo não passa no piso",
  String(centsFromBRL("0,01") >= payments.recurring.minCents),
  "false",
);
checa(
  "9,99 não passa no piso",
  String(centsFromBRL("9,99") >= payments.recurring.minCents),
  "false",
);
checa(
  "10,00 passa no piso",
  String(centsFromBRL("10,00") >= payments.recurring.minCents),
  "true",
);

console.log(
  falhas === 0
    ? "\nTudo certo.\n"
    : `\n${falhas} falha(s). A doação mensal NÃO deve ir para produção assim.\n`,
);
process.exit(falhas === 0 ? 0 : 1);
