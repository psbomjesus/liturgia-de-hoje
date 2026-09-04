function decodeHtml(text = "") {
  return String(text)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&Aacute;/gi, "Á")
    .replace(/&Eacute;/gi, "É")
    .replace(/&Iacute;/gi, "Í")
    .replace(/&Oacute;/gi, "Ó")
    .replace(/&Uacute;/gi, "Ú")
    .replace(/&atilde;/gi, "ã")
    .replace(/&otilde;/gi, "õ")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&ordf;/gi, "ª")
    .replace(/&ordm;/gi, "º")
    .replace(/\s+/g, " ")
    .trim();
}


function stripTags(text = "") {
  return decodeHtml(
    String(text)
      .replace(/<[^>]+>/g, " ")
  );
}


function normalize(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
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


/* =========================
   TÍTULO DA CELEBRAÇÃO
========================= */

function extractCelebration(html) {

  /*
    O título litúrgico principal
    do Pocket Terço está no primeiro H1.

    Exemplo:
    <h1>6ª feira da 22ª Semana do Tempo Comum</h1>
  */

  const match =
    html.match(
      /<h1\b[^>]*>([\s\S]*?)<\/h1>/i
    );

  if (!match) {
    return "Liturgia do dia";
  }

  return stripTags(match[1]);
}


/* =========================
   GRAU LITÚRGICO
========================= */

function extractRank(celebration) {
  const value =
    normalize(celebration);


  if (
    value.includes("SOLENIDADE")
  ) {
    return "Solenidade";
  }


  if (
    value.includes("FESTA")
  ) {
    return "Festa";
  }


  if (
    value.includes("MEMORIA")
  ) {
    return "Memória";
  }


  if (
    value.includes("DOMINGO")
  ) {
    return "Domingo";
  }


  return "";
}


/* =========================
   LIMPEZA DO TÍTULO
========================= */

function cleanCelebrationTitle(
  celebration
) {
  /*
    Se o próprio H1 já disser:
    "Natividade ..., Festa"

    deixamos "Festa" para o campo rank
    e retiramos do nome principal.
  */

  return celebration
    .replace(
      /,\s*Solenidade\s*$/i,
      ""
    )
    .replace(
      /,\s*Festa\s*$/i,
      ""
    )
    .replace(
      /,\s*Memória(?:\s+obrigatória|\s+facultativa)?\s*$/i,
      ""
    )
    .trim();
}


/* =========================
   TEMPO LITÚRGICO
========================= */

function detectSeason(celebration) {
  const value =
    normalize(celebration);


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
    value.includes("PASCOA") ||
    value.includes("TEMPO PASCAL")
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
   COR LITÚRGICA
========================= */

function detectColor(
  celebration,
  season
) {
  const value =
    normalize(celebration);


  /*
    VERMELHO
  */

  if (
    value.includes("PENTECOSTES") ||
    value.includes("PAIXAO DO SENHOR") ||
    value.includes("DOMINGO DE RAMOS") ||
    value.includes("EXALTACAO DA SANTA CRUZ") ||
    value.includes("MARTIR") ||
    value.includes("MARTIRES") ||
    value.includes("APOSTOLO") ||
    value.includes("APOSTOLOS") ||
    value.includes("EVANGELISTA")
  ) {
    return "Vermelho";
  }


  /*
    ROXO
  */

  if (
    season === "Advento" ||
    season === "Quaresma"
  ) {
    return "Roxo";
  }


  /*
    VERDE
  */

  if (
    season === "Tempo Comum"
  ) {
    return "Verde";
  }


  /*
    BRANCO:
    Natal, Páscoa e festas do Senhor,
    Nossa Senhora, anjos e santos
    não mártires.
  */

  if (
    season === "Tempo do Natal" ||
    season === "Tempo Pascal" ||

    value.includes("VIRGEM MARIA") ||
    value.includes("NOSSA SENHORA") ||
    value.includes("NATIVIDADE DA BEM-AVENTURADA VIRGEM") ||
    value.includes("IMACULADA CONCEICAO") ||
    value.includes("ASSUNCAO") ||
    value.includes("APRESENTACAO DO SENHOR") ||
    value.includes("TRANSFIGURACAO") ||
    value.includes("SAO JOSE") ||
    value.includes("SANTISSIMA TRINDADE") ||
    value.includes("CORPO E SANGUE DE CRISTO") ||
    value.includes("CORPUS CHRISTI") ||
    value.includes("SAGRADO CORACAO") ||
    value.includes("ANJO") ||
    value.includes("ARCANJO")
  ) {
    return "Branco";
  }


  /*
    Se for Festa ou Solenidade
    sem característica de mártir,
    branco é o caso mais comum.
  */

  if (
    value.includes("FESTA") ||
    value.includes("SOLENIDADE")
  ) {
    return "Branco";
  }


  return "";
}


/* =========================
   ANO A / B / C
========================= */

function firstSundayOfAdvent(year) {
  const start =
    new Date(
      Date.UTC(
        year,
        10,
        27,
        12
      )
    );


  for (
    let i = 0;
    i < 7;
    i++
  ) {
    const date =
      new Date(start);

    date.setUTCDate(
      start.getUTCDate() + i
    );

    if (
      date.getUTCDay() === 0
    ) {
      return date;
    }
  }


  return null;
}


function sundayCycle(date) {
  const civilYear =
    date.getUTCFullYear();

  const advent =
    firstSundayOfAdvent(
      civilYear
    );

  let liturgicalYear =
    civilYear;


  if (
    advent &&
    date.getTime() >=
      advent.getTime()
  ) {
    liturgicalYear =
      civilYear + 1;
  }


  const mod =
    liturgicalYear % 3;


  if (mod === 1) {
    return "A";
  }

  if (mod === 2) {
    return "B";
  }

  return "C";
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


    const url =
      `https://pocketterco.com.br/liturgia/${day}/${month}/${year}`;


    const response =
      await fetch(
        url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0"
          }
        }
      );


    if (!response.ok) {

      throw new Error(
        `Pocket Terço respondeu ${response.status}`
      );

    }


    const html =
      await response.text();


    /*
      Agora pegamos SOMENTE o H1.
    */

    const rawCelebration =
      extractCelebration(html);


    const rank =
      extractRank(
        rawCelebration
      );


    const celebration =
      cleanCelebrationTitle(
        rawCelebration
      );


    const season =
      detectSeason(
        rawCelebration
      );


    const color =
      detectColor(
        rawCelebration,
        season
      );


    const isSunday =
      date.getUTCDay() === 0;


    const cycle =
      isSunday
        ? sundayCycle(date)
        : "";


    res.setHeader(
      "Cache-Control",
      "public, max-age=3600, s-maxage=86400"
    );


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
          "Pocket Terço"
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
