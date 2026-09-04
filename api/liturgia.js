module.exports = async function handler(req, res) {
  try {
    const { date } = req.query;

    const DAY_MAP = {
      "2026-09-04":
        "https://liturgiadiaria.edicoescnbb.com.br/app/user/user/UserView.php?ano=2915&mes=3"
    };

    const source = DAY_MAP[date];

    if (!source) {
      return res.status(404).send(`
        <!doctype html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                padding: 24px;
                color: #4a433c;
                line-height: 1.6;
              }
            </style>
          </head>
          <body>
            <p>Esta data ainda não foi configurada na Liturgia oficial da CNBB.</p>
          </body>
        </html>
      `);
    }

    const response = await fetch(source, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) {
      throw new Error("CNBB respondeu com HTTP " + response.status);
    }

    let html = await response.text();

    const baseTag =
      '<base href="https://liturgiadiaria.edicoescnbb.com.br/">';

    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(
        /<head([^>]*)>/i,
        "<head$1>" + baseTag
      );
    }

    html = html.replace(
      "</head>",
      `
      <style>
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }

        body {
          overflow-x: hidden !important;
        }

        iframe {
          display: none !important;
        }
      </style>
      </head>
      `
    );

    res.setHeader(
      "Content-Type",
      "text/html; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    res.status(200).send(html);

  } catch (error) {

    console.error(error);

    res.status(500).send(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="
          font-family:system-ui;
          padding:24px;
          line-height:1.6;
        ">
          <p>Não foi possível carregar a Liturgia oficial da CNBB.</p>
        </body>
      </html>
    `);
  }
};
