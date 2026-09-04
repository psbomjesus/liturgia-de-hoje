const { PDFDocument } = require("pdf-lib");
const pdfParse = require("pdf-parse");

const BASE = "https://liturgia.pt/oracaouniversal";

const URLS = {
  ferial: {
    advento:
      `${BASE}/ferial/01UnivFerialSNLAdvento.pdf`,

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
   UTILIDADES
========================= */

function normalize(text = "") {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}


function parseISODate(value) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

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


function portugueseWeekday(date) {
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


/* =========================
   ANO LITÚRGICO A/B/C
========================= */

function firstSundayOfAdvent(year) {
  /*
    O primeiro domingo do Advento é o domingo
    que cai entre 27 de novembro e 3 de dezembro.
  */

  for (let d = 27; d <= 30; d++) {
    const date =
      new Date(Date.UTC(year, 10, d, 12));

    if (date.getUTCDay() === 0) {
      return date;
    }
  }

  for (let d = 1; d <= 3; d++) {
    const date =
      new Date(Date.UTC(year, 11, d, 12));

    if (date.getUTCDay() === 0) {
      return date;
    }
  }

  return null;
}


function sundayCycle(date) {
  const year = date.getUTCFullYear();

  const advent =
    firstSundayOfAdvent(year);

  let liturgicalYear = year;

  if (
    advent &&
    date.getTime() >= advent.getTime()
  ) {
    liturgicalYear = year + 1;
  }

  const remainder =
    liturgicalYear % 3;

  if (remainder === 1) return "A";
  if (remainder === 2) return "B";

  return "C";
}


/* =========================
   AGENDA LITÚRGICA
========================= */

async function getAgenda(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  const url =
    `https://www.liturgia.pt/liturgiadiaria/dia.php?data=${year}-${month}-${day}`;

  const response =
    await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

  if (!response.ok) {
    throw new Error(
      `Agenda litúrgica respondeu HTTP ${response.status}`
    );
  }

  const html =
    await response.text();

  const clean =
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "\n")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&#039;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/\n+/g, "\n")
      .trim();

  return clean;
}


/* =========================
   IDENTIFICAÇÃO DO DIA
========================= */

function getOrdinaryWeek(agenda) {
  const text =
    normalize(agenda);

  const match =
    text.match(
      /SEMANA\s+([IVXLCDM]+)/
    );

  if (!match) return null;

  return match[1];
}


function getSeason(agenda) {
  const text =
    normalize(agenda);

  if (
    text.includes("ADVENTO")
  ) {
    return "advento";
  }

  if (
    text.includes("TEMPO DO NATAL") ||
    text.includes("NATAL DO SENHOR")
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
    text.includes("TEMPO PASCAL") ||
    text.includes("PASCOA")
  ) {
    return "pascal";
  }

  return "comum";
}


function hasPrincipalSaintCelebration(
  agenda,
  date
) {
  /*
    Domingo é tratado antes desta função.
    Assim uma memória de santo não
    sobrepõe o domingo.
  */

  if (date.getUTCDay() === 0) {
    return false;
  }

  const lines =
    agenda
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);

  /*
    Analisamos apenas a parte inicial
    da agenda, antes das observações
    particulares de dioceses/ordens.
  */

  const head =
    normalize(
      lines.slice(0, 12).join(" ")
    );

  return (
    head.includes(" FESTA") ||
    head.includes(" SOLENIDADE") ||
    head.includes(" MO ") ||
    head.endsWith(" MO")
  );
}


/* =========================
   LEITURA DOS PDFs
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
      `PDF respondeu HTTP ${response.status}`
    );
  }

  const buffer =
    Buffer.from(
      await response.arrayBuffer()
    );

  return buffer;
}


async function extractPdfPages(buffer) {
  const pages = [];

  await pdfParse(buffer, {
    pagerender:
      async function(pageData) {
        const content =
          await pageData.getTextContent();

        const text =
          content.items
            .map(item => item.str)
            .join(" ");

        pages.push(text);

        return text;
      }
  });

  return pages;
}


async function findPage(
  buffer,
  patterns
) {
  const pages =
    await extractPdfPages(buffer);

  const normalizedPatterns =
    patterns
      .filter(Boolean)
      .map(normalize);

  for (
    let index = 0;
    index < pages.length;
    index++
  ) {
    const page =
      normalize(pages[index]);

    const ok =
      normalizedPatterns.every(
        pattern =>
          page.includes(pattern)
      );

    if (ok) {
      return index;
    }
  }

  return -1;
}


/* =========================
   SANTORAL
========================= */

async function findSantoralPage(
  date,
  agenda
) {
  const buffer =
    await fetchPdf(
      URLS.ferial.santoral
    );

  const day =
    date.getUTCDate();

  const months = [
    "",
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
  ];

  const month =
    months[
      date.getUTCMonth() + 1
    ];

  /*
    Primeiro procuramos a combinação
    data + mês.
  */

  let pageIndex =
    await findPage(
      buffer,
      [
        `${day} DE ${month}`
      ]
    );

  /*
    Alguns PDFs podem separar
    a data de forma diferente.
    Usamos então o nome principal
    da celebração da agenda.
  */

  if (pageIndex === -1) {
    const lines =
      agenda
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean);

    const possibleTitle =
      lines.find(line =>
        /FESTA|SOLENIDADE|– MO| - MO/i
          .test(line)
      );

    if (possibleTitle) {
      pageIndex =
        await findPage(
          buffer,
          [possibleTitle]
        );
    }
  }

  return {
    buffer,
    pageIndex
  };
}


/* =========================
   FERIAL
========================= */

async function findFerialPage(
  date,
  agenda
) {
  const season =
    getSeason(agenda);

  let url;

  if (season === "advento") {
    url =
      URLS.ferial.advento;
  }

  else if (season === "quaresma") {
    url =
      URLS.ferial.quaresma;
  }

  else if (season === "pascal") {
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
    portugueseWeekday(date);

  const week =
    getOrdinaryWeek(agenda);


  const patterns = [];

  if (week) {
    patterns.push(
      `SEMANA ${week}`
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
   DOMINGOS
========================= */

async function findSundayPage(
  date,
  agenda
) {
  const cycle =
    sundayCycle(date);

  const season =
    getSeason(agenda);

  const group =
    URLS.domingo[cycle];

  const url =
    group[season] ||
    group.comum;

  const buffer =
    await fetchPdf(url);


  const normalizedAgenda =
    normalize(agenda);


  /*
    Procuramos títulos como:
    DOMINGO XXIII DO TEMPO COMUM
    DOMINGO I DO ADVENTO
    etc.
  */

  const match =
    normalizedAgenda.match(
      /DOMINGO\s+([IVXLCDM]+)(?:\s+DO|\s+DA)?\s+([A-Z\s]+)/
    );


  let patterns = [];

  if (match) {
    patterns.push(
      `DOMINGO ${match[1]}`
    );

    if (
      season === "comum"
    ) {
      patterns.push(
        "TEMPO COMUM"
      );
    }
  }


  if (
    patterns.length === 0
  ) {
    throw new Error(
      "Não foi possível identificar o domingo."
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
   RECORTAR UMA PÁGINA
========================= */

async function singlePagePdf(
  sourceBuffer,
  pageIndex
) {
  const sourcePdf =
    await PDFDocument.load(
      sourceBuffer
    );

  if (
    pageIndex < 0 ||
    pageIndex >=
      sourcePdf.getPageCount()
  ) {
    throw new Error(
      "Página não localizada no formulário."
    );
  }

  const outputPdf =
    await PDFDocument.create();

  const [page] =
    await outputPdf.copyPages(
      sourcePdf,
      [pageIndex]
    );

  outputPdf.addPage(page);

  const bytes =
    await outputPdf.save();

  return Buffer.from(bytes);
}


/* =========================
   HANDLER
========================= */

module.exports =
async function handler(req, res) {

  const { date: rawDate } =
    req.query;

  const date =
    parseISODate(rawDate);

  if (!date) {
    return res.status(400).json({
      error:
        "Informe uma data válida em ?date=AAAA-MM-DD"
    });
  }


  try {
    const agenda =
      await getAgenda(date);


    let result;


    /*
      REGRA DE PRECEDÊNCIA

      1. Domingo primeiro.
         Portanto santos comuns
         nunca tomam o lugar dele.

      2. Em dias de semana,
         festa / solenidade /
         memória principal pode
         usar o Santoral.

      3. Caso contrário,
         usa o formulário ferial.
    */


    if (
      date.getUTCDay() === 0
    ) {
      result =
        await findSundayPage(
          date,
          agenda
        );
    }

    else if (
      hasPrincipalSaintCelebration(
        agenda,
        date
      )
    ) {
      result =
        await findSantoralPage(
          date,
          agenda
        );

      /*
        Se não houver formulário
        próprio no Santoral,
        voltamos ao formulário
        ferial em vez de quebrar.
      */

      if (
        result.pageIndex === -1
      ) {
        result =
          await findFerialPage(
            date,
            agenda
          );
      }
    }

    else {
      result =
        await findFerialPage(
          date,
          agenda
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
            "Não foi possível localizar automaticamente o formulário das preces para esta data.",
          date: rawDate
        });
    }


    const output =
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
      .send(output);


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
