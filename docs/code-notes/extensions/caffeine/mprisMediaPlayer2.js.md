# Notas de extensions/caffeine/mprisMediaPlayer2.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 7

````text
/**
 * Represents the DBus proxy class instance.
 * @typedef {{
 *  ListNamesRemote(callbackFn: (data: [string[]]) => never): never;
 *  ListNamesSync(): [string[]];
 *  ListNamesAsync(): Promise<[string[]]>;
 *  connectSignal(signal: string, callbackFn: (proxy, sender, []: [name: string, oldOwner: string, newOwner: string]) => void): any
 *  disconnectSignal(handlerId: any): void
 *  }} DBusProxy
 */
````

## Línea 17

````text
/**
 * Represents the DBus proxy class.
 * @typedef {{
 *  new(
 *      bus: string,
 *      name: string,
 *      objectPath: string,
 *      proxy: (proxy: DBusProxy) => void): DBusProxy;
 * }} DBusProxyClass
 */
````

## Línea 38

````text
/**
 * Represents the DBus Mpris Player proxy class instance.
 * @typedef {{
 *  PlaybackStatus: string;
 *  connect(signal: string, callbackFn: (player: DBusMprisPlayerProxy) => void): any
 *  disconnect(handlerId: number): void
 * }} DBusMprisPlayerProxy
 */
````

## Línea 46

````text
/**
 * Represents the DBus Mpris Player proxy class.
 * @typedef {{
 *  new(
 *      bus: string,
 *      name: string,
 *      objectPath: string,
 *      player: (player: DBusMprisPlayerProxy) => void): DBusMprisPlayerProxy;
 * }} DBusMprisPlayerProxyClass
 */
````

## Línea 62

````text
// ======================
````

## Línea 64

````text
/**
 * MprisPlayer singleton class.
 * Call `MprisPlayer.Get()` & `MprisPlayer.Destroy()`.
 */
````

## Línea 75

````text
/**
     * @type {_MprisPlayer | undefined}
     */
````

## Línea 84

````text
/**
     * Get singleton instance of MprisMediaPlayer2
     * @returns {_MprisPlayer}
     */
````

## Línea 96

````text
/**
     * Destroy the singleton instance of MprisMediaPlayer2
     * @returns {void}
     */
````

## Línea 107

````text
/**
     * @readonly
     * @type {DBusMprisPlayerProxyClass}
     */
````

## Línea 113

````text
/**
     * @readonly
     * @type {DBusProxy}
     */
````

## Línea 119

````text
/**
     * @readonly
     * @type {any}
     */
````

## Línea 127

````text
/**
     * All players with player dbusProxy instance
     * @type {Map<string, { handlerId: number, playerProxy: DBusMprisPlayerProxy }>}
     */
````

## Línea 133

````text
/**
     * All players with player dbusProxy instance
     * @type {Set<any>}
     */
````

## Línea 152

````text
/**
     * Set a callback function to isPlaying status changes.
     * Use `disconnectIsPlaying(connectId)` to disconnect manually or `MprisPlayer.Destroy()`
     * to destroy all connections.
     * @param {(isPlaying: boolean) => void} callbackFn Callback function
     * @returns {any}
     */
````

## Línea 168

````text
/**
     * Manually disable a single `connectIsPlaying` connection.
     * Run `MprisPlayer.Destroy()` to cleanup all connections.
     * @param {any} connectId The `connectId` received from `connectIsPlaying()`.
     * @returns {void}
     */
````

## Línea 191

````text
/**
     * @param {string} dbusName Name in dbus
     */
````

## Línea 217

````text
/**
     * @param {string} dbusName Name in dbus
     */
````

## Línea 240

````text
/**
     * @param {*} _proxy -
     * @param {*} _sender -
     * @param {[string, string, string]} owner -
     * @returns {void}
     */
````

## Línea 258

````text
/**
     * Get the dbus name list for mpris players
     * @returns {string[]}
     */
````

## Línea 287

````text
/** @type {DBusProxyClass} */
````
