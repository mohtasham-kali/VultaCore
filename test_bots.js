const fetch = require('node-fetch'); // Next.js polyfills this globally usually, but if standard Node, we use global fetch (v18+)

async function go() {
  console.log('Fetching bots...');
  const botsRes = await fetch('http://localhost:3001/api/bots');
  const bots = await botsRes.json();
  
  if (!Array.isArray(bots)) {
    console.error('Expected array, got:', bots);
    return;
  }
  
  for (const bot of bots) {
    console.log(`\n========================================`);
    console.log(`Testing Bot: ${bot.name} (${bot.type})`);
    
    let prompt = "Hello, what can you do?";
    if (bot.name === "Text to Code") prompt = "Write a python function to add two numbers";
    if (bot.name === "Image to Code") prompt = "How do I create a React button interface?";
    if (bot.name === "Error Explainer") prompt = "Explain TypeError undefined is not a function";
    if (bot.name === "Bug Fixer") prompt = "Why does x = 1 / 0 fail in python?";
    if (bot.name.includes("Vulnerability") || bot.type === 'cyber') prompt = "What is a SQL injection?";

    console.log(`Sending Prompt: "${prompt}"`);
    
    try {
      const res = await fetch(`http://localhost:3001/api/bots/${bot.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          userId: 'test-user-123',
          context: 'test mode'
        })
      });
      const data = await res.json();
      console.log(`Status: ${res.status}`);
      console.log(`Response:`, data.response ? data.response.substring(0, 150) + '...' : data);
    } catch (e) {
      console.error(`Error executing ${bot.name}:`, e.message);
    }
  }
}

go();
