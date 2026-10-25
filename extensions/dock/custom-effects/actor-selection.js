// Pure actor selection kept separate so the GNOME Shell hierarchy decision is
// covered by unit tests without requiring a running compositor.

export function selectVisualActor(delegate) {
    // Keep labels, notification badges and running indicators at native size.
    return delegate?.icon?._iconBin ?? null;
}
