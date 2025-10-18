# Bebek Takip Paneli (Statik Web Uygulaması)
- **Ücretsiz** olarak Vercel/Netlify üzerinde yayınlanabilir.
- Veriler cihazda **localStorage**'da saklanır.
- İsterseniz **Google Sheets (Apps Script)** veya **Supabase** ile kalıcı kayıt ekleyebilirsiniz.

## Yayınlama (Vercel)
1. Bu klasörü zip olarak yükleyin veya GitHub'a atın.
2. Vercel → New Project → Import → Deploy.

## Google Sheets Web App (Opsiyonel)
Apps Script `doPost` örneği ve config ayarı:
```javascript
function doPost(e){
  const ss = SpreadsheetApp.openById('<SHEET_ID>');
  const m = JSON.parse(e.postData.contents);
  const map = {feed:'Beslenme',diaper:'AltDegisim',sleep:'Uyku',growth:'Buyume'};
  const sh = ss.getSheetByName(map[m.kind]);
  const p = m.payload;
  if(m.kind==='feed') sh.appendRow([p.date,p.time,p.type,p.side,p.duration,p.amount,p.note,new Date()]);
  if(m.kind==='diaper') sh.appendRow([p.date,p.time,p.dtype,p.color,p.note,new Date()]);
  if(m.kind==='sleep') sh.appendRow([p.date,p.start,p.end,p.minutes,p.note,new Date()]);
  if(m.kind==='growth') sh.appendRow([p.date,p.weight,p.height,p.head,p.temp,p.note,new Date()]);
  return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
}
```
`config.js`:
```js
window.BABY_TRACKER_CONFIG = { remoteEnabled: true, endpointUrl: 'WEB_APP_URL', authToken: '' };
```
