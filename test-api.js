const fetch = require('node-fetch');

async function test() {
  const payload = { status: "In Progress", note: "" };
  console.log("Sending payload:", payload);
  const res = await fetch('http://localhost:5000/api/reports/1/status', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
}

test();
