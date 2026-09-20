/* eslint-disable no-script-url */
/**
 * Lightweight client-side HTML sanitizer to protect dangerouslySetInnerHTML.
 * Strips script tags, event handlers (on*), iframe/embed tags, and dangerous protocol URIs.
 */
export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') {
    return ''
  }

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '')
      .replace(/(href|src)\s*=\s*["']\s*javascript:[^"']*["']/gi, '$1=""')
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(dirty, 'text/html')

  const FORBIDDEN_TAGS = new Set([
    'script',
    'style',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'link',
    'meta',
    'base',
    'frame',
    'frameset',
    'applet',
  ])

  const DANGEROUS_PROTOCOLS = /^\s*(javascript|vbscript|data:text\/html):/i

  const sanitizeNode = (node) => {
    const children = Array.from(node.childNodes)
    for (const child of children) {
      if (child.nodeType === 1) {
        // Node.ELEMENT_NODE === 1
        const tagName = child.tagName.toLowerCase()
        if (FORBIDDEN_TAGS.has(tagName)) {
          child.remove()
          continue
        }

        const attrs = Array.from(child.attributes)
        for (const attr of attrs) {
          const name = attr.name.toLowerCase()
          const val = attr.value.trim().toLowerCase()

          if (name.startsWith('on')) {
            child.removeAttribute(attr.name)
          } else if (
            (name === 'href' || name === 'src' || name === 'action' || name === 'formaction') &&
            DANGEROUS_PROTOCOLS.test(val)
          ) {
            child.removeAttribute(attr.name)
          }
        }

        sanitizeNode(child)
      }
    }
  }

  sanitizeNode(doc.body)
  return doc.body.innerHTML
}

