import { RSSSite } from '@/types/rss';

interface OutlineElement {
  getAttribute(name: string): string | null;
  children: OutlineElement[];
  tagName: string;
}

interface OPMLDocument {
  querySelector(selectors: string): OutlineElement | null;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function parseOPML(xml: string): { sites: RSSSite[] } {
  const parser = new DOMParser();

  let doc = parser.parseFromString(xml, 'text/xml');
  let parserError = doc.querySelector('parsererror');

  if (parserError) {
    doc = parser.parseFromString(xml, 'text/html');
    parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Failed to parse OPML XML');
    }
  }

  return parseOPMLDocument(doc);
}

export function parseOPMLDocument(doc: OPMLDocument): { sites: RSSSite[] } {
  const body = doc.querySelector('body') || doc.querySelector('opml');
  if (!body) {
    return { sites: [] };
  }

  const sites: RSSSite[] = [];

  function walkOutlines(parent: OutlineElement, prefix: string) {
    for (const child of parent.children) {
      if (child.tagName.toLowerCase() !== 'outline') continue;

      const xmlUrl = child.getAttribute('xmlUrl');
      const title = child.getAttribute('title') || child.getAttribute('text') || '';

      if (xmlUrl) {
        const name = prefix ? `${prefix} / ${title}` : title || xmlUrl;
        const color = child.getAttribute('app:color') || undefined;
        sites.push({ name, url: xmlUrl, color });
      } else {
        const folderName = title || child.getAttribute('text') || 'Unnamed';
        const newPrefix = prefix ? `${prefix} / ${folderName}` : folderName;
        walkOutlines(child, newPrefix);
      }
    }
  }

  walkOutlines(body, '');
  return { sites };
}

export function serializeOPML(sites: RSSSite[]): string {
  const outlineElements = sites
    .map(site => {
      const colorAttr = site.color ? ` app:color="${escapeXml(site.color)}"` : '';
      const name = escapeXml(site.name);
      const url = escapeXml(site.url);
      return `    <outline type="rss" text="${name}" title="${name}" xmlUrl="${url}"${colorAttr}/>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0" xmlns:app="https://github.com/wangmuy/rss-git-log">
  <head>
    <title>RSS Subscriptions</title>
  </head>
  <body>
${outlineElements}
  </body>
</opml>`;
}