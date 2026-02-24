const http = require('http');
http.get('http://127.0.0.1:8080/api/accountability?view=all', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const json = JSON.parse(d);
    const proposals = Object.entries(json.proposalInfo || {});
    // Show a few to understand the shape
    proposals.slice(0, 3).forEach(([id, p]) => {
      console.log(JSON.stringify({
        id: id.slice(0,24),
        actionName: p.actionName,
        governanceType: p.governanceType,
        outcome: p.outcome,
        submittedEpoch: p.submittedEpoch,
        expirationEpoch: p.expirationEpoch,
        ratifiedEpoch: p.ratifiedEpoch,
        enactedEpoch: p.enactedEpoch,
        droppedEpoch: p.droppedEpoch,
        expiredEpoch: p.expiredEpoch,
        submittedAt: p.submittedAt ? p.submittedAt.slice(0,10) : null,
      }));
    });
    // Epoch range
    const epochs = proposals.map(([,p]) => p.submittedEpoch).filter(Boolean).sort((a,b)=>a-b);
    console.log('Epoch range:', epochs[0], '-', epochs[epochs.length-1]);
    console.log('Total proposals:', proposals.length);
  });
}).on('error', e => console.log('Error:', e.message));
