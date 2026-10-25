import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const file=process.argv[2] ?? new URL('../extension.js',import.meta.url);
const code=fs.readFileSync(file,'utf8');
const start=code.indexOf('class Bluetooth extends Model');
const end=code.indexOf('// ── Privacidad:',start);
const calls=[];
const context=vm.createContext({Model:class{},BLUEZ:'org.bluez',
    Gio:{DBus:{system:{call(...args){calls.push(args.at(-1));}}},DBusCallFlags:{NO_AUTO_START:0}},
});
const Bluetooth=vm.runInContext(code.slice(start,end)+'\nBluetooth',context);
const bt=Object.create(Bluetooth.prototype);
bt._dead=false; bt._emit=()=>{};
const objects=connected=>({'/a':{'org.bluez.Adapter1':{Powered:true}},'/d':{'org.bluez.Device1':{Adapter:'/a',Paired:true,Connected:connected,Name:'Auriculares'}}});
const finish=connected=>({call_finish:()=>({recursiveUnpack:()=>[objects(connected)]})});
bt.refresh(); bt.refresh();
calls[1](finish(true),null); calls[0](finish(false),null);
assert.equal(bt.paired[0].connected,true,'Una respuesta antigua no debe borrar la conexión automática');
bt.refresh(); calls[2](finish(false),null);
assert.equal(bt.paired[0].connected,false,'Debe detectar la desconexión externa');
console.log('PASS: conexión/desconexión externas y respuestas fuera de orden');
