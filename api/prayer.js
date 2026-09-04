const { PDFDocument } = require("pdf-lib");

const DAY_MAP = {
  "2026-08-31": {
    url: "https://liturgia.pt/oracaouniversal/ferial/06UnivFerialSNLTCPar.pdf",
    pageIndex: 129
  },

  "2026-09-01": {
    url: "https://liturgia.pt/oracaouniversal/ferial/06UnivFerialSNLTCPar.pdf",
    pageIndex: 130
  },

  "2026-09-02": {
    url: "https://liturgia.pt/oracaouniversal/ferial/06UnivFerialSNLTCPar.pdf",
    pageIndex: 131
  },

  "2026-09-03": {
    url: "https://liturgia.pt/oracaouniversal/ferial/07UnivFerialSNLSantoral.pdf",
    pageIndex: 103
  },

  "2026-09-04": {
    url: "https://liturgia.pt/oracaouniversal/ferial/06UnivFerialSNLTCPar.pdf",
    pageIndex: 133
  },

  "2026-09-05": {
    url: "https://liturgia.pt/oracaouniversal/ferial/06UnivFerialSNLTCPar.pdf",
    pageIndex: 134
  },

  "2026-09-06": {
    url: "https://www.liturgia.pt/oracaouniversal/dominical/01_06_Dom_A_TCom.pdf",
    pageIndex: 21
  }
};

module.exports = async function handler(req, res) {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      error: "Informe ?date=AAAA-MM-DD"
    });
  }

  const item = DAY_MAP[date];

  if (!item) {
    return res.status(404).json({
      error: "Ainda não há prece configurada para esta data.",
      date
    });
  }

  try {
    const response = await fetch(item.url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      throw new Error(
        `Falha ao obter PDF oficial: ${response.status}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    const bytes = new Uint8Array(arrayBuffer);

    const sourcePdf = await PDFDocument.load(bytes);

    if (
      item.pageIndex < 0 ||
      item.pageIndex >= sourcePdf.getPageCount()
    ) {
      throw new Error(
        "Página configurada fora do PDF."
      );
    }

    const outputPdf = await PDFDocument.create();

    const [page] = await outputPdf.copyPages(
      sourcePdf,
      [item.pageIndex]
    );

    outputPdf.addPage(page);

    const outputBytes = await outputPdf.save();

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="preces-${date}.pdf"`
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=3600, s-maxage=86400"
    );

    res.status(200).send(
      Buffer.from(outputBytes)
    );

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Não foi possível preparar a página das preces.",
      detail: error.message
    });
  }
};
