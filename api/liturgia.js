module.exports = async function handler(req, res) {
  try {
    const source = "https://liturgiadiaria.edicoescnbb.com.br/";

    const response = await fetch(source, {
      headers: {
        "User-Agent": "Mozilla/5.0 LiturgiaDeHoje/1.0",
        "Accept": "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) {
      throw new Error("CNBB respondeu com HTTP " + response.status);
    }

    let html = await response.text();

    // Faz links relativos da página oficial continuarem funcionando
    // quando o HTML é exibido dentro do nosso domínio.
    const baseTag = '<base href="https://liturgiadiaria.edicoescnbb.com.br/">';
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, '<head$1>' + baseTag);
    } else {
      html = baseTag + html;
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(html);
  } catch (error) {
    console.error(error);
    res.status(500).send(
      "<!doctype html><html><body style='font-family:system-ui;padding:24px'>" +
      "<h2>Não foi possível carregar a Liturgia da CNBB.</h2>" +
      "<p>Tente novamente em alguns instantes.</p>" +
      "</body></html>"
    );
  }
};
