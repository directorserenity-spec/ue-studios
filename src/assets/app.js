const menuPanels = Array.from(document.querySelectorAll('.drop, .mobilemenu'));
document.addEventListener('click', event => {
  for (const panel of menuPanels) if (!panel.contains(event.target)) panel.open = false;
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  for (const panel of menuPanels) {
    if (!panel.open) continue;
    panel.open = false;
    panel.querySelector('summary').focus();
  }
});

const params = new URLSearchParams(location.search);
const code = document.documentElement.lang;
const settingsNode = document.getElementById('session-settings');
const settings = settingsNode ? JSON.parse(settingsNode.textContent) : null;
// Carry the selected format and section to the equivalent page. Personal project
// notes and editable text stay on the visitor's device.
for (const link of document.querySelectorAll('[data-lang-link]')) {
  const target = new URL(link.href);
  for (const key of ['format', 'plan', 'look']) {
    if (params.has(key)) target.searchParams.set(key, params.get(key));
  }
  target.hash = location.hash;
  link.href = target.href;
}
const layoutButtons = [...document.querySelectorAll('[data-set]')];
if (layoutButtons.length) {
  const layouts = [
    { key:'lounge', name:'Interview lounge', wall:['#35363a','#77797e','#303135'] },
    { key:'desk', name:'Presenter desk', wall:['#404349','#9b9fa5','#45474c'] },
    { key:'bench', name:'Demo bench', wall:['#26272a','#57595f','#292a2d'] }
  ];
  const title = document.getElementById('set-name');
  const useLook = document.getElementById('use-look');
  let selected = layouts[0];
  const linkLook = () => {
    const next = new URLSearchParams({look:selected.key});
    if(title.value.trim()) next.set('show',title.value.trim());
    useLook.href = settings.planner+'?'+next.toString();
  };
  function changeLayout(key) {
    const idx=layouts.findIndex(l=>l.key===key);
    if(idx<0) return;
    selected=layouts[idx];
    layoutButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.set===key)));
    document.querySelectorAll('.scene').forEach((scene,i)=>scene.toggleAttribute('hidden',i!==idx));
    selected.wall.forEach((color,i)=>document.querySelector('.w'+(i+1)).setAttribute('stop-color',color));
    document.getElementById('art-title').textContent=settings.ui.illustrated+' '+layoutButtons[idx].textContent;
    linkLook();
  }
  layoutButtons.forEach(b=>b.addEventListener('click',()=>changeLayout(b.dataset.set)));
  title.addEventListener('input',()=>{
    const name=title.value.trim();
    document.getElementById('screenText').textContent=name.length>15?name.slice(0,14)+'…':(name||'UE Studios.');
    linkLook();
  });
  changeLayout(params.get('look')||'lounge');
}

const form=document.getElementById('planner');
if(form) setupPlanner();
function setupPlanner(){
  const button=form.querySelector('button[type=submit]');
  form.addEventListener('submit',event=>event.preventDefault());
  const {plans,services,ui}=settings;
  const el=id=>document.getElementById(id);
  const format=el('format'),plan=el('plan'),look=el('look'),show=el('show'),clips=el('clips'),notes=el('notes');
  function select(select,value){if([...select.options].some(o=>o.value===value))select.value=value;}
  function defaults(){
    const service=services.find(s=>s.slug===format.value);
    plan.value=service?.plan||'custom';
    look.value=service?.look||'lounge';
    const onlyQuote = !service || service.plan === 'custom';
    for(const opt of plan.options)opt.disabled=onlyQuote&&opt.value!=='custom';
  }
  function chosen(){return plans.find(p=>p.id===plan.value);}
  function priceText(){const p=chosen();return p.price===null?ui.quote:new Intl.NumberFormat(code,{style:'currency',currency:'EUR',maximumFractionDigits:0,minimumFractionDigits:0}).format(p.price+Number(clips.value)*35);}
  function total(){
    el('scope').textContent=chosen().detail;
    el('total').textContent=priceText();
    el('message').textContent='';
  }
  select(format,params.get('format'));defaults();
  if(!plan.querySelector('option:disabled'))select(plan,params.get('plan'));
  select(look,params.get('look'));show.value=(params.get('show')||'').slice(0,80);
  format.addEventListener('change',()=>{defaults();total();});
  for(const input of [plan,clips])input.addEventListener('change',total);
  form.addEventListener('submit',()=>{
    const field=(label,value)=>label+': '+value;
    const lines=[ui.heading,ui.brief,'',field(ui.project,show.value.trim()||ui.untitled),
      field(ui.format,format.selectedOptions[0].textContent), field(ui.production,chosen().name),field(ui.scope,chosen().detail),
      field(ui.set,look.selectedOptions[0].textContent),field(ui.clips,clips.value),field(ui.estimate,priceText()),
      '',ui.notes,notes.value.trim()||ui.pending,'',ui.disclaimer];
    const address=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=address;a.download=code==='en'?'ue-studios-session-brief.txt':'ue-studios-session-brief-'+code+'.txt';document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(address),1500);
    el('message').textContent=ui.downloaded;
  });
  total();button.disabled=false;
}
const homePath = code==='en' ? '/' : '/'+code+'/';
if(location.pathname===homePath&&['#plan','#rates','#top'].includes(location.hash)){
  if(location.hash==='#plan')location.replace(homePath+'contact/');
  else if(location.hash==='#rates')location.replace(homePath+'studio-hire/#rates');
}
