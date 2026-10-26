import {_} from '../dependencies/gettext.js';







export const DefaultShortcuts = {
    doNewFolder: {Hint: _('New Folder'), Accel: '<Control><Shift>N', Edit: true},
    doPaste: {Hint: _('Paste'), Accel: '<Control>V'},
    doUndo: {Hint: _('Undo'), Accel: '<Control>Z'},
    doRedo: {Hint: _('Redo'), Accel: '<Control><Shift>Z'},
    selectAll: {Hint: _('Select All'), Accel: '<Control>A'},
    showDesktopInFiles: {Hint: _('Show Desktop in Files'), Accel: '', Edit: true},
    openInTerminal: {Hint: _('Open in Terminal'), Accel: '', Edit: true},
    changeBackGround: {Hint: _('Change Background'), Accel: '', Edit: true},
    changeDisplaySettings: {Hint: _('Change Display Settings'), Accel: '', Edit: true},
    changeDesktopIconSettings: {Hint: _('Change Desktop Icon Settings'), Accel: '', Edit: true},
    cleanUpIcons: {Hint: _('Clean Up Icons'), Accel: '', Edit: true},
    'keep-arranged': {Hint: _('Keep Arranged'), Accel: '', Edit: true},
    'keep-stacked': {Hint: _('Keep Stacked'), Accel: '', Edit: true},
    sortSpecialFolders: {Hint: _('Sort Special Folders'), Accel: ''},
    'sort-special-folders': {Hint: _('Sort Special Folders'), Accel: ''},
    arrangeByName: {Hint: _('Arrange Icons by Name'), Accel: '', Edit: true},
    arrangeByDescendingName: {Hint: _('Arrange Icons By Descending Name'), Accel: '', Edit: true},
    arrangeByModifiedTime: {Hint: _('Arrange Icons By Modified Time'), Accel: '', Edit: true},
    arrangeByKind: {Hint: _('Arrange Icons By Kind'), Accel: '', Edit: true},
    arrangeBySize: {Hint: _('Arrange Icons By Size'), Accel: '', Edit: true},
    findFiles: {Hint: _('Find Files'), Accel: '<Control>F', Edit: true},
    updateDesktop: {Hint: _('Update Desktop'), Accel: 'F5', Edit: true},
    showHideHiddenFiles: {Hint: _('Show Hidden Files'), Accel: '<Control>H'},
    unselectAll: {Hint: _('Unselect All'), Accel: 'Escape'},
    previewAction: {Hint: _('Preview'), Accel: 'space'},
    toggleKeyboardSelection: {
        Hint: _('Toggle Keyboard Selection'),
        Accel: '<Control>space',
    },
    toggleWidgetLayer: {Hint: _('Toggle Widget Layer'), Accel: '<Control><Shift>L', Edit: true},
    togglePinnedWidgetsBelowApps: {
        Hint: _('Toggle Pinned Widgets Below Applications'),
        Accel: '',
        Edit: true,
    },
    addWidget: {Hint: _('Add Widget'), Accel: '<Shift><Control>plus', Edit: true},

    chooseIconLeft: {
        Hint: _('Choose Icon Left'),
        Accel: 'Left,<Shift>Left,<Control>Left,<Alt>Left,' +
            '<Shift><Control>Left,<Shift><Alt>Left',
    },
    chooseIconRight: {
        Hint: _('Choose Icon Right'),
        Accel: 'Right,<Shift>Right,<Control>Right,<Alt>Right,' +
            '<Shift><Control>Right,<Shift><Alt>Right',
    },
    chooseIconUp: {
        Hint: _('Choose Icon Up'),
        Accel: 'Up,<Shift>Up,<Control>Up,<Alt>Up,' +
            '<Shift><Control>Up,<Shift><Alt>Up',
    },
    chooseIconDown: {
        Hint: _('Choose Icon Down'),
        Accel: 'Down,<Shift>Down,<Control>Down,<Alt>Down,' +
            '<Shift><Control>Down,<Shift><Alt>Down',
    },
    menuKeyPressed: {Hint: _('Show Menu'), Accel: 'Menu,<Shift>F10'},
    displayShellBackgroundMenu: {Hint: _('Display Shell Background Menu'), Accel: ''},
    createDesktopShortcut: {Hint: _('Create Desktop Shortcut'), Accel: '', Edit: true},
    textEntryAccelsTurnOn: {Hint: _('Text Entry Accels Turn On'), Accel: ''},
    textEntryAccelsTurnOff: {Hint: _('Text Entry Accels Turn Off'), Accel: ''},
    newDocument: {Hint: _('New Document'), Accel: ''},
    showShortcutViewer: {Hint: _('Show Shortcut Viewer'), Accel: '', Edit: true},
    forceGC: {Hint: _('Force Garbage Collection'), Accel: '', Edit: true},
    toggleVisibility: {Hint: _('Show Or Hide Desktop Icons'), Accel: '', Global: true},

    openMultipleFileAction: {Hint: 'Open All', Accel: '<Control>Return', Edit: true},
    openOneFileAction: {Hint: 'Open Item', Accel: 'Return', Edit: true},
    openInNewWindow: {
        Hint: _('Open Folder in New Window'), Accel: '<Shift>Return', Edit: true,
    },
    stackunstack: {Hint: 'Stack/Unstack', Accel: ''},
    doopenwith: {Hint: 'Open With', Accel: '', Edit: true},
    graphicslaunch: {Hint: 'Launch using Integrated Graphics Card', Accel: ''},
    runasaprogram: {Hint: 'Run as a Program', Accel: ''},
    docut: {Hint: 'Cut Item', Accel: '<Control>X'},
    docopy: {Hint: 'Copy Item', Accel: '<Control>C'},
    dorename: {Hint: 'Rename Item', Accel: 'F2', Edit: true},
    movetotrash: {Hint: 'Move to Trash', Accel: 'Delete'},
    deletepermanantly: {Hint: 'Delete Permanently', Accel: '<Shift>Delete'},
    emptytrash: {Hint: 'Empty Trash', Accel: '', Edit: true},
    allowdisallowlaunching: {Hint: 'Allow/Disallow Launching', Accel: '', Edit: true},
    eject: {Hint: 'Eject', Accel: '', Edit: true},
    unmount: {Hint: 'Unmount', Accel: '', Edit: true},
    extractautoar: {Hint: 'Extract Here', Accel: ''},
    extracthere: {Hint: 'Extract Here', Accel: ''},
    extractto: {Hint: 'Extract To', Accel: ''},
    sendto: {Hint: 'Email to', Accel: '', Edit: true},
    compressfiles: {Hint: 'Compress Files', Accel: '', Edit: true},
    newfolderfromselection: {Hint: 'New Folder from Selection', Accel: '', Edit: true},
    properties: {Hint: 'Show Properties', Accel: '<Control>I', Edit: true},
    showinfiles: {Hint: 'Show in Files', Accel: '', Edit: true},
    openinterminal: {Hint: 'Open Terminal with Shell at this path', Accel: '', Edit: true},
    openDesktopInTerminal: {Hint: 'Open Terminal at Desktop path', Accel: '', Edit: true},
    makeLinks: {Hint: 'Create Link to Item', Accel: '<Shift><Control>M', Edit: true},
    bulkCopy: {Hint: 'Copy to', Accel: '', Edit: true},
    bulkMove: {Hint: 'Move to', Accel: '', Edit: true},
    onScriptClicked: {Hint: 'Run Script', Accel: ''},
    closeWidget: {Hint: 'Close Selected Widget', Accel: '<Shift><Control>X', Edit: true},
    toggleWidgetGrid: {Hint: 'Toggle Widget Grid', Accel: '<Control><Shift>G', Edit: true},


    updateGridWindows: {Hint: 'Update Grid Windows', Accel: ''},
    lowerWidgetLayer: {Hint: 'Lower Widget Layer', Accel: ''},
    raiseWidgetLayer: {Hint: 'Raise Widget Layer', Accel: ''},
    updatePinnedWindowPosition: {Hint: 'Update Pinned Window Position', Accel: ''},
    desktopAction: {Hint: 'Desktop Action', Accel: ''},
    sendfiles: {Hint: 'Send Files', Accel: ''},
    changeDesktop: {Hint: 'Change Desktop', Accel: ''},
    restoreDefaultDesktop: {Hint: 'Restore Default Desktop', Accel: ''},
    arrangeaction: {Hint: 'Arrange Action', Accel: ''},
    reloadCSS: {Hint: 'Reload CSS', Accel: ''},
};








export const GlobalShortcuts = {
    toggleVisibility: DefaultShortcuts.toggleVisibility,
};
