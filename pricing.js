(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FolioPricing=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const numeric=value=>Number.isFinite(Number(value))?Number(value):0;

  function weightedMedian(observations){
    const rows=observations.map(row=>({value:numeric(row.soldPrice)+numeric(row.shippingPrice),weight:numeric(row.weight)||1})).filter(row=>row.value>0&&row.weight>0).sort((a,b)=>a.value-b.value);
    if(!rows.length)return 0;
    const half=rows.reduce((sum,row)=>sum+row.weight,0)/2;
    let running=0;
    for(const row of rows){running+=row.weight;if(running>=half)return row.value}
    return rows.at(-1).value;
  }

  function confidenceFor(observations){
    if(!observations.length)return {level:"未調査",score:0};
    const score=Math.min(100,Math.round(observations.reduce((sum,row)=>sum+(numeric(row.weight)||1),0)*18));
    return {level:score>=75?"高":score>=40?"中":"低",score};
  }

  function calculatePriceBands(observations,costs={}){
    const market=weightedMedian(observations);
    const feeRate=Math.min(.95,Math.max(0,numeric(costs.feeRate)/100));
    const fixed=numeric(costs.allocatedCost)+numeric(costs.packagingCost)+numeric(costs.sellerShipping)+numeric(costs.targetRecovery);
    const floor=Math.ceil(fixed/(1-feeRate));
    if(!market)return {market:0,floor,quick:0,recommended:0,patient:0,confidence:confidenceFor(observations)};
    return {market:Math.round(market),floor,quick:Math.round(market*.9),recommended:Math.max(floor,Math.round(market)),patient:Math.max(floor,Math.round(market*1.1)),confidence:confidenceFor(observations)};
  }

  function candidateId(type,items){return `${type}:${items.map(item=>item.id).sort().join("+")}`}
  function groupBy(items,key){return items.reduce((map,item)=>{const value=String(item[key]||"").trim();if(value)(map[value]??=[]).push(item);return map},{});}
  function make(type,title,reason,items){return {id:candidateId(type,items),type,title,reason,items,pieceCount:items.length};}

  function buildPackageCandidates(items){
    const surplus=items.filter(item=>numeric(item.duplicateQty)>0),candidates=[];
    Object.entries(groupBy(surplus,"country")).filter(([,group])=>group.length>=2).forEach(([country,group])=>candidates.push(make("country",`${country} セット`,"同一国の額面・年代を比較できる構成",group)));
    Object.entries(groupBy(surplus,"region")).filter(([,group])=>group.length>=3).forEach(([region,group])=>candidates.push(make("region",`${region} 入門セット`,"地域を横断して収集を始めやすい構成",group.slice(0,8))));
    Object.entries(groupBy(surplus,"currency")).filter(([,group])=>group.length>=2).forEach(([currency,group])=>candidates.push(make("currency",`${currency} 系列セット`,"同一通貨の変化を追える構成",group)));
    if(surplus.length>=3)candidates.push(make("mixed","世界の紙幣 スターターセット","低価格帯の余剰を地域横断で紹介する構成",surplus.slice(0,8)));
    surplus.slice(0,6).forEach(item=>candidates.push(make("single",`${item.country} ${item.denomination} ${item.currency}`,"比較可能な成約実績がある場合の単品候補",[item])));
    const seen=new Set();
    return candidates.filter(candidate=>{const signature=candidate.items.map(item=>item.id).sort().join("|");if(seen.has(signature))return false;seen.add(signature);return true}).slice(0,8);
  }

  return {weightedMedian,confidenceFor,calculatePriceBands,buildPackageCandidates};
});
