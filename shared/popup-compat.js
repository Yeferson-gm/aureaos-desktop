import {PACKAGE_VERSION} from 'resource:///org/gnome/shell/misc/config.js';
export function popupAnimation(animation) {
    return Number.parseInt(PACKAGE_VERSION) >= 51
        ? {animate: animation !== 0 && animation !== false, fadeOnly: animation === 1}
        : animation;
}
