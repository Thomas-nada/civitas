/**
 * Builds drep-votes-intersect-24m.xlsx — hybrid model (on-chain overrides Ekklesia)
 * All VP values in ADA internally. Display in M ADA where labelled.
 * Data sources:
 *   - On-chain votes: Koios (fresh)
 *   - DRep VP: Koios drep_info (fresh, lovelace → /1e6 = ADA)
 *   - Ekklesia votes: Civitas server (fresh, lovelace → /1e6 = ADA)
 *   - DRep ranking/universe: Civitas snapshot (same epoch, votingPowerAda in ADA)
 *   - Total active stake: snapshot (full universe, supplemented by Koios for top 500)
 */
const ExcelJS = require('exceljs');
const fs = require('fs');

const OUT_PATH = 'C:/Users/Thomas/Desktop/drep-votes-intersect-24m.xlsx';
const EKK_PROPOSAL_ID = '6a1512d73ea9a75799cf8f1c';
const GOV_ACTION_ID   = 'gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8sgx6wlxf';

// ── bech32 decode ─────────────────────────────────────────────────────────────
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const CMAP    = Object.fromEntries([...CHARSET].map((c,i)=>[c,i]));
function toHash(b) {
  try {
    const s=b.toLowerCase(), si=s.lastIndexOf('1'), ds=s.slice(si+1);
    const d=[...ds].map(c=>CMAP[c]), p=d.slice(0,-6);
    let bits=0,v=0; const by=[];
    for(const x of p){v=(v<<5)|x;bits+=5;if(bits>=8){bits-=8;by.push((v>>bits)&0xff);}}
    return Buffer.from(by.slice(1)).toString('hex');
  } catch { return ''; }
}

// ── Load raw data ─────────────────────────────────────────────────────────────
const snap       = require('./snapshot.seed.json');
const ekkRaw     = require('C:/Users/Thomas/AppData/Local/Temp/ekklesia-fresh.json');
const onchainRaw = require('C:/Users/Thomas/AppData/Local/Temp/onchain-votes-fresh.json');
const koiosInfo  = require('C:/Users/Thomas/AppData/Local/Temp/koios-drep-info-fresh.json');

// ── Deregistered set (from fresh Koios drep_info) ────────────────────────────
const deregSet = new Set(
  koiosInfo.filter(d=>d.drep_status==='deregistered').map(d=>d.drep_id.toLowerCase())
);

// ── Fresh VP lookup (Koios, lovelace → ADA, only active=true) ────────────────
// amount is in lovelace in Koios response
const vpByIdKoios   = {};  // drep_id → ADA
const vpByHexKoios  = {};  // hex     → ADA
for (const d of koiosInfo) {
  if (d.active !== true) continue;
  const ada = Number(d.amount) / 1e6;
  if (d.drep_id) vpByIdKoios[d.drep_id.toLowerCase()] = ada;
  if (d.hex)     vpByHexKoios[d.hex.toLowerCase()] = ada;
}

// ── Ekklesia votes (lovelace → ADA) ──────────────────────────────────────────
const ekkAllVotes = (ekkRaw.votes[EKK_PROPOSAL_ID] || []);
const ekkVotes    = ekkAllVotes.filter(v => !deregSet.has(v.userId.toLowerCase()));
const excludedList = ekkAllVotes.filter(v => deregSet.has(v.userId.toLowerCase()))
  .map(v=>`${v.name} (${v.vote})`).join(', ');

// Ekklesia VP: prefer fresh Koios, fall back to Ekklesia's own votingPower (lovelace)
function getVpAda(userId) {
  const id = userId.toLowerCase();
  const hash = toHash(userId);
  return vpByIdKoios[id]
      || vpByHexKoios[hash]
      || Number(ekkAllVotes.find(v=>v.userId.toLowerCase()===id)?.votingPower || 0) / 1e6;
}

const ekkById   = Object.fromEntries(ekkVotes.map(v=>[v.userId.toLowerCase(), v.vote]));
const ekkByHash = Object.fromEntries(ekkVotes.map(v=>[toHash(v.userId), v.vote]));
const nameById  = Object.fromEntries(ekkVotes.map(v=>[v.userId.toLowerCase(), v.name || '']));

// ── On-chain votes (Koios, hex-keyed) ────────────────────────────────────────
const onChainDreps  = onchainRaw.filter(v=>v.voter_role==='DRep' && !deregSet.has(v.voter_id?.toLowerCase()));
const onChainByHex  = Object.fromEntries(onChainDreps.map(v=>[v.voter_hex.toLowerCase(), v.vote]));
const onChainById   = {};
for (const d of snap.dreps) {
  const hash = toHash(d.id);
  if (hash && onChainByHex[hash]) onChainById[d.id.toLowerCase()] = onChainByHex[hash];
}

// ── Snapshot universe for ranking and total active stake ─────────────────────
// snapshot votingPowerAda is in ADA
const snapActiveDreps = snap.dreps.filter(d =>
  d.status === 'active' && !d.id.startsWith('drep_always') && !deregSet.has(d.id.toLowerCase())
);
const alwaysNoConfAda = Number(snap.specialDreps.alwaysNoConfidence.votingPowerAda); // ADA
const totalActiveAda  = snapActiveDreps.reduce((s,d)=>s+Number(d.votingPowerAda||0),0) + alwaysNoConfAda;

// VP per drep (prefer fresh Koios, fall back to snapshot)
function getDrepVpAda(snapDrep) {
  const hash = toHash(snapDrep.id);
  return vpByIdKoios[snapDrep.id.toLowerCase()]
      || vpByHexKoios[hash]
      || Number(snapDrep.votingPowerAda || 0);
}

// ── Top 500 ───────────────────────────────────────────────────────────────────
const regularDreps = snap.dreps
  .filter(d=>!d.id.startsWith('drep_always') && !deregSet.has(d.id.toLowerCase()))
  .sort((a,b)=>Number(b.votingPowerAda)-Number(a.votingPowerAda));
const top500 = regularDreps.slice(0,500);

// ── Live on-chain stats ───────────────────────────────────────────────────────
let curYesAda=0, curNoAda=0, curAbsAda=0, curYesCt=0, curNoCt=0, curAbsCt=0;
for (const v of onChainDreps) {
  const vp = vpByHexKoios[v.voter_hex.toLowerCase()] || 0;
  if(v.vote==='Yes')    {curYesAda+=vp; curYesCt++;}
  else if(v.vote==='No'){curNoAda+=vp;  curNoCt++;}
  else                  {curAbsAda+=vp; curAbsCt++;}
}
const curDenom   = totalActiveAda - curAbsAda;
const curYesPct  = curDenom > 0 ? curYesAda/curDenom : 0;
const liveDataAt = new Date(Math.max(...onChainDreps.map(d=>d.block_time))*1000).toUTCString();
const fetchedAt  = new Date().toUTCString();

// ── Hybrid prediction ─────────────────────────────────────────────────────────
// For each Ekklesia voter: use on-chain vote if cast, else Ekklesia vote
let hybYesAda=0, hybNoAda=0, hybAbsAda=0, hybYesCt=0, hybNoCt=0, hybAbsCt=0;
for (const v of ekkVotes) {
  const hash  = toHash(v.userId);
  const vote  = onChainByHex[hash] || v.vote;
  const vp    = getVpAda(v.userId);
  if(vote==='Yes')    {hybYesAda+=vp; hybYesCt++;}
  else if(vote==='No'){hybNoAda+=vp;  hybNoCt++;}
  else                {hybAbsAda+=vp; hybAbsCt++;}
}
const hybDenom  = totalActiveAda - hybAbsAda;
const hybYesPct = hybDenom > 0 ? hybYesAda/hybDenom : 0;

// ── Sorted Ekklesia for DRep Votes sheet ─────────────────────────────────────
const sortedEkk = [...ekkVotes].sort((a,b)=>{
  const ord={Yes:0,No:1,Abstain:2};
  const od=(ord[a.vote]??3)-(ord[b.vote]??3);
  return od!==0?od:getVpAda(b.userId)-getVpAda(a.userId);
});

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  darkBlue:'FF1E3A5F', midBlue:'FF2D6A9F', lightBlue:'FFEFF6FF',
  green:'FF2D7D4F', darkGreen:'FF1A6B39', lightGreen:'FFD4EDDA',
  red:'FFC0392B', darkRed:'FF922B21',
  grey:'FF7F8C8D', lightGrey:'FFF0F4F8',
  amber:'FFFFC107', amberBg:'FFFFF3CD', amberText:'FF856404',
  white:'FFFFFFFF', offWhite:'FFF8F9FA',
};
const fill  = a=>({type:'pattern',pattern:'solid',fgColor:{argb:a}});
const fnt   = (a,sz=10,bold=false,italic=false)=>({color:{argb:a},size:sz,bold,italic,name:'Calibri'});
const aln   = (h='left',v='middle',wrap=false)=>({horizontal:h,vertical:v,wrapText:wrap});

function voteStyle(vote) {
  if(vote==='Yes')     return {fill:fill(C.green),  font:fnt(C.white,10,true)};
  if(vote==='No')      return {fill:fill(C.red),    font:fnt(C.white,10,true)};
  if(vote==='Abstain') return {fill:fill(C.grey),   font:fnt(C.white,10,true)};
  return {};
}
function addCF(ws,ref,rules){ if(!ws.conditionalFormattings)ws.conditionalFormattings=[]; ws.conditionalFormattings.push({ref,rules}); }
function voteCFRules() {
  return [
    {type:'containsText',operator:'containsText',text:'Yes',    priority:1,style:{fill:fill(C.green),font:fnt(C.white,10,true)}},
    {type:'containsText',operator:'containsText',text:'No',     priority:2,style:{fill:fill(C.red),  font:fnt(C.white,10,true)}},
    {type:'containsText',operator:'containsText',text:'Abstain',priority:3,style:{fill:fill(C.grey), font:fnt(C.white,10,true)}},
  ];
}
function setCell(ws,r,c,val,opts={}) {
  const cell=ws.getCell(r,c);
  if(opts.formula) cell.value={formula:opts.formula}; else cell.value=val;
  if(opts.fill)   cell.fill=opts.fill;
  if(opts.font)   cell.font=opts.font;
  if(opts.align)  cell.alignment=opts.align;
  if(opts.numFmt) cell.numFmt=opts.numFmt;
  return cell;
}
function fmt(n,decimals=2){ return Number(n).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g,','); }

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator='Civitas'; wb.created=new Date();
  buildSummary(wb);
  buildDrepVotes(wb);
  buildTop500(wb);
  buildPrediction(wb);
  await wb.xlsx.writeFile(OUT_PATH);
  console.log('Saved:', OUT_PATH);
  console.log(`\nKEY NUMBERS:`);
  console.log(`  Fetched at:          ${fetchedAt}`);
  console.log(`  Latest on-chain vote: ${liveDataAt}`);
  console.log(`  On-chain Yes:        ${curYesCt} DReps, ${fmt(curYesAda/1e6)}M ADA  (${(curYesPct*100).toFixed(2)}%)`);
  console.log(`  Hybrid Yes:          ${hybYesCt} DReps, ${fmt(hybYesAda/1e6)}M ADA  (${(hybYesPct*100).toFixed(2)}%)`);
  console.log(`  Total active stake:  ${fmt(totalActiveAda/1e6)}M ADA`);
  console.log(`  Ekklesia voters:     ${ekkVotes.length}  (excluded deregistered: ${ekkAllVotes.length-ekkVotes.length})`);
}

// ═════════════════════════════════════════════════════════════════════════════
function buildSummary(wb) {
  const ws = wb.addWorksheet('Summary',{properties:{tabColor:{argb:C.darkBlue.slice(2)}}});
  ws.getColumn(1).width=2; ws.getColumn(2).width=36; ws.getColumn(3).width=2;
  ws.getColumn(4).width=20; ws.getColumn(5).width=4; ws.getColumn(6).width=36;
  ws.getColumn(7).width=2; ws.getColumn(8).width=20; ws.getColumn(9).width=2;

  let r=1;
  function block(text,bg,fc,sz,bold,italic,wrap) {
    ws.mergeCells(r,1,r,9);
    setCell(ws,r,1,text,{fill:fill(bg),font:fnt(fc,sz,bold,italic),align:aln('left','middle',wrap)});
    ws.getRow(r).height=sz>=13?30:wrap?24:18; r++;
  }
  function gap(h=8){ws.getRow(r).height=h;r++;}
  function secHdr(t){
    ws.mergeCells(r,1,r,9);
    setCell(ws,r,1,t,{fill:fill(C.midBlue),font:fnt(C.white,10,true),align:aln('left','middle')});
    ws.getRow(r).height=18; r++;
  }
  function statRow(l1,v1,f1,l2,v2,f2,isF1,isF2) {
    ws.getRow(r).height=16;
    setCell(ws,r,2,l1,{font:fnt('FF222222',10,true),align:aln('left','middle')});
    const c1=ws.getCell(r,4); if(isF1)c1.value={formula:v1};else c1.value=v1;
    c1.numFmt=f1; c1.alignment=aln('right','middle'); c1.font=fnt('FF111111',10,true);
    if(l2!==undefined){
      setCell(ws,r,6,l2,{font:fnt('FF222222',10,true),align:aln('left','middle')});
      const c2=ws.getCell(r,8); if(isF2)c2.value={formula:v2};else c2.value=v2;
      c2.numFmt=f2; c2.alignment=aln('right','middle'); c2.font=fnt('FF111111',10,true);
    }
    r++;
  }

  // Title
  block('Cardano Budget 2026 — DRep Vote Summary',C.darkBlue,C.white,15,true,false,false);
  block('Intersect: Governance coordination and technical stewardship for the Cardano ecosystem — 25,400,000 ADA',C.darkBlue,'FFAECCE8',10,false,false,true);
  block(`Data: Koios API (on-chain) + Ekklesia (off-chain ballot). Fetched ${fetchedAt}`,C.darkBlue,'FF8AAECC',9,false,true,false);
  block(`Excluded (deregistered on-chain): ${excludedList}`,C.amberBg,C.amberText,10,false,true,true);
  gap(10);

  // Status banner — current on-chain
  ws.mergeCells(r,1,r,9);
  const onBg = curYesPct>=0.67?C.darkGreen:C.darkRed;
  setCell(ws,r,1,`${curYesPct>=0.67?'✓':'✗'}  CURRENT ON-CHAIN:  ${(curYesPct*100).toFixed(2)}% Yes  (${curYesCt} DReps voted)  —  threshold 67%  —  latest vote ${liveDataAt}`,{fill:fill(onBg),font:fnt(C.white,11,true),align:aln('center','middle')});
  ws.getRow(r).height=24; r++; gap(4);

  // Status banner — hybrid prediction
  ws.mergeCells(r,1,r,9);
  const hybBg = hybYesPct>=0.67?C.darkGreen:C.darkRed;
  setCell(ws,r,1,`${hybYesPct>=0.67?'✓':'✗'}  HYBRID PREDICTION:  ${(hybYesPct*100).toFixed(2)}% Yes  (on-chain votes override Ekklesia predictions)  —  threshold 67%`,{fill:fill(hybBg),font:fnt(C.white,11,true),align:aln('center','middle')});
  ws.getRow(r).height=24; r++;
  gap(12);

  // Current on-chain
  secHdr(`Current On-Chain Votes  (${onChainDreps.length} DReps voted — live from Koios)`);
  statRow('Yes (DReps)',curYesCt,'#,##0','Yes VP (ADA)',curYesAda,'#,##0.00');
  statRow('No (DReps)', curNoCt, '#,##0','No VP (ADA)', curNoAda, '#,##0.00');
  statRow('Abstain (DReps)',curAbsCt,'#,##0','Abstain VP (ADA)',curAbsAda,'#,##0.00');
  statRow('Not yet voted', snapActiveDreps.length-(curYesCt+curNoCt+curAbsCt),'#,##0','Not-voted VP (ADA)',totalActiveAda-curYesAda-curNoAda-curAbsAda,'#,##0.00');
  statRow('Denominator (ADA)',curDenom,'#,##0.00','Total active stake (ADA)',totalActiveAda,'#,##0.00');
  gap(4);
  ws.mergeCells(r,1,r,9);
  setCell(ws,r,1,`Current Yes%:  ${(curYesPct*100).toFixed(2)}%  of  ${fmt(curDenom/1e6)}M ADA eligible  (threshold: 67%)`,{fill:fill(curYesPct>=0.67?C.darkGreen:C.darkRed),font:fnt(C.white,11,true),align:aln('center','middle')});
  ws.getRow(r).height=22; r++; gap(14);

  // Hybrid prediction
  secHdr(`Hybrid Prediction  (${ekkVotes.length} Ekklesia voters — on-chain vote used where cast, Ekklesia otherwise)`);
  statRow('Yes (DReps)',hybYesCt,'#,##0','Yes VP (ADA)',hybYesAda,'#,##0.00');
  statRow('No (DReps)', hybNoCt, '#,##0','No VP (ADA)', hybNoAda, '#,##0.00');
  statRow('Abstain (DReps)',hybAbsCt,'#,##0','Abstain VP (ADA)',hybAbsAda,'#,##0.00');
  statRow('Denominator (ADA)',hybDenom,'#,##0.00','Buffer / Gap to 67% (ADA)',hybYesAda-0.67*hybDenom,'+#,##0.00;-#,##0.00');

  gap(4);
  ws.mergeCells(r,1,r,9);
  setCell(ws,r,1,`Predicted Yes%:  ${(hybYesPct*100).toFixed(2)}%  of  ${fmt(hybDenom/1e6)}M ADA eligible  (threshold: 67%,  ${hybYesPct>=0.67?'buffer':'gap'}: ${fmt(Math.abs(hybYesAda-0.67*hybDenom)/1e6)}M ADA)`,{fill:fill(hybYesPct>=0.67?C.darkGreen:C.darkRed),font:fnt(C.white,11,true),align:aln('center','middle')});
  ws.getRow(r).height=22; r++; gap(14);

  // Methodology
  secHdr('Methodology');
  ws.mergeCells(r,1,r,9);
  setCell(ws,r,1,'Treasury withdrawal threshold: 67% of active DRep voting power (abstain VP excluded from denominator). Always-no-confidence counted on No side. Not-voted DReps count as No side. Hybrid model: where a DRep has voted on-chain, their on-chain vote is used; otherwise their Ekklesia off-chain ballot vote is used. Deregistered DReps excluded via Koios drep_info.',{fill:fill(C.offWhite),font:fnt('FF444444',9),align:aln('left','middle',true)});
  ws.getRow(r).height=40; r++; gap(14);

  // Sheet index
  secHdr('Sheets in this workbook');
  [['DRep Votes (Ekklesia)',`${ekkVotes.length} DReps who voted on the Ekklesia off-chain ballot`],
   ['Top 500 DReps by VP','Top 500 DReps ranked by voting power — shows both on-chain and Ekklesia votes'],
   ['Prediction Sheet','⭐ Hybrid model — on-chain vote shown; edit Predicted Vote (col G) to adjust; stats recalculate live'],
  ].forEach(([n,d],i)=>{
    ws.getRow(r).height=16;
    setCell(ws,r,2,n,{font:fnt('FF111111',10,true),align:aln('left','middle')});
    ws.mergeCells(r,3,r,9);
    setCell(ws,r,3,d,{font:fnt(i===2?'FF1E40AF':'FF333333',9),align:aln('left','middle')});
    if(i%2===1) ws.getRow(r).getCell(1).fill=fill(C.lightGrey);
    r++;
  });
}

// ═════════════════════════════════════════════════════════════════════════════
function buildDrepVotes(wb) {
  const ws = wb.addWorksheet('DRep Votes (Ekklesia)',{properties:{tabColor:{argb:C.midBlue.slice(2)}}});
  ws.getColumn(1).width=5; ws.getColumn(2).width=28; ws.getColumn(3).width=65;
  ws.getColumn(4).width=58; ws.getColumn(5).width=10; ws.getColumn(6).width=22; ws.getColumn(7).width=18;

  ws.mergeCells(1,1,1,7);
  setCell(ws,1,1,'Ekklesia Off-Chain Ballot — DRep Votes on Intersect: Governance coordination and technical stewardship for the Cardano ecosystem',{fill:fill(C.darkBlue),font:fnt(C.white,11,true),align:aln('left','middle',true)});
  ws.getRow(1).height=28;
  ws.mergeCells(2,1,2,7);
  setCell(ws,2,1,`${ekkVotes.length} valid voters. Excluded (deregistered): ${excludedList}`,{fill:fill(C.amberBg),font:fnt(C.amberText,10,false,true),align:aln('left','middle')});
  ws.getRow(2).height=18;

  const hdrs=['#','DRep Name','DRep ID (bech32)','DRep Hash (hex)','Vote','VP Snapshot (ADA)','VP Source'];
  hdrs.forEach((h,i)=>setCell(ws,3,i+1,h,{fill:fill(C.midBlue),font:fnt(C.white,10,true),align:aln('center','middle')}));
  ws.getRow(3).height=18; ws.views=[{state:'frozen',ySplit:3}];

  sortedEkk.forEach((v,i)=>{
    const row=i+4; const bg=i%2===1?fill(C.lightGrey):undefined;
    const vp=getVpAda(v.userId);
    const vpSrc = vpByIdKoios[v.userId.toLowerCase()] ? 'Koios (live)' : 'Ekklesia';
    const vs=voteStyle(v.vote);
    setCell(ws,row,1,i+1,{fill:bg,align:aln('center','middle')});
    setCell(ws,row,2,v.name||'',{fill:bg,align:aln('left','middle')});
    setCell(ws,row,3,v.userId,{fill:bg,align:aln('left','middle')});
    setCell(ws,row,4,toHash(v.userId),{fill:bg,align:aln('left','middle')});
    setCell(ws,row,5,v.vote,{...vs,align:aln('center','middle')});
    setCell(ws,row,6,vp,{fill:bg,numFmt:'#,##0.00',align:aln('right','middle')});
    setCell(ws,row,7,vpSrc,{fill:bg,align:aln('center','middle'),font:fnt('FF888888',9)});
  });

  // Summary
  const sumR=sortedEkk.length+5;
  ws.mergeCells(sumR,1,sumR,7);
  setCell(ws,sumR,1,'Summary',{fill:fill(C.darkBlue),font:fnt(C.white,10,true)});
  ws.getRow(sumR).height=16;
  [['Yes',sortedEkk.filter(v=>v.vote==='Yes')],['No',sortedEkk.filter(v=>v.vote==='No')],['Abstain',sortedEkk.filter(v=>v.vote==='Abstain')]].forEach(([lbl,rows],i)=>{
    const vp=rows.reduce((s,v)=>s+getVpAda(v.userId),0);
    const rr=sumR+1+i;
    setCell(ws,rr,1,`${lbl} votes`,{font:fnt('FF222222',10,true),align:aln('left','middle')});
    setCell(ws,rr,2,rows.length,{numFmt:'#,##0',align:aln('right','middle')});
    setCell(ws,rr,3,`${lbl} VP (ADA)`,{font:fnt('FF222222',10,true),align:aln('left','middle')});
    setCell(ws,rr,4,vp,{numFmt:'#,##0.00',align:aln('right','middle')});
    ws.getRow(rr).height=16;
  });
}

// ═════════════════════════════════════════════════════════════════════════════
function buildTop500(wb) {
  const ws = wb.addWorksheet('Top 500 DReps by VP',{properties:{tabColor:{argb:C.midBlue.slice(2)}}});
  ws.getColumn(1).width=6; ws.getColumn(2).width=28; ws.getColumn(3).width=65;
  ws.getColumn(4).width=58; ws.getColumn(5).width=14; ws.getColumn(6).width=14;
  ws.getColumn(7).width=20; ws.getColumn(8).width=10;

  ws.mergeCells(1,1,1,8);
  setCell(ws,1,1,'Top 500 DReps by Voting Power — Intersect: Governance coordination and technical stewardship',{fill:fill(C.darkBlue),font:fnt(C.white,11,true),align:aln('left','middle',true)});
  ws.getRow(1).height=28;
  ws.mergeCells(2,1,2,8);
  setCell(ws,2,1,`Deregistered excluded: ${excludedList}`,{fill:fill(C.amberBg),font:fnt(C.amberText,10,false,true),align:aln('left','middle')});
  ws.getRow(2).height=18;

  const hdrs=['Rank','DRep Name','DRep ID (bech32)','DRep Hash (hex)','Ekklesia Vote','On-Chain Vote','VP (ADA)','Status'];
  hdrs.forEach((h,i)=>setCell(ws,3,i+1,h,{fill:fill(C.midBlue),font:fnt(C.white,10,true),align:aln('center','middle')}));
  ws.getRow(3).height=18; ws.views=[{state:'frozen',ySplit:3}];

  top500.forEach((d,i)=>{
    const row=i+4; const bg=i%2===1?fill(C.lightGrey):undefined;
    const hash=toHash(d.id);
    const ekkVote=ekkById[d.id.toLowerCase()]||ekkByHash[hash]||'';
    const onChainVote=onChainById[d.id.toLowerCase()]||'';
    const vp=getDrepVpAda(d);
    const evs=voteStyle(ekkVote); const ovs=voteStyle(onChainVote);
    setCell(ws,row,1,i+1,{fill:bg,align:aln('center','middle')});
    setCell(ws,row,2,d.name||nameById[d.id.toLowerCase()]||'',{fill:bg,align:aln('left','middle')});
    setCell(ws,row,3,d.id,{fill:bg,align:aln('left','middle')});
    setCell(ws,row,4,hash,{fill:bg,align:aln('left','middle')});
    setCell(ws,row,5,ekkVote,{...evs,align:aln('center','middle')});
    setCell(ws,row,6,onChainVote,{...ovs,align:aln('center','middle')});
    setCell(ws,row,7,vp,{fill:bg,numFmt:'#,##0.00',align:aln('right','middle')});
    setCell(ws,row,8,d.status||'',{fill:bg,align:aln('center','middle')});
  });
}

// ═════════════════════════════════════════════════════════════════════════════
function buildPrediction(wb) {
  const ws = wb.addWorksheet('Prediction Sheet',{properties:{tabColor:{argb:C.darkGreen.slice(2)}}});
  ws.getColumn(1).width=6; ws.getColumn(2).width=28; ws.getColumn(3).width=65;
  ws.getColumn(4).width=58; ws.getColumn(5).width=14; ws.getColumn(6).width=14;
  ws.getColumn(7).width=14; ws.getColumn(8).width=20; ws.getColumn(9).width=40;

  const COLS=9, DS=24, DE=DS+top500.length-1;
  const onChainCol=`F${DS}:F${DE}`, predCol=`G${DS}:G${DE}`, vpCol=`H${DS}:H${DE}`;

  // ── Headers ───────────────────────────────────────────────────────────────
  ws.mergeCells(1,1,1,COLS);
  setCell(ws,1,1,'Prediction Sheet — Intersect: Governance coordination and technical stewardship (25,400,000 ADA)',{fill:fill(C.darkBlue),font:fnt(C.white,11,true),align:aln('left','middle',true)});
  ws.getRow(1).height=28;
  ws.mergeCells(2,1,2,COLS);
  setCell(ws,2,1,`Hybrid model: On-Chain Vote (col F) is locked from Koios. Edit Predicted Vote (col G) to override. Stats recalculate live via SUMIF.  Excluded: ${excludedList}`,{fill:fill(C.offWhite),font:fnt('FF555555',10,false,true),align:aln('left','middle',true)});
  ws.getRow(2).height=22; ws.getRow(3).height=6;

  // ── Constants block rows 4-7 ──────────────────────────────────────────────
  ws.mergeCells(4,1,4,COLS);
  setCell(ws,4,1,'⚙  Constants (do not edit)',{fill:fill('FF374151'),font:fnt(C.white,10,true),align:aln('left','middle')});
  ws.getRow(4).height=16;
  [[5,'Total Active Stake ADA  (regular active DReps + always-no-confidence)',totalActiveAda,'Threshold denominator base'],
   [6,'Always-No-Confidence VP ADA  (counts as No side)',alwaysNoConfAda,'Included in row above'],
   [7,'Ekklesia voters with predicted vote',ekkVotes.length,'Used in stats below'],
  ].forEach(([rn,lbl,val,note])=>{
    ws.mergeCells(rn,1,rn,4);
    setCell(ws,rn,1,lbl,{fill:fill(C.offWhite),font:fnt('FF222222',10),align:aln('left','middle')});
    setCell(ws,rn,5,val,{fill:fill(C.offWhite),font:fnt('FF111111',10,true),numFmt:'#,##0.00',align:aln('right','middle')});
    ws.mergeCells(rn,6,rn,COLS);
    setCell(ws,rn,6,note,{fill:fill(C.offWhite),font:fnt('FF888888',9,false,true),align:aln('left','middle')});
    ws.getRow(rn).height=16;
  });
  ws.getRow(8).height=6;

  // ── Live calc rows 9-16 ───────────────────────────────────────────────────
  ws.mergeCells(9,1,9,COLS);
  setCell(ws,9,1,'📊  Live Threshold Calculation  (edit Predicted Vote column G → stats update automatically)',{fill:fill(C.darkBlue),font:fnt(C.white,10,true),align:aln('left','middle')});
  ws.getRow(9).height=18;

  const calcRows=[
    [10,'Predicted Yes VP (ADA)',         {formula:`SUMIF(${predCol},"Yes",${vpCol})`},         '#,##0.00',''],
    [11,'Predicted Yes %',                {formula:'E10/E14'},                                   '0.00%','← must reach 67.00%'],
    [12,'No + Not Voted VP (ADA)',         {formula:'E5-E10-E13'},                               '#,##0.00','Blanks + explicit No + outside-top-500'],
    [13,'Predicted Abstain VP (ADA)',      {formula:`SUMIF(${predCol},"Abstain",${vpCol})`},     '#,##0.00','Excluded from denominator'],
    [14,'Outcome Denominator (ADA)',       {formula:'E5-E13'},                                   '#,##0.00','Active stake minus abstain'],
    [15,'Required threshold',             0.67,                                                  '0.00%','Treasury withdrawal: 67% DRep'],
    [16,'Buffer (+) / Gap to close (−)',  {formula:'E10-0.67*E14'},                              '+#,##0.00;-#,##0.00','Positive = passing with margin'],
  ];
  calcRows.forEach(([rn,lbl,val,fmt_,note])=>{
    ws.mergeCells(rn,1,rn,4);
    setCell(ws,rn,1,lbl,{fill:fill(C.lightBlue),font:fnt('FF222222',10),align:aln('left','middle')});
    const c=ws.getCell(rn,5);
    if(typeof val==='object') c.value=val; else c.value=val;
    c.numFmt=fmt_; c.alignment=aln('right','middle'); c.font=fnt('FF111111',10,true);
    if(note){ws.mergeCells(rn,6,rn,COLS); setCell(ws,rn,6,note,{fill:fill(C.lightBlue),font:fnt('FF888888',9,false,true),align:aln('left','middle')});}
    ws.getRow(rn).height=16;
  });
  ws.getRow(17).height=6;

  // ── Status banner row 18 ──────────────────────────────────────────────────
  ws.mergeCells(18,1,18,COLS);
  const b18=ws.getCell(18,1);
  b18.value={formula:`IF(E11>=0.67,"✓  ON TRACK TO PASS  —  "&TEXT(E11,"0.00%")&" Yes  (need 67%,  buffer: "&TEXT(E16,"#,##0.00")&" ADA)","✗  NOT YET ON TRACK  —  "&TEXT(E11,"0.00%")&" Yes  (need 67%,  gap: "&TEXT(ABS(E16),"#,##0.00")&" ADA)")`};
  b18.fill=fill(C.midBlue); b18.font=fnt(C.white,12,true); b18.alignment=aln('center','middle');
  ws.getRow(18).height=28;
  addCF(ws,`A18:I18`,[
    {type:'expression',formulae:['$E$11>=0.67'],priority:1,style:{fill:fill(C.darkGreen)}},
    {type:'expression',formulae:['$E$11<0.67'], priority:2,style:{fill:fill(C.darkRed)}},
  ]);
  ws.getRow(19).height=6; ws.getRow(20).height=6;

  // ── Column headers rows 21-23 ─────────────────────────────────────────────
  ws.mergeCells(21,1,21,COLS);
  setCell(ws,21,1,'Hybrid Vote Prediction — Top 500 DReps by Voting Power',{fill:fill(C.darkBlue),font:fnt(C.white,11,true),align:aln('left','middle')});
  ws.getRow(21).height=20;
  ws.mergeCells(22,1,22,COLS);
  setCell(ws,22,1,'✏  Col F = on-chain vote (locked, from Koios).  Col G = Predicted Vote (editable dropdown — Yes/No/Abstain or blank = Not Voted).  Pre-filled from Ekklesia; flips to on-chain where voted.',{fill:fill(C.lightBlue),font:fnt('FF1E40AF',10,false,true),align:aln('left','middle',true)});
  ws.getRow(22).height=22;
  ['Rank','DRep Name','DRep ID (bech32)','DRep Hash (hex)','Ekklesia Vote','On-Chain Vote','Predicted Vote ▼','VP (ADA)','Mismatch Notice'].forEach((h,i)=>
    setCell(ws,23,i+1,h,{fill:fill(C.midBlue),font:fnt(C.white,10,true),align:aln('center','middle')}));
  ws.getRow(23).height=18; ws.views=[{state:'frozen',ySplit:23}];

  // ── Data rows ─────────────────────────────────────────────────────────────
  top500.forEach((d,i)=>{
    const row=DS+i; const bg=i%2===1?fill(C.lightGrey):undefined;
    const hash=toHash(d.id);
    const ekkVote   = ekkById[d.id.toLowerCase()]||ekkByHash[hash]||'';
    const onChainVote = onChainById[d.id.toLowerCase()]||'';
    // Predicted = on-chain if voted, else Ekklesia prediction
    const predVote  = onChainVote || ekkVote;
    const vp        = getDrepVpAda(d);
    const evs=voteStyle(ekkVote); const ovs=voteStyle(onChainVote); const pvs=voteStyle(predVote);

    setCell(ws,row,1,i+1,{fill:bg,align:aln('center','middle')});
    setCell(ws,row,2,d.name||nameById[d.id.toLowerCase()]||'',{fill:bg,align:aln('left','middle')});
    setCell(ws,row,3,d.id,{fill:bg,align:aln('left','middle')});
    setCell(ws,row,4,hash,{fill:bg,align:aln('left','middle')});
    setCell(ws,row,5,ekkVote,{...evs,align:aln('center','middle')});
    setCell(ws,row,6,onChainVote,{...ovs,align:aln('center','middle')});
    setCell(ws,row,7,predVote,{...pvs,align:aln('center','middle')}); // editable
    setCell(ws,row,8,vp,{fill:bg,numFmt:'#,##0.00',align:aln('right','middle')});

    // Mismatch notice col 9
    const notice=ws.getCell(row,9);
    notice.value={formula:`IF(AND(G${row}<>"",F${row}<>"",G${row}<>F${row}),"⚠ On-chain: "&F${row}&" / Predicted: "&G${row},"")`};
    notice.fill=bg||undefined; notice.alignment=aln('left','middle'); notice.font=fnt('FF856404',9);
    ws.getRow(row).height=15;
  });

  // ── Data validation: dropdown on col G ───────────────────────────────────
  ws.dataValidations.add(`G${DS}:G${DE}`,{
    type:'list',allowBlank:true,formulae:['"Yes,No,Abstain"'],
    showErrorMessage:true,errorStyle:'warning',
    errorTitle:'Invalid vote',error:'Select Yes, No, Abstain, or clear for Not Voted.',
    promptTitle:'Predicted Vote',prompt:'Yes, No, Abstain, or blank = Not Yet Voted (counts on No side).',
  });

  // ── Conditional formatting ────────────────────────────────────────────────
  addCF(ws,`E${DS}:E${DE}`,voteCFRules());
  addCF(ws,`F${DS}:F${DE}`,voteCFRules());
  addCF(ws,`G${DS}:G${DE}`,voteCFRules());
  addCF(ws,`I${DS}:I${DE}`,[{type:'expression',formulae:[`I${DS}<>""`],priority:1,style:{fill:fill(C.amberBg),font:fnt(C.amberText,9,true)}}]);
}

main().catch(e=>{console.error(e);process.exit(1);});
