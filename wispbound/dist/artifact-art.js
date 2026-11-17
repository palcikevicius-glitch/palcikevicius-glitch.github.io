import {artifact} from './catalog.js';

const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

export function artifactArt(id) {
  const entry = artifact(id);
  return entry ? `./assets/artifacts/${entry.id}.svg` : '';
}

export function artifactIcon(id, className = '') {
  const src = artifactArt(id);
  if (!src) return '';
  return `<img class="artifact-art${className ? ` ${esc(className)}` : ''}" src="${src}" alt="" aria-hidden="true" width="64" height="64" draggable="false" decoding="async">`;
}
