# Notas de extensions/desktop-icons/app/widgetManager.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 27

````text
/**
 * WidgetManager
 *
 * - Owned by DesktopManager.
 * - Uses DesktopGrid/WidgetGrid for all geometry math.
 * - Positions widgets inside each grid's `widgetContainer` (Gtk.Fixed).
 *
 * Coordinate model:
 *   - We store per-instance:
 *       * monitorIndex
 *       * normX, normY  (0..1, normalized to grid.normalizedWidth/Height)
 *       * pinnedGlobalX, pinnedGlobalY (absolute shell coords for floating
 *         pinned windows; used to survive margin/order changes)
 *       * width, height (absolute pixels, widget-owned)
 *   - On layout changes, we rebuild a map of:
 *       monitorIndex -> { grid, widgetContainer }
 *   - To place an instance:
 *       localX = normX * grid.normalizedWidth
 *       localY = normY * grid.normalizedHeight
 *       widgetContainer.put(actor, localX, localY)
 */
````

## Línea 89

````text
// monitorIndex -> { grid, widgetContainer }
````

## Línea 92

````text
// instanceId -> {
````

## Línea 93

````text
//   instanceId,
````

## Línea 94

````text
//   widgetId,
````

## Línea 95

````text
//   kind,
````

## Línea 96

````text
//   monitorIndex,
````

## Línea 97

````text
//   normX,
````

## Línea 98

````text
//   normY,
````

## Línea 99

````text
//   width,
````

## Línea 100

````text
//   height,
````

## Línea 101

````text
//   actor,
````

## Línea 102

````text
//   config,
````

## Línea 103

````text
// }
````

## Línea 114

````text
// When true, suppress emitting stateChanged events
````

## Línea 122

````text
// loadState is handled during startup and by Preferences; avoid
````

## Línea 123

````text
// overlapping loads during construction.
````

## Línea 189

````text
/**
     * Called by DesktopManager from applyDesktopLayoutChange().
     *
     * @param {Array<object>} desktops - the same array WindowManager uses,
     *   containing DesktopGrid/WidgetGrid instances for each monitor.
     *
     * @param {object} changeInfo - layout change info:
     *   {
     *     redisplay: boolean,
     *     monitorschanged: boolean,
     *     gridschanged: boolean,
     *   }
     */
````

## Línea 281

````text
// =====================================================================
````

## Línea 282

````text
// Public instance API
````

## Línea 283

````text
// =====================================================================
````

## Línea 285

````text
/**
     * High-level helper: create a new instance for a widget from the registry.
     *
     * @param {string} widgetId - ID from WidgetRegistry (usually folder name).
     * @param {object} opts
     *   {
     *     monitorIndex?: number,  // optional, defaults to first available
     *     x?: number,             // local coords in widgetContainer space
     *     y?: number,
     *     width?: number,         // override defaultWidth/defaultHeight
     *     height?: number,
     *     initialPinned?: boolean,           // optional initial pinned mode
     *     inheritConsentFromInstanceId?: string, // optional source instance
     *     selectAfterCreate?: boolean,           // optional auto-select/focus
     *   }
     *
     * Returns the created instance object or null.
     */
````

## Línea 317

````text
// 1. Load descriptor (or create a fallback one)
````

## Línea 335

````text
// 2. Choose monitor index: caller hint or first available surface
````

## Línea 352

````text
// 3. Size from opts or registry defaults
````

## Línea 361

````text
// 4. Compute placement
````

## Línea 373

````text
// 5. Create the actual instance (generates UUID, attaches actor)
````

## Línea 417

````text
// Persist creation
````

## Línea 435

````text
// Clear selection first so CSS + chrome are detached.
````

## Línea 470

````text
// Don't reposition if nothing changed, to avoid unnecessary state
````

## Línea 471

````text
// updates that write the json file with new postion triggering UI
````

## Línea 472

````text
// to refresh.
````

## Línea 558

````text
/*
     * Compute the current absolute frame for an instance based on
     * stored normX/normY + width/height and the grid's normalized size.
     *
     * Returns coordinates in the local coordinate space of the
     * widgetContainer.
     *
     */
````

## Línea 591

````text
// Clamp to stay inside the grid's usable area
````

## Línea 864

````text
// =====================================================================
````

## Línea 865

````text
// Widget state persistence API
````

## Línea 866

````text
// =====================================================================
````

## Línea 868

````text
/*
     * Load widget instances from a JSON-compatible object.
     *
     * Schema:
     * {
     *   version: 2,
     *   instances: [
     *     {
     *      instanceId, widgetId, kind,
     *      monitorIndex, normX, normY,
     *      width, height,
     *      config: { ... }   // author-defined fields
     *      prefsUri: string|null,
     *      hasPreferences: boolean,
     *      pinnable: boolean,
     *      chrome: {
     *        showCloseButton: boolean,
     *        showPrefsButton: boolean,
     *        showMoveButton: boolean,
     *        showPinButton: boolean,
     *      },
     *      hasBackend: boolean,
     *      webConsent: boolean|null,
     *      backendConsent: boolean|null,
     *     },
     *     ...
     *   ]
     * }
     *
     *
     * @param {object} state - JSON-compatible object as described above.
     *
     * @returns {void}
     *
     * It is called by Preferences when it reads the saved state from disk.
     * as well as by DesktopManager when it starts as well from this
     * constructor.
     *
     * It is also called by Preferences when the user changes widget state.
     *
     * As the state read from disk is asynchronous, this method may be called
     * before the widget registry is loaded, with null, so we need to handle
     * that case gracefully.
     *
     * Method is idempotent; it will not remove instances that are not in the
     * input state, and it will not add instances that are already present.
     *
     * It also has to deal with null, undefined, or missing fields gracefully.
     */
````

## Línea 959

````text
// Avoid emitting stateChanged while rebuilding from persisted state.
````

## Línea 960

````text
// Only suppress around positioning, so we don't block saves for long
````

## Línea 961

````text
// async operations (e.g., consent prompts).
````

## Línea 1292

````text
// showMoveButton=false means the widget owns pinned move UI. In that
````

## Línea 1293

````text
// mode the host suppresses overlay drag and expects widget content to
````

## Línea 1294

````text
// call beginPinnedWindowMove() from its own control or drag surface.
````

## Línea 1298

````text
/**
     * Notify Preferences that widget state has changed.
     * Triggers async write to $XDG_DATA_HOME/<app-id>/widgets.json
     */
````

## Línea 1310

````text
/**
     * Compute a per-instance Z index from the current GTK child order of each
     * widgetContainer. Lower index = deeper, higher index = closer to front.
     *
     * This does not mutate any internal state; it only observes the widget
     * hierarchy. Add buttons and non-widget actors are skipped.
     *
     * @returns {Map<string, number>} instanceId -> zIndex
     */
````

## Línea 1352

````text
/**
     * Return a list of content widget instances sorted for export:
     *   1) By monitorIndex (to keep per-monitor grouping stable).
     *   2) By stacking index within that monitor, derived from GTK.
     *
     * This does not change the instances or maps; it only sorts a local array.
     *
     * @param {Map<string, number>} zIndexByInstanceId
     * @returns {Array<object>} sorted instance objects
     */
````

## Línea 1373

````text
// First group by monitorIndex
````

## Línea 1380

````text
// Then by z-index within that monitor, derived from GTK
````

## Línea 1394

````text
/**
     * Export the full current widget state as a JSON-compatible object.
     *
     * The saved schema is identical to loadState():
     * {
     *   version: 4,
     *   instances: [
     *     { instanceId, widgetId, kind, monitorIndex,
     *       normX, normY, width, height,
     *       pinnedGlobalX, pinnedGlobalY, config }
     *   ]
     * }
     * */
````

## Línea 1461

````text
// v1 -> v2: instances gain hasBackend.
````

## Línea 1462

````text
// Compute it once from the widget manifest (descriptor) and persist.
````

## Línea 1463

````text
// Schema v2+: backend capability is stored per instance (hasBackend)
````

## Línea 1464

````text
// and is resolved once at creation or migration time.
````

## Línea 1480

````text
// If registry lookup fails, default false (safe).
````

## Línea 1524

````text
// Persist the migrated file state as-is (do NOT call exportState() here).
````

## Línea 1532

````text
// =====================================================================
````

## Línea 1533

````text
// Internal helpers
````

## Línea 1534

````text
// =====================================================================
````

## Línea 1548

````text
// Convert local coords to normalized using existing grid plumbing.
````

## Línea 1549

````text
// This uses normalizedWidth/Height internally.
````

## Línea 1978

````text
// Use optional chaining because requestRender()
````

## Línea 1979

````text
// currently exists only on HTML hosts.
````

## Línea 2056

````text
// this can be re-entrant for html widgets due to consent checks
````

## Línea 2068

````text
// this can be re-entrant for html widgets due to consent checks
````

## Línea 2145

````text
// IMPORTANT: during loadState writes are suppressed, so if we changed
````

## Línea 2146

````text
// consent OR removed an instance, force a state write once.
````

## Línea 2242

````text
// If the instance is selected and we're suppressing selection chrome,
````

## Línea 2243

````text
// don't do reattachment at all, the widget is being dragged.
````

## Línea 2294

````text
// Never attach to an instance that's being dragged.
````

## Línea 2419

````text
// Keep host chrome button names in the ding-widget-*-button form.
````

## Línea 2420

````text
// If a new host chrome button is added here, update
````

## Línea 2421

````text
// DesktopGrid._isWidgetChromeActor() so input handling continues to
````

## Línea 2422

````text
// distinguish host chrome from draggable widget actors.
````

## Línea 2571

````text
// Delegate everything to WebWidgetContext
````

## Línea 2607

````text
// Stub for future GTK widgets. For now, everything is HTML.
````

## Línea 2608

````text
//
````

## Línea 2623

````text
// ToDo: GTK Widget layer change;
````

## Línea 2631

````text
// To Do: GTK Widget seleted state
````

## Línea 2742

````text
// To Do: GTK Widget layer change
````

## Línea 2748

````text
// To Do : Gtk Widget layer change
````

## Línea 2759

````text
// ignore
````

## Línea 2775

````text
// ignore
````

## Línea 2826

````text
/* ====================================================================
     * --- IGNORE ---
     * GTK widget support stub (future)
     * --- IGNORE ---
     * ===================================================================== */
````

## Línea 2833

````text
// GTK stub for later: we could create a native Gtk.Widget here, e.g.:
````

## Línea 2841

````text
/* ====================================================================
     * WebKit WebContext HTML widget support
     * ===================================================================== */
````

## Línea 2858

````text
// We prune aggressively, there may be no host, add button has
````

## Línea 2859

````text
// no isAlive(). Look only for html hosts
````

## Línea 2871

````text
/* =====================================================================
     * Widget Picker UI
     * ===================================================================== */
````

## Línea 2891

````text
// Sort by display name
````

## Línea 2962

````text
// Double-clicking a row also activates "Add"
````

## Línea 2967

````text
// If user closes via window close button / Esc
````

## Línea 2981

````text
// allow close
````

## Línea 3008

````text
/** @type {Adw.Window} */
````

## Línea 3010

````text
/** @type {Gtk.ListBox} */
````

## Línea 3012

````text
/** @type {Gtk.Button} */
````

## Línea 3014

````text
/** @type {Gtk.Button} */
````

## Línea 3016

````text
/** @type {Gtk.Button} */
````

## Línea 3022

````text
// Populate rows from registry
````

## Línea 3028

````text
// Select first by default
````

## Línea 3198

````text
// `widgets.backup` is temporary rollback state and should never linger.
````

## Línea 3223

````text
// ignore cleanup failures
````

## Línea 3248

````text
// Ensure widget layers are visible before adding a widget.
````

## Línea 3280

````text
// Ensure widget layers are visible before showingt widget grid.
````

## Línea 3304

````text
/* =====================================================================
     * Widget Consent UI
     * ===================================================================== */
````

## Línea 3476

````text
// If we can’t resolve spec, keep message generic.
````
