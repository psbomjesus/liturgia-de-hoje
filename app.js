let currentDate = new Date();
currentDate.setHours(12, 0, 0, 0);

const weekdays = [
  "DOMINGO",
  "SEGUNDA-FEIRA",
  "TERÇA-FEIRA",
  "QUARTA-FEIRA",
  "QUINTA-FEIRA",
  "SEXTA-FEIRA",
  "SÁBADO"
];


/* =========================
   FUNÇÕES DE DATA
========================= */

function isoDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}


function formatDateBR(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}


function cloneDate(date) {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  return copy;
}


/* =========================
   ELEMENTOS DA TELA
========================= */

function getElements() {
  return {
    weekday: document.getElementById("weekday"),
    date: document.getElementById("date"),
    celebration: document.getElementById("celebration"),
    meta: document.getElementById("meta"),

    liturgiaCard: document.getElementById("liturgia"),

    prayerStatus: document.getElementById("prayerStatus"),
    pdfArea: document.getElementById("pdfArea"),

    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    todayBtn: document.getElementById("todayBtn")
  };
}


/* =========================
   COR LITÚRGICA
========================= */

function liturgicalColor(colorName) {
  const color =
    String(colorName || "")
      .trim()
      .toLowerCase();

  if (color === "verde") {
    return {
      background: "#5d8f67",
      border: "#5d8f67"
    };
  }

  if (color === "branco") {
    return {
      background: "#ffffff",
      border: "#b9b3ab"
    };
  }

  if (
    color === "roxo" ||
    color === "violeta"
  ) {
    return {
      background: "#76508d",
      border: "#76508d"
    };
  }

  if (color === "vermelho") {
    return {
      background: "#b94a48",
      border: "#b94a48"
    };
  }

  if (color === "rosa") {
    return {
      background: "#c98b9e",
      border: "#c98b9e"
    };
  }

  return {
    background: "#8a8279",
    border: "#8a8279"
  };
}


/* =========================
   CABEÇALHO AUTOMÁTICO
========================= */

async function renderHeader(date) {
  const els = getElements();
  const iso = isoDate(date);

  if (els.weekday) {
    els.weekday.textContent =
      weekdays[date.getDay()];
  }

  if (els.date) {
    els.date.textContent =
      formatDateBR(date);
  }

  if (els.celebration) {
    els.celebration.textContent =
      "Carregando celebração...";
  }

  if (els.meta) {
    els.meta.textContent =
      "Carregando dados litúrgicos...";
  }


  try {
    const response =
      await fetch(
        "/api/day?date=" +
        encodeURIComponent(iso),
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        "Não foi possível carregar os dados litúrgicos."
      );
    }

    const data =
      await response.json();


    if (els.celebration) {
      els.celebration.textContent =
        data.celebration ||
        "Liturgia do dia";
    }


    const metaParts = [];

    if (data.rank) {
      metaParts.push(data.rank);
    }

    if (data.color) {
      metaParts.push(data.color);
    }

    if (data.cycle) {
      metaParts.push(
        "Ano " + data.cycle
      );
    }


    if (els.meta) {
      /*
        Apaga o conteúdo anterior para
        construirmos a bolinha + texto.
      */

      els.meta.innerHTML = "";


      /*
        BOLINHA LITÚRGICA
      */

      if (data.color) {
        const dot =
          document.createElement("span");

        const colors =
          liturgicalColor(
            data.color
          );

        dot.style.display =
          "inline-block";

        dot.style.width =
          "16px";

        dot.style.height =
          "16px";

        dot.style.borderRadius =
          "50%";

        dot.style.background =
          colors.background;

        dot.style.border =
          "1.5px solid " +
          colors.border;

        dot.style.marginRight =
          "8px";

        dot.style.verticalAlign =
          "-2px";

        dot.style.boxSizing =
          "border-box";

        els.meta.appendChild(
          dot
        );
      }


      /*
        TEXTO:
        Festa · Branco
        ou
        Verde · Ano A
        etc.
      */

      const text =
        document.createElement("span");

      text.textContent =
        metaParts.length
          ? metaParts.join(" · ")
          : (
              data.season ||
              "Calendário litúrgico"
            );

      els.meta.appendChild(
        text
      );
    }

  } catch (error) {

    console.error(
      "Erro ao carregar cabeçalho:",
      error
    );

    if (els.celebration) {
      els.celebration.textContent =
        "Liturgia do dia";
    }

    if (els.meta) {
      els.meta.textContent =
        "Dados litúrgicos indisponíveis";
    }
  }
}


/* =========================
   LITURGIA
========================= */

function renderLiturgia(date) {
  const els = getElements();

  if (!els.liturgiaCard) return;

  const iso = isoDate(date);

  const old =
    document.getElementById(
      "liturgiaLive"
    );

  if (old) {
    old.remove();
  }


  const wrapper =
    document.createElement("div");

  wrapper.id =
    "liturgiaLive";


  const info =
    document.createElement("p");

  info.style.color =
    "#746d64";

  info.style.lineHeight =
    "1.55";

  info.textContent =
    "Liturgia do dia com textos litúrgicos brasileiros.";

  wrapper.appendChild(info);


  const iframe =
    document.createElement("iframe");

  iframe.src =
    "/api/liturgia?date=" +
    encodeURIComponent(iso);

  iframe.title =
    "Liturgia do dia";

  iframe.loading =
    "eager";

  iframe.style.width =
    "100%";

  iframe.style.height =
    "1000px";

  iframe.style.border =
    "1px solid #e9e0d5";

  iframe.style.borderRadius =
    "12px";

  iframe.style.background =
    "#ffffff";

  wrapper.appendChild(
    iframe
  );


  const placeholders =
    els.liturgiaCard.querySelectorAll(
      ".placeholder"
    );

  placeholders.forEach(
    element => {
      element.remove();
    }
  );


  els.liturgiaCard.appendChild(
    wrapper
  );
}


/* =========================
   ORAÇÃO DOS FIÉIS
========================= */

function renderPrayer(date) {
  const els = getElements();

  if (!els.pdfArea) return;

  const iso =
    isoDate(date);

  els.pdfArea.innerHTML =
    "";


  if (els.prayerStatus) {
    els.prayerStatus.innerHTML =
      "<strong>Oração dos Fiéis do dia</strong><br>" +
      "Formulário correspondente à celebração litúrgica desta data.";
  }


  const iframe =
    document.createElement("iframe");

  /*
    Acrescentamos a data como versão
    para reduzir problemas de cache
    durante os testes.
  */

  iframe.src =
    "/api/prayer?date=" +
    encodeURIComponent(iso) +
    "&v=" +
    Date.now();

  iframe.title =
    "Oração dos Fiéis";

  iframe.loading =
    "eager";

  iframe.style.width =
    "100%";

  iframe.style.minHeight =
    "760px";

  iframe.style.border =
    "1px solid #e9e0d5";

  iframe.style.borderRadius =
    "12px";

  iframe.style.background =
    "#ffffff";

  els.pdfArea.appendChild(
    iframe
  );


  const fallback =
    document.createElement("p");

  fallback.style.fontSize =
    "13px";

  fallback.style.color =
    "#746d64";

  fallback.style.lineHeight =
    "1.5";

  fallback.innerHTML =
    'Se o visualizador não carregar, ' +
    '<a href="/api/prayer?date=' +
    encodeURIComponent(iso) +
    '&v=' +
    Date.now() +
    '" target="_blank" rel="noopener">' +
    'toque aqui para abrir a oração deste dia</a>.';

  els.pdfArea.appendChild(
    fallback
  );
}


/* =========================
   RENDERIZAÇÃO PRINCIPAL
========================= */

function render() {
  renderHeader(currentDate);
  renderLiturgia(currentDate);
  renderPrayer(currentDate);
}


/* =========================
   NAVEGAÇÃO
========================= */

function previousDay() {
  currentDate.setDate(
    currentDate.getDate() - 1
  );

  render();
}


function nextDay() {
  currentDate.setDate(
    currentDate.getDate() + 1
  );

  render();
}


function goToday() {
  currentDate =
    new Date();

  currentDate.setHours(
    12,
    0,
    0,
    0
  );

  render();
}


/* =========================
   PRÉ-CARREGAMENTO
   HOJE + 6 DIAS
========================= */

function preloadNextSevenDays() {
  const today =
    new Date();

  today.setHours(
    12,
    0,
    0,
    0
  );


  for (
    let i = 0;
    i < 7;
    i++
  ) {
    const date =
      cloneDate(today);

    date.setDate(
      today.getDate() + i
    );

    const iso =
      isoDate(date);


    fetch(
      "/api/day?date=" +
      encodeURIComponent(iso),
      {
        method: "GET",
        cache: "no-store"
      }
    ).catch(() => {});


    fetch(
      "/api/liturgia?date=" +
      encodeURIComponent(iso),
      {
        method: "GET",
        cache: "force-cache"
      }
    ).catch(() => {});


    /*
      As preces ficam sem pré-cache
      enquanto estamos testando,
      para não guardar resultados
      antigos ou incorretos.
    */
  }
}


/* =========================
   BOTÕES
========================= */

const els =
  getElements();


if (els.prevBtn) {
  els.prevBtn.addEventListener(
    "click",
    previousDay
  );
}


if (els.nextBtn) {
  els.nextBtn.addEventListener(
    "click",
    nextDay
  );
}


if (els.todayBtn) {
  els.todayBtn.addEventListener(
    "click",
    goToday
  );
}


/* =========================
   INÍCIO DO APP
========================= */

render();


setTimeout(() => {
  preloadNextSevenDays();
}, 1000);
