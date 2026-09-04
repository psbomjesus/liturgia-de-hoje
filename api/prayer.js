const { PDFDocument } = require("pdf-lib");
const pdfParse = require("pdf-parse");

const BASE =
  "https://liturgia.pt/oracaouniversal";

const URLS = {
  ferial: {
    advento:
      `${BASE}/ferial/01UnivFerialSNLAdvento.pdf`,

    natal:
      `${BASE}/ferial/02UnivFerialSNLNatal.pdf`,

    quaresma:
      `${BASE}/ferial/03UnivFerialSNLQuaresma.pdf`,

    pascal:
      `${BASE}/ferial/04UnivFerialSNLTempoPascal.pdf`,

    comumImpar:
      `${BASE}/ferial/05UnivFerialSNLTCImpar.pdf`,

    comumPar:
      `${BASE}/ferial/06UnivFerialSNLTCPar.pdf`,

    santoral:
      `${BASE}/ferial/07UnivFerialSNLSantoral.pdf`
  },

  domingo: {
    A: {
      advento:
        `${BASE}/dominical/01_01_Dom_A_Adv.pdf`,
      natal:
        `${BASE}/dominical/01_02_Dom_A_Nat.pdf`,
      quaresma:
        `${BASE}/dominical/01_03_Dom_A_Qua.pdf`,
      pascal:
        `${BASE}/dominical/01_05_Dom_A_Pas.pdf`,
      comum:
        `${BASE}/dominical/01_06_Dom_A_TCom.pdf`
    },

    B: {
      advento:
        `${BASE}/dominical/02_01_Dom_B_Adv.pdf`,
      natal:
        `${BASE}/dominical/02_02_Dom_B_Nat.pdf`,
      quaresma:
        `${BASE}/dominical/02_03_Dom_B_Qua.pdf`,
      pascal:
        `${BASE}/dominical/02_05_Dom_B_Pas.pdf`,
      comum:
        `${BASE}/dominical/02_06_Dom_B_TCom.pdf`
    },

    C: {
      advento:
        `${BASE}/dominical/03_01_Dom_C_Adv.pdf`,
      natal:
        `${BASE}/dominical/03_02_Dom_C_Nat.pdf`,
      quaresma:
        `${BASE}/dominical/03_03_Dom_C_Qua.pdf`,
      pascal:
        `${BASE}/dominical/03_05_Dom_C_Pas.pdf`,
      comum:
        `${BASE}/dominical/03_06_Dom_C_TCom.pdf`
    }
  }
};


/* =========================
   TEXTO
========================= */

function decodeHtml(text = "") {
  return String(text)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&#39;/gi, "'")
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
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}


/* =========================
   DATA
========================= */

function parseISODate(value) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/
      .exec(value || "");

  if (!match) return null;

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        12
      )
    );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}


function weekdayName(date) {
  return [
    "DOMINGO",
    "SEGUNDA-FEIRA",
    "TERCA-FEIRA",
    "QUARTA-FEIRA",
    "QUINTA-FEIRA",
    "SEXTA-FEIRA",
    "SABADO"
  ][date.getUTCDay()];
}


function monthName(date) {
  return [
    "JANEIRO",
    "FEVEREIRO",
    "MARCO",
    "ABRIL",
    "MAIO",
    "JUNHO",
    "JULHO",
    "AGOSTO",
    "SETEMBRO",
    "OUTUBRO",
    "NOVEMBRO",
    "DEZEMBRO"
  ][date.getUTCMonth()];
}


/* =========================
   NÚMEROS ROMANOS
========================= */

function toRoman(number) {
  const values = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"]
  ];

  let result = "";
  let n = number;

  for (const [value, roman] of values) {
    while (n >= value) {
      result += roman;
      n -= value;
    }
  }

  return result;
}


/* =========================
   CALENDÁRIO BRASILEIRO
   POCKET TERÇO
========================= */

async function getBrazilianCelebration(date) {
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

  const h1 =
    html.match(
      /<h1\b[^>]*>([\s\S]*?)<\/h1>/i
    );

  if (!h1) {
    throw new Error(
      "Não foi possível identificar a celebração brasileira."
    );
  }

  return stripTags(h1[1]);
}


/* =========================
   CLASSIFICAÇÃO
========================= */

function getSeason(celebration) {
  const text =
    normalize(celebration);

  if (
    text.includes("ADVENTO")
  ) {
    return "advento";
  }

  if (
    text.includes("NATAL") ||
    text.includes("EPIFANIA") ||
    text.includes("BATISMO DO SENHOR")
  ) {
    return "natal";
  }

  if (
    text.includes("QUARESMA") ||
    text.includes("CINZAS")
  ) {
    return "quaresma";
  }

  if (
    text.includes("PASCOA") ||
    text.includes("TEMPO PASCAL") ||
    text.includes("ASCENSAO") ||
    text.includes("PENTECOSTES")
  ) {
    return "pascal";
  }

  return "comum";
}


function getWeekNumber(
  celebration
) {
  const text =
    normalize(celebration);

  const match =
    text.match(
      /(\d+)[ªº]?\s+SEMANA/
    );

  if (!match) {
    return null;
  }

  return Number(match[1]);
}


function getSundayNumber(
  celebration
) {
  const text =
    normalize(celebration);

  const match =
    text.match(
      /(\d+)[ºª]?\s+DOMINGO/
    );

  if (!match) {
    return null;
  }

  return Number(match[1]);
}


/* =========================
   É CELEBRAÇÃO PRÓPRIA?
========================= */

function isProperCelebration(
  celebration,
  date
) {
  if (
    date.getUTCDay() === 0
  ) {
    return false;
  }

  const text =
    normalize(celebration);

  if (
    text.includes("SEMANA DO TEMPO COMUM") ||
    text.includes("SEMANA DO ADVENTO") ||
    text.includes("SEMANA DA QUARESMA")
  ) {
    return false;
  }

  if (
    text.includes("FESTA") ||
    text.includes("SOLENIDADE") ||
    text.includes("MEMORIA")
  ) {
    return true;
  }

  if (
    text.includes("VIRGEM MARIA") ||
    text.includes("NOSSA SENHORA") ||
    text.includes("APOSTOLO") ||
    text.includes("EVANGELISTA") ||
    text.includes("MARTIR") ||
    text.includes("MARTIRES")
  ) {
    return true;
  }

  return false;
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

  if (mod === 1) return "A";
  if (mod === 2) return "B";

  return "C";
}


/* =========================
   BAIXAR PDF
========================= */

async function fetchPdf(url) {
  const response =
    await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

  if (!response.ok) {
    throw new Error(
      `PDF respondeu ${response.status}: ${url}`
    );
  }

  return Buffer.from(
    await response.arrayBuffer()
  );
}


/* =========================
   EXTRAIR PÁGINAS
========================= */

async function extractPages(buffer) {
  const pages = [];

  await pdfParse(buffer, {
    pagerender: async function (pageData) {
      const content =
        await pageData.getTextContent();

      const text =
        content.items
          .map(item => item.str)
          .join(" ");

      /*
        IMPORTANTE:
        nesta versão usamos push().
        O pdf-parse percorre as páginas
        em sequência.
      */

      pages.push(text);

      return text;
    }
  });

  return pages;
}


/* =========================
   LOCALIZAR PÁGINA
========================= */

async function findPage(
  buffer,
  patterns
) {
  const pages =
    await extractPages(buffer);

  const required =
    patterns
      .filter(Boolean)
      .map(normalize);

  for (
    let i = 0;
    i < pages.length;
    i++
  ) {
    const text =
      normalize(
        pages[i] || ""
      );

    const matches =
      required.every(
        pattern =>
          text.includes(pattern)
      );

    if (matches) {
      return i;
    }
  }

  return -1;
}


/* =========================
   SANTORAL
========================= */

async function findSantoral(
  date
) {
  const buffer =
    await fetchPdf(
      URLS.ferial.santoral
    );

  const pages =
    await extractPages(buffer);

  const day =
    date.getUTCDate();

  const month =
    monthName(date);

  /*
    Exige a data exata.

    Assim "7 DE SETEMBRO"
    não pode mais coincidir
    com "27 DE SETEMBRO".
  */

  const exactDateRegex =
    new RegExp(
      `(^|[^0-9])${day}\\s+DE\\s+${month}([^A-Z0-9]|$)`,
      "i"
    );

  for (
    let i = 0;
    i < pages.length;
    i++
  ) {
    const text =
      normalize(
        pages[i] || ""
      );

    if (
      exactDateRegex.test(text)
    ) {
      return {
        buffer,
        pageIndex: i
      };
    }
  }

  return {
    buffer,
    pageIndex: -1
  };
}


/* =========================
   FERIAL
========================= */

async function findFerial(
  date,
  celebration
) {
  const season =
    getSeason(celebration);

  let url;

  if (
    season === "advento"
  ) {
    url =
      URLS.ferial.advento;
  }

  else if (
    season === "natal"
  ) {
    url =
      URLS.ferial.natal;
  }

  else if (
    season === "quaresma"
  ) {
    url =
      URLS.ferial.quaresma;
  }

  else if (
    season === "pascal"
  ) {
    url =
      URLS.ferial.pascal;
  }

  else {
    url =
      date.getUTCFullYear() % 2 === 0
        ? URLS.ferial.comumPar
        : URLS.ferial.comumImpar;
  }

  const buffer =
    await fetchPdf(url);

  const weekday =
    weekdayName(date);

  const week =
    getWeekNumber(
      celebration
    );

  const patterns = [];

  if (week) {
    patterns.push(
      `SEMANA ${toRoman(week)}`
    );
  }

  patterns.push(
    weekday
  );

  const pageIndex =
    await findPage(
      buffer,
      patterns
    );

  return {
    buffer,
    pageIndex
  };
}


/* =========================
   DOMINGO
========================= */

async function findSunday(
  date,
  celebration
) {
  const cycle =
    sundayCycle(date);

  const season =
    getSeason(celebration);

  const group =
    URLS.domingo[cycle];

  const url =
    group[season] ||
    group.comum;

  const buffer =
    await fetchPdf(url);

  const number =
    getSundayNumber(
      celebration
    );

  if (!number) {
    throw new Error(
      "Não foi possível identificar o número do domingo."
    );
  }

  const roman =
    toRoman(number);

  const patterns =
    [`DOMINGO ${roman}`];

  if (
    season === "comum"
  ) {
    patterns.push(
      "TEMPO COMUM"
    );
  }

  const pageIndex =
    await findPage(
      buffer,
      patterns
    );

  return {
    buffer,
    pageIndex
  };
}


/* =========================
   CRIAR PDF DE UMA PÁGINA
========================= */

async function singlePagePdf(
  buffer,
  pageIndex
) {
  const source =
    await PDFDocument.load(
      buffer
    );

  if (
    pageIndex < 0 ||
    pageIndex >=
      source.getPageCount()
  ) {
    throw new Error(
      "Página não localizada no PDF."
    );
  }

  const output =
    await PDFDocument.create();

  const [page] =
    await output.copyPages(
      source,
      [pageIndex]
    );

  output.addPage(page);

  const bytes =
    await output.save();

  return Buffer.from(bytes);
}


/* =========================
   HANDLER
========================= */

module.exports =
async function handler(req, res) {

  const rawDate =
    req.query.date;

  const date =
    parseISODate(
      rawDate
    );

  if (!date) {
    return res
      .status(400)
      .json({
        error:
          "Informe uma data válida em ?date=AAAA-MM-DD"
      });
  }

  try {

    /*
      1. O calendário brasileiro
         define a celebração.
    */

    const celebration =
      await getBrazilianCelebration(
        date
      );

    let result;


    /*
      2. DOMINGO PRIMEIRO.

      Um santo comum nunca deve
      substituir o domingo.
    */

    if (
      date.getUTCDay() === 0
    ) {
      result =
        await findSunday(
          date,
          celebration
        );
    }


    /*
      3. DIA DE SEMANA COM
         CELEBRAÇÃO PRÓPRIA
         NO CALENDÁRIO BRASILEIRO.
    */

    else if (
      isProperCelebration(
        celebration,
        date
      )
    ) {
      result =
        await findSantoral(
          date
        );

      /*
        Se não houver formulário
        próprio correspondente no
        PDF português, não escolhemos
        outro santo por engano.

        Fazemos fallback ferial.
      */

      if (
        result.pageIndex === -1
      ) {
        result =
          await findFerial(
            date,
            celebration
          );
      }
    }


    /*
      4. DIA FERIAL NORMAL.
    */

    else {
      result =
        await findFerial(
          date,
          celebration
        );
    }


    if (
      !result ||
      result.pageIndex === -1
    ) {
      return res
        .status(404)
        .json({
          error:
            "Não foi possível localizar a Oração dos Fiéis desta data.",
          date:
            rawDate,
          celebration
        });
    }


    const pdf =
      await singlePagePdf(
        result.buffer,
        result.pageIndex
      );


    res.setHeader(
      "Content-Type",
      "application/pdf"
    );


    res.setHeader(
      "Content-Disposition",
      `inline; filename="preces-${rawDate}.pdf"`
    );


    res.setHeader(
      "Cache-Control",
      "public, max-age=3600, s-maxage=86400"
    );


    return res
      .status(200)
      .send(pdf);


  } catch (error) {

    console.error(
      "Prayer error:",
      error
    );


    return res
      .status(500)
      .json({
        error:
          "Não foi possível preparar a Oração dos Fiéis.",
        detail:
          error.message
      });

  }
};
