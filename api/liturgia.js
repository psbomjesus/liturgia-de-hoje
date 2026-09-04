module.exports = async function handler(req, res) {
  try {
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).send("Data inválida.");
    }

    /*
      Transforma:
      2026-09-04
      em:
      04/09/2026
    */
    const [year, month, day] = date.split("-");

    const source =
      `https://pocketterco.com.br/liturgia/${day}/${month}/${year}`;

    const response = await fetch(source, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
        "Accept":
          "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) {
      throw new Error(
        "Pocket Terço respondeu com HTTP " +
        response.status
      );
    }

    let html = await response.text();


    /* =========================
       LIMPEZA INICIAL
    ========================= */

    html = html
      .replace(
        /<script\b[^>]*>[\s\S]*?<\/script>/gi,
        ""
      )
      .replace(
        /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
        ""
      )
      .replace(
        /<button\b[^>]*>[\s\S]*?<\/button>/gi,
        ""
      );


    /* =========================
       LOCALIZA A LITURGIA
    ========================= */

    const startPatterns = [
      "Primeira Leitura",
      "Leitura —",
      "Leitura -"
    ];

    let start = -1;

    for (const pattern of startPatterns) {
      const index = html.indexOf(pattern);

      if (index !== -1) {
        start = index;
        break;
      }
    }


    const endPatterns = [
      "Antífona do Ofertório",
      "Sobre as Oferendas",
      "Homilia do dia",
      "Santo do dia"
    ];

    let end = -1;

    for (const pattern of endPatterns) {
      const index = html.indexOf(pattern, start);

      if (index !== -1) {
        if (end === -1 || index < end) {
          end = index;
        }
      }
    }


    if (start === -1) {
      throw new Error(
        "Não foi possível localizar a Primeira Leitura."
      );
    }


    /*
      Preserva a tag que contém
      o título da Primeira Leitura.
    */
    const tagStart =
      html.lastIndexOf("<", start);

    start =
      tagStart !== -1
        ? tagStart
        : start;


    if (end === -1) {
      end = html.length;
    } else {
      const tagEnd =
        html.lastIndexOf("<", end);

      if (tagEnd !== -1) {
        end = tagEnd;
      }
    }


    let liturgia =
      html.slice(start, end);


    /* =========================
       REMOVE MÍDIAS
    ========================= */

    liturgia = liturgia
      .replace(
        /<img\b[^>]*>/gi,
        ""
      )
      .replace(
        /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
        ""
      )
      .replace(
        /<video\b[^>]*>[\s\S]*?<\/video>/gi,
        ""
      )
      .replace(
        /<audio\b[^>]*>[\s\S]*?<\/audio>/gi,
        ""
      )
      .replace(
        /<svg\b[^>]*>[\s\S]*?<\/svg>/gi,
        ""
      );


    /* =========================
       REMOVE BLOCOS DO PLAYER
    ========================= */

    /*
      O iframe do vídeo pode desaparecer,
      mas a caixa que o envolve pode continuar.

      Aqui removemos blocos identificados
      como vídeo, YouTube, embed ou player.
    */

    liturgia = liturgia.replace(
      /<(div|section|figure)\b[^>]*(?:class|id)=["'][^"']*(?:youtube|video|embed|player)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi,
      ""
    );


    /*
      Remove links do YouTube,
      caso algum permaneça.
    */

    liturgia = liturgia
      .replace(
        /<a\b[^>]*href=["'][^"']*(?:youtube\.com|youtu\.be)[^"']*["'][^>]*>[\s\S]*?<\/a>/gi,
        ""
      )
      .replace(
        /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s<"']+/gi,
        ""
      );


    /*
      Depois de retirar o vídeo,
      podem sobrar DIVs vazias.
      Eliminamos essas caixas.
    */

    for (let i = 0; i < 6; i++) {
      liturgia = liturgia.replace(
        /<div\b[^>]*>\s*(?:&nbsp;|<br\s*\/?>|\s)*<\/div>/gi,
        ""
      );
    }


    liturgia = liturgia
      .replace(
        /<section\b[^>]*>\s*(?:&nbsp;|<br\s*\/?>|\s)*<\/section>/gi,
        ""
      )
      .replace(
        /<figure\b[^>]*>\s*(?:&nbsp;|<br\s*\/?>|\s)*<\/figure>/gi,
        ""
      );


    /* =========================
       PÁGINA FINAL
    ========================= */

    const page = `
      <!doctype html>

      <html lang="pt-BR">

      <head>

        <meta charset="utf-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >

        <base href="https://pocketterco.com.br/">

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
              Arial,
              sans-serif;

            color: #292621;
            line-height: 1.7;

            padding:
              12px 18px 30px 18px;
          }


          /*
            Não mostrar mídias
            ou elementos externos.
          */

          header,
          nav,
          footer,
          aside,
          form,
          button,
          iframe,
          img,
          video,
          audio,
          canvas {
            display: none !important;
          }


          /*
            Esconde também os contêineres
            usados para vídeo/player.
          */

          [class*="youtube"],
          [class*="Youtube"],
          [class*="video"],
          [class*="Video"],
          [class*="embed"],
          [class*="Embed"],
          [class*="player"],
          [class*="Player"],
          [id*="youtube"],
          [id*="Youtube"],
          [id*="video"],
          [id*="Video"],
          [id*="embed"],
          [id*="Embed"],
          [id*="player"],
          [id*="Player"] {
            display: none !important;
            height: 0 !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
          }


          /*
            Se algum contêiner ficou vazio
            após a remoção do vídeo,
            ele também desaparece.
          */

          div:empty,
          section:empty,
          figure:empty {
            display: none !important;
            height: 0 !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
          }


          h1,
          h2,
          h3,
          h4 {
            color: #292621;
            line-height: 1.3;
          }

          h1,
          h2 {
            font-family:
              Georgia,
              "Times New Roman",
              serif;

            margin-top: 30px;
            margin-bottom: 12px;
          }

          h1 {
            font-size: 28px;
          }

          h2 {
            font-size: 24px;
          }

          h3,
          h4 {
            font-size: 19px;
            margin-top: 25px;
          }

          p,
          li {
            font-size: 17px;
            line-height: 1.75;
          }

          p {
            margin: 10px 0;
          }

          a {
            color: inherit;
            text-decoration: none;
            pointer-events: none;
          }

          sup {
            font-size: 11px;
          }


          .fonte-liturgia {
            margin-top: 38px;
            padding-top: 16px;

            border-top:
              1px solid #e4ddd4;

            font-size: 12px;
            line-height: 1.5;

            color: #817970;
          }

        </style>

      </head>


      <body>

        ${liturgia}

        <div class="fonte-liturgia">
          Textos litúrgicos © Conferência Nacional
          dos Bispos do Brasil.
          Consulta realizada por meio do Pocket Terço.
        </div>

      </body>

      </html>
    `;


    res.setHeader(
      "Content-Type",
      "text/html; charset=utf-8"
    );


    /*
      Temporariamente sem cache,
      para podermos conferir a correção.
    */

    res.setHeader(
      "Cache-Control",
      "no-store"
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
          color:#554d45;
          line-height:1.6;
        "
      >

        <p>
          Não foi possível carregar a
          Liturgia do dia.
        </p>

      </body>

      </html>
    `);

  }
};
