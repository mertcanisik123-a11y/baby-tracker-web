document.addEventListener('DOMContentLoaded', function(){
  const $  = (s)=>document.querySelector(s);
  const $$ = (s)=>document.querySelectorAll(s);
  const todayStr = ()=> new Date().toISOString().slice(0,10);
  const pad2 = (n)=> String(n).padStart(2,'0');
  const nowTime = ()=> {const d=new Date();return ${pad2(d.getHours())}:${pad2(d.getMinutes())}}

  // Depo
  const state = JSON.parse(localStorage.getItem("baby-tracker-data")||'{"feed":[],"diaper":[],"sleep":[],"growth":[]}');
  const save  = ()=> localStorage.setItem("baby-tracker-data", JSON.stringify(state));
  let editing = {kind:null, index:null};

  // NAV
  function go(id){
    $$(".page").forEach(p=>p.classList.remove("active"));
    $("#"+id).classList.add("active");
    $$(".bottomnav button").forEach(b=>b.classList.toggle("active", b.dataset.go===id));
  }
  document.querySelector('.bottomnav').addEventListener('click',(e)=>{
    const btn=e.target.closest('button[data-go]'); if(!btn) return; go(btn.dataset.go);
  });
  go('home');

  // Home kartlarından Ekle sayfasına geç
  $$(".action").forEach(b=> b.addEventListener('click', ()=>{
    go('add');
    const t=b.dataset.tab||'feed';
    document.querySelectorAll(".tab-btn").forEach(x=>x.classList.toggle("active", x.dataset.tab===t));
    showForm(t);
  }));

  function showForm(t){
    $("#feedForm").style.display   = (t==="feed")?"block":"none";
    $("#sleepForm").style.display  = (t==="sleep")?"block":"none";
    $("#diaperForm").style.display = (t==="diaper")?"block":"none";
    $("#growthForm").style.display = (t==="growth")?"block":"none";
  }
  $$(".tab-btn").forEach(b=>b.onclick=()=>{ 
    $$(".tab-btn").forEach(x=>x.classList.remove("active")); b.classList.add("active");
    showForm(b.dataset.tab);
  });
  showForm('feed');

  // Varsayılan tarih/saat
  ["#feedDate","#diaperDate","#sleepDate","#growthDate"].forEach(s=>$(s).value=todayStr());
  $("#feedTime").value   = nowTime();
  $("#diaperTime").value = nowTime();
  $("#sleepStart").value = nowTime();
  $("#sleepEnd").value   = nowTime();
  $("#todayText").textContent = new Date().toLocaleDateString('tr-TR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});

  // Hızlı doldurma
  $$(".chip").forEach(ch=> ch.onclick=()=>{
    const [sel,val]=ch.dataset.fill.split(":"); const el=document.querySelector(sel);
    if(el){ el.value=val; el.dispatchEvent(new Event("input")); }
  });

  // FORMLAR — Beslenme
  $("#feedForm").addEventListener("submit",(e)=>{
    e.preventDefault();
    const item = {
      date:$("#feedDate").value, time:$("#feedTime").value,
      type:$("#feedType").value, side:$("#feedSide").value,
      duration:$("#feedDuration").value? +$("#feedDuration").value : "",
      amount:$("#feedAmount").value? +$("#feedAmount").value : "",
      note:$("#feedNote").value||""
    };
    if(editing.kind==="feed" && editing.index!=null){
      state.feed[editing.index]=item; editing={kind:null,index:null}; $("#feedSubmit").textContent="Kaydet";
    }else{
      state.feed.unshift(item);
    }
    save(); renderAll(); e.target.reset(); $("#feedDate").value=todayStr(); $("#feedTime").value=nowTime();
  });

  // Bez
  $("#diaperForm").addEventListener("submit",(e)=>{
    e.preventDefault();
    state.diaper.unshift({
      date:$("#diaperDate").value, time:$("#diaperTime").value,
      dtype:$("#diaperType").value, color:$("#diaperColor").value||"", note:$("#diaperNote").value||""
    });
    save(); renderAll(); e.target.reset(); $("#diaperDate").value=todayStr(); $("#diaperTime").value=nowTime();
  });

  // Uyku
  $("#sleepForm").addEventListener("submit",(e)=>{
    e.preventDefault();
    const s=$("#sleepStart").value, t=$("#sleepEnd").value;
    const m=((+t.slice(0,2))*60+(+t.slice(3)))-((+s.slice(0,2))*60+(+s.slice(3))); const mins=m<0?m+1440:m;
    state.sleep.unshift({date:$("#sleepDate").value,start:s,end:t,minutes:mins,note:$("#sleepNote").value||""});
    save(); renderAll(); e.target.reset(); $("#sleepDate").value=todayStr(); $("#sleepStart").value=nowTime(); $("#sleepEnd").value=nowTime();
  });

  // Ölçüm
  $("#growthForm").addEventListener("submit",(e)=>{
    e.preventDefault();
    state.growth.unshift({
      date:$("#growthDate").value,
      weight:+($("#growthWeight").value||0),
      height:$("#growthHeight").value? +$("#growthHeight").value:"",
      head:$("#growthHead").value? +$("#growthHead").value:"",
      temp:$("#growthTemp").value? +$("#growthTemp").value:"",
      note:$("#growthNote").value||""
    });
    save(); renderAll(); e.target.reset(); $("#growthDate").value=todayStr();
  });

  // ÖZET / TABLO / REHBER / HAFTALIK
  function renderAll(){ renderSummary(); renderTable(); renderGuide(); renderWeekly(); }
  $("#refreshSummary").addEventListener("click", renderAll);

  function renderSummary(){
    const t=todayStr();
    const feeds=state.feed.filter(x=>x.date===t);
    const diapers=state.diaper.filter(x=>x.date===t);
    const sleeps=state.sleep.filter(x=>x.date===t);
    $("#sumFeedCount").textContent=feeds.length;
    $("#sumMl").textContent=feeds.reduce((s,x)=>s+(+x.amount||0),0);
    $("#sumMin").textContent=feeds.reduce((s,x)=>s+(+x.duration||0),0);
    $("#sumDiaper").textContent=diapers.length;
    $("#sumSleep").textContent=sleeps.reduce((s,x)=>s+(+x.minutes||0),0);

    if(state.feed.length){
      const last=state.feed[0]; const [h,m]=last.time.split(":").map(Number);
      const now=new Date(); const diff=(now.getHours()*60+now.getMinutes())-(h*60+m); const mins=diff<0?diff+1440:diff;
      $("#sinceLastFeed").textContent=${Math.floor(mins/60)}s ${mins%60}d;
    }else $("#sinceLastFeed").textContent="–";
  }

  function renderTable(){
    const tb=$("#feedTable tbody"); if(!tb) return;
    const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-7);
    const rows=state.feed.filter(x=> new Date(x.date)>=cutoff);
    tb.innerHTML="";
    rows.forEach((r,i)=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${r.date}</td><td>${r.time}</td><td>${r.type}</td><td>${r.side||""}</td>
      <td>${r.duration||""}</td><td>${r.amount||""}</td><td>${r.note||""}</td>
      <td style="display:flex;gap:6px">
        <button data-i="${i}" class="edit">Düzenle</button>
        <button data-i="${i}" class="delete" style="background:#ef4444;color:#fff;border:none;border-radius:8px;padding:6px 10px">Sil</button>
      </td>`;
      tb.appendChild(tr);
    });
    tb.querySelectorAll(".delete").forEach(b=>{
      b.onclick=()=>{ state.feed.splice(b.dataset.i,1); save(); renderAll(); };
    });
    tb.querySelectorAll(".edit").forEach(b=>{
      b.onclick=()=>{
        const i=+b.dataset.i, r=state.feed[i];
        $("#feedDate").value=r.date; $("#feedTime").value=r.time;
        $("#feedType").value=r.type; $("#feedSide").value=r.side||"-";
        $("#feedDuration").value=r.duration||""; $("#feedAmount").value=r.amount||"";
        $("#feedNote").value=r.note||"";
        editing={kind:"feed", index:i}; $("#feedSubmit").textContent="Güncelle";
        go('add'); document.querySelector(.tab-btn[data-tab="feed"]).click();
      };
    });
  }

  function renderGuide(){
    const age= +($("#ageMonths")?.value||1);
    const ml = age<=1? "120–150" : age<=2? "150–180" : age<=3? "150–210" : "Doktora danışın";
    const freq = age<=1? "7–9" : age<=3? "6–8" : "5–7";
    const el=$("#guideResult"); if(!el) return;
    el.innerHTML=`
      <div class="stat"><div class="stat_label">Biberon (ml/öğün)</div><div class="stat_value">${ml}</div></div>
      <div class="stat"><div class="stat_label">Emzirme (kez/gün)</div><div class="stat_value">${freq}</div></div>`;
  }
  $("#ageMonths")?.addEventListener("input", renderGuide);

  function renderWeekly(){
    const out=$("#weeklySummary"); if(!out) return;
    const days=7; const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-days);
    let feed=0, ml=0, sleep=0;
    state.feed.forEach(x=>{ if(new Date(x.date)>=cutoff){ feed++; ml+=(+x.amount||0); }});
    state.sleep.forEach(x=>{ if(new Date(x.date)>=cutoff){ sleep+=(+x.minutes||0); }});
    out.innerHTML=`<div class="stat"><div class="stat_label">Beslenme</div><div class="stat_value">${feed}</div></div>
                   <div class="stat"><div class="stat_label">Toplam ml</div><div class="stat_value">${ml}</div></div>
                   <div class="stat"><div class="stat_label">Uyku (dk)</div><div class="stat_value">${sleep}</div></div>`;
  }

  renderAll();
});
