document.addEventListener('DOMContentLoaded', () => {
  console.log('App loaded ✅');

  // ==== State & Helpers ======================================================
  const LS_KEY = 'bt_data_v1';
  const nowISO = () => new Date().toISOString().slice(0,16); // yyyy-MM-ddTHH:mm
  const pad = n => String(n).padStart(2,'0');

  const state = load();
  function load(){
    try{ return JSON.parse(localStorage.getItem(LS_KEY) || '{"items":[]}'); }
    catch{ return {items:[]}; }
  }
  function save(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }

  function fmtTime(ts){
    const d = new Date(ts);
    return ${pad(d.getHours())}:${pad(d.getMinutes())} • ${d.toLocaleDateString('tr-TR')};
  }

  function setToday(){
    const d = new Date();
    const days = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
    const txt = ${d.toLocaleDateString('tr-TR', {day:'2-digit', month:'long', year:'numeric'})} • ${days[d.getDay()]};
    document.getElementById('todayText').textContent = txt;
  }

  // ==== Navigation ============================================================
  function go(page){
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page).classList.add('active');
    document.querySelectorAll('.bottomnav button').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(.bottomnav [data-go="${page}"]);
    if (btn) btn.classList.add('active');

    if(page==='home') renderHome();
    if(page==='history') renderHistory();
    if(page==='charts') renderCharts();
  }
  window.go = go; // ihtiyaç olursa

  // Bottomnav
  document.querySelector('.bottomnav').addEventListener('click', (e)=>{
    const b = e.target.closest('button[data-go]');
    if(!b) return;
    go(b.dataset.go);
  });

  // ==== Tabs (Add) ===========================================================
  function showForm(tab){
    document.querySelectorAll('.tab-btn').forEach(x => x.classList.toggle('active', x.dataset.tab===tab));
    document.getElementById('feedForm').classList.toggle('visible', tab==='feed');
    document.getElementById('sleepForm').classList.toggle('visible', tab==='sleep');
    document.getElementById('diaperForm').classList.toggle('visible', tab==='diaper');
    document.getElementById('growthForm').classList.toggle('visible', tab==='growth');
  }
  document.querySelector('#add .tabs').addEventListener('click', (e)=>{
    const b = e.target.closest('.tab-btn');
    if(!b) return;
    showForm(b.dataset.tab);
  });

  // ANA SAYFADAKİ 4 KART: TIKLAYINCA EKLE SEKMESİNİ AÇ
document.getElementById('home').addEventListener('click', (e) => {
  const btn = e.target.closest('.action');   // .action sınıflı kart mı?
  if (!btn) return;

  go('add');                                 // Ekle sekmesine geç
  const tab = btn.dataset.tab || 'feed';

  // Üst sekmeyi aktif et
  document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
  const tabBtn = document.querySelector(.tab-btn[data-tab="${tab}"]);
  if (tabBtn) tabBtn.classList.add('active');

  // İlgili formu göster
  function showForm(t){
    document.getElementById('feedForm').classList.toggle('visible',   t==='feed');
    document.getElementById('sleepForm').classList.toggle('visible',  t==='sleep');
    document.getElementById('diaperForm').classList.toggle('visible', t==='diaper');
    document.getElementById('growthForm').classList.toggle('visible', t==='growth');
  }
  showForm(tab);

  console.log('Kart tıklandı →', tab); // teşhis için
});

  // ==== Defaults for inputs ==================================================
  document.getElementById('feedTime').value = nowISO();
  document.getElementById('sleepStart').value = nowISO();
  document.getElementById('sleepEnd').value = nowISO();
  document.getElementById('diaperTime').value = nowISO();
  document.getElementById('growthDate').value = new Date().toISOString().slice(0,10);

  // ==== Save handlers ========================================================
  document.getElementById('saveFeed').addEventListener('click', ()=>{
    const item = {
      id: crypto.randomUUID(),
      type: 'feed',
      time: new Date(document.getElementById('feedTime').value).toISOString(),
      feedType: document.getElementById('feedType').value,
      side: document.getElementById('feedSide').value,
      duration: Number(document.getElementById('feedDuration').value || 0),
      amount: Number(document.getElementById('feedAmount').value || 0),
      note: document.getElementById('feedNote').value.trim()
    };
    state.items.push(item); save();
    go('home');
  });

  document.getElementById('saveSleep').addEventListener('click', ()=>{
    const start = new Date(document.getElementById('sleepStart').value);
    const end   = new Date(document.getElementById('sleepEnd').value);
    const mins = Math.max(0, Math.round((end-start)/60000));
    const item = {
      id: crypto.randomUUID(),
      type: 'sleep',
      start: start.toISOString(),
      end: end.toISOString(),
      minutes: mins,
      note: document.getElementById('sleepNote').value.trim()
    };
    state.items.push(item); save();
    go('home');
  });

  document.getElementById('saveDiaper').addEventListener('click', ()=>{
    const item = {
      id: crypto.randomUUID(),
      type: 'diaper',
      time: new Date(document.getElementById('diaperTime').value).toISOString(),
      diaperType: document.getElementById('diaperType').value,
      note: document.getElementById('diaperNote').value.trim()
    };
    state.items.push(item); save();
    go('home');
  });

  document.getElementById('saveGrowth').addEventListener('click', ()=>{
    const item = {
      id: crypto.randomUUID(),
      type: 'growth',
      date: new Date(document.getElementById('growthDate').value).toISOString(),
      weight: Number(document.getElementById('weight').value || 0),
      height: Number(document.getElementById('height').value || 0),
      note: document.getElementById('growthNote').value.trim()
    };
    state.items.push(item); save();
    go('home');
  });

  // ==== Renderers ============================================================
  function renderHome(){
    // bugünün filtrelenmesi
    const s = new Date(); s.setHours(0,0,0,0);
    const e = new Date(); e.setHours(23,59,59,999);
    const today = state.items.filter(x=>{
      const t = new Date(x.time || x.start || x.date);
      return t>=s && t<=e;
    });

    const feedCount = today.filter(x=>x.type==='feed').length;
    const sleepMins = today.filter(x=>x.type==='sleep').reduce((a,b)=>a+(b.minutes||0),0);
    const diaperCount = today.filter(x=>x.type==='diaper').length;

    document.getElementById('sumFeed').textContent = feedCount;
    document.getElementById('sumSleep').textContent = sleepMins;
    document.getElementById('sumDiaper').textContent = diaperCount;

    // last feed since
    const lastFeed = [...state.items].reverse().find(x=>x.type==='feed');
    if(lastFeed){
      const diffMin = Math.round((Date.now()-new Date(lastFeed.time))/60000);
      const h = Math.floor(diffMin/60), m = diffMin%60;
      document.getElementById('sinceFeed').textContent = ${h}s ${m}d;
    }else{
      document.getElementById('sinceFeed').textContent = '—';
    }

    // recent list (son 6 kayıt)
    const list = document.getElementById('recentList');
    list.innerHTML = '';
    [...state.items].slice(-6).reverse().forEach(it=>{
      const div = document.createElement('div');
      div.className = 'list-item';
      div.innerHTML = `
        <div><strong>${labelOf(it)}</strong><div class="muted">${fmtOf(it)}</div></div>
        <small>${it.note?it.note:''}</small>`;
      list.appendChild(div);
    });
  }

  function labelOf(it){
    if(it.type==='feed'){
      return it.feedType==='bottle'
        ? Biberon ${it.amount||0} ml
        : Emzirme ${it.duration||0} dk;
    }
    if(it.type==='sleep') return Uyku ${it.minutes} dk;
    if(it.type==='diaper'){
      const map = {wet:'Islak', dirty:'Kakalı', both:'İkisi'};
      return Bez • ${map[it.diaperType]||''};
    }
    if(it.type==='growth'){
      const w = it.weight? ${it.weight} gr : '';
      const h = it.height? ${it.height} cm : '';
      return Ölçüm ${w} ${h}.trim();
    }
    return 'Kayıt';
  }
  function fmtOf(it){
    const t = it.time || it.start || it.date;
    return fmtTime(t);
  }

  function renderHistory(filter='all'){
    const list = document.getElementById('historyList');
    list.innerHTML = '';
    const items = filter==='all' ? state.items : state.items.filter(x=>x.type===filter);
    if(items.length===0){ list.innerHTML = <div class="muted">Kayıt yok</div>; return; }

    [...items].reverse().forEach(it=>{
      const row = document.createElement('div');
      row.className = 'list-item';
      row.innerHTML = `
        <div>
          <strong>${labelOf(it)}</strong>
          <div class="muted">${fmtOf(it)}</div>
        </div>
        <div class="row">
          <button class="chip" data-del="${it.id}">Sil</button>
        </div>`;
      list.appendChild(row);
    });
  }

  // history filtre & sil
  document.getElementById('history').addEventListener('click', (e)=>{
    const chip = e.target.closest('.chip[data-filter]');
    if(chip){
      document.querySelectorAll('#history .chip').forEach(x=>x.classList.remove('active'));
      chip.classList.add('active');
      renderHistory(chip.dataset.filter);
      return;
    }
    const del = e.target.closest('[data-del]');
    if(del){
      const id = del.dataset.del;
      const idx = state.items.findIndex(x=>x.id===id);
      if(idx>-1){ state.items.splice(idx,1); save(); renderHistory(document.querySelector('#history .chip.active').dataset.filter); renderHome(); }
    }
  });

  function renderCharts(){
    // basit 7 gün özeti
    const byDay = {feed:0,sleep:0,diaper:0};
    const d0 = new Date(); d0.setHours(0,0,0,0);
    const d7 = new Date(d0); d7.setDate(d7.getDate()-6);

    state.items.forEach(it=>{
      const t = new Date(it.time || it.start || it.date);
      if(t>=d7){
        if(it.type==='feed') byDay.feed++;
        if(it.type==='sleep') byDay.sleep += (it.minutes||0)/60;
        if(it.type==='diaper') byDay.diaper++;
      }
    });

    document.getElementById('wFeed').textContent = byDay.feed.toFixed(0);
    document.getElementById('wSleep').textContent = byDay.sleep.toFixed(1);
    document.getElementById('wDiaper').textContent = byDay.diaper.toFixed(0);
  }

  // ==== Init ================================================================
  setToday();
  renderHome();

});
