const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvaHFmaGNpbmt6eXVtamxqbWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MzM1MzksImV4cCI6MjA4NjIwOTUzOX0.tfgc9ASbxhaDO_gcyjA8SLVqFqacCTLYbia7RFzK4zM';
const BASE = 'https://lohqfhcinkzyumjljmhq.supabase.co/rest/v1';

async function checkTable(table) {
    const res = await fetch(`${BASE}/${table}?limit=1`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
        console.log(`\n${table} columns:`, Object.keys(data[0]));
    } else {
        console.log(`\n${table}:`, data);
    }
}

await checkTable('organizations');
await checkTable('projects');
await checkTable('tasks');
