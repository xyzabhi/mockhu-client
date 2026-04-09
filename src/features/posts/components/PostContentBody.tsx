import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { theme } from '../../../presentation/theme/theme';
import { postContentLooksLikeHtml, stripHtmlTags } from '../postContentFormatting';

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function findClosing(line: string, from: number, closing: string): number {
  const idx = line.indexOf(closing, from);
  return idx === -1 ? line.length : idx;
}

function parseLineToNodes(line: string, keyBase: number): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  let k = keyBase;
  while (i < line.length) {
    if (line.startsWith('<strong><em>', i)) {
      const openLen = '<strong><em>'.length;
      const closeTag = '</em></strong>';
      const close = findClosing(line, i + openLen, closeTag);
      const inner = line.slice(i + openLen, close);
      out.push(
        <Text
          key={`n-${k++}`}
          style={{
            fontFamily: theme.typography.semiBold,
            fontWeight: '600',
            fontStyle: 'italic',
          }}
        >
          {decodeHtmlEntities(inner)}
        </Text>,
      );
      i = close === line.length ? close : close + closeTag.length;
    } else if (line.startsWith('<strong>', i)) {
      const openLen = '<strong>'.length;
      const closeTag = '</strong>';
      const close = findClosing(line, i + openLen, closeTag);
      const inner = line.slice(i + openLen, close);
      out.push(
        <Text key={`n-${k++}`} style={{ fontFamily: theme.typography.semiBold, fontWeight: '600' }}>
          {decodeHtmlEntities(inner)}
        </Text>,
      );
      i = close === line.length ? close : close + closeTag.length;
    } else if (line.startsWith('<em>', i)) {
      const openLen = '<em>'.length;
      const closeTag = '</em>';
      const close = findClosing(line, i + openLen, closeTag);
      const inner = line.slice(i + openLen, close);
      out.push(
        <Text key={`n-${k++}`} style={{ fontStyle: 'italic' }}>
          {decodeHtmlEntities(inner)}
        </Text>,
      );
      i = close === line.length ? close : close + closeTag.length;
    } else if (line[i] === '<') {
      const gt = line.indexOf('>', i);
      if (gt > i) {
        i = gt + 1;
      } else {
        out.push(decodeHtmlEntities(line.slice(i)));
        break;
      }
    } else {
      const nextTag = line.indexOf('<', i);
      const end = nextTag === -1 ? line.length : nextTag;
      const raw = line.slice(i, end);
      if (raw.length > 0) {
        out.push(decodeHtmlEntities(raw));
      }
      i = end;
    }
  }
  return out;
}

function parseStoredHtmlToNodes(html: string): ReactNode[] {
  const lines = html.split(/<br\s*\/?>/i);
  const nodes: ReactNode[] = [];
  let key = 0;
  lines.forEach((line, li) => {
    nodes.push(...parseLineToNodes(line, key));
    key += 256;
    if (li < lines.length - 1) {
      nodes.push('\n');
    }
  });
  return nodes;
}

type PostContentBodyProps = {
  content: string;
  style?: object;
};

/** Feed/detail: plain text or HTML subset from stored posts. */
export function PostContentBody({ content, style }: PostContentBodyProps) {
  if (!postContentLooksLikeHtml(content)) {
    return <Text style={style}>{content}</Text>;
  }
  const nodes = parseStoredHtmlToNodes(content);
  const hasRenderable = nodes.some((n) => n !== '' && n != null);
  if (!hasRenderable) {
    return <Text style={style}>{stripHtmlTags(content)}</Text>;
  }
  return <Text style={style}>{nodes}</Text>;
}
