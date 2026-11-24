// Browser storage keeps MVP tasks and events without a backend.
function setupList(formId, listId, key, makeLabel) {
  const form = document.getElementById(formId), list = document.getElementById(listId);
  if (!form || !list) return;
  let items = [];
  try { items = JSON.parse(localStorage.getItem(key) || '[]'); } catch { items = []; }
  function render() {
    list.replaceChildren();
    items.forEach((item, i) => {
      const li = document.createElement('li'); li.className = 'list-group-item d-flex justify-content-between align-items-center gap-2';
      const label = document.createElement('span'); label.textContent = item;
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn btn-sm btn-outline-secondary'; remove.textContent = 'Remove';
      remove.addEventListener('click', () => { items.splice(i, 1); save(); });
      li.append(label, remove); list.append(li);
    });
  }
  function save() { try { localStorage.setItem(key, JSON.stringify(items)); } catch {} render(); }
  form.addEventListener('submit', e => { e.preventDefault(); const label = makeLabel(); if (!label.trim()) return; items.push(label); save(); form.reset(); });
  render();
}
setupList('task-form','tasks','campus-tasks',()=>document.getElementById('task-title').value.trim());
setupList('event-form','events','campus-events',()=>document.getElementById('event-title').value.trim()+' — '+document.getElementById('event-date').value);
// Filter sample tutoring subjects as the user types.
const subject = document.getElementById('subject');
subject?.addEventListener('input',()=>document.querySelectorAll('#subjects li').forEach(li=>{li.hidden=!li.textContent.toLowerCase().includes(subject.value.toLowerCase());}));
// Initial live API integration: Open-Meteo current weather for Liberty, MO.
const weatherButton = document.getElementById('weather-button');
weatherButton?.addEventListener('click', async()=>{
  const status=document.getElementById('weather'); status.textContent='Loading weather…'; weatherButton.disabled=true;
  try { const response=await fetch('https://api.open-meteo.com/v1/forecast?latitude=39.25&longitude=-94.42&current=temperature_2m,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph'); if(!response.ok) throw new Error('Request failed'); const data=await response.json(); status.textContent=`${data.current.temperature_2m} °F · Wind ${data.current.wind_speed_10m} mph`; }
  catch {status.textContent='Weather unavailable. Please try again.';} finally {weatherButton.disabled=false;}
});
