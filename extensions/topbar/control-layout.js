export function controlRows(ids, sizes, available = () => true) {
    const rows = [];
    let row = [];
    for (const id of ids.filter(available)) {
        if (sizes[id] === 'wide') {
            if (row.length) rows.push(row);
            rows.push([id]); row = [];
        } else {
            row.push(id);
            if (row.length === 2) { rows.push(row); row = []; }
        }
    }
    if (row.length) rows.push(row);
    return rows;
}
export function panelSize(width, height, scale = 1) {
    return {width: Math.max(240, Math.min(344, width / scale - 32)), height: Math.max(180, height / scale - 100)};
}
