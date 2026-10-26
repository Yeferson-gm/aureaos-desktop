const FULLY_SHOWN_EPSILON = 0.001;








export function shouldClipSlideContainer(slideProgress) {
    return slideProgress < 1 - FULLY_SHOWN_EPSILON;
}
