const FULLY_SHOWN_EPSILON = 0.001;

/**
 * The slide container only needs a clip while the dock is moving through the
 * screen edge. Once fully shown, clipping would cut transformed icon content.
 *
 * @param {number} slideProgress value from 0 (hidden) to 1 (shown)
 * @returns {boolean} whether the slide viewport must clip its child
 */
export function shouldClipSlideContainer(slideProgress) {
    return slideProgress < 1 - FULLY_SHOWN_EPSILON;
}
