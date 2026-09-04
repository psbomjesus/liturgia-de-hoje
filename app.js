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
   LITURGIA
========================= */

function renderLiturgia(date) {
  const els = getElements();

  if (!els.liturgiaCard) return;

  const iso = isoDate(date);

  const old =
    document.getElementById("liturgiaLive");

  if (old) {
    old.remove();
  }

  const wrapper =
    document.createElement("div");

  wrapper.id = "liturgiaLive";


  const info =
    document.createElement("p");

  info.style.color = "#746d64";
  info.style.lineHeight = "1.55";

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

  iframe.loading = "eager";

  iframe.style.width = "100%";
  iframe.style.height = "1000px";

  iframe.style.border =
    "1px solid #e9e0d5";

  iframe.style.borderRadius =
    "12px";

  iframe.style.background =
    "#ffffff";

  wrapper.appendChild(iframe);


  const placeholders =
    els.liturgiaCard.querySelectorAll(
      ".placeholder"
    );

  placeholders.forEach(element => {
    element.remove();
  });


  els.liturgiaCard.appendChild(wrapper);
}


/* =========================
   ORAÇÃO DOS FIÉIS
========================= */

function renderPrayer(date) {
  const els = getElements();

  if (!els.pdfArea) return;

  const iso = isoDate(date);

  els.pdfArea.innerHTML = "";


  if (els.prayerStatus) {
    els.prayerStatus.innerHTML =
      "<strong>Oração dos Fiéis do dia</strong><br>" +
      "Formulário correspondente à celebração litúrgica desta data.";
  }


  const iframe =
    document.createElement("iframe");

  iframe.src =
    "/api/prayer?date=" +
    encodeURIComponent(iso);

  iframe.title =
    "Oração dos Fiéis";

  iframe.loading = "eager";

  iframe.style.width = "100%";

  iframe.style.minHeight = "760px";

  iframe.style.border =
    "1px solid #e9e0d5";

  iframe.style.borderRadius =
    "12px";

  iframe.style.background =
    "#ffffff";

  els.pdfArea.appendChild(iframe);


  const fallback =
    document.createElement("p");

  fallback.style.fontSize = "13px";
  fallback.style.color = "#746d64";
  fallback.style.lineHeight = "1.5";

  fallback.innerHTML =
    'Se o visualizador não carregar, ' +
    '<a href="/api/prayer?date=' +
    encodeURIComponent(iso) +
    '" target="_blank" rel="noopener">' +
    'toque aqui para abrir a oração deste dia</a>.';

  els.pdfArea.appendChild(fallback);
}


/* =========================
   CABEÇALHO
========================= */

function renderHeader(date) {
  const els = getElements();

  if (els.weekday) {
    els.weekday.textContent =
      weekdays[date.getDay()];
  }

  if (els.date) {
    els.date.textContent =
      formatDateBR(date);
  }


  /*
    A identificação completa da celebração,
    cor, semana e ciclo será ligada ao
    calendário litúrgico automático na
    próxima etapa.

    Aqui não usamos mais uma tabela
    manual de datas.
  */

  if (els.celebration) {
    els.celebration.textContent =
      "Liturgia do dia";
  }

  if (els.meta) {
    els.meta.textContent =
      "Calendário litúrgico automático";
  }
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
  currentDate = new Date();

  currentDate.setHours(
    12, 0, 0, 0
  );

  render();
}


/* =========================
   PRÉ-CARREGAMENTO
   HOJE + 6 DIAS
========================= */

function preloadNextSevenDays() {
  const today = new Date();

  today.setHours(
    12, 0, 0, 0
  );


  for (let i = 0; i < 7; i++) {

    const date =
      cloneDate(today);

    date.setDate(
      today.getDate() + i
    );

    const iso =
      isoDate(date);


    /*
      Pré-carrega a Liturgia.
    */

    fetch(
      "/api/liturgia?date=" +
      encodeURIComponent(iso),
      {
        method: "GET",
        cache: "force-cache"
      }
    ).catch(() => {});


    /*
      Pré-carrega também as Preces.

      Quando o novo prayer.js automático
      estiver instalado, os sete dias
      ficarão preparados juntos.
    */

    fetch(
      "/api/prayer?date=" +
      encodeURIComponent(iso),
      {
        method: "GET",
        cache: "force-cache"
      }
    ).catch(() => {});
  }
}


/* =========================
   BOTÕES
========================= */

const els = getElements();

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
