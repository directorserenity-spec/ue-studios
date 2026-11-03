import fs from 'node:fs/promises';

export const languages = { en:'English', el:'Ελληνικά', ru:'Русский' };
export const localeCodes = Object.keys(languages);
const dictionaries = Object.fromEntries(await Promise.all(
  ['el', 'ru'].map(async code => [code, JSON.parse(await fs.readFile(new URL('./locales/' + code + '.json', import.meta.url), 'utf8'))])
));

export function inLanguage(route, code) {
  return (code === 'en' ? '' : '/' + code) + route;
}

export const escapeHTML = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const decodeHTML = value => value.replaceAll('&nbsp;', ' ').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');

export function translate(value, code) {
  if (code === 'en' || !/[A-Za-z]/.test(value)) return value;
  const key = value.trim().replace(/\s+/gu, ' ');
  const translated = dictionaries[code][key];
  if (typeof translated !== 'string' || !translated.trim()) throw Error('Missing ' + code + ' copy: ' + key);
  return translated;
}

// Localize only the text, accessible attributes and internal routes of our generated
// template fragments. Identifiers, form values and SVG geometry stay stable.
export function localMarkup(markup, code) {
  if (code === 'en') return markup;
  return markup.replace(/<[^>]*>|[^<]+/g, token => {
    if (token.startsWith('<')) {
      return token.replace(/ (aria-label|alt|placeholder|href|action)="([^"]*)"/g, (attribute, name, value) => {
        if (name === 'href' || name === 'action') {
          if (!value.startsWith('/') || value.startsWith('/assets/')) return attribute;
          return ' ' + name + '="' + inLanguage(value, code) + '"';
        }
        return ' ' + name + '="' + escapeHTML(translate(decodeHTML(value), code)) + '"';
      });
    }
    const decoded = decodeHTML(token);
    if (!/[A-Za-z]/.test(decoded)) return token;
    return token.match(/^\s*/u)[0] + escapeHTML(translate(decoded, code)) + token.match(/\s*$/u)[0];
  });
}

export function alternatives(route, origin, xml = false) {
  const entries = [...localeCodes, 'x-default'];
  return entries.map(code => {
    const url = origin + inLanguage(route, code === 'x-default' ? 'en' : code);
    return '<' + (xml ? 'xhtml:link' : 'link') + ' rel="alternate" hreflang="' + code + '" href="' + escapeHTML(url) + '"' + (xml ? '/>' : '>');
  }).join('');
}

export function languageMenu(route, code) {
  const name = escapeHTML(translate('Language', code));
  const links = localeCodes.map(other =>
    '<a href="' + inLanguage(route,other) + '" data-lang-link="' + other + '" hreflang="' + other + '" lang="' + other + '"' +
    (code === other ? ' aria-current="page"' : '') + '>' + languages[other] + '</a>'
  ).join('');
  return '<details class="drop lang-menu"><summary aria-label="' + name + ' · ' + languages[code] + '">' + code.toUpperCase() + ' ▾</summary><nav class="dropdown" aria-label="' + name + '">' + links + '</nav></details>';
}
