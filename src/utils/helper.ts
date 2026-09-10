import { JSDOM } from 'jsdom';

/** Express 5 types route params as string | string[]. Prisma needs a string. */
export function routeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

/**
 * Process images in content:
 * 1. Extract base64 images and upload to S3
 * 2. Replace image URLs with final S3 URLs
 * 3. Track all images used in the content
 */
export async function processContentImages(content: string) {
  const dom = new JSDOM(`<div>${content}</div>`);
  const document = dom.window.document;
  const imgElements = document.querySelectorAll('img');
  const extractedImages = [];

  // Process each image in the content
  for (const img of imgElements) {
    const src = img.getAttribute('src') || '';
    const alt = img.getAttribute('alt') || '';
    const caption = img.getAttribute('data-caption') || '';

    // Just track the image information regardless of source
    if (src) {
      extractedImages.push({
        url: src,
        filename: src.split('/').pop() || 'image',
        alt,
        caption,
      });
    }
  }

  // Get the updated content
  const processedContent = document.querySelector('div')?.innerHTML || '';

  return { processedContent, extractedImages };
}
