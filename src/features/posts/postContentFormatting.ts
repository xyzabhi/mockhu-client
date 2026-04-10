export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/** Detect stored post content that uses HTML from this client. */
export function postContentLooksLikeHtml(content: string): boolean {
  return /<\/(strong|em)>|<(strong|em)(\s|>)/i.test(content);
}
