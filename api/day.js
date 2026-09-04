function normalize(text = "") {
  return String(text)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#039;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}


function stripTags(html = "") {
  return normalize(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "\n")
  );
}


function parseDate(value) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date =
    new Date(Date.UTC(year, month - 1, day, 12));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}


function firstSundayOfAdvent(year) {
  const start =
    new Date(Date.UTC(year, 10, 27, 12));

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);

    date.setUTCDate(
      start.getUTCDate() + i
    );

    if (date.getUTCDay() === 0) {
      return date;
    }
  }

  return null;
}


function sundayCycle(date) {
  const civilYear =
    date.getUTCFullYear();

  const advent =
    firstSundayOfAdvent(civilYear);

  let liturgicalYear =
    civilYear;

  if (
    advent &&
    date.getTime() >= advent.getTime()
  ) {
    liturgicalYear =
      civilYear + 1;
  }

  const mod =
    liturgicalYear % 3;

  if (mod === 1) return "A";
  if (mod === 2) return "B";

  return "C";
}


/* =========================
   IDENTIFICAÇÃO DO TÍTULO
========================= */

function findCelebration(text) {
  const lines =
    text
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);


  /*
    O Pocket Terço costuma apresentar
    próximo do início algo como:

    Liturgia do dia 08/09/2026
    Natividade de Nossa Senhora

    ou:

    4ª feira da 23ª Semana do Tempo Comum
  */


  for (let i = 0; i < lines.length; i++) {

    const line = lines[i];

    if (
      /Liturgia do dia/i.test(line)
    ) {

      /*
        Procura nas linhas logo seguintes
        o nome litúrgico principal.
      */

      for (
        let j = i + 1;
        j <= i + 8 && j < lines.length;
        j++
      ) {

        const candidate =
          lines[j].trim();

        if (
          candidate.length < 3
        ) {
          continue;
        }


        if (
          /Antífona/i.test(candidate) ||
          /Ordinário da Missa/i.test(candidate) ||
          /Gradual/i.test(candidate) ||
          /Sugestões/i.test(candidate)
        ) {
          continue;
        }


        return candidate;
      }
    }
  }


  /*
    Plano B:
    procura diretamente expressões
    típicas do calendário brasileiro.
  */

  const candidates =
    lines.filter(line =>
      (
        /Semana do Tempo Comum/i.test(line) ||
        /Domingo.*Tempo Comum/i.test(line) ||
        /Domingo.*Advento/i.test(line) ||
        /Domingo.*Quaresma/i.test(line) ||
        /Domingo.*Páscoa/i.test(line) ||
        /Natal do Senhor/i.test(line) ||
        /Natividade/i.test(line) ||
        /Assunção/i.test(line) ||
        /Imaculada/i.test(line) ||
        /São |Santa |Santos |Santas /i.test(line)
      )
    );


  if (candidates.length) {
    return candidates[0];
  }


  return "Liturgia do dia";
}


/* =========================
   GRAU DA CELEBRAÇÃO
========================= */

function detectRank(text, celebration) {
  const combined =
    `${celebration} ${text}`
      .toUpperCase();


  if (
    combined.includes("SOLENIDADE")
  ) {
    return "Solenidade";
  }


  if (
    combined.includes("FESTA")
  ) {
    return "Festa";
  }


  if (
    combined.includes("MEMÓRIA OBRIGATÓRIA") ||
    combined.includes("MEMORIA OBRIGATORIA")
  ) {
    return "Memória";
  }


  if (
    combined.includes("MEMÓRIA FACULTATIVA") ||
    combined.includes("MEMORIA FACULTATIVA")
  ) {
    return "Memória facultativa";
  }


  if (
    /DOMINGO/i.test(celebration)
  ) {
    return "Domingo";
  }


  return "";
}


/* =========================
   COR LITÚRGICA
========================= */

function detectColor(text, celebration, rank) {
  const value =
    `${celebration} ${rank} ${text}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();


  /*
    Quando a própria página contém
    indicação explícita de cor,
    ela tem prioridade.
  */

  if (
    /COR LITURGICA.{0,30}BRANCO/.test(value) ||
    /COR.{0,15}BRANCA/.test(value)
  ) {
    return "Branco";
  }


  if (
    /COR LITURGICA.{0,30}VERDE/.test(value)
  ) {
    return "Verde";
  }


  if (
    /COR LITURGICA.{0,30}VERMELH/.test(value)
  ) {
    return "Vermelho";
  }


  if (
    /COR LITURGICA.{0,30}ROX/.test(value) ||
    /COR LITURGICA.{0,30}VIOLET/.test(value)
  ) {
    return "Roxo";
  }


  if (
    /COR LITURGICA.{0,30}ROSA/.test(value)
  ) {
    return "Rosa";
  }


  /*
    Se a página não expuser a cor
    de forma legível no HTML,
    usamos regras litúrgicas seguras.
  */


  /*
    Mártires, Paixão, Pentecostes etc.
  */

  if (
    value.includes("MARTIR") ||
    value.includes("MARTIRES") ||
    value.includes("PAIXAO DO SENHOR") ||
    value.includes("PENTECOSTES")
  ) {
    return "Vermelho";
  }


  /*
    Advento e Quaresma.
  */

  if (
    value.includes("ADVENTO") ||
    value.includes("QUARESMA") ||
    value.includes("CINZAS")
  ) {
    return "Roxo";
  }


  /*
    Celebrações do Senhor, de Nossa Senhora,
    anjos e santos não mártires.
  */

  if (
    value.includes("NATAL") ||
    value.includes("PASCOA") ||
    value.includes("NATIVIDADE DA VIRGEM") ||
    value.includes("NOSSA SENHORA") ||
    value.includes("VIRGEM MARIA") ||
    value.includes("IMACULADA") ||
    value.includes("ASSUNCAO") ||
    value.includes("TRANSFIGURACAO") ||
    value.includes("SAO JOSE") ||
    value.includes("ANJOS") ||
    value.includes("ARCANJOS")
  ) {
    return "Branco";
  }


  /*
    Tempo Comum ferial e domingos.
  */

  if (
    value.includes("TEMPO COMUM")
  ) {
    return "Verde";
  }


  return "";
}


/* =========================
   TEMPO LITÚRGICO
========================= */

function detectSeason(text, celebration) {
  const value =
    `${celebration} ${text}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();


  if (
    value.includes("ADVENTO")
  ) {
    return "Advento";
  }


  if (
    value.includes("NATAL")
  ) {
    return "Tempo do Natal";
  }


  if (
    value.includes("QUARESMA") ||
    value.includes("CINZAS")
  ) {
    return "Quaresma";
  }


  if (
    value.includes("TEMPO PASCAL") ||
    value.includes("PASCOA")
  ) {
    return "Tempo Pascal";
  }


  if (
    value.includes("TEMPO COMUM")
  ) {
    return "Tempo Comum";
  }


  return "";
}


/* =========================
   HANDLER
========================= */

module.exports =
async function handler(req, res) {

  const rawDate =
    req.query.date;

  const date =
    parseDate(rawDate);


  if (!date) {

    return res
      .status(400)
      .json({
        error:
          "Informe uma data válida em ?date=AAAA-MM-DD"
      });

  }


  try {

    const day =
      String(
        date.getUTCDate()
      ).padStart(2, "0");

    const month =
      String(
        date.getUTCMonth() + 1
      ).padStart(2, "0");

    const year =
      date.getUTCFullYear();


    /*
      MESMA FONTE DA LITURGIA
      UTILIZADA NO APP.
    */

    const url =
      `https://pocketterco.com.br/liturgia/${day}/${month}/${year}`;


    const response =
      await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });


    if (!response.ok) {

      throw new Error(
        `Pocket Terço respondeu ${response.status}`
      );

    }


    const html =
      await response.text();

    const text =
      stripTags(html);


    const celebration =
      findCelebration(text);


    const rank =
      detectRank(
        text,
        celebration
      );


    const color =
      detectColor(
        text,
        celebration,
        rank
      );


    const season =
      detectSeason(
        text,
        celebration
      );


    const isSunday =
      date.getUTCDay() === 0;


    const cycle =
      isSunday
        ? sundayCycle(date)
        : "";


    return res
      .status(200)
      .json({

        date: rawDate,

        celebration,

        rank,

        color,

        season,

        cycle,

        source:
          "Pocket Terço / textos litúrgicos brasileiros"

      });


  } catch (error) {

    console.error(
      "Day API error:",
      error
    );


    return res
      .status(500)
      .json({

        error:
          "Não foi possível identificar os dados litúrgicos desta data.",

        detail:
          error.message

      });

  }
};
