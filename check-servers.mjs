// Check if backend and frontend servers are running
async function check(url) {
  try {
    const res = await fetch(url);
    return `Status: ${res.status}`;
  } catch (e) {
    return `Not running (${e.cause?.code || e.message})`;
  }
}

console.log('Backend :5000/api/health ->', await check('http://localhost:5000/api/health'));
console.log('Frontend :3000           ->', await check('http://localhost:3000'));
