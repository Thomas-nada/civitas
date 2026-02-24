const http = require('http');
http.get('http://127.0.0.1:8080/api/accountability?view=committee', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const json = JSON.parse(d);
    const cc = json.committeeMembers || [];
    console.log('Total CC members:', cc.length);
    cc.forEach(m => {
      const keys = Object.keys(m).filter(k => k !== 'votes');
      const info = {};
      keys.forEach(k => info[k] = m[k]);
      console.log(JSON.stringify(info));
    });
  });
}).on('error', e => console.log('Error:', e.message));
