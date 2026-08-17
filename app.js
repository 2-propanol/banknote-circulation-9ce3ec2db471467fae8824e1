const STORAGE_KEY = "banknote-circulation-ledger-v1";
const demoNotes = [
  {id:"demo-001",country:"フランス",currency:"フラン",denomination:"50",year:"1992",catalogNo:"P-157",condition:"VF",quantity:1,status:"Collection",acquisitionCost:680,acquisitionPurpose:"自己コレクション",salePrice:0,feesShipping:0,soldAt:""},
  {id:"demo-002",country:"ユーゴスラビア",currency:"ディナール",denomination:"500000000000",year:"1993",catalogNo:"P-137",condition:"XF",quantity:2,status:"Sale Candidate",acquisitionCost:420,acquisitionPurpose:"セット購入に伴う余剰",salePrice:0,feesShipping:0,soldAt:""},
  {id:"demo-003",country:"ドイツ民主共和国",currency:"マルク",denomination:"20",year:"1975",catalogNo:"P-29",condition:"VF",quantity:1,status:"Collection",acquisitionCost:560,acquisitionPurpose:"自己コレクション",salePrice:0,feesShipping:0,soldAt:""},
  {id:"demo-004",country:"モンゴル",currency:"トゥグルグ",denomination:"10",year:"1981",catalogNo:"P-43",condition:"UNC",quantity:1,status:"Listed",acquisitionCost:260,acquisitionPurpose:"セット購入に伴う余剰",salePrice:800,feesShipping:0,soldAt:""},
  {id:"demo-005",country:"ブラジル",currency:"クルゼイロ",denomination:"1000",year:"1990",catalogNo:"P-228",condition:"XF",quantity:0,status:"Sold",acquisitionCost:350,acquisitionPurpose:"セット購入に伴う余剰",salePrice:1200,feesShipping:310,soldAt:new Date().getFullYear()+"-04-18"}
];
let notes = loadNotes();
const yen = new Intl.NumberFormat("ja-JP",{style:"currency",currency:"JPY",maximumFractionDigits:0});
const els = Object.fromEntries(["ledger-body","mobile-ledger","search","status-filter","empty-state","surplus-list","surplus-count","metric-types","metric-quantity","metric-surplus","metric-listed","metric-recovery","sales-total","cost-total","net-total","register-dialog","register-form","toast","export-data","import-data","reset-demo"].map(id=>[id,document.getElementById(id)]));

function loadNotes(){try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY));return Array.isArray(value)?value:structuredClone(demoNotes)}catch{return structuredClone(demoNotes)}}
function saveNotes(){localStorage.setItem(STORAGE_KEY,JSON.stringify(notes));render()}
function escapeHtml(value){return String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]))}
function statusClass(value){return "status-"+value.toLowerCase().replaceAll(" ","-")}
function noteName(note){return `${note.country} ${note.denomination} ${note.currency}`}
function matches(note){const q=els.search.value.trim().toLowerCase();const filter=els["status-filter"].value;const text=[note.country,note.currency,note.denomination,note.year,note.catalogNo].join(" ").toLowerCase();return(!q||text.includes(q))&&(!filter||note.status===filter)}

function render(){
  const visible=notes.filter(matches);
  els["ledger-body"].innerHTML=visible.map(note=>`<tr><td><span class="note-title">${escapeHtml(noteName(note))}</span><span class="note-sub">${escapeHtml(note.year||"年不明")} · ${escapeHtml(note.condition)}</span></td><td>${escapeHtml(note.catalogNo||"未同定")}<br><span class="note-sub">${escapeHtml(note.acquisitionPurpose)}</span></td><td><span class="status ${statusClass(note.status)}">${escapeHtml(note.status)}</span></td><td>${note.quantity}</td><td>${yen.format(note.acquisitionCost||0)}</td><td><button class="row-action danger" data-delete="${escapeHtml(note.id)}">削除</button></td></tr>`).join("");
  els["mobile-ledger"].innerHTML=visible.map(note=>`<article class="mobile-note"><div class="mobile-note-head"><div><b>${escapeHtml(noteName(note))}</b><div class="note-sub">${escapeHtml(note.year||"年不明")} · ${escapeHtml(note.catalogNo||"未同定")}</div></div><span class="status ${statusClass(note.status)}">${escapeHtml(note.status)}</span></div><dl><div><dt>状態</dt><dd>${escapeHtml(note.condition)}</dd></div><div><dt>枚数</dt><dd>${note.quantity}枚</dd></div><div><dt>取得原価</dt><dd>${yen.format(note.acquisitionCost||0)}</dd></div><div><dt>取得目的</dt><dd>${escapeHtml(note.acquisitionPurpose)}</dd></div></dl><div class="mobile-actions"><button class="row-action danger" data-delete="${escapeHtml(note.id)}">削除</button></div></article>`).join("");
  els["empty-state"].hidden=visible.length>0;
  const surplus=notes.filter(n=>["Sale Candidate","Listed"].includes(n.status));
  els["surplus-count"].textContent=`${surplus.length}件`;
  els["surplus-list"].innerHTML=surplus.length?surplus.map(n=>`<div class="action-item"><div><b>${escapeHtml(noteName(n))}</b><span>${escapeHtml(n.catalogNo||"未同定")} · ${escapeHtml(n.condition)} · ${n.quantity}枚</span></div><span class="status ${statusClass(n.status)}">${escapeHtml(n.status)}</span></div>`).join(""):`<p class="empty-state">現在、余剰候補はありません。</p>`;
  const year=String(new Date().getFullYear());const sold=notes.filter(n=>n.status==="Sold"&&String(n.soldAt||"").startsWith(year));const sales=sold.reduce((a,n)=>a+(Number(n.salePrice)||0),0);const costs=sold.reduce((a,n)=>a+(Number(n.feesShipping)||0),0);const net=sales-costs;
  els["metric-types"].textContent=new Set(notes.filter(n=>n.status!=="Sold").map(n=>[n.country,n.currency,n.denomination,n.year,n.catalogNo].join("|"))).size;
  els["metric-quantity"].textContent=notes.reduce((a,n)=>a+(Number(n.quantity)||0),0);els["metric-surplus"].textContent=notes.filter(n=>n.status==="Sale Candidate").length;els["metric-listed"].textContent=notes.filter(n=>n.status==="Listed").length;els["metric-recovery"].textContent=yen.format(net);els["sales-total"].textContent=yen.format(sales);els["cost-total"].textContent=yen.format(costs);els["net-total"].textContent=yen.format(net);
}
function toast(message){els.toast.textContent=message;els.toast.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>els.toast.classList.remove("show"),2200)}
document.querySelectorAll("[data-open-register]").forEach(button=>button.addEventListener("click",()=>els["register-dialog"].showModal()));
document.querySelector("[data-close-register]").addEventListener("click",()=>els["register-dialog"].close());
els["register-form"].addEventListener("submit",event=>{event.preventDefault();const form=new FormData(event.currentTarget);notes.unshift({id:crypto.randomUUID(),country:form.get("country"),currency:form.get("currency"),denomination:form.get("denomination"),year:form.get("year"),catalogNo:form.get("catalogNo"),condition:form.get("condition"),quantity:Number(form.get("quantity")),status:form.get("status"),acquisitionCost:Number(form.get("acquisitionCost")),acquisitionPurpose:form.get("acquisitionPurpose"),salePrice:0,feesShipping:0,soldAt:""});saveNotes();event.currentTarget.reset();els["register-dialog"].close();toast("紙幣をこの端末の台帳へ登録しました")});
document.addEventListener("click",event=>{const button=event.target.closest("[data-delete]");if(!button)return;const target=notes.find(n=>n.id===button.dataset.delete);if(target&&confirm(`${noteName(target)} をこの端末の台帳から削除しますか？`)){notes=notes.filter(n=>n.id!==target.id);saveNotes();toast("台帳から削除しました")}});
[els.search,els["status-filter"]].forEach(input=>input.addEventListener("input",render));
els["export-data"].addEventListener("click",()=>{const blob=new Blob([JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),banknotes:notes},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`banknote-ledger-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);toast("JSONバックアップを書き出しました")});
els["import-data"].addEventListener("change",async event=>{const file=event.target.files[0];if(!file)return;try{const value=JSON.parse(await file.text());const imported=Array.isArray(value)?value:value.banknotes;if(!Array.isArray(imported))throw new Error();notes=imported;saveNotes();toast("JSONバックアップを読み込みました")}catch{alert("読み込める紙幣台帳JSONではありません。") }event.target.value=""});
els["reset-demo"].addEventListener("click",()=>{if(confirm("この端末の入力内容を消去してデモデータへ戻しますか？")){notes=structuredClone(demoNotes);saveNotes();toast("デモデータへ戻しました")}});
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll("[data-nav]").forEach(a=>a.classList.toggle("active",a.dataset.nav===entry.target.id))}}),{rootMargin:"-20% 0px -70%"});document.querySelectorAll("main > [id]").forEach(section=>observer.observe(section));
render();
