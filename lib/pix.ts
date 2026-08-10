/**
 * Gera o "copia e cola" do Pix (BR Code), no padrão EMV®QRCPS do Banco Central.
 *
 * É um Pix estático com valor: o mesmo código que qualquer banco monta para uma
 * cobrança sem integração. Não existe PSP nem webhook aqui — a página não tem
 * como saber se alguém pagou (ver `app/doar/[tier]/page.tsx`).
 *
 * O formato é uma sequência de campos `ID + tamanho(2 dígitos) + valor`, e
 * termina no CRC16, que é o que o app do banco confere antes de aceitar o
 * código. CRC errado = QR recusado, então ele tem teste (`npm run test:pix`).
 */

/** Monta um campo no formato ID + tamanho com 2 dígitos + valor. */
function campo(id: string, valor: string): string {
  const tamanho = valor.length.toString().padStart(2, "0");
  return `${id}${tamanho}${valor}`;
}

/**
 * CRC16/CCITT-FALSE — polinômio 0x1021, valor inicial 0xFFFF, sem reflexão e
 * sem XOR final. É o que a especificação do BR Code exige.
 */
export function crc16(payload: string): string {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Tira acento e o que não for imprimível em ASCII.
 *
 * Nome e cidade do recebedor viajam em ASCII no BR Code; caractere fora da
 * tabela quebra a leitura em parte dos aplicativos.
 */
function ascii(texto: string, limite: number): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim()
    .slice(0, limite)
    .toUpperCase();
}

export function gerarPixCopiaECola({
  chave,
  nome,
  cidade,
  valorCents,
  txid = "***",
}: {
  chave: string;
  nome: string;
  cidade: string;
  /** Valor em centavos. `0` gera um Pix sem valor definido. */
  valorCents?: number;
  txid?: string;
}): string {
  const merchantAccount = campo(
    "26",
    campo("00", "br.gov.bcb.pix") + campo("01", chave),
  );

  const partes = [
    campo("00", "01"), // Payload Format Indicator
    merchantAccount, // Conta do recebedor (chave Pix)
    campo("52", "0000"), // Merchant Category Code — 0000 = não informado
    campo("53", "986"), // Moeda: 986 = BRL
    ...(valorCents && valorCents > 0
      ? [campo("54", (valorCents / 100).toFixed(2))]
      : []),
    campo("58", "BR"), // País
    campo("59", ascii(nome, 25)), // Nome do recebedor
    campo("60", ascii(cidade, 15)), // Cidade do recebedor
    campo("62", campo("05", ascii(txid, 25) || "***")), // Identificador
  ].join("");

  // O CRC entra no fim, e o cálculo inclui o próprio "6304".
  const semCrc = `${partes}6304`;
  return `${semCrc}${crc16(semCrc)}`;
}
