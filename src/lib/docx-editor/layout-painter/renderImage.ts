/**
 * Image Renderer
 *
 * Renders image fragments to DOM. Handles:
 * - Inline images
 * - Anchored/floating images with z-index layering
 * - Basic image sizing
 * - Lazy loading with Intersection Observer for off-screen images
 */

import type { ImageFragment, ImageBlock, ImageMeasure } from '../layout-engine/types';
import type { RenderContext } from './renderPage';

/**
 * CSS class names for image elements
 */
export const IMAGE_CLASS_NAMES = {
  image: 'layout-image',
  imageAnchored: 'layout-image-anchored',
  imageLoading: 'layout-image-loading',
};

/**
 * Options for rendering an image fragment
 */
export interface RenderImageFragmentOptions {
  document?: Document;
}

/**
 * Track registered Intersection Observers for lazy loading.
 * Using a single observer per document to avoid performance issues.
 */
const observerRegistry = new WeakMap<Document, IntersectionObserver>();

/**
 * Get or create an Intersection Observer for lazy loading.
 */
function getLazyObserver(doc: Document): IntersectionObserver {
  let observer = observerRegistry.get(doc);
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLImageElement;
            const src = target.dataset.src;
            if (src) {
              // Load the image
              target.src = src;
              target.classList.remove(IMAGE_CLASS_NAMES.imageLoading);
              // Clean up data attribute
              delete target.dataset.src;
              // Stop observing this element
              observer!.unobserve(target);
            }
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before viewport
        threshold: 0,
      }
    );
    observerRegistry.set(doc, observer);
  }
  return observer;
}

/**
 * Render an image fragment to DOM
 *
 * @param fragment - The image fragment to render
 * @param block - The full image block
 * @param measure - The image measure
 * @param context - Rendering context
 * @param options - Rendering options
 * @returns The image DOM element
 */
export function renderImageFragment(
  fragment: ImageFragment,
  block: ImageBlock,
  _measure: ImageMeasure,
  _context: RenderContext,
  options: RenderImageFragmentOptions = {}
): HTMLElement {
  const doc = options.document ?? document;

  // Create container div
  const containerEl = doc.createElement('div');
  containerEl.className = IMAGE_CLASS_NAMES.image;

  if (fragment.isAnchored) {
    containerEl.classList.add(IMAGE_CLASS_NAMES.imageAnchored);
  }

  // Basic styling
  containerEl.style.position = 'absolute';
  containerEl.style.width = `${fragment.width}px`;
  containerEl.style.height = `${fragment.height}px`;
  containerEl.style.overflow = 'hidden';

  // Z-index for layering
  if (fragment.zIndex !== undefined) {
    containerEl.style.zIndex = String(fragment.zIndex);
  }

  // Behind document flag
  if (block.anchor?.behindDoc) {
    containerEl.style.zIndex = '-1';
  }

  // Store metadata
  containerEl.dataset.blockId = String(fragment.blockId);

  if (fragment.pmStart !== undefined) {
    containerEl.dataset.pmStart = String(fragment.pmStart);
  }
  if (fragment.pmEnd !== undefined) {
    containerEl.dataset.pmEnd = String(fragment.pmEnd);
  }

  // Create the actual image element
  const imgEl = doc.createElement('img');
  imgEl.alt = block.alt ?? '';

  // Image sizing
  imgEl.style.width = '100%';
  imgEl.style.height = '100%';
  imgEl.style.objectFit = 'contain';
  imgEl.style.display = 'block';

  // Apply transform if present (rotation, flip)
  if (block.transform) {
    imgEl.style.transform = block.transform;
  }

  // Prevent dragging
  imgEl.draggable = false;

  // Lazy loading: Start with placeholder if src is a data URL or external
  // For now, always use lazy loading for better performance
  const isDataUrl = block.src.startsWith('data:');
  const isExternal = block.src.startsWith('http://') || block.src.startsWith('https://');

  if (isExternal || isDataUrl) {
    // For external/data URLs, load immediately but track for potential future optimization
    imgEl.src = block.src;
  } else {
    // For relative URLs, use lazy loading with Intersection Observer
    imgEl.dataset.src = block.src;
    imgEl.classList.add(IMAGE_CLASS_NAMES.imageLoading);
    imgEl.style.backgroundColor = '#f0f0f0';

    // Observe for lazy loading
    const observer = getLazyObserver(doc);
    observer.observe(imgEl);
  }

  containerEl.appendChild(imgEl);

  return containerEl;
}

/**
 * Clean up the IntersectionObserver registered for a given document.
 * Call this when the editor unmounts or before re-rendering to avoid memory leaks.
 */
export function cleanupImageObserver(doc: Document): void {
  const obs = observerRegistry.get(doc);
  if (obs) {
    obs.disconnect();
    observerRegistry.delete(doc);
  }
}
