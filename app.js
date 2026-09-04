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

function render(){
  document.getElementById("weekday").textContent = weekdays[currentDate.getDay()];
  document.getElementById("date").textContent = formatDateBR(currentDate);

  // Dados provisórios apenas para 4/9/2026.
  const iso = [
    currentDate.getFullYear(),
    String(currentDate.getMonth()+1).padStart(2,"0"),
    String(currentDate.getDate()).padStart(2,"0")
  ].join("-");

  const celebration = document.getElementById("celebration");
  const meta = document.getElementById("meta");
  const prayerStatus = document.getElementById("prayerStatus");
  const pdfArea = document.getElementById("pdfArea");

  pdfArea.innerHTML = "";

  if(iso === "2026-09-04"){
    celebration.textContent = "22ª Semana do Tempo Comum";
    meta.textContent = "Verde · Ano Litúrgico A · Ciclo ferial: Ano II";
    prayerStatus.textContent = "Formulário ferial do Tempo Comum — ano par.";
    const iframe = document.createElement("iframe");
    iframe.src = "https://liturgia.pt/oracaouniversal/ferial/06UnivFerialSNLTCPar.pdf";
    iframe.title = "Oração Universal";
    pdfArea.appendChild(iframe);
  } else {
    celebration.textContent = "Celebração a identificar automaticamente";
    meta.textContent = "Calendário litúrgico automático em preparação";
    prayerStatus.textContent = "A seleção automática do PDF para esta data será adicionada na próxima etapa.";
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
