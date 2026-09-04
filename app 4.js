let currentDate = new Date();

const weekdays = [
  "DOMINGO","SEGUNDA-FEIRA","TERÇA-FEIRA","QUARTA-FEIRA",
  "QUINTA-FEIRA","SEXTA-FEIRA","SÁBADO"
];

function formatDateBR(date){
  return new Intl.DateTimeFormat("pt-BR", {
    day:"numeric", month:"long", year:"numeric"
  }).format(date);
}

function isoDate(date){
  return [
    date.getFullYear(),
    String(date.getMonth()+1).padStart(2,"0"),
    String(date.getDate()).padStart(2,"0")
  ].join("-");
}

/*
  PRIMEIRO MÓDULO FUNCIONAL
  Semana XXII do Tempo Comum de 2026.
  O PDF é o documento oficial do Secretariado Nacional de Liturgia.
  Nesta etapa não extraímos, alteramos nem resumimos o conteúdo.
*/
const days = {
  "2026-08-31": {
    celebration:"Segunda-feira da 22ª Semana do Tempo Comum",
    meta:"Verde · Ano Litúrgico A · Ciclo ferial: Ano II",
    prayerLabel:"Segunda-feira da Semana XXII · Tempo Comum · Ano Par"
  },
  "2026-09-01": {
    celebration:"Terça-feira da 22ª Semana do Tempo Comum",
    meta:"Verde · Ano Litúrgico A · Ciclo ferial: Ano II",
    prayerLabel:"Terça-feira da Semana XXII · Tempo Comum · Ano Par"
  },
  "2026-09-02": {
    celebration:"Quarta-feira da 22ª Semana do Tempo Comum",
    meta:"Verde · Ano Litúrgico A · Ciclo ferial: Ano II",
    prayerLabel:"Quarta-feira da Semana XXII · Tempo Comum · Ano Par"
  },
  "2026-09-03": {
    celebration:"São Gregório Magno, Papa e Doutor da Igreja",
    meta:"Branco · Ano Litúrgico A · Memória obrigatória",
    prayerLabel:"3 de setembro · São Gregório Magno"
  },
  "2026-09-04": {
    celebration:"Sexta-feira da 22ª Semana do Tempo Comum",
    meta:"Verde · Ano Litúrgico A · Ciclo ferial: Ano II",
    prayerLabel:"Sexta-feira da Semana XXII · Tempo Comum · Ano Par"
  },
  "2026-09-05": {
    celebration:"Sábado da 22ª Semana do Tempo Comum",
    meta:"Verde · Ano Litúrgico A · Ciclo ferial: Ano II",
    prayerLabel:"Sábado da Semana XXII · Tempo Comum · Ano Par"
  }
};

const ordinaryEvenPdf =
  "https://liturgia.pt/oracaouniversal/ferial/06UnivFerialSNLTCPar.pdf";

const santoralPdf =
  "https://liturgia.pt/oracaouniversal/ferial/07UnivFerialSNLSantoral.pdf";

const ordinaryWeek22Pages = {
  "2026-08-31": 128, // segunda
  "2026-09-01": 129, // terça
  "2026-09-02": 130, // quarta
  "2026-09-04": 132, // sexta
  "2026-09-05": 133  // sábado
};

function getPrayerPdf(iso){
  if(iso === "2026-09-03"){
    return santoralPdf;
  }
  if(ordinaryWeek22Pages[iso]){
    return ordinaryEvenPdf + "#page=" + ordinaryWeek22Pages[iso] + "&view=FitH";
  }
  return null;
}

function render(){
  const iso = isoDate(currentDate);
  const data = days[iso];

  document.getElementById("weekday").textContent =
    weekdays[currentDate.getDay()];
  document.getElementById("date").textContent =
    formatDateBR(currentDate);

  const celebration = document.getElementById("celebration");
  const meta = document.getElementById("meta");
  const prayerStatus = document.getElementById("prayerStatus");
  const pdfArea = document.getElementById("pdfArea");

  pdfArea.innerHTML = "";

  if(data){
    celebration.textContent = data.celebration;
    meta.textContent = data.meta;
    prayerStatus.innerHTML =
      "<strong>" + data.prayerLabel + "</strong><br>" +
      "Documento oficial exibido abaixo, sem alterações.";

    const pdf = getPrayerPdf(iso);

    if(pdf){
      const iframe = document.createElement("iframe");
      iframe.src = pdf;
      iframe.title = "Oração Universal oficial";
      iframe.loading = "lazy";
      pdfArea.appendChild(iframe);

      const fallback = document.createElement("p");
      fallback.style.fontSize = "13px";
      fallback.style.color = "#746d64";
      fallback.innerHTML =
        'Se o iPhone não exibir o PDF dentro desta área, ' +
        '<a href="' + pdf + '" target="_blank" rel="noopener">toque aqui para abrir o documento oficial</a>.';
      pdfArea.appendChild(fallback);
    }
  } else {
    celebration.textContent =
      "Celebração a identificar automaticamente";
    meta.textContent =
      "Calendário litúrgico automático em expansão";
    prayerStatus.textContent =
      "Esta data ainda não foi incluída nesta primeira etapa funcional.";
  }
}

document.getElementById("prevBtn").addEventListener("click", ()=>{
  currentDate.setDate(currentDate.getDate()-1);
  render();
});

document.getElementById("nextBtn").addEventListener("click", ()=>{
  currentDate.setDate(currentDate.getDate()+1);
  render();
});

document.getElementById("todayBtn").addEventListener("click", ()=>{
  currentDate = new Date();
  render();
});

render();
