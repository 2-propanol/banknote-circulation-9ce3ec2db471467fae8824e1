const PUBLIC_SITE="https://rune-markar.github.io/folio-7c4e19a2/";
const PUBLIC_DATA_URL=new URL("data/collection.json",PUBLIC_SITE).href;
const PRIVATE_KEY="banknote-circulation-ledger-v1";
const PRIVATE_MARKET_KEY="banknote-circulation-market-v1";
const PUBLIC_CACHE_KEY="folio-public-collection-cache-v1";
let publicDatabase={schemaVersion:null,updatedAt:"",items:[]};
let privateNotes=loadPrivateNotes();
let privateMarket=loadPrivateMarket();
let packageCandidates=[];
const yen=new Intl.NumberFormat("ja-JP",{style:"currency",currency:"JPY",maximumFractionDigits:0});
const $=id=>document.getElementById(id);
const palette=[["#235f62","#318f82"],["#5f3d78","#9672bc"],["#6b4b2b","#b7813c"],["#25496b","#3e81ab"],["#5c3440","#a45c67"]];

function loadPrivateNotes(){
  try{
    const value=JSON.parse(localStorage.getItem(PRIVATE_KEY));
    return Array.isArray(value)?value.filter(note=>!String(note.id).startsWith("demo-")):[];
  }catch{return []}
}
function loadPrivateMarket(){
  try{
    const value=JSON.parse(localStorage.getItem(PRIVATE_MARKET_KEY));
    return {observations:Array.isArray(value?.observations)?value.observations:[],costs:value?.costs&&typeof value.costs==="object"?value.costs:{},decisions:value?.decisions&&typeof value.decisions==="object"?value.decisions:{}};
  }catch{return {observations:[],costs:{},decisions:{}}}
}
function savePrivate(){localStorage.setItem(PRIVATE_KEY,JSON.stringify(privateNotes));render()}
function saveMarket(){localStorage.setItem(PRIVATE_MARKET_KEY,JSON.stringify(privateMarket));render()}
function esc(value){return String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]))}
function noteName(note){return `${note.country} ${note.denomination} ${note.currency}`}
function colors(note){return palette[Math.abs([...note.id].reduce((sum,char)=>sum+char.charCodeAt(0),0))%palette.length]}
function imageUrl(path){if(!path)return "";try{return new URL(path,PUBLIC_SITE).href}catch{return ""}}
function visual(note){
  const [a,b]=colors(note),front=imageUrl(note.imageFront);
  return `<div class="note-visual${front?" has-image":""}" style="--note-a:${a};--note-b:${b}">${front?`<img src="${esc(front)}" alt="" loading="lazy">`:""}<small>${esc(note.country)} · ${esc(note.catalogNo||"UNLISTED")}</small><b>${esc(note.denomination)}</b></div>`;
}
function normalizePublic(item){
  const duplicateQty=Number(item.duplicateQty||0),collectionQty=Number(item.collectionQty||0);
  return {id:item.id,source:"world-banknote-archive",country:item.country||"",region:item.region||"",currency:item.currency||"",denomination:item.denomination||"",year:item.year||"",series:item.series||"",catalogNo:item.catalogNumber||"",condition:item.condition||"未評価",quantity:collectionQty+duplicateQty,collectionQty,duplicateQty,status:duplicateQty>0?"Sale Candidate":"Collection",acquisitionCost:0,acquisitionPurpose:"公開所蔵データ",imageFront:item.images?.front||"",imageBack:item.images?.back||"",story:item.story||""};
}
function allNotes(){return [...publicDatabase.items.map(normalizePublic),...privateNotes]}
function setText(id,value){const element=$(id);if(element)element.textContent=value}
function filtered(){
  const query=$("search").value.trim().toLowerCase(),status=$("status-filter").value;
  return allNotes().filter(note=>(!query||[note.country,note.region,note.currency,note.denomination,note.year,note.catalogNo,note.series].join(" ").toLowerCase().includes(query))&&(!status||note.status===status));
}
function evidenceWeight(level){return level==="exact"?3:level==="close"?1.5:.5}
function candidateFor(id){return packageCandidates.find(candidate=>candidate.id===id)}
function candidatePayload(candidate){
  return {purpose:"紙幣パッケージの成約相場調査",packageType:candidate.type,packageTitle:candidate.title,items:candidate.items.map(note=>({sourceItemId:note.id,country:note.country,currency:note.currency,denomination:note.denomination,issueYear:note.year,catalogNumber:note.catalogNo,condition:note.condition}))};
}
function renderPackageStudio(duplicateItems){
  packageCandidates=FolioPricing.buildPackageCandidates(duplicateItems);
  const grid=$("package-grid");
  if(!packageCandidates.length){grid.innerHTML='<p class="empty-state">パッケージを構成できる余剰はありません。</p>';return}
  grid.innerHTML=packageCandidates.map(candidate=>{
    const observations=privateMarket.observations.filter(row=>row.candidateId===candidate.id).map(row=>({...row,weight:evidenceWeight(row.matchLevel)}));
    const costs=privateMarket.costs[candidate.id]||{};
    const prices=FolioPricing.calculatePriceBands(observations,costs);
    const accepted=privateMarket.decisions[candidate.id]==="accepted";
    const itemNames=candidate.items.map(note=>`${note.country} ${note.denomination} ${note.currency}`).join(" / ");
    const priceBlock=observations.length?`<div class="price-bands"><div><span>早期</span><b>${yen.format(prices.quick)}</b></div><div class="recommended"><span>推奨</span><b>${yen.format(prices.recommended)}</b></div><div><span>長期</span><b>${yen.format(prices.patient)}</b></div></div><p class="price-evidence">成約証拠 ${observations.length}件 · 確信度 ${prices.confidence.level} · 最低線 ${yen.format(prices.floor)}</p>`:`<div class="unpriced"><b>価格は未算定</b><span>成約事例を入力すると価格帯を計算します</span></div>`;
    return `<article class="package-card${accepted?" accepted":""}"><div class="package-top"><span class="proposal-tag">${accepted?"採用済み":"未確認の提案"}</span><small>${candidate.pieceCount} PIECES</small></div><h3>${esc(candidate.title)}</h3><p>${esc(candidate.reason)}</p><div class="package-items">${esc(itemNames)}</div>${priceBlock}<div class="package-actions"><button class="secondary-action" data-open-market="${esc(candidate.id)}">＋ 成約事例</button><button class="secondary-action" data-research="${esc(candidate.id)}">調査データ</button><button class="${accepted?"secondary-action":"primary-action"}" data-approve-package="${esc(candidate.id)}">${accepted?"採用を取消":"候補を採用"}</button>${observations.length?`<button class="text-action" data-clear-market="${esc(candidate.id)}">証拠を消去</button>`:""}</div></article>`;
  }).join("");
}
async function syncPublicCollection(){
  const state=$("sync-state");state.className="";state.innerHTML="<i></i> 同期中";setText("sync-updated","公開サイトを確認しています");
  try{
    const response=await fetch(PUBLIC_DATA_URL,{cache:"no-store"});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const data=await response.json();
    if(!Array.isArray(data.items))throw new Error("items missing");
    publicDatabase=data;
    try{localStorage.setItem(PUBLIC_CACHE_KEY,JSON.stringify(data))}catch{}
    state.innerHTML="<i></i> 同期済み";
    setText("sync-updated",`schema v${data.schemaVersion} · 更新 ${data.updatedAt||"不明"}`);
  }catch(error){
    try{const cached=JSON.parse(localStorage.getItem(PUBLIC_CACHE_KEY));if(Array.isArray(cached.items))publicDatabase=cached}catch{}
    state.className="error";state.innerHTML="<i></i> 同期エラー";
    setText("sync-updated",publicDatabase.items.length?"前回取得データを表示中":"公開データを取得できません");
  }
  render();
}
function render(){
  const notes=allNotes(),publicItems=publicDatabase.items.map(normalizePublic),duplicateItems=publicItems.filter(note=>note.duplicateQty>0);
  const year=String(new Date().getFullYear()),sold=privateNotes.filter(note=>note.status==="Sold"&&String(note.soldAt||"").startsWith(year));
  const sales=sold.reduce((sum,note)=>sum+(Number(note.salePrice)||0),0),cost=sold.reduce((sum,note)=>sum+(Number(note.feesShipping)||0),0),net=sales-cost;
  const totalPieces=publicItems.reduce((sum,note)=>sum+note.quantity,0);
  const duplicatePieces=publicItems.reduce((sum,note)=>sum+note.duplicateQty,0);
  setText("metric-types",publicItems.length);setText("metric-quantity",totalPieces);setText("metric-surplus",duplicatePieces);setText("metric-recovery",yen.format(net));setText("nav-collection-count",publicItems.length);setText("nav-surplus-count",duplicatePieces);
  ["current-year","records-year"].forEach(id=>setText(id,year));["hero-net-total","hero-recovery-total","net-total"].forEach(id=>setText(id,yen.format(net)));["hero-sales-total","sales-total"].forEach(id=>setText(id,yen.format(sales)));["hero-cost-total","cost-total"].forEach(id=>setText(id,yen.format(cost)));
  $("recent-grid").innerHTML=(publicItems.length?publicItems:privateNotes).slice(0,3).map(note=>`<article class="recent-card">${visual(note)}<div class="recent-info"><b>${esc(noteName(note))}</b><span>${esc(note.year)} · ${esc(note.condition)}</span></div></article>`).join("");
  const shown=filtered();
  $("collection-grid").innerHTML=shown.map(note=>`<article class="note-card">${visual(note)}<div class="note-info"><h3>${esc(noteName(note))}</h3><p>${esc(note.year||"年不明")} · ${esc(note.catalogNo||"未同定")}</p><div class="note-meta"><div><span>状態 / 枚数</span><b>${esc(note.condition)} · ${note.quantity}枚</b></div><div><span>重複</span><b>${note.duplicateQty||0}枚</b></div></div><div class="note-actions"><span class="status">${note.source==="world-banknote-archive"?"WBA · ":""}${esc(note.status)}</span>${note.source==="world-banknote-archive"?`<a class="delete" href="${PUBLIC_SITE}">参照 ↗</a>`:`<button class="delete" data-delete="${esc(note.id)}">削除</button>`}</div></div></article>`).join("");
  $("empty-state").hidden=shown.length>0;
  setText("surplus-count",duplicateItems.length);setText("pipeline-candidate",duplicatePieces);setText("pipeline-listed",privateNotes.filter(note=>note.status==="Listed").length);setText("pipeline-sold",privateNotes.filter(note=>note.status==="Sold").length);
  renderPackageStudio(duplicateItems);
  $("surplus-list").innerHTML=duplicateItems.length?duplicateItems.map(note=>`<article class="surplus-item">${visual(note)}<div><b>${esc(noteName(note))}</b><small>${esc(note.catalogNo||"未同定")} · 本蔵${note.collectionQty}枚 + 重複${note.duplicateQty}枚</small></div><span class="status">WBA · DUPLICATE</span></article>`).join(""):'<p class="empty-state">公開データ上の重複はありません。</p>';
}
function showView(view){
  const safe=["dashboard","collection","surplus","records"].includes(view)?view:"dashboard";
  document.querySelectorAll("[data-view]").forEach(element=>element.classList.toggle("active",element.dataset.view===safe));
  document.querySelectorAll("[data-view-link]").forEach(element=>element.classList.toggle("active",element.dataset.viewLink===safe));
  if(location.hash!==`#${safe}`)history.replaceState(null,"",`#${safe}`);
  scrollTo({top:0,behavior:"smooth"});
}
function toast(message){$("toast").textContent=message;$("toast").classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>$("toast").classList.remove("show"),2000)}

document.addEventListener("click",event=>{
  const link=event.target.closest("[data-view-link]");if(link){event.preventDefault();showView(link.dataset.viewLink)}
  const button=event.target.closest("[data-delete]");if(button){const note=privateNotes.find(item=>item.id===button.dataset.delete);if(note&&confirm(`${noteName(note)} を削除しますか？`)){privateNotes=privateNotes.filter(item=>item.id!==note.id);savePrivate();toast("ローカル登録を削除しました")}}
  const marketButton=event.target.closest("[data-open-market]");if(marketButton){
    const candidate=candidateFor(marketButton.dataset.openMarket);if(!candidate)return;
    const form=$("market-form"),costs=privateMarket.costs[candidate.id]||{};form.reset();form.elements.candidateId.value=candidate.id;
    ["allocatedCost","packagingCost","sellerShipping","feeRate","targetRecovery"].forEach(name=>{if(costs[name]!==undefined)form.elements[name].value=costs[name]});
    $("market-candidate-summary").innerHTML=`<b>${esc(candidate.title)}</b><span>${candidate.pieceCount}枚 · ${candidate.items.length}種類</span>`;$("market-dialog").showModal();
  }
  const researchButton=event.target.closest("[data-research]");if(researchButton){const candidate=candidateFor(researchButton.dataset.research);if(candidate){$("research-payload").textContent=JSON.stringify(candidatePayload(candidate),null,2);$("research-dialog").showModal()}}
  const approveButton=event.target.closest("[data-approve-package]");if(approveButton){const id=approveButton.dataset.approvePackage;privateMarket.decisions[id]=privateMarket.decisions[id]==="accepted"?"proposed":"accepted";saveMarket();toast(privateMarket.decisions[id]==="accepted"?"パッケージ候補を採用しました":"採用を取り消しました")}
  const clearButton=event.target.closest("[data-clear-market]");if(clearButton&&confirm("この候補の成約証拠をすべて消去しますか？")){privateMarket.observations=privateMarket.observations.filter(row=>row.candidateId!==clearButton.dataset.clearMarket);saveMarket();toast("成約証拠を消去しました")}
});
document.querySelectorAll("[data-open-register]").forEach(button=>button.addEventListener("click",()=>$("register-dialog").showModal()));
document.querySelector("[data-close-register]").addEventListener("click",()=>$("register-dialog").close());
$("register-form").addEventListener("submit",event=>{
  event.preventDefault();const form=new FormData(event.currentTarget);
  privateNotes.unshift({id:`local-${crypto.randomUUID()}`,source:"local",country:form.get("country"),currency:form.get("currency"),denomination:form.get("denomination"),year:form.get("year"),catalogNo:form.get("catalogNo"),condition:form.get("condition"),quantity:Number(form.get("quantity")),collectionQty:Number(form.get("quantity")),duplicateQty:0,status:"Local Draft",acquisitionCost:Number(form.get("acquisitionCost")),acquisitionPurpose:form.get("acquisitionPurpose"),salePrice:0,feesShipping:0,soldAt:""});
  savePrivate();event.currentTarget.reset();$("register-dialog").close();showView("collection");toast("ローカル下書きとして登録しました");
});
document.querySelector("[data-close-market]").addEventListener("click",()=>$("market-dialog").close());
$("market-form").addEventListener("submit",event=>{
  event.preventDefault();const form=new FormData(event.currentTarget),candidateId=form.get("candidateId");
  privateMarket.observations.push({id:crypto.randomUUID(),candidateId,marketplace:form.get("marketplace"),matchLevel:form.get("matchLevel"),soldPrice:Number(form.get("soldPrice")),shippingPrice:Number(form.get("shippingPrice")),soldAt:form.get("soldAt"),listingUrl:form.get("listingUrl"),recordedAt:new Date().toISOString()});
  privateMarket.costs[candidateId]={allocatedCost:Number(form.get("allocatedCost")),packagingCost:Number(form.get("packagingCost")),sellerShipping:Number(form.get("sellerShipping")),feeRate:Number(form.get("feeRate")),targetRecovery:Number(form.get("targetRecovery"))};
  saveMarket();$("market-dialog").close();toast("成約証拠を保存し、価格を再計算しました");
});
$("copy-research").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("research-payload").textContent);toast("調査用JSONをコピーしました")}catch{toast("コピーできませんでした")}});
["search","status-filter"].forEach(id=>$(id).addEventListener("input",render));
$("sync-now").addEventListener("click",syncPublicCollection);
$("export-data").addEventListener("click",()=>{
  const payload={schemaVersion:2,exportedAt:new Date().toISOString(),publicSource:{url:PUBLIC_DATA_URL,schemaVersion:publicDatabase.schemaVersion,updatedAt:publicDatabase.updatedAt},privateLedger:privateNotes,privateMarket};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),anchor=document.createElement("a");anchor.href=url;anchor.download=`folio-ledger-${new Date().toISOString().slice(0,10)}.json`;anchor.click();URL.revokeObjectURL(url);toast("連携情報と私有台帳を書き出しました");
});
$("import-data").addEventListener("change",async event=>{try{const data=JSON.parse(await event.target.files[0].text()),list=Array.isArray(data)?data:data.privateLedger||data.banknotes;if(!Array.isArray(list))throw new Error();privateNotes=list.filter(note=>!String(note.id).startsWith("demo-"));if(data.privateMarket){privateMarket={observations:Array.isArray(data.privateMarket.observations)?data.privateMarket.observations:[],costs:data.privateMarket.costs||{},decisions:data.privateMarket.decisions||{}};localStorage.setItem(PRIVATE_MARKET_KEY,JSON.stringify(privateMarket))}savePrivate();toast("私有台帳と市場証拠を読み込みました")}catch{alert("読み込めるFOLIO台帳JSONではありません。")}event.target.value=""});
$("reset-demo").textContent="ローカル下書きを消去";
$("reset-demo").addEventListener("click",()=>{if(confirm("ローカル下書き、私有台帳、市場証拠を消去しますか？")){privateNotes=[];privateMarket={observations:[],costs:{},decisions:{}};localStorage.removeItem(PRIVATE_MARKET_KEY);savePrivate();toast("ローカルデータを消去しました")}});
addEventListener("hashchange",()=>showView(location.hash.slice(1)));
showView(location.hash.slice(1));render();syncPublicCollection();
