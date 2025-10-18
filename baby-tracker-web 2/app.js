document.addEventListener('DOMContentLoaded', () => {
  // ---------- Tarih ----------
  const d = new Date();
  const days = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
  document.getElementById('todayText').textContent =
    d.toLocaleDateString('tr-TR',{day:'2-digit',month:'long',year:'numeric'}) + ' • ' + days[d.getDay()];

  // ---------- Basit hafıza ----------
  const LS = 'bt_data_v1';
  const state = load();
  function load(){ try { return JSON.parse(localStorage.getItem(LS)||'{"items":[]}'); } catch { return {items:[]}; } }
  function save(){ localStorage.setItem(LS, JSON.stringify(state)); }

  // ---------- Navigation ----------
  function go(page){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.getElementById(page).classList.add('active');
    document.querySelectorAll('.bottomnav button').forEach(b=>b.classList.remove('active'));
    const b = document.querySelector(.bottomnav [data-go="${page}"]); if(b) b.classList.add('active');
    if(page==='home') renderHome();
    if(page==='history') renderHistory();
    if(page==='charts') renderCharts();
  }
  window.go = go;

  document.querySelector('.bottomnav').addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-go]'); if(!btn) return;
    go(btn.dataset.go);
  });

  // Ana sayfa kart → Ekle sekmesi ilgili tab
  document.getElementById('home').addEventListener('click', (e)=>{
    const btn = e.target.closest('.action'); if(!btn) return;
    go('add'); showForm(btn.dataset.tab || 'feed');
  });

  // ---------- Tabs (Ekle) ----------
  function showForm(tab){
    document.querySelectorAll('.tab-btn').forEach(x=>x.classList.toggle('active', x.dataset.tab===tab));
    document.getElementById('feedForm').classList.toggle('visible',   tab==='feed');
    document.getElementById('sleepForm').classList.toggle('visible',  tab==='sleep');
    document.getElementById('diaperForm').classList.toggle('visible', tab==='diaper');
    document.getElementById('growthForm').classList.toggle('visible', tab==='growth');
  }
  document.querySelector('#add .tabs').addEventListener('click', (e)=>{
    const btn = e.target.closest('.tab-btn'); if(!btn) return;
    showForm(btn.dataset.tab);
  });

  // ---------- Inputs default ----------
  const nowISO = () => new Date().toISOString().slice(0,16);
  document.getElementById('feedTime').value  = nowISO();
  document.getElementById('sleepStart').value = nowISO();
  document.getElementById('sleepEnd').value   = nowISO();
  document.getElementById('diaperTime').value = nowISO();
  document.getElementById('growthDate').value = new Date().toISOString().slice(0,10);

  // ---------- Kaydet butonları ----------
  const pad = n => String(n).padStart(2,'0');
  const fmt = ts => { const t=new Date(ts); return ${pad(t.getHours())}:${pad(t.getMinutes())} • ${t.toLocaleDateString('tr-TR')}; };

  document.getElementById('saveFeed').addEventListener('click', ()=>{
    state.items.push({
      id: crypto.randomUUID(), type:'feed',
      time: new Date(document.getElementById('feedTime').value).toISOString(),
      feedType: document.getElementById('feedType').value,
      side: document.getElementById('feedSide').value,
      duration: Number(document.getElementById('feedDuration').value||0),
      amount: Number(document.getElementById('feedAmount').value||0),
      note: document.getElementById('feedNote').value.trim()
    }); save(); go('home');
  });

  document.getElementById('saveSleep').addEventListener('click', ()=>{
    const s = new Date(document.getElementById('sleepStart').value);
    const e = new Date(document.getElementById('sleepEnd').value);
    const minutes = Math.max(0, Math.round((e-s)/60000));
    state.items.push({
      id: crypto.randomUUID(), type:'sleep',
      start:s.toISOString(), end:e.toISOString(), minutes,
      note: document.getElementById('sleepNote').value.trim()
    }); save(); go('home');
  });

  document.getElementById('saveDiaper').addEventListener('click', ()=>{
    state.items.push({
      id: crypto.randomUUID(), type:'diaper',
      time: new Date(document.getElementById('diaperTime').value).toISOString(),
      diaperType: document.getElementById('diaperType').value,
      note: document.getElementById('diaperNote').value.trim()
    }); save(); go('home');
  });

  document.getElementById('saveGrowth').addEventListener('click', ()=>{
    state.items.push({
      id: crypto.randomUUID(), type:'growth',
      date: new Date(document.getElementById('growthDate').value).toISOString(),
      weight: Number(document.getElementById('weight').value||0),
      height: Number(document.getElementById('height').value||0),
      note: document.getElementById('growthNote').value.trim()
    }); save(); go('home');
  });

  // ---------- Renderers ----------
  function labelOf(it){
    if(it.type==='feed'){
      return it.feedType==='bottle'
        ? Biberon ${it.amount||0} ml : Emzirme ${it.duration||0} dk;
    }
    if(it.type==='sleep')  return Uyku ${it.minutes||0} dk;
    if(it.type==='diaper'){ const map={wet:'Islak',dirty:'Kakalı',both:'İkisi'}; return Bez • ${map[it.diaperType]||''}; }
    if(it.type==='growth'){ const w=it.weight?${it.weight} gr:''; const h=it.height?${it.height} cm:''; return Ölçüm ${w} ${h}.trim(); }
    return 'Kayıt';
  }
  function timeOf(it){ return fmt(it.time || it.start || it.date); }

  function renderHome(){
    const s = new Date(); s.setHours(0,0,0,0);
    const e = new Date(); e.setHours(23,59,59,999);
    const today = state.items.filter(x=>{ const t=new Date(x.time||x.start||x.date); return t>=s && t<=e; });

    document.getElementById('sumFeed').textContent   = today.filter(x=>x.type==='feed').length;
    document.getElementById('sumSleep').textContent  = today.filter(x=>x.type==='sleep').reduce((a,b)=>a+(b.minutes||0),0);
    document.getElementById('sumDiaper').textContent = today.filter(x=>x.type==='diaper').length;

    const lastFeed = [...state.items].reverse().find(x=>x.type==='feed');
    if(lastFeed){
      const diffMin = Math.round((Date.now()-new Date(lastFeed.time))/60000);
      const h = Math.floor(diffMin/60), m = diffMin%60;
      document.getElementById('sinceFeed').textContent = ${h}s ${m}d;
    } else document.getElementById('sinceFeed').textContent = '—';

    const list = document.getElementById('recentList'); list.innerHTML='';
    [...state.items].slice(-6).reverse().forEach(it=>{
      const div=document.createElement('div'); div.className='list-item';
      div.innerHTML = <div><strong>${labelOf(it)}</strong><div class="muted">${timeOf(it)}</div></div><small>${it.note||''}</small>;
      list.appendChild(div);
    });
  }

  function renderHistory(filter='all'){
    const list = document.getElementById('historyList'); list.innerHTML='';
    const items = filter==='all' ? state.items : state.items.filter(x=>x.type===filter);
    if(items.length===0){ list.innerHTML='<div class="muted">Kayıt yok</div>'; return; }
    [...items].reverse().forEach(it=>{
      const row=document.createElement('div'); row.className='list-item';
      row.innerHTML=<div><strong>${labelOf(it)}</strong><div class="muted">${timeOf(it)}</div></div>;
      list.appendChild(row);
    });
  }
  document.getElementById('history').addEventListener('click',(e)=>{
    const c=e.target.closest('.chip[data-filter]'); if(!c) return;
    document.querySelectorAll('#history .chip').forEach(x=>x.classList.remove('active'));
    c.classList.add('active'); renderHistory(c.dataset.filter);
  });

  function renderCharts(){
    const d0=new Date(); d0.setHours(0,0,0,0);
    const d7=new Date(d0); d7.setDate(d7.getDate()-6);
    let f=0,s=0,d=0;
    state.items.forEach(it=>{
      const t=new Date(it.time||it.start||it.date);
      if(t>=d7){ if(it.type==='feed')f++; if(it.type==='sleep')s+=(it.minutes||0)/60; if(it.type==='diaper')d++; }
    });
    document.getElementById('wFeed').textContent   = (f/7).toFixed(1);
    document.getElementById('wSleep').textContent  = (s/7).toFixed(1)+'s';
    document.getElementById('wDiaper').textContent = (d/7).toFixed(1);
  }

  // init
  renderHome();
});
