const test=require("node:test");
const assert=require("node:assert/strict");
const {weightedMedian,calculatePriceBands,buildPackageCandidates}=require("../pricing.js");

test("weighted median favors stronger comparable evidence",()=>{
  assert.equal(weightedMedian([{soldPrice:900,weight:1},{soldPrice:1200,weight:3},{soldPrice:3000,weight:.5}]),1200);
});

test("recommended price never falls below private cost floor",()=>{
  const result=calculatePriceBands([{soldPrice:1000,shippingPrice:200,weight:1}],{allocatedCost:900,packagingCost:100,sellerShipping:230,targetRecovery:300,feeRate:10});
  assert.equal(result.market,1200);
  assert.equal(result.floor,1700);
  assert.equal(result.recommended,1700);
});

test("package candidates use duplicate inventory only",()=>{
  const candidates=buildPackageCandidates([
    {id:"a",country:"A",region:"R",currency:"X",duplicateQty:1},
    {id:"b",country:"A",region:"R",currency:"Y",duplicateQty:2},
    {id:"c",country:"B",region:"R",currency:"Z",duplicateQty:0}
  ]);
  assert.ok(candidates.some(candidate=>candidate.type==="country"));
  assert.ok(candidates.every(candidate=>candidate.items.every(item=>item.duplicateQty>0)));
  assert.ok(candidates.every(candidate=>candidate.pieceCount===candidate.items.length));
});
