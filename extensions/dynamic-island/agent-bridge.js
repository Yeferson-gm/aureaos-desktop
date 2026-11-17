import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import St from 'gi://St';
import Pango from 'gi://Pango';
import {validateActivity} from './content-models.js';
import {Assistants} from './assistants.js';

const XML = '<node><interface name="org.aurea.Island"><method name="Publish"><arg type="s" direction="in"/><arg type="b" direction="out"/></method></interface></node>';

export class AgentBridge {
    constructor(island) {
        this.island = island;
        this.items = new Map();
        this.object = Gio.DBusExportedObject.wrapJSObject(XML, {Publish: raw => this.publish(raw)});
        this.object.export(Gio.DBus.session, '/org/aurea/Island');
        this.owner = Gio.bus_own_name_on_connection(Gio.DBus.session, 'org.aurea.Island', Gio.BusNameOwnerFlags.NONE, null, null);
    }

    publish(raw) {
        const e = this.island;
        if (!e._settings.get_boolean('agent-events') || raw.length > 4096) return false;
        let value;
        try { value = validateActivity(JSON.parse(raw)); } catch { return false; }
        if (!value) return false;
        if (!this.items.has(value.id) && this.items.size >= 20) {
            const completed = [...this.items.values()].find(item => ['done', 'error'].includes(item.state));
            if (!completed) return false;
            this.items.delete(completed.id);
        }
        this.items.set(value.id, value);
        if (value.state === 'done') e._ornaments.celebrate();
        const active = ['running', 'waiting'].includes(value.state);
        e._live.update(`agent-${value.id}`, active ? {text: value.title, page: 'agents', icon: 'utilities-terminal-symbolic', priority: 35} : null);
        if (value.state !== 'running') e._toast({key: `agent-${value.id}`, text: `${value.title} · ${value.state === 'done' ? 'Terminado' : value.state === 'waiting' ? 'Necesita tu atención' : 'Error'}`,
            icon: 'utilities-terminal-symbolic', priority: value.state === 'error' ? 80 : 45});
        else e._updatePill();
        this.render();
        return true;
    }

    syncEnabled() {
        if (!this.island._settings.get_boolean('agent-events')) {
            for (const id of this.items.keys()) this.island._live.update(`agent-${id}`, null);
            this.items.clear();
            this.island._updatePill();
        }
        this.render();
    }

    build() {
        const e = this.island;
        const page = e._newPage('agents');
        this.assistants = new Assistants(e, page);
        const hint = e._label('Actividad de las sesiones iniciadas aquí. Las respuestas se muestran en tu herramienta.', 'di-hint', {width: 370});
        hint.clutter_text.set_line_wrap(true);
        page.add_child(hint);
        this.list = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-live-list'});
        page.add_child(this.list);
        this.render();
    }

    render() {
        if (!this.list) return;
        const e = this.island;
        this.list.destroy_all_children();
        if (!e._settings.get_boolean('agent-events')) {
            this.list.add_child(e._label('Activa Integraciones locales en Ajustes.', 'di-hint')); return;
        }
        if (!this.items.size) this.list.add_child(e._label('Las tareas iniciadas con aurea-task.py aparecerán aquí.', 'di-hint'));
        for (const item of this.items.values()) {
            const row = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-agent-card'});
            const title = e._label(item.title, 'di-dashboard-detail', {width: 350});
            title.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
            row.add_child(title);
            row.add_child(e._label(({running: 'En curso', waiting: 'Necesita atención', done: 'Terminado', error: 'Error'})[item.state], 'di-hint'));
            if (item.detail) {
                const detail = e._label(item.detail, 'di-hint', {width: 350});
                detail.clutter_text.set_line_wrap(true);
                row.add_child(detail);
            }
            if (item.progress !== null) {
                const bar = e._makeBar(340, 5); bar.set(item.progress); row.add_child(bar.actor);
            }
            row.add_child(e._chip('Retirar de la isla', () => {
                this.items.delete(item.id); e._live.update(`agent-${item.id}`, null); e._updatePill(); this.render();
            }));
            this.list.add_child(row);
        }
        e._resizeIsland();
    }

    destroy() {
        this.object?.unexport();
        if (this.owner) Gio.bus_unown_name(this.owner);
        this.owner = 0;
        this.items.clear();
    }
}
