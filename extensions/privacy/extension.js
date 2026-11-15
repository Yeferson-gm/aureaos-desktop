//Main imports
import St from 'gi://St';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';


import {PopupAnimation} from 'resource:///org/gnome/shell/ui/boxpointer.js';

import * as Config from 'resource:///org/gnome/shell/misc/config.js';
const ShellVersion = parseFloat(Config.PACKAGE_VERSION);

import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
const QuickSettingsMenu = Main.panel.statusArea.quickSettings;


import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';


const DisplayMode = {
  QuickToggles: 0,
  QuickGroup: 1,
  Indicators: 2
};


const PrivacySettingImageSwitchItem = GObject.registerClass(
  class PrivacySettingImageSwitchItem extends PopupMenu.PopupSwitchMenuItem {
    _init(text, icon, active) {
      super._init(text, active, {});

      this._icon = new St.Icon({
        style_class: 'popup-menu-icon',
      });

      this.insert_child_below(this._icon, this.label);
      this._icon.icon_name = icon;
    }
  }
);

const PrivacyIndicator = GObject.registerClass(
  class PrivacyIndicator extends PanelMenu.Button{
    _init() {
      super._init(0.0, _('Privacy Settings Menu Indicator'));


      this.add_child(new St.Icon({
        gicon: Gio.ThemedIcon.new('preferences-system-privacy-symbolic'),
        style_class: 'system-status-icon'
      }));


      this._privacySettings = new Gio.Settings({schema: 'org.gnome.desktop.privacy'});
      this._locationSettings = new Gio.Settings({schema: 'org.gnome.system.location'});
    }

    _resetSettings() {
      let privacySettings = new Gio.Settings({schema: 'org.gnome.desktop.privacy'});
      let locationSettings = new Gio.Settings({schema: 'org.gnome.system.location'});


      locationSettings.reset('enabled');
      privacySettings.reset('disable-camera');
      privacySettings.reset('disable-microphone');
    }

    addEntries() {
      this.menu.addMenuItem(new PopupMenu.PopupMenuItem(
        _('Privacy Settings'),
        {reactive: false}
      ));
      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      let toggleItems = [
        new PrivacySettingImageSwitchItem(_('Location'), 'location-services-active-symbolic', true),
        new PrivacySettingImageSwitchItem(_('Camera'), 'camera-photo-symbolic', true),
        new PrivacySettingImageSwitchItem(_('Microphone'), 'audio-input-microphone-symbolic', true)
      ];

      let gsettingsSchemas = [

        [this._locationSettings, 'enabled', Gio.SettingsBindFlags.DEFAULT],
        [this._privacySettings, 'disable-camera', Gio.SettingsBindFlags.INVERT_BOOLEAN],
        [this._privacySettings, 'disable-microphone', Gio.SettingsBindFlags.INVERT_BOOLEAN]
      ];


      toggleItems.forEach((toggleItem, i) => {
        gsettingsSchemas[i][0].bind(
          gsettingsSchemas[i][1],
          toggleItem._switch,
          'state',
          gsettingsSchemas[i][2]
        );


        this.menu.addMenuItem(toggleItem);
      });


      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());


      let subMenu = new PopupMenu.PopupSubMenuMenuItem(_('Reset settings'), true);
      subMenu.icon.icon_name = 'edit-delete-symbolic';
      subMenu.menu.addAction(_('Reset to defaults'), this._resetSettings, null);

      this.menu.addMenuItem(subMenu);
    }
  }
);


const PrivacyQuickToggle = GObject.registerClass(
  class PrivacyQuickToggle extends QuickSettings.QuickToggle {
    _init(settingName, settingIcon, settingSchema, settingKey, settingBindFlag) {

      super._init({
        title: settingName,
        iconName: settingIcon,
        toggleMode: true,
      });


      this._settings = new Gio.Settings({schema: settingSchema});


      this._settings.bind(
        settingKey,
        this,
        'checked',
        settingBindFlag
      );
    }
  }
);


const PrivacyQuickGroup = GObject.registerClass(
  class PrivacyQuickGroup extends QuickSettings.QuickMenuToggle {
    _init(extension, useQuickSubtitle, clickToToggle) {

      super._init({
        title: _('Privacy'),
        iconName: 'preferences-system-privacy-symbolic',
        toggleMode: false,
      });


      this.menu.setHeader('preferences-system-privacy-symbolic', _('Privacy Settings'));


      this.connect('clicked', () => {
        if (clickToToggle) {

          let targetState = this.checked;
          this._settingsInfo.forEach((settingInfo) => {
            let newState = targetState ^ (settingInfo[2] == Gio.SettingsBindFlags.INVERT_BOOLEAN);
            settingInfo[0].set_boolean(settingInfo[1], newState);
          });
        } else {
          this.menu.open();
        }
      });


      this._privacySettings = new Gio.Settings({schema: 'org.gnome.desktop.privacy'});
      this._locationSettings = new Gio.Settings({schema: 'org.gnome.system.location'});

      this._toggleDisplayInfo = [

        [_('Location'), 'location-services-active-symbolic'],
        [_('Camera'), 'camera-photo-symbolic'],
        [_('Microphone'), 'audio-input-microphone-symbolic']
      ];

      this._settingsInfo = [

        [this._locationSettings, 'enabled', Gio.SettingsBindFlags.DEFAULT],
        [this._privacySettings, 'disable-camera', Gio.SettingsBindFlags.INVERT_BOOLEAN],
        [this._privacySettings, 'disable-microphone', Gio.SettingsBindFlags.INVERT_BOOLEAN]
      ];

      this._toggleItems = [];


      this._toggleDisplayInfo.forEach((displayInfo, i) => {
        this._toggleItems.push(
          new PrivacySettingImageSwitchItem(displayInfo[0], displayInfo[1], true)
        );


        let event = 'changed::' + this._settingsInfo[i][1];
        this._settingsInfo[i][0].connectObject(event, () => {
          this._updateSubtitle(); this._updateVisualState();
        }, this);


        this._settingsInfo[i][0].bind(
          this._settingsInfo[i][1],
          this._toggleItems[i]._switch,
          'state',
          this._settingsInfo[i][2]
        );


        this.menu.addMenuItem(this._toggleItems[i]);
      });


      this._useQuickSubtitle = useQuickSubtitle;
      this._updateSubtitle();


      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
      let settingsItem = this.menu.addAction(_('Extension Settings'), () => {
        extension.openPreferences();
        if (ShellVersion >= 51) {
          QuickSettingsMenu.menu.close({fadeOnly: true});
        } else {
          QuickSettingsMenu.menu.close(PopupAnimation.FADE);
        }
      });


      settingsItem.visible = Main.sessionMode.allowSettings;
      this.menu._settingsActions[extension.uuid] = settingsItem;


      this._updateVisualState();
    }

    _updateVisualState() {

      let enableToggle = true;
      this._settingsInfo.forEach((settingInfo) => {
        let settingEnabled = settingInfo[0].get_boolean(settingInfo[1]);
        if (settingEnabled == (settingInfo[2] != Gio.SettingsBindFlags.INVERT_BOOLEAN)) {
          enableToggle = false;
        }
      });


      this.checked = enableToggle;
    }

    _updateSubtitle() {

      if (!this._useQuickSubtitle) {
        return;
      }


      let enabledSettingsCount = 0;
      let enabledSettingName = '';
      this._settingsInfo.forEach((settingInfo, i) => {
        let settingEnabled = settingInfo[0].get_boolean(settingInfo[1]);
        if (settingEnabled == (settingInfo[2] != Gio.SettingsBindFlags.INVERT_BOOLEAN)) {
          enabledSettingsCount += 1;
          enabledSettingName = this._toggleDisplayInfo[i][0];
        }
      });

      if (enabledSettingsCount == 0) {

        this.subtitle = _('Private');
      } else if (enabledSettingsCount == 1) {

        this.subtitle = enabledSettingName;
      } else {


        this.subtitle = enabledSettingsCount + _(' allowed');
      }
    }

    clean() {

      this._settingsInfo.forEach((settingInfo) => {
        settingInfo[0].disconnectObject(this);
      });
    }
  }
);

class QuickSettingsManager {
  constructor() {
    this._quickSettingToggles = [];


    let quickSettingsInfo = [
      [_('Location'), 'location-services-active-symbolic', 'org.gnome.system.location', 'enabled', Gio.SettingsBindFlags.DEFAULT],
      [_('Camera'), 'camera-photo-symbolic', 'org.gnome.desktop.privacy', 'disable-camera', Gio.SettingsBindFlags.INVERT_BOOLEAN],
      [_('Microphone'), 'audio-input-microphone-symbolic', 'org.gnome.desktop.privacy', 'disable-microphone', Gio.SettingsBindFlags.INVERT_BOOLEAN]
    ];


    quickSettingsInfo.forEach((quickSettingInfo, i) => {
      this._quickSettingToggles.push(
        new PrivacyQuickToggle(
          quickSettingInfo[0], quickSettingInfo[1],
          quickSettingInfo[2], quickSettingInfo[3],
          quickSettingInfo[4]
        )
      );


      let backgroundApps = QuickSettingsMenu._backgroundApps?.quickSettingsItems?.at(-1) ?? null;
      QuickSettingsMenu.menu.insertItemBefore(this._quickSettingToggles[i], backgroundApps);
    });
  }

  clean() {

    this._quickSettingToggles.forEach((quickSettingToggle) => {
      quickSettingToggle.destroy();
     });


    this._quickSettingToggles = [];
  }
}

class QuickGroupManager {
  constructor(extension, useQuickSubtitle, clickToToggle) {

    this._quickSettingsGroup = new PrivacyQuickGroup(extension, useQuickSubtitle, clickToToggle);
    let backgroundApps = QuickSettingsMenu._backgroundApps?.quickSettingsItems?.at(-1) ?? null;
    QuickSettingsMenu.menu.insertItemBefore(this._quickSettingsGroup, backgroundApps);
  }

  clean() {
    this._quickSettingsGroup.clean();
    this._quickSettingsGroup.destroy();
    this._quickSettingsGroup = null;
  }
}

class IndicatorSettingsManager {
  constructor(forceIconRight) {

    this._indicator = new PrivacyIndicator();


    this._indicator.addEntries();


    let offset = 0;
    if (forceIconRight) {
      offset = Main.panel._rightBox.get_n_children() - 1;
    }


    Main.panel.addToStatusArea('privacy-menu', this._indicator, offset);
  }

  clean() {

    this._indicator.remove_all_children();
    this._indicator.destroy();
    this._inidcator = null;
  }
}

export default class PrivacyQuickSettingsManager extends Extension {
  enable() {

    this._privacyMenu = new PrivacyExtension(this);


    this._privacyMenu.initMenu();
  }

  disable() {

    this._privacyMenu.disconnectListeners();
    this._privacyMenu.destroyMenu();
    this._privacyMenu = null;
  }
}

class PrivacyExtension {
  constructor(extension) {
    this._privacyManager = null;
    this._extension = extension;
    this._extensionSettings = this._extension.getSettings();
  }

  disconnectListeners() {
    this._extensionSettings.disconnectObject(this);
  }

  _decideMenuType() {





    if (this._extensionSettings.get_boolean('use-quick-settings')) {
      if (this._extensionSettings.get_boolean('group-quick-settings')) {
        return DisplayMode.QuickGroup;
      }
      return DisplayMode.QuickToggles;
    }

    return DisplayMode.Indicator;
  }

  initMenu() {

    this._createMenu();


    this._extensionSettings.connectObject('changed', () => {

      this.destroyMenu();
      this._createMenu();
    }, this);
  }

  _createMenu() {

    switch (this._decideMenuType()) {
      case DisplayMode.QuickToggles:
        this._privacyManager = new QuickSettingsManager();
        break;
      case DisplayMode.QuickGroup:
        let useQuickSubtitle = this._extensionSettings.get_boolean('use-quick-subtitle');
        let clickToToggle = this._extensionSettings.get_boolean('click-to-toggle');
        this._privacyManager = new QuickGroupManager(this._extension, useQuickSubtitle, clickToToggle);
        break;
      case DisplayMode.Indicator:
        let forceIconRight = this._extensionSettings.get_boolean('move-icon-right');
        this._privacyManager = new IndicatorSettingsManager(forceIconRight);
        break;
    }
  }

  destroyMenu() {

    if (this._privacyManager != null) {
      this._privacyManager.clean();
      this._privacyManager = null;
    }
  }
}
