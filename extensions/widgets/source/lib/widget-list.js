export function normalizeWidgetList(config) {
    const seen = new Set();
    const duplicates = [];
    const widgets = config.widgets.filter(widget => {
        if (seen.has(widget.tipo)) {
            duplicates.push(widget);
            return false;
        }
        seen.add(widget.tipo);
        return true;
    });
    if (!duplicates.length)
        return false;
    config.widgets = widgets;
    config.widgetsArchivados = [...(config.widgetsArchivados ?? []), ...duplicates];
    return true;
}
