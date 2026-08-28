// Base62 Character set
const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const UUID_WITHOUT_HYPHENS_REGEX = /^[0-9a-fA-F]{32}$/;

/**
 * Converts a standard 128-bit UUID/GUID to a Base62 string (padded to 22 chars).
 */
export function uuidToBase62(uuid: string | null | undefined): string {
  if (!uuid) return '';
  const cleanUuid = uuid.trim().replace(/-/g, '');
  if (!UUID_WITHOUT_HYPHENS_REGEX.test(cleanUuid)) {
    return uuid;
  }

  let num = BigInt('0x' + cleanUuid);
  if (num === 0n) return '0'.repeat(22);

  let str = '';
  while (num > 0n) {
    str = CHARSET[Number(num % 62n)] + str;
    num = num / 62n;
  }
  return str.padStart(22, '0');
}

/**
 * Converts a Base62 string back to standard 128-bit UUID/GUID (with hyphens).
 */
export function base62ToUuid(b62: string | null | undefined): string {
  if (!b62) return '';
  const trimmed = b62.trim();

  // If already in standard UUID format, return as is
  if (UUID_REGEX.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  // If 32-char hex without hyphens
  if (UUID_WITHOUT_HYPHENS_REGEX.test(trimmed)) {
    return [
      trimmed.slice(0, 8),
      trimmed.slice(8, 12),
      trimmed.slice(12, 16),
      trimmed.slice(16, 20),
      trimmed.slice(20)
    ].join('-').toLowerCase();
  }

  try {
    let num = 0n;
    for (let i = 0; i < trimmed.length; i++) {
      const idx = CHARSET.indexOf(trimmed[i]);
      if (idx === -1) {
        return trimmed;
      }
      num = num * 62n + BigInt(idx);
    }

    const hex = num.toString(16).padStart(32, '0');
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20)
    ].join('-').toLowerCase();
  } catch {
    return trimmed;
  }
}

/**
 * Generates an SEO-friendly URL slug from Turkish text.
 */
export function slugify(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .replace(/Ğ/g, 'g')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/ş/g, 's')
    .replace(/İ/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/I/g, 'i')
    .replace(/Ö/g, 'o')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'c')
    .replace(/ç/g, 'c')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Generates full product URL: /{slug}-p-{base62Id}
 */
export function generateProductUrl(product: { id?: string; productId?: string; name?: string } | null | undefined): string {
  if (!product) return '/products';
  const id = product.id || product.productId;
  if (!id) return '/products';
  const slug = slugify(product.name || 'urun');
  const b62Id = uuidToBase62(id);
  return `/${slug}-p-${b62Id}`;
}

/**
 * Generates full category URL: /{slug}-c-{base62Id}
 */
export function generateCategoryUrl(category: { id?: string; name?: string } | null | undefined): string {
  if (!category || !category.id) return '/products';
  const slug = slugify(category.name || 'kategori');
  const b62Id = uuidToBase62(category.id);
  return `/${slug}-c-${b62Id}`;
}

/**
 * Generates search URL: /ara?q={searchQuery}
 */
export function generateSearchUrl(query: string): string {
  const q = (query || '').trim();
  return `/ara?q=${encodeURIComponent(q)}`;
}

export interface ParsedSlugResult {
  type: 'product' | 'category' | 'unknown';
  id: string; // Decoded standard GUID
  rawId: string; // Base62 or raw ID in URL
  slugName: string;
}

/**
 * Parses a dynamic URL slug (e.g. "asus-tuf-gaming-p-DzTEz..." or "ram-c-u0ML33...")
 */
export function parseSlug(slug: string | null | undefined): ParsedSlugResult {
  if (!slug) {
    return { type: 'unknown', id: '', rawId: '', slugName: '' };
  }

  // Check product pattern: {slugName}-p-{base62Id}
  const productMatch = slug.match(/^(.+)-p-([0-9a-zA-Z]+)$/);
  if (productMatch) {
    const rawId = productMatch[2];
    const decodedId = base62ToUuid(rawId);
    return {
      type: 'product',
      id: decodedId,
      rawId: rawId,
      slugName: productMatch[1]
    };
  }

  // Check category pattern: {slugName}-c-{base62Id}
  const categoryMatch = slug.match(/^(.+)-c-([0-9a-zA-Z]+)$/);
  if (categoryMatch) {
    const rawId = categoryMatch[2];
    const decodedId = base62ToUuid(rawId);
    return {
      type: 'category',
      id: decodedId,
      rawId: rawId,
      slugName: categoryMatch[1]
    };
  }

  return { type: 'unknown', id: '', rawId: '', slugName: slug };
}
