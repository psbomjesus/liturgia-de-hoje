let currentDate = new Date();

const weekdays = [
  "DOMINGO",
  "SEGUNDA-FEIRA",
  "TERÇA-FEIRA",
  "QUARTA-FEIRA",
  "QUINTA-FEIRA",
  "SEXTA-FEIRA",
  "SÁBADO"
];

function formatDateBR(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function isoDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

const days = {

  "2026-08-31": {
    celebration: "Segunda-feira da 22ª Semana do Tempo Comum",
    meta: "Verde · Ano Litúrgico A · Ciclo ferial: Ano II",
    prayerLabel: "Segunda-feira da Semana XXII · Tempo Comum · Ano Par"
  },

  "2026-09-01": {
    celebration: "Terça-feira da 22ª Semana do Tempo Comum",
    meta: "Verde · Ano Litúrgico A · Ciclo ferial: Ano II",
    prayerLabel: "Terça-feira da Semana XXII · Tempo Comum · Ano Par"
  },

  "2026-09-02": {
    celebration: "Quarta-feira da 22ª Semana do Tempo Comum",
    meta: "Verde · Ano Litúrgico A · Ciclo ferial: Ano II",
    prayerLabel: "Quarta-feira da Semana XXII · Tempo Comum · Ano Par"
  },

  "2026-09-03": {
    celebration: "São Gregório Magno, Papa e Doutor da Igreja",
    meta: "Branco · Ano Litúrgico A · Memória obrigatória",
    prayerLabel: "3 de setembro · São Gregório Magno"
  },

  "2026-09-04": {
    celebration: "Sexta-feira da 22ª Semana do Tempo Comum",
    meta: "Verde · Ano Litúrgico A · Ciclo ferial: Ano II",
    prayerLabel: "Sexta-feira da Semana XXII · Tempo Comum · Ano Par"
  },

  "2026-09-05": {
    celebration: "Sábado da 22ª Semana do Tempo Comum",
    meta: "Verde · Ano Litúrgico A · Ciclo ferial: Ano II",
    prayerLabel: "Sábado da Semana XXII · Tempo Comum · Ano Par"
  },

  "2026-09-06": {
    celebration: "23º Domingo do Tempo Comum",
    meta: "Verde · Ano Litúrgico A",
    prayerLabel: "23º Domingo do Tempo Comum · Ano A"
  }
};

function renderLiturgia(iso) {

  const liturgiaCard =
    document.getElementById("liturgia");

  if (!liturgiaCard) return;

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
    "Liturgia oficial da CNBB, sem resumo ou adaptação.";

  wrapper.appendChild(info);

  const iframe =
    document.createElement("iframe");

  iframe.src =
    "/api/liturgia?date=" +
    encodeURIComponent(iso);

  iframe.title =
    "Liturgia Diária";

  iframe.loading = "lazy";

  iframe.style.width = "100%";
  iframe.style.height = "900px";
  iframe.style.border =
    "1px solid #e9e0d5";
  iframe.style.borderRadius =
    "12px";
  iframe.style.background =
    "white";

  wrapper.appendChild(iframe);

  const placeholders =
    liturgiaCard.querySelectorAll(
      ".placeholder"
    );

  placeholders.forEach(
    element => element.remove()
  );

  liturgiaCard.appendChild(wrapper);
}

function render() {

  const iso =
    isoDate(currentDate);

  const data =
    days[iso];

  const weekday =
    document.getElementById("weekday");

  const date =
    document.getElementById("date");

  const celebration =
    document.getElementById("celebration");

  const meta =
    document.getElementById("meta");

  const prayerStatus =
    document.getElementById("prayerStatus");

  const pdfArea =
    document.getElementById("pdfArea");

  weekday.textContent =
    weekdays[currentDate.getDay()];

  date.textContent =
    formatDateBR(currentDate);

  pdfArea.innerHTML = "";

  if (data) {

    celebration.textContent =
      data.celebration;

    meta.textContent =
      data.meta;

    prayerStatus.innerHTML =
      "<strong>" +
      data.prayerLabel +
      "</strong><br>" +
      "Página oficial do Secretariado Nacional de Liturgia, sem alterações.";

    const iframe =
      document.createElement("iframe");

    iframe.src =
      "/api/prayer?date=" +
      encodeURIComponent(iso);

    iframe.title =
      "Oração Universal oficial do dia";

    iframe.loading =
      "lazy";

    pdfArea.appendChild(
      iframe
    );

    const fallback =
      document.createElement("p");

    fallback.style.fontSize =
      "13px";

    fallback.style.color =
      "#746d64";

    fallback.innerHTML =
      'Se o visualizador não carregar, ' +
      '<a href="/api/prayer?date=' +
      encodeURIComponent(iso) +
      '" target="_blank" rel="noopener">' +
      'toque aqui para abrir somente a página oficial deste dia</a>.';

    pdfArea.appendChild(
      fallback
    );

  } else {

    celebration.textContent =
      "Celebração a identificar automaticamente";

    meta.textContent =
      "Calendário litúrgico automático em expansão";

    prayerStatus.textContent =
      "Esta data ainda não foi incluída nesta primeira etapa funcional.";
  }

  renderLiturgia(iso);
}

document
  .getElementById("prevBtn")
  .addEventListener(
    "click",
    () => {

      currentDate.setDate(
        currentDate.getDate() - 1
      );

      render();
    }
  );

document
  .getElementById("nextBtn")
  .addEventListener(
    "click",
    () => {

      currentDate.setDate(
        currentDate.getDate() + 1
      );

      render();
    }
  );

document
  .getElementById("todayBtn")
  .addEventListener(
    "click",
    () => {

      currentDate =
        new Date();

      render();
    }
  );

render();
