(function(){
  const $  = (s)=>document.querySelector(s);
  const $$ = (s)=>document.querySelectorAll(s);
  const todayStr = ()=> new Date().toISOString().slice(0,10);
  const pad2 = (n)=> String(n).padStart(2,'0');
  const nowTime = ()=> {const d=new Date();return ${pad2(d.getHours())}:${pad2(d.getMinutes())}}

  // Local data
  const state = JSON.parse(localStorage.getItem("baby-tracker-data")||'{"feed":[],"diaper":[],"sleep":[],"growth":[]}');
  const save  = ()=> localStorage.setItem("baby-tracker-data", JSON.stringify(state));

  // NAV: tek sayfa açık olsun
  function go(id){
    $$(".page").forEach(p=>p.classList.remove("active"));
    $("#"+id).classList.add("active");
    $$(".bottomnav button").forEach(b=>b.classList.toggle("active", b.dataset.go===id));
  }
  $$(".bottomnav button").forEach(b=> b.onclick=()=> go(b.dataset.go));
  go("home"); // açılışta sadece ana sayfa

  // Tabs (Ekle sayfası)
  $$(".tab-btn").forEach(b=>b.onclick=()=>{
    $$(".tab-btn").forEach(x=>x.classList.remove("active")); b.classList.add("active");
    const t=b.dataset.tab;
    $("#feedForm").style.display   = (t==="feed")?"block":"none";
    $("#sleepForm").style.display  = (t==="sleep")?"block":"none";
    $("#diaperForm").style.display = (t==="diaper")?"block":"none";
    $("#growthForm").style.display = (t==="growth")?"block":"none";
  });
  // varsayılan
  $("#sleepForm").style.display="none"; $("#diaperForm").style.display="none"; $("#growthForm").style.display="none";

  // Varsayılan tarih/saat
  ["#feedDate","#diaperDate","#sleepDate","#growthDate"].forEach(s=>$(s).value=todayStr());
  $("#feedTime").value   = nowTime();
  $("#diaperTime").value = nowTime();
  $("#sleepStart").value = nowTime();
  $("#sleepEnd").value   = nowTime();
  $("#todayText") && ($("#todayText").textContent = new Date().toLocaleDateString('tr-TR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}));

  // Hızlı doldurma çipleri
  $$(".chip").forEach(chip=>{
    chip.onclick=()=>{
      const [sel,val]=chip.dataset.fill.split(":");
      const el=document.querySelector(sel);
      if(el){ el.value=val; el.dispatchEvent(new Event("input")); }
    }
  });

  // FORMLAR
  $("#feedForm")?.addEventListener("submit",(e)=>{
    e.preventDefault();
    state.feed.unshift({
      date:$("#feedDate").value, time:$("#feedTime").value,
      type:$("#feedType").value, side:$("#feedSide").value,
      duration:$("#feedDuration").value? +$("#feedDuration").value : "",
      amount:$("#feedAmount").value? +$("#feedAmount").value : "",
      note:$("#feedNote").value||""
    });
    save(); renderAll(); e.target.reset(); $("#feedDate").value=todayStr(); $("#feedTime").value=nowTime();
  });

  $("#diaperForm")?.addEventListener("submit",(e)=>{
    e.preventDefault();
    state.diaper.unshift({
      date:$("#diaperDate").value, time:$("#diaperTime").value,
      dtype:$("#diaperType").value, color:$("#diaperColor").value||"", note:$("#diaperNote").value||""
    });
    save(); renderAll(); e.target.reset(); $("#diaperDate").value=todayStr(); $("#diaperTime").value=nowTime();
  });

  $("#sleepForm")?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const s=$("#sleepStart").value, t=$("#sleepEnd").value;
    const m=((+t.slice(0,2))*60+(+t.slice(3)))-((+s.slice(0,2))*60+(+s.slice(3))); const mins=m<0?m+1440:m;
    state.sleep.unshift({date:$("#sleepDate").value,start:s,end:t,minutes:mins,note:$("#sleepNote").value||""});
    save(); renderAll(); e.target.reset(); $("#sleepDate").value=todayStr(); $("#sleepStart").value=nowTime(); $("#sleepEnd").value=nowTime();
  });

  $("#growthForm")?.addEventListener("submit",(e)=>{
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

  // ÖZETLER
  function renderAll(){ renderSummary(); renderTable(); }
  function renderSummary(){
    const t=todayStr();
    const feeds=state.feed.filter(x=>x.date===t);
    const diapers=state.diaper.filter(x=>x.date===t);
    const sleeps=state.sleep.filter(x=>x.date===t);
    $("#sumFeedCount") && ($("#sumFeedCount").textContent=feeds.length);
    $("#sumMl") && ($("#sumMl").textContent=feeds.reduce((s,x)=>s+(+x.amount||0),0));
    $("#sumMin") && ($("#sumMin").textContent=feeds.reduce((s,x)=>s+(+x.duration||0),0));
    $("#sumDiaper") && ($("#sumDiaper").textContent=diapers.length);
    $("#sumSleep") && ($("#sumSleep").textContent=sleeps.reduce((s,x)=>s+(+x.minutes||0),0));
    if($("#sinceLastFeed")){
      if(state.feed.length){
        const last=state.feed[0]; const [h,m]=last.time.split(":").map(Number);
        const now=new Date(); const diff=(now.getHours()*60+now.getMinutes())-(h*60+m); const mins=diff<0?diff+1440:diff;
        $("#sinceLastFeed").textContent=${Math.floor(mins/60)}s ${mins%60}d;
      }else $("#sinceLastFeed").textContent="–";
    }
  }

  function renderTable(){
    const tb=$("#feedTable tbody"); if(!tb) return;
    const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-7);
    const rows=state.feed.filter(x=> new Date(x.date)>=cutoff).slice(0,200);
    tb.innerHTML="";
    rows.forEach((r,i)=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${r.date}</td><td>${r.time}</td><td>${r.type}</td><td>${r.side||""}</td>
      <td>${r.duration||""}</td><td>${r.amount||""}</td><td>${r.note||""}</td>
      <td><button data-i="${i}" class="primary" style="padding:6px 10px">Sil</button></td>`;
      tb.appendChild(tr);
    });
    tb.querySelectorAll("button").forEach(b=> b.onclick=()=>{ state.feed.splice(b.dataset.i,1); save(); renderAll(); });
  }

  renderAll();
})();
