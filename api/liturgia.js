module.exports = async function handler(req, res) {
  try {
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).send("Data inválida.");
    }

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


    /* =========================================
       REMOVE BLOCOS DO YOUTUBE ANTES DE TUDO
    ========================================= */

    /*
      O Pocket Terço coloca vídeos no meio
      da liturgia.

      Não basta apagar somente o iframe,
      porque o contêiner pode continuar
      aparecendo como uma caixa ou barra.

      Por isso removemos primeiro blocos
      completos que contenham YouTube.
    */

    const youtubeBlockPatterns = [

      /<figure\b[^>]*>[\s\S]*?(?:youtube\.com|youtu\.be)[\s\S]*?<\/figure>/gi,

      /<section\b[^>]*>[\s\S]*?(?:youtube\.com|youtu\.be)[\s\S]*?<\/section>/gi,

      /<p\b[^>]*>[\s\S]*?(?:youtube\.com|youtu\.be)[\s\S]*?<\/p>/gi
    ];

    for (const pattern of youtubeBlockPatterns) {
      html = html.replace(pattern, "");
    }


    /*
      Remove DIVs que contenham diretamente
      um iframe do YouTube.
    */

    html = html.replace(
      /<div\b[^>]*>\s*<iframe\b[^>]*(?:youtube\.com|youtu\.be)[^>]*>[\s\S]*?<\/iframe>\s*<\/div>/gi,
      ""
    );


    /*
      Remove iframe do YouTube que ainda
      tenha permanecido.
    */

    html = html.replace(
      /<iframe\b[^>]*(?:youtube\.com|youtu\.be)[^>]*>[\s\S]*?<\/iframe>/gi,
      ""
    );


    /*
      Remove também URLs soltas do YouTube.
    */

    html = html.replace(
      /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s<"']+/gi,
      ""
    );


    /* =========================================
       LIMPEZA GERAL
    ========================================= */

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


    /* =========================================
       LOCALIZA A LITURGIA DA PALAVRA
    ========================================= */

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


    if (start === -1) {
      throw new Error(
        "Não foi possível localizar a Primeira Leitura."
      );
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

      if (
        index !== -1 &&
        (end === -1 || index < end)
      ) {
        end = index;
      }
    }


    /*
      Preserva a tag do título
      da Primeira Leitura.
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


    /* =========================================
       REMOVE QUALQUER MÍDIA RESTANTE
    ========================================= */

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


    /* =========================================
       REMOVE ESTILOS ORIGINAIS
       DOS ELEMENTOS
    ========================================= */

    /*
      Isso impede que algum contêiner
      que sobrou mantenha altura,
      fundo azul ou proporção de vídeo.

      Não altera o texto litúrgico.
    */

    liturgia = liturgia.replace(
      /\sstyle=(["'])[\s\S]*?\1/gi,
      ""
    );


    /* =========================================
       REMOVE ELEMENTOS VAZIOS
    ========================================= */

    /*
      Fazemos várias passagens porque,
      ao retirar um elemento interno,
      o elemento pai também pode ficar vazio.
    */

    for (let i = 0; i < 10; i++) {

      liturgia = liturgia
        .replace(
          /<div\b[^>]*>\s*(?:&nbsp;|<br\s*\/?>|\s)*<\/div>/gi,
          ""
        )
        .replace(
          /<section\b[^>]*>\s*(?:&nbsp;|<br\s*\/?>|\s)*<\/section>/gi,
          ""
        )
        .replace(
          /<figure\b[^>]*>\s*(?:&nbsp;|<br\s*\/?>|\s)*<\/figure>/gi,
          ""
        )
        .replace(
          /<p\b[^>]*>\s*(?:&nbsp;|<br\s*\/?>|\s)*<\/p>/gi,
          ""
        );

    }


    /* =========================================
       PÁGINA FINAL
    ========================================= */

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
          canvas,
          object,
          embed {
            display: none !important;
          }


          /*
            Segurança extra contra
            qualquer player restante.
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

            width: 0 !important;
            height: 0 !important;

            min-width: 0 !important;
            min-height: 0 !important;

            max-width: 0 !important;
            max-height: 0 !important;

            margin: 0 !important;
            padding: 0 !important;

            border: 0 !important;

            background: transparent !important;
          }


          div:empty,
          section:empty,
          figure:empty,
          p:empty {
            display: none !important;

            width: 0 !important;
            height: 0 !important;

            min-height: 0 !important;

            margin: 0 !important;
            padding: 0 !important;

            border: 0 !important;

            background: transparent !important;
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
