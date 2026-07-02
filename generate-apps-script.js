/**
 * Generates a Google Apps Script (.gs) file that builds the full
 * DRep vote spreadsheet natively in Google Sheets — dropdowns,
 * formulas, conditional formatting, cross-sheet live refs, all native.
 */
const fs = require('fs');

const EKKLESIA_PROPOSAL_ID = '6a1512d73ea9a75799cf8f1c';
const GOV_ACTION_ID = 'gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8sgx6wlxf';

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const CHARSET_MAP = Object.fromEntries([...CHARSET].map((c, i) => [c, i]));
function drepIdToHash(b) {
  try {
    const s = b.toLowerCase(), si = s.lastIndexOf('1'), ds = s.slice(si + 1);
    const d = [...ds].map(c => CHARSET_MAP[c]), p = d.slice(0, -6);
    let bits = 0, v = 0; const by = [];
    for (const x of p) { v = (v << 5) | x; bits += 5; if (bits >= 8) { bits -= 8; by.push((v >> bits) & 0xff); } }
    return Buffer.from(by.slice(1)).toString('hex');
  } catch { return ''; }
}
function isActive(d) { return String(d.status || '').toLowerCase() === 'active'; }

// ── Load data ────────────────────────────────────────────────────────────────
const snapshot  = require('D:/New folder (2)/civitas/snapshot.seed.json');
const voteData  = require('C:/Users/Thomas/AppData/Local/Temp/drep-votes.json');
const koiosData = require('C:/Users/Thomas/AppData/Local/Temp/koios-drep-status.json');
const allDreps  = snapshot.dreps;

const deregisteredIds = new Set(koiosData.filter(d => d.drep_status === 'deregistered').map(d => d.drep_id.toLowerCase()));
const allEkkVotes = voteData.votes[EKKLESIA_PROPOSAL_ID] || [];
const ekkVotes   = allEkkVotes.filter(v => !deregisteredIds.has(v.userId.toLowerCase()));
const excluded   = allEkkVotes.filter(v =>  deregisteredIds.has(v.userId.toLowerCase()));

const ekkVoteById   = Object.fromEntries(ekkVotes.map(v => [v.userId.toLowerCase(), v.vote]));
const ekkVoteByHash = Object.fromEntries(ekkVotes.map(v => [drepIdToHash(v.userId), v.vote]));
const ekkNameById   = Object.fromEntries(ekkVotes.map(v => [v.userId.toLowerCase(), v.name]));

const onChainById = {};
for (const d of allDreps) {
  if (!d.votes) continue;
  const arr = Array.isArray(d.votes) ? d.votes : Object.values(d.votes);
  const v = arr.find(v => v.proposalId === GOV_ACTION_ID);
  if (v) onChainById[d.id.toLowerCase()] = v.vote;
}

const alwaysNoConfVpAda = Number(snapshot.specialDreps?.alwaysNoConfidence?.votingPowerAda || allDreps.find(d => d.id === 'drep_always_no_confidence')?.votingPowerAda || 0);
const regularDrepStakeAda = allDreps.filter(d => isActive(d) && !d.id.startsWith('drep_always') && !deregisteredIds.has(d.id.toLowerCase())).reduce((s, d) => s + Number(d.votingPowerAda || 0), 0);
const totalActiveStakeAda = regularDrepStakeAda + alwaysNoConfVpAda;

const vpByDrepId = Object.fromEntries(allDreps.filter(d => isActive(d) && !d.id.startsWith('drep_always') && !deregisteredIds.has(d.id.toLowerCase())).map(d => [d.id.toLowerCase(), Number(d.votingPowerAda || 0)]));

// Top 500
const regularDreps = allDreps.filter(d => !d.id.startsWith('drep_always') && !deregisteredIds.has(d.id.toLowerCase()));
regularDreps.sort((a, b) => b.votingPowerAda - a.votingPowerAda);
const top500 = regularDreps.slice(0, 500);
const top500ActiveVP = top500.filter(d => isActive(d)).reduce((s, d) => s + Number(d.votingPowerAda || 0), 0);
const remainingVP = Math.max(0, totalActiveStakeAda - alwaysNoConfVpAda - top500ActiveVP);

// On-chain stats
let curYesAda = 0, curNoAda = 0, curAbstainAda = 0, curYesDreps = 0, curNoDreps = 0, curAbstainDreps = 0;
for (const [id, vote] of Object.entries(onChainById)) {
  if (deregisteredIds.has(id)) continue;
  const vp = vpByDrepId[id] || 0;
  if (vote === 'Yes')     { curYesAda += vp; curYesDreps++; }
  else if (vote === 'No') { curNoAda  += vp; curNoDreps++;  }
  else                    { curAbstainAda += vp; curAbstainDreps++; }
}
const curNotVotedAda  = Math.max(totalActiveStakeAda - curYesAda - curNoAda - curAbstainAda, 0);
const curDenominator  = Math.max(totalActiveStakeAda - curAbstainAda, 0);
const curYesPct       = curDenominator > 0 ? curYesAda / curDenominator : 0;
const activeDrepCount = Object.keys(vpByDrepId).length;

// ── Build data arrays for embedding ──────────────────────────────────────────
const sortedEkk = [...ekkVotes].sort((a, b) => {
  const order = { Yes: 0, No: 1, Abstain: 2 };
  const od = (order[a.vote] ?? 3) - (order[b.vote] ?? 3);
  return od !== 0 ? od : Number(b.votingPower) - Number(a.votingPower);
});

// Sheet 1: DRep Votes — [name, id, hash, vote, lovelace, ada]
const ekkVotesRows = sortedEkk.map(v => [
  v.name || '',
  v.userId,
  drepIdToHash(v.userId),
  v.vote,
  Number(v.votingPower),
  Number(v.votingPower) / 1e6,
]);

// Sheets 2 & 3: Top 500 — [rank, name, id, hash, ekkVote, onChainVote, vpAda, status]
const top500Rows = top500.map((d, i) => {
  const hash = drepIdToHash(d.id);
  const ekkVote   = ekkVoteById[d.id.toLowerCase()] || ekkVoteByHash[hash] || '';
  const onChainV  = onChainById[d.id.toLowerCase()] || '';
  return [i + 1, d.name || ekkNameById[d.id.toLowerCase()] || '', d.id, hash, ekkVote, onChainV, Number(d.votingPowerAda) || 0, d.status || ''];
});

// Summary on-chain stats block
const onchainStats = { curYesDreps, curNoDreps, curAbstainDreps, curYesAda, curNoAda, curAbstainAda, curNotVotedAda, curDenominator, curYesPct, activeDrepCount };
const config = { totalActiveStakeAda, alwaysNoConfVpAda, remainingVP };
const excludedNames = excluded.map(v => `${v.name} (voted ${v.vote})`).join(', ');
const generatedAt = new Date().toUTCString();

// ── Generate Apps Script ─────────────────────────────────────────────────────
const gs = `// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  Civitas — Cardano Budget 2026 DRep Vote Tracker                        ║
// ║  Intersect: Governance coordination and technical stewardship            ║
// ║                                                                          ║
// ║  HOW TO USE:                                                             ║
// ║  1. Open a new blank Google Sheet                                        ║
// ║  2. Extensions > Apps Script                                             ║
// ║  3. Delete the default code, paste this entire file                     ║
// ║  4. Click Run > buildSheet (grant permissions when prompted)             ║
// ║  5. Return to the sheet — done!                                          ║
// ║                                                                          ║
// ║  INTERACTIVE FEATURES:                                                   ║
// ║  • Prediction Sheet col E: dropdown to change any DRep's predicted vote  ║
// ║  • Stats block (rows 10-16) recalculates live via SUMIF formulas        ║
// ║  • Status banner auto-switches green/red at the 67% threshold            ║
// ║  • Summary sheet auto-updates from Prediction Sheet formula refs         ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ── Embedded data (generated ${generatedAt}) ────────────────────
const CONFIG = ${JSON.stringify(config)};

const ONCHAIN = ${JSON.stringify(onchainStats)};

const EXCLUDED_NOTE = ${JSON.stringify(excludedNames)};

// [name, id, hash, vote, lovelace, ada]
const EKK_VOTES = ${JSON.stringify(ekkVotesRows)};

// [rank, name, id, hash, ekkVote, onChainVote, vpAda, status]
const TOP500 = ${JSON.stringify(top500Rows)};

// ── Main entry point ──────────────────────────────────────────────────────────
function buildSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone('UTC');

  // Build in this order so sheet refs resolve correctly
  _buildDrepVotesSheet(ss);
  _buildTop500Sheet(ss);
  _buildPredictionSheet(ss);
  _buildSummarySheet(ss);

  // Move Summary to front
  ss.setActiveSheet(ss.getSheetByName('Summary'));
  ss.moveActiveSheet(1);

  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('✓ Done! All sheets built.\\n\\nTip: Go to "Prediction Sheet", edit any cell in column E (Predicted Vote) to Yes / No / Abstain — the stats and Summary update automatically.');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function _getOrCreate(ss, name, tabColor) {
  let s = ss.getSheetByName(name);
  if (s) { s.clearContents(); s.clearFormats(); s.clearConditionalFormatRules(); }
  else    { s = ss.insertSheet(name); }
  if (tabColor) s.setTabColor(tabColor);
  return s;
}

function _hdr(s, r, c, spanCols, text, bg, fontColor, fontSize, bold, italic, wrap) {
  const range = s.getRange(r, c, 1, spanCols);
  if (spanCols > 1) range.merge();
  range.setValue(text)
    .setBackground(bg || null)
    .setFontColor(fontColor || '#000000')
    .setFontSize(fontSize || 10)
    .setFontWeight(bold ? 'bold' : 'normal')
    .setFontStyle(italic ? 'italic' : 'normal')
    .setVerticalAlignment('middle')
    .setWrapStrategy(wrap ? SpreadsheetApp.WrapStrategy.WRAP : SpreadsheetApp.WrapStrategy.OVERFLOW);
}

function _voteVF(val) {
  if (val === 'Yes')     return '#2D7D4F';
  if (val === 'No')      return '#C0392B';
  if (val === 'Abstain') return '#7F8C8D';
  return null;
}

function _addVoteCF(s, a1) {
  const range = s.getRange(a1);
  const rules = s.getConditionalFormatRules();
  ['Yes','No','Abstain'].forEach(v => {
    const bg = v === 'Yes' ? '#2D7D4F' : v === 'No' ? '#C0392B' : '#7F8C8D';
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(v).setBackground(bg).setFontColor('#FFFFFF').setBold(true)
      .setRanges([range]).build());
  });
  s.setConditionalFormatRules(rules);
}

// ── Sheet 1: DRep Votes ───────────────────────────────────────────────────────
function _buildDrepVotesSheet(ss) {
  const s = _getOrCreate(ss, 'DRep Votes', '#2D6A9F');
  s.setColumnWidths(1, 7, 120);
  s.setColumnWidth(1, 50); s.setColumnWidth(3, 480); s.setColumnWidth(4, 430); s.setColumnWidth(5, 90); s.setColumnWidth(6, 160); s.setColumnWidth(7, 120);

  const COLS = 7;
  _hdr(s,1,1,COLS,'Cardano Budget 2026 — DRep Votes on: Intersect: Governance coordination and technical stewardship for the Cardano ecosystem','#1E3A5F','#FFFFFF',12,true,false,true);
  s.setRowHeight(1, 32);
  _hdr(s,2,1,COLS,'Note: '+EXCLUDED_NOTE+' excluded — deregistered on-chain (confirmed via Koios).','#FFF3CD','#856404',10,false,true,true);
  s.setRowHeight(2, 20);

  const headers = ['#','DRep Name','DRep ID (bech32)','DRep Hash (hex)','Vote','Voting Power (lovelace)','Voting Power (ADA)'];
  const hRow = s.getRange(3,1,1,COLS);
  hRow.setValues([headers]).setBackground('#2D6A9F').setFontColor('#FFFFFF').setFontWeight('bold').setHorizontalAlignment('center');
  s.setFrozenRows(3);

  const DATA_START = 4;
  const rowData = EKK_VOTES.map((r,i) => [i+1, r[0], r[1], r[2], r[3], r[4], r[5]]);
  s.getRange(DATA_START,1,rowData.length,COLS).setValues(rowData);

  // Format numbers
  s.getRange(DATA_START,6,rowData.length,1).setNumberFormat('#,##0');
  s.getRange(DATA_START,7,rowData.length,1).setNumberFormat('#,##0.00');
  s.getRange(DATA_START,5,rowData.length,1).setHorizontalAlignment('center');

  // Alternating rows
  for (let i = 0; i < rowData.length; i++) {
    if (i % 2 === 1) s.getRange(DATA_START+i,1,1,COLS).setBackground('#F0F4F8');
  }

  // Conditional formatting on vote column
  _addVoteCF(s, 'E'+DATA_START+':E'+(DATA_START+rowData.length-1));

  // Summary block
  const sumR = DATA_START + rowData.length + 1;
  _hdr(s,sumR,1,COLS,'Summary','#1E3A5F','#FFFFFF',10,true,false,false);
  const yesRows = EKK_VOTES.filter(r=>r[3]==='Yes');
  const noRows  = EKK_VOTES.filter(r=>r[3]==='No');
  const absRows = EKK_VOTES.filter(r=>r[3]==='Abstain');
  const sumData = [
    ['Total DReps voted (registered only)', EKK_VOTES.length,'','','','',''],
    ['Yes', yesRows.length,'','Yes VP (ADA)','',yesRows.reduce((a,r)=>a+r[5],0).toFixed(2),''],
    ['No',  noRows.length, '','No VP (ADA)', '',noRows.reduce((a,r) =>a+r[5],0).toFixed(2),''],
    ['Abstain',absRows.length,'','Abstain VP (ADA)','',absRows.reduce((a,r)=>a+r[5],0).toFixed(2),''],
    ['Excluded (deregistered)', EXCLUDED_NOTE,'','','','',''],
  ];
  s.getRange(sumR+1,1,sumData.length,COLS).setValues(sumData);
}

// ── Sheet 2: Top 500 ─────────────────────────────────────────────────────────
function _buildTop500Sheet(ss) {
  const s = _getOrCreate(ss, 'Top 500 DReps by VP', '#2D6A9F');
  s.setColumnWidth(1,50); s.setColumnWidth(2,200); s.setColumnWidth(3,480); s.setColumnWidth(4,430); s.setColumnWidth(5,90); s.setColumnWidth(6,120); s.setColumnWidth(7,14);

  _hdr(s,1,1,7,'Top 500 DReps by Voting Power — Intersect: Governance coordination and technical stewardship for the Cardano ecosystem','#1E3A5F','#FFFFFF',11,true,false,true);
  s.setRowHeight(1,30);
  _hdr(s,2,1,7,'Deregistered DReps excluded: '+EXCLUDED_NOTE,'#FFF3CD','#856404',10,false,true,true);
  s.setRowHeight(2,20);

  const hdrs = ['Rank','DRep Name','DRep ID (bech32)','DRep Hash (hex)','Ekklesia Vote','Voting Power (ADA)','Status'];
  s.getRange(3,1,1,7).setValues([hdrs]).setBackground('#2D6A9F').setFontColor('#FFFFFF').setFontWeight('bold').setHorizontalAlignment('center');
  s.setFrozenRows(3);

  const DATA_START = 4;
  const rowData = TOP500.map(r => [r[0],r[1],r[2],r[3],r[4],r[6],r[7]]);
  s.getRange(DATA_START,1,rowData.length,7).setValues(rowData);
  s.getRange(DATA_START,6,rowData.length,1).setNumberFormat('#,##0.00');
  s.getRange(DATA_START,5,rowData.length,1).setHorizontalAlignment('center');

  for (let i = 0; i < rowData.length; i++) {
    if (i % 2 === 1) s.getRange(DATA_START+i,1,1,7).setBackground('#F0F4F8');
  }
  _addVoteCF(s, 'E'+DATA_START+':E'+(DATA_START+rowData.length-1));
}

// ── Sheet 3: Prediction Sheet ─────────────────────────────────────────────────
function _buildPredictionSheet(ss) {
  const s = _getOrCreate(ss, 'Prediction Sheet', '#1A6B39');
  s.setColumnWidth(1,50); s.setColumnWidth(2,200); s.setColumnWidth(3,480); s.setColumnWidth(4,430);
  s.setColumnWidth(5,100); s.setColumnWidth(6,100); s.setColumnWidth(7,260); s.setColumnWidth(8,130);

  const COLS = 8;
  const DATA_START = 24;
  const DATA_END   = DATA_START + TOP500.length - 1;
  const VOTE_A1    = 'E'+DATA_START+':E'+DATA_END;
  const VP_A1      = 'H'+DATA_START+':H'+DATA_END;

  // ── Header rows ──────────────────────────────────────────────────────────
  _hdr(s,1,1,COLS,'Prediction Sheet — Intersect: Governance coordination and technical stewardship (25,400,000 ADA)','#1E3A5F','#FFFFFF',11,true,false,true);
  s.setRowHeight(1,30);
  _hdr(s,2,1,COLS,'Deregistered excluded: '+EXCLUDED_NOTE+'. Predictions pre-filled from Ekklesia off-chain votes — edit column E to change any DRep\\'s predicted vote.','#FFFFFF','#555555',10,false,true,true);
  s.setRowHeight(2,20);
  s.setRowHeight(3,6);

  // ── Constants block (rows 4-7) ───────────────────────────────────────────
  _hdr(s,4,1,COLS,'⚙  Constants (do not edit)','#374151','#FFFFFF',10,true,false,false);
  s.setRowHeight(4,16);

  const constData = [
    ['Total Active Stake ADA  (regular DReps + always-no-confidence)','','','',CONFIG.totalActiveStakeAda,'','Used as denominator base'],
    ['Always-No-Confidence VP ADA  (counts as No side)','','','',CONFIG.alwaysNoConfVpAda,'','Included in row above'],
    ['Active DRep VP outside top 500 ADA  (counts as Not Voted → No side)','','','',CONFIG.remainingVP,'','Included in row above'],
  ];
  s.getRange(5,1,3,COLS).setBackground('#F8F9FA');
  for (let i = 0; i < constData.length; i++) {
    const r = 5 + i;
    s.getRange(r,1,1,4).merge().setValue(constData[i][0]).setFontSize(10).setVerticalAlignment('middle');
    s.getRange(r,5).setValue(constData[i][4]).setNumberFormat('#,##0.00').setFontWeight('bold').setHorizontalAlignment('right');
    s.getRange(r,6,1,3).merge().setValue(constData[i][6]).setFontSize(9).setFontColor('#888888').setFontStyle('italic').setVerticalAlignment('middle');
    s.setRowHeight(r,16);
  }

  s.setRowHeight(8,6);

  // ── Live calc block (rows 9-16) ──────────────────────────────────────────
  _hdr(s,9,1,COLS,'📊  Live Threshold Calculation  —  updates automatically when you edit Predicted Vote (column E)','#1E3A5F','#FFFFFF',10,true,false,false);
  s.setRowHeight(9,18);

  const formulaRows = [
    [10, 'Predicted Yes VP (ADA)',                        '=SUMIF('+VOTE_A1+',"Yes",'+VP_A1+')',       '#,##0.00', ''],
    [11, 'Predicted Yes %',                               '=E10/E14',                                  '0.00%',    '← must reach 67.00% to pass'],
    [12, 'No + Not Voted VP (ADA)',                       '=E5-E10-E13',                               '#,##0.00', 'Includes blanks, explicit No, and outside-top-500'],
    [13, 'Predicted Abstain VP (ADA)',                    '=SUMIF('+VOTE_A1+',"Abstain",'+VP_A1+')',   '#,##0.00', 'Excluded from denominator'],
    [14, 'Outcome Denominator (ADA)',                     '=E5-E13',                                   '#,##0.00', 'Total active stake minus abstain'],
    [15, 'Required threshold',                            '0.67',                                      '0.00%',    'Treasury withdrawal: 67% DRep threshold'],
    [16, 'Buffer (positive) / Gap to close (negative)',   '=E10-0.67*E14',                             '#,##0.00', 'Positive = passing with margin'],
  ];

  formulaRows.forEach(([r, label, val, fmt, note]) => {
    s.getRange(r,1,1,4).merge().setValue(label).setFontSize(10).setVerticalAlignment('middle');
    const valCell = s.getRange(r,5);
    if (r === 15) valCell.setValue(0.67); else valCell.setFormula(val);
    valCell.setNumberFormat(fmt).setFontWeight('bold').setHorizontalAlignment('right');
    if (note) s.getRange(r,6,1,3).merge().setValue(note).setFontSize(9).setFontColor('#888888').setFontStyle('italic').setVerticalAlignment('middle');
    s.setRowHeight(r,16);
  });

  s.setRowHeight(17,6);

  // ── Status banner (row 18) — formula-driven text ─────────────────────────
  s.getRange(18,1,1,COLS).merge()
    .setFormula('=IF(E11>=0.67,"✓  ON TRACK TO PASS  —  "&TEXT(E11,"0.00%")&" Yes  (need 67.00%,  buffer: "&TEXT(E16,"#,##0.00")&" ADA)","✗  NOT YET ON TRACK  —  "&TEXT(E11,"0.00%")&" Yes  (need 67.00%,  gap to close: "&TEXT(ABS(E16),"#,##0.00")&" ADA)")')
    .setFontColor('#FFFFFF').setFontSize(12).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  s.setRowHeight(18,28);

  // CF on status banner
  const bannerRange = s.getRange('A18:H18');
  const bannerRules = s.getConditionalFormatRules();
  bannerRules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$E$11>=0.67').setBackground('#1A6B39').setRanges([bannerRange]).build());
  bannerRules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$E$11<0.67') .setBackground('#922B21').setRanges([bannerRange]).build());
  s.setConditionalFormatRules(bannerRules);

  s.setRowHeight(19,6); s.setRowHeight(20,6);

  // ── Table header rows ─────────────────────────────────────────────────────
  _hdr(s,21,1,COLS,'Vote Prediction — Top 500 DReps by Voting Power','#1E3A5F','#FFFFFF',11,true,false,false);
  s.setRowHeight(21,20);
  _hdr(s,22,1,COLS,'✏  Edit column E to change any DRep\\'s predicted vote. Select Yes / No / Abstain or clear the cell for Not Yet Voted (counts as No side). Stats and banner above update automatically.','#EFF6FF','#1E40AF',10,false,true,true);
  s.setRowHeight(22,20);

  const colHdrs = ['Rank','DRep Name','DRep ID (bech32)','DRep Hash (hex)','Predicted Vote ▼','On-Chain Vote','Mismatch Notice','VP Snapshot (ADA)'];
  s.getRange(23,1,1,COLS).setValues([colHdrs]).setBackground('#2D6A9F').setFontColor('#FFFFFF').setFontWeight('bold').setHorizontalAlignment('center');
  s.setRowHeight(23,18);
  s.setFrozenRows(23);

  // ── Data rows ─────────────────────────────────────────────────────────────
  // Columns: rank, name, id, hash, ekkVote(editable), onChainVote, notice(formula), vpAda
  const staticData = TOP500.map(r => [r[0], r[1], r[2], r[3], r[4], r[5], '', r[6]]);
  s.getRange(DATA_START,1,staticData.length,COLS).setValues(staticData);

  // Notice column (G) — formula per row, set as array in one call
  const noticeFormulas = TOP500.map((_, i) => {
    const r = DATA_START + i;
    return ['=IF(AND(E'+r+'<>"",F'+r+'<>"",E'+r+'<>F'+r+'),"⚠ Off-chain: "&E'+r+'&" / On-chain: "&F'+r+',"")'];
  });
  s.getRange(DATA_START,7,noticeFormulas.length,1).setFormulas(noticeFormulas);

  // Formatting
  s.getRange(DATA_START,8,TOP500.length,1).setNumberFormat('#,##0.00');
  s.getRange(DATA_START,5,TOP500.length,1).setHorizontalAlignment('center');
  s.getRange(DATA_START,6,TOP500.length,1).setHorizontalAlignment('center');

  // Alternating rows
  for (let i = 0; i < TOP500.length; i++) {
    if (i % 2 === 1) {
      s.getRange(DATA_START+i,1,1,4).setBackground('#F0F4F8');
      s.getRange(DATA_START+i,7,1,2).setBackground('#F0F4F8');
    }
  }

  // ── Data validation: dropdown on predicted vote column ────────────────────
  const dropdownRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Yes','No','Abstain'], true)
    .setAllowInvalid(false)
    .setHelpText('Select Yes, No, Abstain, or clear for Not Yet Voted (counts as No side).')
    .build();
  s.getRange(VOTE_A1).setDataValidation(dropdownRule);

  // ── Conditional formatting ────────────────────────────────────────────────
  const cfRules = s.getConditionalFormatRules(); // already has banner rules
  const predRange    = s.getRange(VOTE_A1);
  const onchainRange = s.getRange('F'+DATA_START+':F'+DATA_END);
  const noticeRange  = s.getRange('G'+DATA_START+':G'+DATA_END);

  ['Yes','No','Abstain'].forEach(v => {
    const bg = v==='Yes'?'#2D7D4F':v==='No'?'#C0392B':'#7F8C8D';
    cfRules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(v).setBackground(bg).setFontColor('#FFFFFF').setBold(true).setRanges([predRange]).build());
    cfRules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(v).setBackground(bg).setFontColor('#FFFFFF').setBold(true).setRanges([onchainRange]).build());
  });

  // Mismatch notice — yellow highlight when non-empty
  cfRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=G'+DATA_START+'<>""')
    .setBackground('#FFF3CD').setFontColor('#856404').setBold(true)
    .setRanges([noticeRange]).build());

  s.setConditionalFormatRules(cfRules);
}

// ── Sheet 4 (first): Summary ──────────────────────────────────────────────────
function _buildSummarySheet(ss) {
  const s = _getOrCreate(ss, 'Summary', '#1E3A5F');
  s.setColumnWidths(1,7,140);
  s.setColumnWidth(1,10); s.setColumnWidth(4,10); s.setColumnWidth(7,10);

  const COLS = 7;
  let r = 1;

  function full(text, bg, fc, sz, bold, italic, isFormula) {
    const range = s.getRange(r,1,1,COLS).merge().setBackground(bg||null).setFontColor(fc||'#000000')
      .setFontSize(sz||10).setFontWeight(bold?'bold':'normal').setFontStyle(italic?'italic':'normal')
      .setVerticalAlignment('middle').setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    if (isFormula) range.setFormula(text); else range.setValue(text);
    s.setRowHeight(r, sz>=14?34:20); r++;
  }
  function blank(h=8) { s.setRowHeight(r,h); r++; }
  function secTitle(text) {
    s.getRange(r,1,1,COLS).merge().setValue(text).setBackground('#2D6A9F').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(10).setVerticalAlignment('middle');
    s.setRowHeight(r,18); r++;
  }
  function statRow(l1,v1,fmt1,l2,v2,fmt2,f1,f2) {
    // Col A-B = label1, C = val1, D = spacer, E-F = label2, G = val2
    s.getRange(r,1,1,2).merge().setValue(l1).setFontWeight('bold').setFontSize(10).setVerticalAlignment('middle');
    const c1 = s.getRange(r,3); if(f1) c1.setFormula(v1); else c1.setValue(v1); c1.setNumberFormat(fmt1||'@').setHorizontalAlignment('right').setVerticalAlignment('middle');
    s.getRange(r,5,1,2).merge().setValue(l2).setFontWeight('bold').setFontSize(10).setVerticalAlignment('middle');
    const c2 = s.getRange(r,7); if(f2) c2.setFormula(v2); else c2.setValue(v2); c2.setNumberFormat(fmt2||'@').setHorizontalAlignment('right').setVerticalAlignment('middle');
    s.setRowHeight(r,16); r++;
  }

  // Title block
  full('Cardano Budget 2026 — DRep Vote Summary','#1E3A5F','#FFFFFF',14,true,false);
  full('Intersect: Governance coordination and technical stewardship for the Cardano ecosystem — 25,400,000 ADA','#1E3A5F','#AECCE8',10,false,false);
  full('Note: '+EXCLUDED_NOTE+' excluded — deregistered on-chain (confirmed via Koios).','#FFF3CD','#856404',10,false,true);
  blank(12);

  // Status banner (formula, CF)
  s.getRange(r,1,1,COLS).merge()
    .setFormula('=IF(\'Prediction Sheet\'!E11>=0.67,"✓  PREDICTED TO PASS  —  "&TEXT(\'Prediction Sheet\'!E11,"0.00%")&" Yes  (threshold: 67%,  buffer: "&TEXT(\'Prediction Sheet\'!E16,"#,##0.00")&" ADA)","✗  NOT YET ON TRACK  —  "&TEXT(\'Prediction Sheet\'!E11,"0.00%")&" Yes  (threshold: 67%,  gap: "&TEXT(ABS(\'Prediction Sheet\'!E16),"#,##0.00")&" ADA)")')
    .setFontColor('#FFFFFF').setFontSize(13).setFontWeight('bold').setHorizontalAlignment('left').setVerticalAlignment('middle');
  s.setRowHeight(r,28);
  const bannerRange = s.getRange(r,1,1,COLS);
  const cfRules = s.getConditionalFormatRules();
  cfRules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied("='Prediction Sheet'!$E$11>=0.67").setBackground('#1A6B39').setRanges([bannerRange]).build());
  cfRules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied("='Prediction Sheet'!$E$11<0.67") .setBackground('#922B21').setRanges([bannerRange]).build());
  s.setConditionalFormatRules(cfRules);
  r++;

  blank(14);

  // Current on-chain block (static)
  secTitle('Current On-Chain Votes  (governance action on Cardano mainnet — static)');
  statRow('DReps voted on-chain',   ONCHAIN.curYesDreps+ONCHAIN.curNoDreps+ONCHAIN.curAbstainDreps,'0','Active DRep universe',ONCHAIN.activeDrepCount,'#,##0');
  statRow('Yes (DReps)',            ONCHAIN.curYesDreps,'0','Yes VP (ADA)',ONCHAIN.curYesAda,'#,##0.00');
  statRow('No (DReps)',             ONCHAIN.curNoDreps, '0','No VP (ADA)', ONCHAIN.curNoAda,'#,##0.00');
  statRow('Abstain (DReps)',        ONCHAIN.curAbstainDreps,'0','Abstain VP (ADA)',ONCHAIN.curAbstainAda,'#,##0.00');
  statRow('Not yet voted (DReps)',  ONCHAIN.activeDrepCount-(ONCHAIN.curYesDreps+ONCHAIN.curNoDreps+ONCHAIN.curAbstainDreps),'#,##0','Not-voted VP (No side, ADA)',ONCHAIN.curNotVotedAda,'#,##0.00');
  blank(6);
  const curPctText = (ONCHAIN.curYesPct*100).toFixed(2)+'% Yes on-chain  of  '+(ONCHAIN.curDenominator/1e6).toFixed(1)+'M ADA eligible  (threshold: 67%)';
  s.getRange(r,1,1,COLS).merge().setValue(curPctText).setFontColor('#FFFFFF').setFontSize(11).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setBackground(ONCHAIN.curYesPct>=0.67?'#1A6B39':'#922B21');
  s.setRowHeight(r,22); r++;

  blank(14);

  // Predicted block (formula refs — live)
  secTitle('Predicted Votes  (updates live from Prediction Sheet — edit votes there to see this update)');
  statRow('DReps with predicted vote', EKK_VOTES.length,'0','Active DRep universe',ONCHAIN.activeDrepCount,'#,##0');
  statRow('Predicted Yes VP (ADA)','=\'Prediction Sheet\'!E10','#,##0.00','Predicted Yes %','=\'Prediction Sheet\'!E11','0.00%',true,true);
  statRow('No + Not Voted VP (ADA)','=\'Prediction Sheet\'!E12','#,##0.00','Predicted Abstain VP (ADA)','=\'Prediction Sheet\'!E13','#,##0.00',true,true);
  statRow('Outcome Denominator (ADA)','=\'Prediction Sheet\'!E14','#,##0.00','Buffer / Gap (ADA)','=\'Prediction Sheet\'!E16','#,##0.00',true,true);
  blank(6);

  // Predicted % row with live CF
  s.getRange(r,1,1,COLS).merge()
    .setFormula('="Predicted Yes%:  "&TEXT(\'Prediction Sheet\'!E11,"0.00%")&"  of  "&TEXT(\'Prediction Sheet\'!E14/1000000,"#,##0.0")&"M ADA eligible  (threshold: 67%)"')
    .setFontColor('#FFFFFF').setFontSize(11).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  s.setRowHeight(r,22);
  const predPctRange = s.getRange(r,1,1,COLS);
  const cfRules2 = s.getConditionalFormatRules();
  cfRules2.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied("='Prediction Sheet'!$E$11>=0.67").setBackground('#1A6B39').setRanges([predPctRange]).build());
  cfRules2.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied("='Prediction Sheet'!$E$11<0.67") .setBackground('#922B21').setRanges([predPctRange]).build());
  s.setConditionalFormatRules(cfRules2);
  r++;

  blank(14);

  // Methodology
  secTitle('Methodology');
  full('Threshold: Treasury withdrawal requires 67% of active DRep voting power (excluding abstain voters from denominator). Always-no-confidence delegation is included in the No side. DReps not assigned a predicted vote (blank in Prediction Sheet) count as "not yet voted" (No side). Deregistered DReps excluded (confirmed via Koios drep_info).','#F8F9FA','#444444',9,false,false);

  blank(6);

  // Sheet index
  secTitle('Sheets in this workbook');
  const sheets = [
    ['DRep Votes', EKK_VOTES.length+' registered DReps who voted via Ekklesia off-chain ballot'],
    ['Top 500 DReps by VP','Top 500 DReps by voting power with their Ekklesia vote'],
    ['Prediction Sheet','⭐ Interactive — edit column E to change predictions; stats and Summary update live'],
  ];
  sheets.forEach(([name,desc],i) => {
    s.getRange(r,1,1,2).merge().setValue(name).setFontWeight('bold').setFontSize(9).setVerticalAlignment('middle');
    s.getRange(r,3,1,5).merge().setValue(desc).setFontSize(9).setFontColor(i===2?'#1E40AF':'#000000').setVerticalAlignment('middle').setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    if (i%2===1) s.getRange(r,1,1,COLS).setBackground('#F0F4F8');
    s.setRowHeight(r,16); r++;
  });
}
`;

const outPath = 'C:/Users/Thomas/Desktop/civitas-drep-votes.gs';
fs.writeFileSync(outPath, gs, 'utf8');
console.log('Generated:', outPath);
console.log(`File size: ${(gs.length / 1024).toFixed(1)} KB`);
console.log(`\nData embedded:`);
console.log(`  DRep Votes rows: ${ekkVotesRows.length}`);
console.log(`  Top 500 rows:    ${top500Rows.length}`);
console.log(`\nHow to use:`);
console.log(`  1. Open a new blank Google Sheet`);
console.log(`  2. Extensions > Apps Script`);
console.log(`  3. Delete default code, paste the .gs file`);
console.log(`  4. Run > buildSheet`);
