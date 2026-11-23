const percent = value => Number.isFinite(value) && value >= 0 && value <= 100 ? Math.round(value) : null;
const identity = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
export function deviceIcon(type, hint = '') {
    if (type === 5 || /mouse/.test(hint)) return 'input-mouse-symbolic';
    if (type === 6 || /keyboard/.test(hint)) return 'input-keyboard-symbolic';
    if ([16, 17].includes(type) || /headphone|headset/.test(hint)) return 'audio-headphones-symbolic';
    if (type === 8 || /phone/.test(hint)) return 'phone-symbolic';
    if (type === 2) return 'computer-symbolic';
    return 'bluetooth-active-symbolic';
}
export function mergeDevices(power = [], bluetooth = {}) {
    const result = [];
    for (const [path, interfaces] of Object.entries(bluetooth)) {
        const device = interfaces['org.bluez.Device1'];
        if (!device?.Connected) continue;
        result.push({id: path, name: device.Alias || device.Name || 'Bluetooth',
            address: identity(device.Address), percentage: percent(interfaces['org.bluez.Battery1']?.Percentage),
            charging: false, icon: deviceIcon(0, device.Icon || ''), kind: 'accessory'});
    }
    for (const item of power) {
        if (!item.IsPresent || item.Type === 1 || /DisplayDevice$/.test(item.path ?? '')) continue;
        const match = result.find(device => (device.address && device.address === identity(item.Serial)) ||
            identity(device.name) === identity(item.Model) || (device.address && identity(item.NativePath).includes(device.address)));
        const percentage = item.BatteryLevel > 1 ? null : percent(item.Percentage);
        if (match) {
            match.percentage ??= percentage;
            match.charging = [1, 5].includes(item.State);
        } else {
            result.push({id: item.path, name: item.Model || (item.Type === 2 ? 'Este equipo' : 'Dispositivo'),
                percentage, charging: [1, 5].includes(item.State), icon: deviceIcon(item.Type), kind: item.Type === 2 ? 'computer' : 'accessory'});
        }
    }
    return result.sort((a, b) => (a.kind === 'computer') - (b.kind === 'computer') || a.name.localeCompare(b.name)).slice(0, 16);
}
