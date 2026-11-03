import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inLanguage, localeCodes } from '../src/i18n.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const live = process.env.UE_PUBLIC_LAUNCH === 'true' && process.env.VERCEL_ENV !== 'preview';
const origin = new URL(live ? process.env.UE_PUBLIC_ORIGIN : (process.env.UE_PREVIEW_ORIGIN || (process.env.VERCEL_URL ? 'https://'+process.env.VERCEL_URL : 'https://limassol-studio-session.red-tetra-0002.chatgpt.site'))).origin;
const pages = new Map(), titles = new Set(), descriptions = new Set();
async function discover(dir) {
  for(const entry of await fs.readdir(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()) await discover(file);
    else if(entry.name==='index.html'){
      const route='/'+path.relative(root,file).replace(/index\.html$/,'');
      pages.set(route,await fs.readFile(file,'utf8'));
    }
  }
}
await discover(root);
const englishRoutes=[...pages.keys()].filter(route=>!/^\/(el|ru)\//.test(route));
assert.equal(englishRoutes.length,13);
assert.equal(pages.size,39);

function validateAlternates(markup, route, xml=false) {
  const tags=[...markup.matchAll(/<(?:xhtml:)?link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\s*\/?>/g)];
  assert.equal(tags.length,4,route+' alternates');
  const expected=new Set([...localeCodes,'x-default']);
  for(const [,lang,href] of tags) {
    assert(expected.delete(lang),route+' unexpected alternate '+lang);
    const target=inLanguage(route,lang==='x-default'?'en':lang);
    assert.equal(href,origin+target);
    assert(pages.has(target));
  }
  if(xml)assert(markup.includes('xhtml:link'));
}

for(const baseRoute of englishRoutes){
  for(const lang of localeCodes){
    const route=inLanguage(baseRoute,lang), html=pages.get(route);
    assert(html,route+' missing');
    assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,route+' h1');
    const title=html.match(/<title>(.*?)<\/title>/s)?.[1];
    const desc=html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert(title&&desc,route+' metadata');
    assert(!titles.has(title),route+' duplicate title');assert(!descriptions.has(desc),route+' duplicate description');
    titles.add(title);descriptions.add(desc);
    if(lang!=='en'){
      const alphabet=lang==='el'?/\p{Script=Greek}/u:/\p{Script=Cyrillic}/u;
      assert(alphabet.test(title) && alphabet.test(desc),route+' metadata language');
      assert(alphabet.test(html.match(/<h1>(.*?)<\/h1>/s)?.[1]||'') || baseRoute==='/the-barbers-chair/',route+' heading language');
    }
    assert(html.includes('<html lang="'+lang+'">')); assert(html.includes('id="main"'));
    assert(html.includes('content="'+(live?'index,follow':'noindex,nofollow')+'"'));
    assert.equal(html.match(/<link rel="canonical" href="([^"]+)">/)?.[1],origin+route);
    assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
    validateAlternates(html,baseRoute);
    for(const other of localeCodes)assert(html.includes('href="'+inLanguage(baseRoute,other)+'" data-lang-link="'+other+'"'),route+' switcher');
    const ld=JSON.parse(html.match(/<script type="application\/ld\+json">(.+?)<\/script>/s)[1]);assert.equal(ld[0].inLanguage,lang);assert.equal(ld[0].url,origin+route);
    const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,route+' duplicate ID');
    for(const match of html.matchAll(/<(?:a|form|img|script|link)\b[^>]*>/g)){
      const tag=match[0], attr=tag.match(/ (?:href|src|action)="([^"]+)"/);
      if(!attr)continue;
      const raw=attr[1].replaceAll('&amp;','&'), url=new URL(raw,origin+route);
      if(url.origin!==origin)continue;
      if(url.pathname.startsWith('/assets/')){await fs.access(path.join(root,url.pathname));continue;}
      const target=pages.get(url.pathname);assert(target,route+' missing link '+raw);
      if(url.hash)assert(target.includes('id="'+decodeURIComponent(url.hash.slice(1))+'"'),route+' missing anchor '+raw);
      if(!tag.includes('hreflang=') && !tag.startsWith('<link')){
        const actual=url.pathname.match(/^\/(el|ru)\//)?.[1]||'en';assert.equal(actual,lang,route+' mixed-language flow '+raw);
      }
    }
    if(baseRoute==='/contact/' || baseRoute==='/studio-hire/'){
      const config=JSON.parse(html.match(/<script type="application\/json" id="session-settings">(.+?)<\/script>/s)[1]);
      assert.equal(config.planner,inLanguage('/contact/',lang));assert(config.ui.downloaded);
      if(baseRoute==='/contact/'){
        assert.equal(config.services.length,9);assert.equal(config.plans.find(p=>p.id==='edited').price+3*35,330);
        if(lang!=='en')assert.notEqual(config.ui.quote,'By quotation');
      }
    }
  }
}
const robots=await fs.readFile(path.join(root,'robots.txt'),'utf8');
assert(robots.includes(live?'Allow: /':'Disallow: /'));
if(live){
  const xml=await fs.readFile(path.join(root,'sitemap.xml'),'utf8');
  const entries=[...xml.matchAll(/<url>(.*?)<\/url>/gs)];
  assert.equal(entries.length,pages.size);
  const routes=new Set(pages.keys());
  for(const [,entry] of entries){
    const url=new URL(entry.match(/<loc>([^<]+)<\/loc>/)[1]);assert.equal(url.origin,origin);assert(routes.delete(url.pathname));
    validateAlternates(entry,url.pathname.replace(/^\/(el|ru)\//,'/'),true);
  }
  assert(robots.includes('Sitemap: '+origin+'/sitemap.xml'));
}else{
  await assert.rejects(fs.access(path.join(root,'sitemap.xml')), {code:'ENOENT'});
}
console.log('Passed 39 pages, 156 reciprocal hreflang entries with x-default, same-page language switches, localized navigation and planner, metadata, canonical URLs, assets and index controls.');
