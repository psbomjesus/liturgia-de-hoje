const { PDFDocument } = require("pdf-lib");
const pdfParse = require("pdf-parse");

const BASE = "https://liturgia.pt/oracaouniversal";

const URLS = {
  ferial: {
    advento: `${BASE}/ferial/01UnivFerialSNLAdvento.pdf`,
    natal: `${BASE}/ferial/02UnivFerialSNLNatal.pdf`,
    quaresma: `${BASE}/ferial/03UnivFerialSNLQuaresma.pdf`,
    pascal: `${BASE}/ferial/04UnivFerialSNLTempoPascal.pdf`,
    comumImpar: `${BASE}/ferial/05UnivFerialSNLTCImpar.pdf`,
    comumPar: `${BASE}/ferial/06UnivFerialSNLTCPar.pdf`,
    santoral: `${BASE}/ferial/07UnivFerialSNLSantoral.pdf`
  },

  domingo: {
    A: {
      advento: `${BASE}/dominical/01_01_Dom_A_Adv.pdf`,
      natal: `${BASE}/dominical/01_02_Dom_A_Nat.pdf`,
      quaresma: `${BASE}/dominical/01_03_Dom_A_Qua.pdf`,
      pascal: `${BASE}/dominical/01_05_Dom_A_Pas.pdf`,
      comum: `${BASE}/dominical/01_06_Dom_A_TCom.pdf`,
      trindade: `${BASE}/dominical/01_07_Dom_A_SSTrindade.pdf`,
      corpus: `${BASE}/dominical/01_08_Dom_A_CorpoDeus.pdf`,
      coracao: `${BASE}/dominical/01_09_Dom_A_SCoracaoJesus.pdf`
    },

    B: {
      advento: `${BASE}/dominical/02_01_Dom_B_Adv.pdf`,
      natal: `${BASE}/dominical/02_02_Dom_B_Nat.pdf`,
      quaresma: `${BASE}/dominical/02_03_Dom_B_Qua.pdf`,
      pascal: `${BASE}/dominical/02_05_Dom_B_Pas.pdf`,
      comum: `${BASE}/dominical/02_06_Dom_B_TCom.pdf`,
      trindade: `${BASE}/dominical/02_07_Dom_B_SSTrindade.pdf`,
      corpus: `${BASE}/dominical/02_08_Dom_B_CorpoDeus.pdf`,
      coracao: `${BASE}/dominical/02_09_Dom_B_SCoracaoJesus.pdf`
    },

    C: {
      advento: `${BASE}/dominical/03_01_Dom_C_Adv.pdf`,
      natal: `${BASE}/dominical/03_02_Dom_C_Nat.pdf`,
      quaresma: `${BASE}/dominical/03_03_Dom_C_Qua.pdf`,
      pascal: `${BASE}/dominical/03_05_Dom_C_Pas.pdf`,
      comum: `${BASE}/dominical/03_06_Dom_C_TCom.pdf`,
      trindade: `${BASE}/dominical/03_07_Dom_C_SSTrindade.pdf`,
      corpus: `${BASE}/dominical/03_08_Dom_C_CorpoDeus.pdf`,
      coracao: `${BASE}/dominical/03_09_Dom_C_SCoracaoJesus.pdf`
    }
  }
};


/* =========================
   UTILIDADES
========================= */

function normalize(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}


function parseISODate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day, 12));

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
   ANO DOMINICAL A / B / C
========================= */

function firstSundayOfAdvent(year) {
  const start = new Date(Date.UTC(year, 10, 27, 12));

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);

    if (d.getUTCDay() === 0) {
      return d;
    }
  }

  return null;
}


function sundayCycle(date) {
  const civilYear = date.getUTCFullYear();
  const advent = firstSundayOfAdvent(civilYear);

  let liturgicalYear = civilYear;

  if (advent && date >= advent) {
    liturgicalYear = civilYear + 1;
  }

  const mod = liturgicalYear % 3;

  if (mod === 1) return "A";
  if (mod === 2) return "B";

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

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) {
    throw new Error(
      `Agenda litúrgica respondeu ${response.status}`
    );
  }

  const html = await response.text();

  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#039;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\n+/g, "\n")
    .trim();
}


/* =========================
   TEMPO LITÚRGICO
========================= */

function getSeason(agenda) {
  const text = normalize(agenda);

  if (text.includes("ADVENTO")) {
    return "advento";
  }

  if (
    text.includes("TEMPO DO NATAL") ||
    text.includes("NATAL DO SENHOR") ||
    text.includes("EPIFANIA") ||
    text.includes("BAPTISMO DO SENHOR") ||
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
    text.includes("TEMPO PASCAL") ||
    text.includes("PASCOA") ||
    text.includes("ASCENSAO") ||
    text.includes("PENTECOSTES")
  ) {
    return "pascal";
  }

  return "comum";
}


function getWeekRoman(agenda) {
  const text = normalize(agenda);

  const match =
    text.match(/SEMANA\s+([IVXLCDM]+)/);

  return match ? match[1] : null;
}


/* =========================
   PDFs
========================= */

async function fetchPdf(url) {
  const response = await fetch(url, {
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


async function extractPages(buffer) {
  const pages = [];

  await pdfParse(buffer, {
    pagerender: async pageData => {
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


async function findPage(buffer, requiredPatterns) {
  const pages = await extractPages(buffer);

  const patterns =
    requiredPatterns
      .filter(Boolean)
      .map(normalize);

  for (let i = 0; i < pages.length; i++) {
    const page = normalize(pages[i]);

    const found =
      patterns.every(pattern =>
        page.includes(pattern)
      );

    if (found) {
      return i;
    }
  }

  return -1;
}


/* =========================
   SANTORAL
========================= */

async function findSantoralByDate(date) {
  const buffer =
    await fetchPdf(URLS.ferial.santoral);

  const day = date.getUTCDate();
  const month = monthName(date);

  /*
    Primeiro procura:
    "8 DE SETEMBRO"

    Isso é mais seguro do que depender
    do texto da agenda.
  */

  const pageIndex =
    await findPage(
      buffer,
      [`${day} DE ${month}`]
    );

  return {
    buffer,
    pageIndex
  };
}


/* =========================
   CELEBRAÇÃO PRÓPRIA
========================= */

function agendaSuggestsProperCelebration(agenda) {
  const text = normalize(agenda);

  return (
    text.includes("SOLENIDADE") ||
    text.includes("FESTA") ||
    text.includes("MEMORIA") ||
    text.includes("MO ")
  );
}


/*
  Algumas celebrações universais muito
  claras recebem prioridade explícita.

  Isso também protege o caso de 8/9,
  mesmo que o HTML da agenda mude.
*/

function fixedProperDate(date) {
  const md =
    String(date.getUTCMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getUTCDate()).padStart(2, "0");

  const dates = new Set([
    "02-02", // Apresentação do Senhor
    "03-19", // São José
    "03-25", // Anunciação
    "06-24", // Natividade de João Batista
    "06-29", // Pedro e Paulo
    "08-06", // Transfiguração
    "08-15", // Assunção
    "09-08", // Natividade de Nossa Senhora
    "09-14", // Exaltação da Santa Cruz
    "11-01", // Todos os Santos
    "11-02", // Fiéis Defuntos
    "11-09", // Dedicação de Latrão
    "12-08"  // Imaculada Conceição
  ]);

  return dates.has(md);
}


/* =========================
   FERIAL
========================= */

async function findFerial(date, agenda) {
  const season = getSeason(agenda);

  let url;

  if (season === "advento") {
    url = URLS.ferial.advento;
  }

  else if (season === "natal") {
    url = URLS.ferial.natal;
  }

  else if (season === "quaresma") {
    url = URLS.ferial.quaresma;
  }

  else if (season === "pascal") {
    url = URLS.ferial.pascal;
  }

  else {
    url =
      date.getUTCFullYear() % 2 === 0
        ? URLS.ferial.comumPar
        : URLS.ferial.comumImpar;
  }


  const buffer = await fetchPdf(url);

  const weekday = weekdayName(date);
  const week = getWeekRoman(agenda);


  let patterns = [];

  if (week) {
    patterns.push(`SEMANA ${week}`);
  }

  patterns.push(weekday);


  const pageIndex =
    await findPage(buffer, patterns);


  return {
    buffer,
    pageIndex
  };
}


/* =========================
   DOMINGOS
========================= */

function specialSundayType(agenda) {
  const text = normalize(agenda);

  if (
    text.includes("SANTISSIMA TRINDADE")
  ) {
    return "trindade";
  }

  if (
    text.includes("SANTISSIMO CORPO") ||
    text.includes("CORPO E SANGUE DE CRISTO") ||
    text.includes("CORPUS CHRISTI")
  ) {
    return "corpus";
  }

  if (
    text.includes("SAGRADO CORACAO DE JESUS")
  ) {
    return "coracao";
  }

  return null;
}


async function findSunday(date, agenda) {
  const cycle = sundayCycle(date);

  const special =
    specialSundayType(agenda);

  let key;

  if (special) {
    key = special;
  } else {
    key = getSeason(agenda);
  }


  const group =
    URLS.domingo[cycle];

  const url =
    group[key] ||
    group.comum;


  const buffer =
    await fetchPdf(url);


  /*
    PDFs especiais têm apenas uma página.
  */

  if (
    key === "trindade" ||
    key === "corpus" ||
    key === "coracao"
  ) {
    return {
      buffer,
      pageIndex: 0
    };
  }


  const text =
    normalize(agenda);

  const match =
    text.match(
      /DOMINGO\s+([IVXLCDM]+)/
    );


  if (!match) {
    throw new Error(
      "Não foi possível identificar o número do domingo."
    );
  }


  const roman =
    match[1];


  const patterns =
    [`DOMINGO ${roman}`];


  if (key === "comum") {
    patterns.push("TEMPO COMUM");
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
   RECORTAR UMA ÚNICA PÁGINA
========================= */

async function makeSinglePagePdf(
  buffer,
  pageIndex
) {
  const source =
    await PDFDocument.load(buffer);

  if (
    pageIndex < 0 ||
    pageIndex >= source.getPageCount()
  ) {
    throw new Error(
      "Página configurada fora do PDF."
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


    let result = null;


    /*
      REGRA DE PRECEDÊNCIA

      1. DOMINGO primeiro.
         Um santo comum não substitui
         a celebração dominical.

      2. Nos outros dias, verifica
         celebração própria.

      3. Se não houver próprio,
         utiliza o formulário ferial.
    */


    if (date.getUTCDay() === 0) {

      result =
        await findSunday(
          date,
          agenda
        );

    }

    else {

      const shouldTrySantoral =
        fixedProperDate(date) ||
        agendaSuggestsProperCelebration(
          agenda
        );


      if (shouldTrySantoral) {

        const proper =
          await findSantoralByDate(
            date
          );


        if (proper.pageIndex !== -1) {

          result = proper;

        }

      }


      /*
        Caso não tenha encontrado
        uma página própria no Santoral,
        usa a oração ferial.
      */

      if (!result) {

        result =
          await findFerial(
            date,
            agenda
          );

      }

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
          date: rawDate
        });

    }


    const pdf =
      await makeSinglePagePdf(
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
