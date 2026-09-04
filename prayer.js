const { PDFDocument } = require("pdf-lib");

// pageIndex é zero-based, exatamente como o pdf-lib espera.
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
  }
};

module.exports = async function handler(req, res) {
  try {
    const date = Array.isArray(req.query.date) ? req.query.date[0] : req.query.date;
    const item = DAY_MAP[date];

    if (!item) {
      res.status(404).json({ error: "Preces ainda não configuradas para esta data." });
      return;
    }

    const response = await fetch(item.url, {
      headers: { "User-Agent": "LiturgiaDeHoje/1.0" }
    });

    if (!response.ok) {
      throw new Error("Falha ao obter o PDF oficial: HTTP " + response.status);
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    const sourcePdf = await PDFDocument.load(bytes);

    if (item.pageIndex < 0 || item.pageIndex >= sourcePdf.getPageCount()) {
      throw new Error("Página configurada fora do intervalo do PDF.");
    }

    const outputPdf = await PDFDocument.create();
    const [page] = await outputPdf.copyPages(sourcePdf, [item.pageIndex]);
    outputPdf.addPage(page);

    const outputBytes = await outputPdf.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="oracao-universal-' + date + '.pdf"');
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    res.status(200).send(Buffer.from(outputBytes));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Não foi possível preparar a página das preces.",
      detail: error.message
    });
  }
};
