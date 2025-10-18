(function(){
  const cfg = window.BABY_TRACKER_CONFIG || {};
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const todayStr = () => new Date().toISOString().slice(0,10);
  const pad = (n) => String(n).padStart(2,"0");
  const nowTime = () => { const d=new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

  const state = JSON.parse(localStorage.getItem("baby-tracker-data")||'{"feed":[],"diaper":[],"sleep":[],"growth":[]}');
  const save = () => localStorage.setItem("baby-tracker-data", JSON.stringify(state));

  $$(".tab-btn").forEach(btn => btn.addEventListener("click", () => {
    $$(".tab").forEach(s => s.classList.remove("active"));
    $("#"+btn.dataset.tab).classList.add("active");
  }));

  $("#feedDate").value = todayStr();
  $("#feedTime").value = nowTime();
  $("#diaperDate").value = todayStr();
  $("#diaperTime").value = nowTime();
  $("#sleepDate").value = todayStr();
  $("#sleepStart").value = nowTime();
  $("#sleepEnd").value = nowTime();
  $("#growthDate").value = todayStr();

  function renderTable(id, rows, cols){
    const tbody = document.querySelector(`#${id} tbody`);
    tbody.innerHTML = "";
    rows.forEach((row, idx)=>{
      const tr = document.createElement("tr");
      cols.forEach(c=>{
        const td = document.createElement("td");
        td.textContent = row[c] ?? "";
        tr.appendChild(td);
      });
      const del = document.createElement("td");
      const btn = document.createElement("button");
      btn.textContent = "Sil";
      btn.onclick = ()=>{ rows.splice(idx,1); save(); renderAll(); };
      del.appendChild(btn);
      tr.appendChild(del);
      tbody.appendChild(tr);
    });
  }

  function renderAll(){
    renderTable("feed", state.feed, ["date","time","type","side","duration","amount","note"]);
    renderTable("diaper", state.diaper, ["date","time","dtype","color","note"]);
    renderTable("sleep", state.sleep, ["date","start","end","minutes","note"]);
    renderTable("growth", state.growth, ["date","weight","height","head","temp","note"]);
    renderSummary();
  }

  $("#feedForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const item = {
      date: $("#feedDate").value,
      time: $("#feedTime").value,
      type: $("#feedType").value,
      side: $("#feedSide").value,
      duration: $("#feedDuration").value ? Number($("#feedDuration").value) : "",
      amount: $("#feedAmount").value ? Number($("#feedAmount").value) : "",
      note: $("#feedNote").value || ""
    };
    state.feed.unshift(item); save(); renderAll();
    if(cfg.remoteEnabled && cfg.endpointUrl){ try{ await remoteSend("feed", item);}catch(e){console.warn(e);} }
    e.target.reset(); $("#feedDate").value=todayStr(); $("#feedTime").value=nowTime();
  });

  $("#diaperForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const item = {
      date: $("#diaperDate").value,
      time: $("#diaperTime").value,
      dtype: $("#diaperType").value,
      color: $("#diaperColor").value || "",
      note: $("#diaperNote").value || ""
    };
    state.diaper.unshift(item); save(); renderAll();
    if(cfg.remoteEnabled && cfg.endpointUrl){ try{ await remoteSend("diaper", item);}catch(e){console.warn(e);} }
    e.target.reset(); $("#diaperDate").value=todayStr(); $("#diaperTime").value=nowTime();
  });

  $("#sleepForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const start = $("#sleepStart").value, end = $("#sleepEnd").value;
    const minutes = diffMinutes(start, end);
    const item = {
      date: $("#sleepDate").value,
      start, end, minutes,
      note: $("#sleepNote").value || ""
    };
    state.sleep.unshift(item); save(); renderAll();
    if(cfg.remoteEnabled && cfg.endpointUrl){ try{ await remoteSend("sleep", item);}catch(e){console.warn(e);} }
    e.target.reset(); $("#sleepDate").value=todayStr(); $("#sleepStart").value=nowTime(); $("#sleepEnd").value=nowTime();
  });

  $("#growthForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const item = {
      date: $("#growthDate").value,
      weight: Number($("#growthWeight").value || 0),
      height: $("#growthHeight").value ? Number($("#growthHeight").value) : "",
      head: $("#growthHead").value ? Number($("#growthHead").value) : "",
      temp: $("#growthTemp").value ? Number($("#growthTemp").value) : "",
      note: $("#growthNote").value || ""
    };
    state.growth.unshift(item); save(); renderAll();
    if(cfg.remoteEnabled && cfg.endpointUrl){ try{ await remoteSend("growth", item);}catch(e){console.warn(e);} }
    e.target.reset(); $("#growthDate").value=todayStr();
  });

  function diffMinutes(start, end){
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let mins = (eh*60+em) - (sh*60+sm);
    if(mins < 0) mins += 24*60;
    return mins;
  }

  function renderSummary(){
    const today = todayStr();
    const feeds = state.feed.filter(x=>x.date===today);
    const diapers = state.diaper.filter(x=>x.date===today);
    const sleeps = state.sleep.filter(x=>x.date===today);
    const totalMl = feeds.reduce((s,x)=>s + (Number(x.amount)||0), 0);
    const totalMin = feeds.reduce((s,x)=>s + (Number(x.duration)||0), 0);
    const sleepMin = sleeps.reduce((s,x)=>s + (Number(x.minutes)||0), 0);
    $("#summaryContent").innerHTML = `
      <p><strong>Bugün:</strong> ${today}</p>
      <ul>
        <li>Beslenme sayısı: ${feeds.length}</li>
        <li>Toplam miktar (ml): ${totalMl}</li>
        <li>Toplam emzirme süresi (dk): ${totalMin}</li>
        <li>Alt değişim: ${diapers.length} (Çiş/Kaka)</li>
        <li>Toplam uyku (dk): ${sleepMin}</li>
      </ul>
    `;
  }

  $("#exportJson").addEventListener("click", ()=>{
    const blob = new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bebek-takip-${todayStr()}.json`;
    a.click();
  });
  $("#importBtn").addEventListener("click", ()=> $("#importJson").click());
  $("#importJson").addEventListener("change", (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{ Object.assign(state, JSON.parse(reader.result)); save(); renderAll(); };
    reader.readAsText(file);
  });

  $("#exportCsv").addEventListener("click", ()=>{
    const today = todayStr();
    const feeds = state.feed.filter(x=>x.date===today);
    const rows = [["date","time","type","side","duration","amount","note"]]
      .concat(feeds.map(x=>[x.date,x.time,x.type,x.side,x.duration,x.amount,x.note]));
    const csv = rows.map(r=>r.map(v=>`"${(v??"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `bugun-beslenme-${today}.csv`;
    a.click();
  });

  async function remoteSend(kind, payload){
    if(!cfg.endpointUrl) return;
    const headers = {"Content-Type":"application/json"};
    if(cfg.authToken) headers["Authorization"] = "Bearer "+cfg.authToken;
    await fetch(cfg.endpointUrl, { method:"POST", headers, body: JSON.stringify({kind, payload}) });
  }

  renderAll();
})();