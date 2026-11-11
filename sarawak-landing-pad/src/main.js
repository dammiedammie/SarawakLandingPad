import './style.css';
import { createClient } from '@supabase/supabase-js';

// Parcel replaces these at build time from .env (local) or Vercel's environment variables.
const sb = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : null;

const $ = (s) => document.querySelector(s);
const LEVELS = ['Diploma', 'Undergraduate', 'Postgraduate'];
let members = [];
let filter = 'All';

function el(tag, text, cls) {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}

// Intake years
const year = new Date().getFullYear();
[year, year + 1].forEach((y) => $('#intake_year').add(new Option(y, y)));

// Directory
function renderDirectory() {
  const bar = $('#filters');
  bar.textContent = '';
  ['All', ...LEVELS].forEach((lv) => {
    const n = lv === 'All' ? members.length : members.filter((m) => m.level === lv).length;
    const b = el('button', `${lv} (${n})`, 'chip');
    b.type = 'button';
    b.setAttribute('aria-pressed', String(filter === lv));
    b.addEventListener('click', () => { filter = lv; renderDirectory(); });
    bar.appendChild(b);
  });

  const list = $('#list');
  list.textContent = '';
  const shown = members.filter((m) => filter === 'All' || m.level === filter);
  if (!shown.length) {
    list.appendChild(el('div', 'No one here yet. Be the first to join.', 'empty'));
    return;
  }
  shown.forEach((m) => {
    const card = el('article', '', 'person');
    card.appendChild(el('h3', m.full_name));
    card.appendChild(el('p', `${m.level}, ${m.programme} at ${m.destination_university} (${m.intake_year})`));
    card.appendChild(el('p', `From ${m.home_division}. Previously at ${m.previous_institution}.`));
    if (m.needs && m.needs.length) {
      const tags = el('div', '', 'tags');
      m.needs.forEach((n) => tags.appendChild(el('span', n)));
      card.appendChild(tags);
    }
    list.appendChild(card);
  });
}

async function loadDirectory() {
  if (!sb) { $('#list').appendChild(el('div', 'Directory not connected yet.', 'empty')); return; }
  const { data, error } = await sb.from('directory').select('*').order('intake_year', { ascending: false });
  if (error) { $('#list').appendChild(el('div', 'Couldn’t load the directory. Refresh to try again.', 'empty')); return; }
  members = data;
  renderDirectory();
}

// Form
function say(text, isError) {
  const m = $('#form-msg');
  m.textContent = text;
  m.className = isError ? 'err' : '';
}

$('#join-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const d = new FormData(f);
  if (d.get('website')) return; // spam trap
  if (!sb) return say('Sign-ups aren’t connected yet. Add the Supabase keys and rebuild.', true);

  const row = {
    full_name: d.get('full_name').trim(),
    level: d.get('level'),
    programme: d.get('programme').trim(),
    destination_university: d.get('destination_university').trim(),
    previous_institution: d.get('previous_institution').trim(),
    intake_year: Number(d.get('intake_year')),
    home_division: d.get('home_division'),
    whatsapp: d.get('whatsapp').trim(),
    email: d.get('email').trim() || null,
    religion: d.get('religion') || null,
    needs: d.getAll('needs'),
    show_in_directory: d.get('show') === 'on',
    consent: d.get('consent') === 'on',
  };

  const btn = f.querySelector('button[type="submit"]');
  btn.disabled = true;
  say('Sending…');
  const { error } = await sb.from('registrations').insert(row);
  btn.disabled = false;
  if (error) return say('Couldn’t send your details. Check your answers and try again.', true);
  f.reset();
  say('You’re in. A committee member will message you on WhatsApp soon.');
  loadDirectory();
});

loadDirectory();
