/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  OS TRÊS DOCUMENTOS LEGAIS                                            ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Política de Privacidade, Termos de Uso e Política de Doação, transcritos
 * como **dados** e não como JSX: quem edita um texto jurídico não deveria
 * precisar abrir um componente React para isso, e as três páginas usam o mesmo
 * desenho (`app/(legal)/LegalPage.tsx`).
 *
 * ⚠️ **Texto jurídico se altera com revisão, não no impulso.** Cada documento
 * tem a data da última atualização no cabeçalho (`atualizado`), e ela precisa
 * mudar junto com o conteúdo - uma política que muda sem mudar a data é pior
 * do que uma desatualizada, porque ninguém percebe.
 *
 * ── O que **não** está escrito aqui ───────────────────────────────────────
 * CNPJ, endereço, WhatsApp e Instagram saem de `org` (`content/landing.ts`),
 * que é a fonte única desses dados no site inteiro. Repetir o CNPJ em quatro
 * arquivos é garantir que um dia três deles fiquem errados.
 *
 * ⚠️ O e-mail destes documentos (`contatoLegal`) **não** é o `org.email` da
 * página: os textos apontam para `contato@sosanimalhelp.org` e a página usa
 * `support@sosanimalhelp.org`. Mantive os dois como estão porque não sei qual é
 * o certo - se for um só, unifique nos dois lugares.
 */

import { org, pix } from "@/lib/config";

/** O e-mail que os três documentos publicam para exercício de direitos. */
export const contatoLegal = "contato@sosanimalhelp.org";

/** Um pedaço de documento. `titulo` abre uma seção numerada. */
export type BlocoLegal =
  | { tipo: "titulo"; texto: string }
  /** Subtítulo dentro de uma seção - os prazos de guarda, por exemplo. */
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "lista"; itens: string[] }
  /** Linha destacada em caixa - chave Pix, declaração a copiar. */
  | { tipo: "destaque"; texto: string };

export type DocumentoLegal = {
  /** Caminho da rota, sem barra final. */
  slug: string;
  /** Título da página e do `<h1>`. */
  titulo: string;
  /** Rótulo curto, para os menus e o rodapé. */
  rotulo: string;
  /** Uma linha, para o `<meta name="description">`. */
  resumo: string;
  /** Mês e ano da última revisão, por extenso. */
  atualizado: string;
  blocos: BlocoLegal[];
};

/** O rodapé de contato, igual nos três documentos. */
const contato: BlocoLegal[] = [
  { tipo: "titulo", texto: "Contato" },
  {
    tipo: "lista",
    itens: [
      `E-mail: ${contatoLegal}`,
      `WhatsApp: ${org.whatsappDisplay}`,
      `Instagram: ${org.instagram}`,
      `CNPJ: ${org.cnpj} · ${org.supporter}`,
    ],
  },
];

/* ------------------------------------------------------------------ */

export const politicaPrivacidade: DocumentoLegal = {
  slug: "politica-de-privacidade",
  titulo: "Política de Privacidade",
  rotulo: "Política de Privacidade",
  resumo: `Como a ${org.supporter} coleta, usa, armazena e compartilha dados pessoais na campanha ${org.name}, em conformidade com a LGPD.`,
  atualizado: "julho de 2026",
  blocos: [
    {
      tipo: "paragrafo",
      texto: `A ${org.supporter} valoriza a privacidade e a segurança dos dados pessoais de seus usuários, parceiros e beneficiários.`,
    },
    {
      tipo: "paragrafo",
      texto:
        "Esta Política de Privacidade tem por objetivo informar, de forma clara e transparente, como coletamos, utilizamos, armazenamos e compartilhamos seus dados pessoais, em conformidade com a Lei nº 13.709/2018 – Lei Geral de Proteção de Dados Pessoais (LGPD) e demais normas aplicáveis.",
    },
    {
      tipo: "paragrafo",
      texto:
        "Ao navegar no site doe.caioprotetor.org, utilizar seus recursos ou criar uma conta, coletamos dados pessoais sobre você. Dados pessoais referem-se a quaisquer dados que permitam a identificação direta ou indireta de um indivíduo.",
    },
    {
      tipo: "paragrafo",
      texto: `Cada tratamento de dados é realizado com fundamento em uma das hipóteses legais do art. 7º da LGPD, como o consentimento do titular, o cumprimento de obrigação legal ou regulatória, a execução de contrato ou procedimentos preliminares, o exercício regular de direitos ou o legítimo interesse da ${org.supporter}, sempre observando os direitos e liberdades fundamentais do titular.`,
    },
    {
      tipo: "paragrafo",
      texto:
        "O objetivo desta política é informá-lo sobre os meios que utilizamos para coletar e utilizar seus dados pessoais, em estrita conformidade com seus direitos.",
    },

    { tipo: "titulo", texto: "1. Controlador de dados e informações de contato" },
    {
      tipo: "paragrafo",
      texto: `A pessoa que decide coletar e utilizar seus dados pessoais é a organização SOS ANIMAL HELP, entidade sem fins lucrativos, inscrita no CNPJ sob o nº ${org.cnpj}, com sede na ${org.address.line1}, ${org.address.line2}, na cidade de Indaiatuba/SP, CEP: ${org.address.zip}, doravante denominada "Nós".`,
    },

    { tipo: "titulo", texto: "2. Quais dados são coletados" },
    {
      tipo: "paragrafo",
      texto:
        "Ao usar os recursos do nosso site e, em particular, ao criar uma conta ou realizar uma doação, podemos coletar dados pessoais sobre você diretamente, incluindo os seguintes dados:",
    },
    {
      tipo: "lista",
      itens: [
        "Nome e sobrenome, endereço de correio eletrônico, quando aplicável data de nascimento e número de telefone;",
        "Dados financeiros: data do pedido, data do pagamento, status do pedido, tipo de ação (doação, associação etc.), valor do pedido e nome da organização e campanha que receberá o pagamento;",
        "Qualquer informação que você escolher nos fornecer nos formulários de contato.",
      ],
    },
    {
      tipo: "paragrafo",
      texto:
        "Se você fizer uma doação no site, transmitiremos à Infopago, nossa provedora de processamento de pagamentos, em parceria de integração de checkout com a Lusa, certos dados que coletamos diretamente de você, para permitir o processamento da doação via Pix, a saber:",
    },
    {
      tipo: "paragrafo",
      texto:
        "Informações que permitem o pagamento: número do pedido, valor do pagamento, valor da contribuição voluntária, quando aplicável, sobrenome, nome e endereço de e-mail do doador, endereço IP, referência da organização beneficiária, bem como, se fornecido: data de nascimento, endereço postal, nome da empresa.",
    },
    {
      tipo: "paragrafo",
      texto:
        "Como parte deste pagamento, também podemos receber dados sobre você da Infopago e da Lusa, coletados diretamente de você durante a transação, a saber:",
    },
    {
      tipo: "paragrafo",
      texto:
        "Informações bancárias e de pagamento: dados parcialmente pseudonimizados do meio de pagamento utilizado, status do pagamento, data de autorização do pagamento.",
    },
    {
      tipo: "paragrafo",
      texto:
        "Por fim, quando você navega no site, podemos coletar automaticamente dados pessoais sobre você por meio de cookies técnicos e rastreadores que colocamos em seu dispositivo. Os dados coletados são os seguintes:",
    },
    {
      tipo: "lista",
      itens: [
        "Informações sobre o uso das ferramentas e recursos do nosso site: coletamos informações sobre suas interações com o site, incluindo as páginas ou o conteúdo visualizado e os links nos quais você clicou;",
        "Informações de conexão e informações relacionadas aos equipamentos e dispositivos que você usa para se conectar ao nosso site: endereço IP, datas e horários de conexão, dados relacionados ao hardware e software do dispositivo usado, identificadores exclusivos, dados de travamento, páginas visualizadas antes ou depois de se conectar ao site.",
      ],
    },
    {
      tipo: "paragrafo",
      texto:
        'Para mais informações sobre os cookies e rastreadores que usamos e como configurá-los, consulte a seção "Cookies" ao final desta página.',
    },

    { tipo: "titulo", texto: "3. Finalidades da coleta de dados" },
    {
      tipo: "paragrafo",
      texto:
        "Seus dados pessoais são coletados e utilizados para atender a um ou mais dos seguintes objetivos (finalidades):",
    },
    {
      tipo: "lista",
      itens: [
        "Gerenciar seu acesso e uso do site e dos serviços acessíveis por meio dele, bem como responder a quaisquer solicitações relacionadas ao seu uso do site;",
        "Garantir a criação e gestão da sua conta;",
        "Realizar operações relativas à gestão dos nossos doadores e ao acompanhamento da relação com os usuários do site;",
        "Gerenciar a conclusão das operações de doação realizadas on-line através do site;",
        "Criar um arquivo de membros registrados, usuários ou doadores potenciais;",
        "Enviar mensagens informativas relacionadas às nossas novidades e/ou desenvolvimentos em nossos serviços, com opção de recusa por link de cancelamento;",
        "Assegurar o bom funcionamento e a melhoria contínua do site, dos seus serviços e das suas funcionalidades;",
        "Otimizar a operação e a eficiência dos nossos produtos e serviços, bem como das ferramentas analíticas que desenvolvemos;",
        "Desenvolver estatísticas sobre a utilização e frequência dos nossos serviços;",
        "Sugerir conteúdo personalizado no site;",
        "Enviar anúncios, incluindo anúncios por e-mail direcionados, com opção de recusa;",
        "Gerenciar a gestão de depoimentos sobre nossos projetos, serviços ou conteúdos;",
        "Organizar campanhas e operações promocionais, excluindo jogos de azar e apostas on-line;",
        "Enviar solicitações e mensagens promocionais, com opção de recusa;",
        "Gerenciar quaisquer disputas relacionadas ao uso de nossos produtos e serviços;",
        "Enviar newsletters, com opção de recusa;",
        "Gerir os seus pedidos de direito de acesso, retificação e oposição, apagamento, limitação, portabilidade ou direito de apresentar reclamação à autoridade competente;",
        "Cumprir com as nossas obrigações legais e regulamentares, nomeadamente no combate à fraude e ao financiamento do terrorismo.",
      ],
    },
    {
      tipo: "paragrafo",
      texto:
        "Ao coletar seus dados pessoais, informamos se determinados dados são obrigatórios ou opcionais, bem como as possíveis consequências da ausência de resposta.",
    },
    {
      tipo: "paragrafo",
      texto: `O site do ${org.name} e os serviços de pagamento da Lusa não são direcionados a menores de 18 anos. Caso o tratamento de dados de um menor seja necessário, será obtido o consentimento específico e destacado de pelo menos um dos pais ou responsável legal.`,
    },
    {
      tipo: "paragrafo",
      texto:
        "Por fim, gostaríamos de ressaltar que nunca usamos seus dados para tomar decisões automatizadas sobre você.",
    },

    { tipo: "titulo", texto: "4. Quais são os seus direitos?" },
    {
      tipo: "paragrafo",
      texto: `A ${org.supporter} assegura a seus usuários/doadores seus direitos de titular previstos no artigo 18 da Lei Geral de Proteção de Dados. Dessa forma, você pode, de maneira gratuita e a qualquer tempo:`,
    },
    {
      tipo: "lista",
      itens: [
        "Confirmar a existência de tratamento de dados, de maneira simplificada ou em formato claro e completo;",
        "Acessar seus dados, podendo solicitá-los em uma cópia legível sob forma impressa ou por meio eletrônico, seguro e idôneo;",
        "Corrigir seus dados, ao solicitar a edição, correção ou atualização destes;",
        "Limitar seus dados quando desnecessários, excessivos ou tratados em desconformidade com a legislação, através da anonimização, bloqueio ou eliminação;",
        `Solicitar a portabilidade de seus dados, através de um relatório de dados cadastrais que a ${org.supporter} trata a seu respeito;`,
        "Eliminar seus dados tratados a partir de seu consentimento, exceto nos casos previstos em lei;",
        "Revogar seu consentimento, desautorizando o tratamento de seus dados;",
        "Informar-se sobre a possibilidade de não fornecer seu consentimento e sobre as consequências da negativa.",
      ],
    },

    { tipo: "titulo", texto: "5. Compartilhamento de dados" },
    {
      tipo: "paragrafo",
      texto:
        "Seus dados serão comunicados apenas aos membros de nossa equipe que necessitem de acesso (como atendimento ao doador e comunicação), bem como aos nossos potenciais subcontratados (como provedores de TI, provedores de hospedagem de site e provedores de suporte). Eles terão acesso aos seus dados na medida estritamente necessária para a execução de suas respectivas missões e atuam somente sob nossas instruções.",
    },
    {
      tipo: "paragrafo",
      texto:
        "Alguns dos dados que coletamos também são compartilhados com a Infopago e com a Lusa, que gerenciam o processamento das doações via Pix por meio do site, incluindo, quando aplicável, dados bancários. Nesses casos, a Infopago e a Lusa atuam como controladoras dos dados coletados diretamente por elas durante a transação. Recomendamos consultar diretamente as políticas de privacidade da Infopago e da Lusa para saber mais sobre como esses parceiros tratam os seus dados.",
    },
    {
      tipo: "paragrafo",
      texto:
        "Também transferimos seus dados para os abrigos e organizações em benefício dos quais você realizou uma doação, para que possam processá-los no contexto do recebimento e prestação de contas dessa doação. Somente os dados necessários para essas operações são transferidos.",
    },
    {
      tipo: "paragrafo",
      texto:
        "Seus dados também podem ser comunicados no âmbito de auditorias internas, bem como às autoridades administrativas, a fim de cumprir com nossas obrigações legais. Em caso de litígio, seus dados poderão ser comunicados a autoridades judiciais ou administrativas, assistentes jurídicos, oficiais de justiça ou magistrados.",
    },
    {
      tipo: "paragrafo",
      texto:
        "Todos os destinatários comprometem-se a garantir a mais estrita confidencialidade dos seus dados pessoais em sua posse.",
    },

    { tipo: "titulo", texto: "6. Tempo de armazenamento e segurança" },
    {
      tipo: "paragrafo",
      texto:
        "Seus dados serão mantidos apenas pelo período estritamente necessário à sua utilização, com base na finalidade para a qual foram coletados.",
    },
    { tipo: "subtitulo", texto: "Gestão do seu acesso ao site e comunicações" },
    {
      tipo: "paragrafo",
      texto:
        "Seus dados pessoais não serão mantidos além do período estritamente necessário para gerenciar nosso relacionamento com você, no máximo três (3) anos a partir da data de coleta. Dados que permitam comprovar um direito ou contrato, ou que devam ser conservados para cumprimento de obrigação legal, serão conservados pelo prazo de até cinco (5) anos.",
    },
    { tipo: "subtitulo", texto: "Criação e gestão da sua conta" },
    {
      tipo: "paragrafo",
      texto:
        "Ao criar uma conta no site, os dados serão mantidos até que a conta seja excluída pelo usuário. Contas não utilizadas por dois (2) anos a partir da criação serão consideradas inativas e excluídas, junto aos dados nelas contidos, após tentativa de contato prévio.",
    },
    { tipo: "subtitulo", texto: "Gestão das operações de doação online" },
    {
      tipo: "paragrafo",
      texto:
        "As transações financeiras relativas a doações são confiadas à Infopago e à Lusa, que garantem seu bom funcionamento e segurança. Não temos acesso à íntegra dos dados de pagamento, apenas a dados parciais necessários, guardados por até 5 anos para fins de prova em caso de contestação da transação e para cumprir obrigações legais de combate à fraude. Dados relativos ao código de segurança do cartão não são armazenados. De forma mais ampla, dados de pagamento são mantidos durante toda a relação e por mais 5 anos.",
    },
    { tipo: "subtitulo", texto: "Estatísticas de medição de audiência" },
    {
      tipo: "paragrafo",
      texto:
        "Os rastreadores armazenados no seu dispositivo, ou qualquer outro elemento utilizado para identificação ou rastreabilidade, não são mantidos por mais de seis (6) meses. Após esse período, nos reservamos o direito de anonimizar os dados para fins estatísticos.",
    },
    { tipo: "subtitulo", texto: "Bom funcionamento e otimização dos nossos serviços" },
    {
      tipo: "paragrafo",
      texto:
        "Os dados coletados com a finalidade de melhorar nossos serviços e estabelecer estatísticas são mantidos pelo período máximo de um ano.",
    },
    { tipo: "subtitulo", texto: "Gestão de litígios" },
    {
      tipo: "paragrafo",
      texto:
        "Os dados utilizados para fins de qualquer disputa ou processo judicial relativo ao uso do nosso site serão retidos durante o período do processo em andamento e até decisão judicial final.",
    },
    { tipo: "subtitulo", texto: "Solicitações e exercício de direitos" },
    {
      tipo: "paragrafo",
      texto:
        "Quando você entra em contato conosco para solicitar assistência, relatar um problema ou exercer um dos seus direitos decorrentes da LGPD, seus dados são mantidos pelo tempo necessário para processar sua solicitação.",
    },
    {
      tipo: "paragrafo",
      texto:
        "Dados financeiros e de transação poderão ser mantidos por até 5 anos, conforme exigência fiscal e de prevenção à lavagem de dinheiro.",
    },
    {
      tipo: "paragrafo",
      texto:
        "Adotamos medidas técnicas e administrativas para proteger os dados pessoais contra acessos não autorizados e situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou difusão, incluindo criptografia, controle de acesso, monitoramento de servidores e backup seguro.",
    },

    { tipo: "titulo", texto: "7. Prevenção à lavagem de dinheiro e compliance" },
    {
      tipo: "paragrafo",
      texto: `A ${org.supporter} observa as boas práticas de compliance e prevenção à lavagem de dinheiro, podendo realizar verificações de identidade (KYC) e manter registros de transações conforme exigido pela legislação vigente e autoridades competentes.`,
    },

    {
      tipo: "titulo",
      texto: "8. Como você pode acessar os dados pessoais que temos sobre você?",
    },
    {
      tipo: "paragrafo",
      texto: `Você tem o direito de acessar seus dados pessoais para obter a comunicação dos mesmos e, quando aplicável, para obter a retificação ou o apagamento destes, entrando em contato pelo e-mail ${contatoLegal} ou pelo WhatsApp ${org.whatsappDisplay}.`,
    },
    {
      tipo: "paragrafo",
      texto:
        "Lembramos também que qualquer pessoa pode, por motivos legítimos, solicitar a limitação do tratamento dos dados que lhe digam respeito ou opor-se a esse tratamento. Em caso de retificação, eliminação ou limitação de tratamento, comunicaremos tais modificações às pessoas a quem tivermos comunicado seus dados, salvo se tal comunicação se revelar impossível.",
    },

    { tipo: "titulo", texto: "9. Transferência internacional de dados" },
    {
      tipo: "paragrafo",
      texto:
        "Alguns dos terceiros com quem compartilhamos seus dados podem estar localizados ou possuir instalações localizadas em países estrangeiros. Nessas condições, seus dados pessoais permanecem sujeitos à Lei Geral de Proteção de Dados e às demais legislações brasileiras de proteção de dados.",
    },
    {
      tipo: "paragrafo",
      texto: `A ${org.supporter} se compromete a sempre adotar eficientes padrões de segurança cibernética e de proteção de dados, nos melhores esforços de garantir e cumprir as exigências legislativas.`,
    },
    {
      tipo: "paragrafo",
      texto:
        "Ao concordar com esta Política de Privacidade, você concorda com esse compartilhamento, que se dará conforme as finalidades descritas neste instrumento.",
    },

    { tipo: "titulo", texto: "10. Alterações desta política" },
    {
      tipo: "paragrafo",
      texto:
        "A atual versão desta Política de Privacidade foi formulada e atualizada pela última vez em julho de 2026.",
    },
    {
      tipo: "paragrafo",
      texto:
        "Reservamos o direito de modificar esta Política a qualquer tempo, principalmente em função da adequação a eventuais alterações feitas em nosso site ou em âmbito legislativo. Eventuais alterações entrarão em vigor a partir de sua publicação em nosso site e sempre notificaremos as mudanças ocorridas.",
    },
    {
      tipo: "paragrafo",
      texto:
        "Ao utilizar nossos serviços e fornecer seus dados pessoais após tais modificações, você as consente.",
    },

    { tipo: "titulo", texto: "11. Cookies" },
    {
      tipo: "paragrafo",
      texto: `Como muitas outras organizações, a ${org.supporter} utiliza cookies no site do ${org.name}. Esta seção fornece informações sobre como utilizamos cookies e como você pode, quando possível, controlá-los. Seguindo adiante na sua navegação, você declara ter conhecimento desta seção e concordar com ela.`,
    },
    { tipo: "subtitulo", texto: "O que são cookies" },
    {
      tipo: "paragrafo",
      texto:
        "Cookies são pequenos programas descarregados no seu computador ou dispositivo móvel quando você visita um site. Eles permitem reconhecê-lo, adequando a sua navegação às suas preferências manifestadas em navegações anteriores, ajudam a navegar entre páginas de forma eficiente e, geralmente, melhoram sua experiência.",
    },
    { tipo: "subtitulo", texto: "Como gerir e eliminar cookies" },
    {
      tipo: "paragrafo",
      texto:
        "Respeitamos as suas preferências. O site ainda não possui uma central de preferências de cookies própria; até que ela esteja disponível, você pode gerenciar ou eliminar cookies diretamente nas configurações do seu navegador a qualquer momento. Se você optar por eliminar ou recusar cookies, pode ser que não consiga utilizar todas as funcionalidades do site.",
    },
    { tipo: "subtitulo", texto: "Mudança nesta seção" },
    {
      tipo: "paragrafo",
      texto:
        "Podemos modificar esta seção a qualquer momento, a nosso exclusivo critério, e todas as modificações entrarão em vigor imediatamente após a publicação no site.",
    },

    { tipo: "titulo", texto: "12. Contato" },
    {
      tipo: "paragrafo",
      texto:
        "Em caso de dúvidas, solicitações ou exercício de direitos, entre em contato conosco:",
    },
    contato[1],
  ],
};

/* ------------------------------------------------------------------ */

export const termosDeUso: DocumentoLegal = {
  slug: "termos-de-uso",
  titulo: "Termos e Condições de Uso",
  rotulo: "Termos de Uso",
  resumo: `Os termos que regem o uso do site da campanha ${org.name}, operado pela ${org.supporter}.`,
  atualizado: "julho de 2026",
  blocos: [
    {
      tipo: "paragrafo",
      texto: `Bem-vindo(a) ao site do ${org.name}, operado pela ${org.supporter} ("${org.supporter}") e localizado em https://doe.caioprotetor.org/ (o "Site"). Os seguintes termos e condições ("Termos") regem o uso deste Site/APP. Ao acessar, visualizar ou usar o conteúdo, material ou serviços disponíveis neste Site ou por meio dele, você indica que leu e compreendeu estes Termos, que concorda com eles e pretende estar legalmente vinculado a eles. Se você não concordar com estes Termos, ou se tiver menos de 18 anos de idade, você não tem permissão para usar este Site e deve sair imediatamente.`,
    },

    { tipo: "titulo", texto: "1. Finalidade informativa" },
    {
      tipo: "paragrafo",
      texto: `As informações contidas neste Site/APP são exclusivamente para fins informativos. Sem limitar qualquer outra disposição destes Termos ou de outra forma, a ${org.supporter} não é responsável por quaisquer erros ou omissões no Site/APP ou nos Materiais do Site, conforme definidos na Seção 3 destes Termos e Condições.`,
    },

    { tipo: "titulo", texto: "2. Registro" },
    {
      tipo: "paragrafo",
      texto: `Para acessar determinados conteúdos, serviços ou benefícios no Site, você poderá ser solicitado a se registrar e criar uma conta. Como parte do processo de registro, você deverá concordar com estes Termos e, em seguida, poderá ser solicitado a escolher um nome de usuário e senha. Também poderá ser exigido que você forneça à ${org.supporter} certas informações sobre si mesmo, incluindo alguns tipos de informações pessoais, como seu e-mail e endereço. Você é totalmente responsável por sua conta, inclusive pelo uso dela por terceiros, e por manter a confidencialidade da sua senha. Você pode encerrar sua conta a qualquer momento entrando em contato conosco pelo e-mail ${contatoLegal}.`,
    },

    { tipo: "titulo", texto: "3. Direitos de propriedade" },
    {
      tipo: "paragrafo",
      texto: `Entre você e a ${org.supporter}, a ${org.supporter} é proprietária ou licenciada de todos os dados, conteúdos, gráficos, formulários, obras de arte, imagens, fotografias, componentes funcionais, conceitos de software, documentação e outros materiais contidos ou disponibilizados no Site/APP ("Materiais do Site/APP"), bem como da seleção, coordenação, organização e aprimoramento desses materiais. Todos os Materiais do Site/APP são protegidos por leis de direitos autorais, marcas registradas, patentes e outras leis aplicáveis.`,
    },
    {
      tipo: "paragrafo",
      texto: `Você concorda em não remover ou alterar quaisquer avisos de direitos autorais ou de propriedade contidos nos Materiais do Site/APP. Todos os nomes, marcas registradas, logotipos, slogans e símbolos exibidos no Site pertencem à ${org.supporter}. O uso indevido dessas marcas é expressamente proibido e pode violar a legislação de marcas registradas. Sob nenhuma circunstância você terá quaisquer direitos sobre os Materiais do Site/APP, exceto o direito de utilizá-los de acordo com estes Termos.`,
    },

    { tipo: "titulo", texto: "4. Atividades não autorizadas" },
    { tipo: "paragrafo", texto: "Você concorda em não utilizar o Site/APP para:" },
    {
      tipo: "lista",
      itens: [
        "fins ilegais ou não autorizados que violem leis locais, nacionais ou internacionais;",
        `modificar, copiar, distribuir, exibir, reproduzir, publicar, licenciar, criar obras derivadas ou vender Materiais do Site/APP sem autorização escrita da ${org.supporter};`,
        `tentar obter acesso não autorizado aos sistemas da ${org.supporter} ou interferir no funcionamento do Site/APP;`,
        "contornar, desativar ou danificar recursos de segurança do Site/APP.",
      ],
    },
    {
      tipo: "paragrafo",
      texto: `O uso não autorizado poderá causar danos irreparáveis à ${org.supporter}, e, nesses casos, a ${org.supporter} poderá buscar medidas judiciais.`,
    },

    { tipo: "titulo", texto: "5. Materiais enviados ao site" },
    {
      tipo: "paragrafo",
      texto:
        "Certos recursos do Site/APP podem permitir que você envie conteúdos de usuário (comentários, textos, imagens, arquivos etc.). Ao publicar, você declara possuir direito legal de disponibilizar esse conteúdo e que seu uso não viola direitos autorais, de imagem, privacidade ou leis aplicáveis.",
    },
    {
      tipo: "paragrafo",
      texto: `Ao enviar conteúdo, você concede à ${org.supporter} uma licença mundial, perpétua, irrevogável e transferível para usar, distribuir, reproduzir, exibir, modificar e sublicenciar o conteúdo, sem qualquer compensação.`,
    },
    {
      tipo: "paragrafo",
      texto:
        "Se você acreditar que algum conteúdo no Site/APP viola seus direitos, siga o Procedimento de Reclamação descrito na Seção 12.",
    },

    { tipo: "titulo", texto: "6. Sites e conteúdos de terceiros" },
    {
      tipo: "paragrafo",
      texto: `O Site/APP pode conter links para outros sites na Internet apenas para sua conveniência. O uso desses links é por sua conta e risco. A ${org.supporter} não recomenda, endossa nem se responsabiliza pelo conteúdo, precisão das informações, produtos ou serviços fornecidos por sites de terceiros.`,
    },

    { tipo: "titulo", texto: "7. Política de privacidade" },
    {
      tipo: "paragrafo",
      texto: `Qualquer informação pessoal fornecida à ${org.supporter} está sujeita à nossa Política de Privacidade, que é incorporada a estes Termos por referência. A confidencialidade de qualquer comunicação enviada pela Internet não pode ser garantida, incluindo informações pessoais como nome ou endereço.`,
    },

    { tipo: "titulo", texto: "8. Isenção de responsabilidade" },
    {
      tipo: "paragrafo",
      texto: `A ${org.supporter} não garante a precisão, integridade ou qualidade dos materiais, produtos ou serviços do Site/APP. O Site/APP e todo o seu conteúdo são fornecidos "como estão" e "com todas as falhas".`,
    },
    {
      tipo: "paragrafo",
      texto: `A ${org.supporter} não oferece garantias expressas ou implícitas, incluindo garantias de comercialização, adequação a uma finalidade específica, precisão ou não violação de direitos. Todo o risco relativo ao uso é de responsabilidade do usuário.`,
    },

    { tipo: "titulo", texto: "9. Limitação de responsabilidade" },
    {
      tipo: "paragrafo",
      texto: `A ${org.supporter} não será responsável por danos diretos, indiretos, especiais, incidentais, consequenciais, punitivos ou exemplares, incluindo perda de lucros, resultantes do uso ou impossibilidade de uso do Site/APP.`,
    },
    {
      tipo: "paragrafo",
      texto:
        "Se você estiver insatisfeito com o Site/APP ou com os Termos, seu único recurso é interromper o uso do Site.",
    },

    { tipo: "titulo", texto: "10. Indenização" },
    {
      tipo: "paragrafo",
      texto: `Você concorda em indenizar e manter a ${org.supporter}, seus diretores, funcionários e agentes isentos de qualquer reclamação, perda, dano, custo ou despesa (incluindo honorários advocatícios) decorrentes de:`,
    },
    {
      tipo: "lista",
      itens: [
        "uso do Site;",
        "violação da lei;",
        "conduta dolosa ou negligente; ou",
        "violação destes Termos.",
      ],
    },
    {
      tipo: "paragrafo",
      texto: `A ${org.supporter} poderá assumir a defesa de qualquer reivindicação, e você deverá cooperar razoavelmente nesse processo.`,
    },

    { tipo: "titulo", texto: "11. Segurança na internet" },
    {
      tipo: "paragrafo",
      texto: `A ${org.supporter} emprega esforços razoáveis para manter o Site/APP disponível, mas não garante acesso contínuo. A transmissão de dados pela Internet pode ocorrer sem criptografia e envolver diferentes redes, o que pode comprometer a segurança das informações.`,
    },

    { tipo: "titulo", texto: "12. Procedimentos de reclamação" },
    {
      tipo: "paragrafo",
      texto: `Se você acreditar que algum conteúdo no Site/APP viola seus direitos, envie um e-mail para ${contatoLegal} com uma mensagem detalhada contendo:`,
    },
    {
      tipo: "lista",
      itens: [
        "seu nome e, se aplicável, o nome da empresa;",
        "informações de contato (incluindo e-mail);",
        "natureza e detalhes da reclamação, com o conteúdo questionado;",
        "a declaração transcrita abaixo.",
      ],
    },
    {
      tipo: "destaque",
      texto:
        "As declarações e afirmações feitas nesta mensagem são verdadeiras, completas e precisas, e tenho autoridade legal plena para fazê-las e para formular as solicitações aqui apresentadas.",
    },

    { tipo: "titulo", texto: "13. Alterações a estes termos; rescisão" },
    {
      tipo: "paragrafo",
      texto: `A ${org.supporter} reserva-se o direito de modificar ou atualizar estes Termos a qualquer momento. O uso contínuo do Site/APP após as alterações implica concordância com os novos Termos.`,
    },
    {
      tipo: "paragrafo",
      texto: `A ${org.supporter} pode suspender ou encerrar sua conta por violação destes Termos, fornecimento de informações falsas, infração de direitos ou por qualquer outro motivo.`,
    },

    { tipo: "titulo", texto: "14. Lei aplicável e jurisdição" },
    {
      tipo: "paragrafo",
      texto:
        "Estes Termos são regidos por leis brasileiras, e qualquer disputa será resolvida nos tribunais do Brasil. Ao usar o Site/APP, você concorda com essa jurisdição.",
    },

    { tipo: "titulo", texto: "15. Disposições gerais" },
    {
      tipo: "paragrafo",
      texto: `O Site/APP é controlado e operado a partir do Brasil. A ${org.supporter} não garante que o conteúdo seja apropriado para uso em outros locais. O acesso a partir de territórios onde o conteúdo é ilegal é proibido.`,
    },
    {
      tipo: "paragrafo",
      texto: `A falha da ${org.supporter} em exercer qualquer direito não constitui renúncia futura. Os títulos das seções são apenas para referência. Nenhum terceiro é considerado beneficiário destes Termos.`,
    },

    { tipo: "titulo", texto: "16. Doações" },
    {
      tipo: "paragrafo",
      texto: `As doações realizadas através desta plataforma são tratadas conforme nossa Política de Doação. As doações são voluntárias, processadas via Pix por meio da Infopago em parceria de integração de checkout com a Lusa, e não geram qualquer obrigação contratual para a ${org.supporter} além da aplicação dos recursos nos fins declarados.`,
    },

    ...contato,
  ],
};

/* ------------------------------------------------------------------ */

export const politicaDoacao: DocumentoLegal = {
  slug: "politica-de-doacao",
  titulo: "Política de Doação",
  rotulo: "Política de Doação",
  resumo: `Como as doações da campanha ${org.name} são recebidas, aplicadas e prestadas contas pela ${org.supporter}.`,
  atualizado: "julho de 2026",
  blocos: [
    { tipo: "titulo", texto: "1. Sobre a organização" },
    {
      tipo: "paragrafo",
      texto: `A ${org.supporter} (CNPJ ${org.cnpj}) é uma organização sem fins lucrativos legalmente constituída, responsável pelo recebimento e gestão das doações da campanha ${org.name}. Todas as doações são registradas e aplicadas nas atividades de proteção animal descritas abaixo, sem retenção de taxas administrativas sobre o valor recebido via Pix.`,
    },

    { tipo: "titulo", texto: "2. Como as doações são utilizadas" },
    {
      tipo: "lista",
      itens: [
        "Alimentação: ração, suplementos e alimentos especiais para animais em recuperação",
        "Cuidados veterinários: consultas, exames, cirurgias, medicamentos e tratamentos",
        "Infraestrutura dos abrigos: manutenção, higiene e adaptações nos espaços",
        "Castração e controle populacional: prevenção do abandono",
        "Resgates: transporte e primeiros socorros em campo",
      ],
    },
    {
      tipo: "paragrafo",
      texto: `Relatórios de prestação de contas estão disponíveis sob demanda. Entre em contato pelo WhatsApp ${org.whatsappDisplay} para solicitar.`,
    },

    { tipo: "titulo", texto: "3. Métodos de pagamento" },
    {
      tipo: "paragrafo",
      texto:
        "As doações são processadas exclusivamente via Pix, sistema de pagamento instantâneo regulamentado pelo Banco Central do Brasil. Isso garante:",
    },
    {
      tipo: "lista",
      itens: [
        "Transação imediata e rastreável",
        "Sem taxas para o doador",
        "Comprovante disponível diretamente no aplicativo do banco",
        "Segurança assegurada pela infraestrutura do sistema bancário nacional",
      ],
    },
    { tipo: "destaque", texto: `Chave Pix: ${pix.key}` },

    { tipo: "titulo", texto: "4. Doações dedutíveis de imposto de renda" },
    {
      tipo: "paragrafo",
      texto: `A ${org.supporter} está em processo de regularização para enquadramento como entidade beneficente. Recomendamos consultar seu contador para verificar as condições atuais de dedutibilidade fiscal das doações realizadas.`,
    },

    { tipo: "titulo", texto: "5. Política de reembolso" },
    {
      tipo: "paragrafo",
      texto:
        "Doações têm caráter voluntário e, como regra geral, são irrevogáveis após o processamento. No entanto, analisamos solicitações de reembolso em casos de:",
    },
    {
      tipo: "lista",
      itens: [
        "Duplicidade de transação comprovada",
        "Erro técnico no sistema de pagamento",
        "Cobrança indevida documentada",
      ],
    },
    {
      tipo: "paragrafo",
      texto: `Para solicitar reembolso, entre em contato em até 7 dias corridos após a transação, pelo WhatsApp ${org.whatsappDisplay}, com o comprovante Pix em mãos.`,
    },

    { tipo: "titulo", texto: "6. Transparência e prestação de contas" },
    {
      tipo: "paragrafo",
      texto:
        "Comprometemo-nos com a transparência total no uso dos recursos. Disponibilizamos:",
    },
    {
      tipo: "lista",
      itens: [
        "Documentação da organização (CNPJ, estatuto, certidões) mediante solicitação",
        "Atualizações regulares nas redes sociais sobre o uso das doações",
        "Relatório fotográfico e financeiro para doadores que solicitarem",
      ],
    },

    { tipo: "titulo", texto: "7. Proteção dos dados do doador" },
    {
      tipo: "paragrafo",
      texto:
        "Os dados fornecidos durante a doação são tratados conforme nossa Política de Privacidade. Não compartilhamos informações dos doadores com terceiros para fins comerciais.",
    },

    { tipo: "titulo", texto: "8. Menores de idade" },
    {
      tipo: "paragrafo",
      texto:
        "Doações são de responsabilidade exclusiva de quem realiza a transação via Pix. Menores de 18 anos não devem realizar doações sem autorização e supervisão direta de seus responsáveis legais, cabendo a estes a verificação prévia à efetivação da doação.",
    },

    ...contato,
  ],
};

/** Os três documentos, na ordem em que o rodapé e o menu os listam. */
export const documentosLegais = [politicaDoacao, politicaPrivacidade, termosDeUso];
