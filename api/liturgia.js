module.exports = async function handler(req, res) {
  try {
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).send("Data inválida.");
    }

    const month = date.slice(0, 7);

    const source =
      "https://carmosaodomingos.com.br/liturgia" +
      "?data=" + encodeURIComponent(date) +
      "&mes=" + encodeURIComponent(month);

    const response = await fetch(source, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) {
      throw new Error(
        "Fonte da liturgia respondeu com HTTP " +
        response.status
      );
    }

    let html = await response.text();

    /*
      Pegamos somente o conteúdo principal da página.
      Assim não aparecem menu, rodapé e calendário.
    */
    const mainMatch =
      html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);

    if (mainMatch) {
      html = mainMatch[1];
    }

    /*
      Remove scripts para deixar a visualização
      mais simples e segura dentro do aplicativo.
    */
    html = html.replace(
      /<script\b[^>]*>[\s\S]*?<\/script>/gi,
      ""
    );

    /*
      Tenta remover a parte do calendário,
      caso ela esteja dentro do <main>.
    */
    const calendarIndex =
      html.search(/Calendário litúrgico/i);

    if (calendarIndex !== -1) {
      html = html.slice(0, calendarIndex);
    }

    const page = `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8">

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          >

          <style>
            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
            }

            body {
              font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif;

              color: #292621;
              line-height: 1.65;
              padding: 22px;
            }

            nav,
            header,
            footer,
            button,
            form {
              display: none !important;
            }

            img {
              max-width: 100%;
            }

            h1,
            h2,
            h3 {
              line-height: 1.25;
              color: #292621;
            }

            h1 {
              font-size: 28px;
            }

            h2 {
              font-size: 23px;
              margin-top: 32px;
            }

            h3 {
              font-size: 20px;
              margin-top: 26px;
            }

            p {
              font-size: 17px;
            }

            a {
              color: inherit;
              text-decoration: none;
            }
          </style>
        </head>

        <body>
          ${html}

          <p
            style="
              margin-top:40px;
              padding-top:18px;
              border-top:1px solid #ddd;
              font-size:13px;
              color:#777;
            "
          >
            Textos sincronizados com a fonte
            CNBB / Edições CNBB.
          </p>
        </body>
      </html>
    `;

    res.setHeader(
      "Content-Type",
      "text/html; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=300, s-maxage=3600"
    );

    res.status(200).send(page);

  } catch (error) {

    console.error(error);

    res.status(500).send(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          >
        </head>

        <body
          style="
            font-family:system-ui;
            padding:24px;
            line-height:1.6;
          "
        >
          <p>
            Não foi possível carregar
            a Liturgia do dia.
          </p>
        </body>
      </html>
    `);
  }
};
