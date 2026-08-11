/**
 * Testes do gerador de BR Code (`lib/pix.ts`).
 *
 * Roda com `npm run test:pix`. Existe porque um CRC errado não quebra o build
 * nem o lint - ele quebra na mão de quem tenta doar, quando o app do banco
 * recusa o código. É o tipo de erro que só aparece tarde demais.
 */
// O Node 24 remove os tipos do TypeScript sozinho, então o módulo real é
// importado direto - sem cópia da lógica e sem etapa de build no meio.
import { crc16, gerarPixCopiaECola } from "../lib/pix.ts";

let falhas = 0;
function checa(nome, real, esperado) {
  const ok = real === esperado;
  if (!ok) falhas += 1;
  console.log(`${ok ? "  ok  " : " FALHA"} ${nome}${ok ? "" : `\n         esperado: ${esperado}\n         recebido: ${real}`}`);
}

/** Divide o BR Code em campos ID/tamanho/valor e valida cada tamanho. */
function tlv(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const id = s.slice(i, i + 2);
    const len = Number.parseInt(s.slice(i + 2, i + 4), 10);
    const val = s.slice(i + 4, i + 4 + len);
    if (Number.isNaN(len) || val.length !== len) return null;
    out.push([id, val]);
    i += 4 + len;
  }
  return out;
}

console.log("\nBR Code / Pix\n");

// Vetor público do CRC16/CCITT-FALSE: é a checagem que prova o algoritmo.
checa('crc16("123456789") = 29B1', crc16("123456789"), "29B1");

const codigo = gerarPixCopiaECola({
  chave: "63.153.881/0001-09",
  nome: "SOS Animal Help",
  cidade: "Indaiatuba",
  valorCents: 6490,
});

const campos = tlv(codigo);
checa("estrutura TLV válida", campos ? "sim" : "não", "sim");

const mapa = Object.fromEntries((campos ?? []).map(([id, v]) => [id, v]));
checa("moeda = 986 (BRL)", mapa["53"], "986");
checa("país = BR", mapa["58"], "BR");
checa("valor 6490 centavos vira 64.90", mapa["54"], "64.90");
checa("nome sem acento e em caixa alta", mapa["59"], "SOS ANIMAL HELP");
checa("chave Pix presente", String(mapa["26"]).includes("63.153.881/0001-09") ? "sim" : "não", "sim");
checa("CRC fecha com o próprio payload", crc16(codigo.slice(0, -4)), codigo.slice(-4));

// Sem valor: doação de valor livre não pode emitir o campo 54.
const semValor = gerarPixCopiaECola({
  chave: "63.153.881/0001-09",
  nome: "SOS Animal Help",
  cidade: "Indaiatuba",
});
checa("sem valor não emite campo 54", semValor.includes("5405") ? "emitiu" : "não emitiu", "não emitiu");

console.log(`\n${falhas === 0 ? "Tudo certo." : `${falhas} falha(s).`}\n`);
process.exit(falhas === 0 ? 0 : 1);
