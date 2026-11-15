//////////////////////////////////////////////////////////////////////////////////////////
//             ,-.  ,--.  ,-.  ,  , ,---.  ,-.  ;-.     ,-. .  . ,-.  ,--.              //
//             |  \ |    (   ` | /    |   /   \ |  )   /    |  | |  ) |                 //
//             |  | |-    `-.  |<     |   |   | |-'    |    |  | |-<  |-                //
//             |  / |    .   ) | \    |   \   / |      \    |  | |  ) |                 //
//             `-'  `--'  `-'  '  `   '    `-'  '       `-' `--` `-'  `--'              //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: GPL-3.0-or-later

'use strict';

import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import Adw from 'gi://Adw';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import {registerImageChooserButton} from './src/ImageChooserButton.js';






export default class DesktopCubePreferences extends ExtensionPreferences {






  fillPreferencesWindow(window) {

    this._resources = Gio.Resource.load(this.path + '/resources/desktop-cube.gresource');
    Gio.resources_register(this._resources);


    registerImageChooserButton();


    this._builder = new Gtk.Builder();
    this._builder.add_from_resource(`/ui/settings.ui`);


    Gtk.IconTheme.get_for_display(Gdk.Display.get_default()).add_resource_path('/img');


    this._pages = [
      this._builder.get_object('general-page'), this._builder.get_object('desktop-page'),
      this._builder.get_object('overview-page')
    ];


    this._settings = this.getSettings();


    this._bindAdjustment('workpace-separation');
    this._bindAdjustment('horizontal-stretch');
    this._bindAdjustment('window-parallax');
    this._bindImageChooserButton('background-panorama');
    this._bindSwitch('last-first-gap');
    this._bindSwitch('enable-desktop-dragging');
    this._bindSwitch('enable-panel-dragging');
    this._bindSwitch('enable-desktop-edge-switch');
    this._bindSwitch('enable-overview-edge-switch');
    this._bindSwitch('enable-overview-dragging');
    this._bindSwitch('do-explode');
    this._bindSwitch('per-monitor-perspective');
    this._bindAdjustment('active-workpace-opacity');
    this._bindAdjustment('inactive-workpace-opacity');
    this._bindAdjustment('edge-switch-pressure');
    this._bindAdjustment('mouse-rotation-speed');


    const label    = this._builder.get_object('central-perspective-row');
    label.subtitle = label.subtitle.replace(
      '%s', '<a href="https://youtu.be/dpYyn1BXGjU">https://youtu.be/dpYyn1BXGjU</a>');


    this._pages[0].connect('realize', (widget) => {
      const window = widget.get_root();


      const menu   = this._builder.get_object('menu-button');
      const header = this._findWidgetByType(window.get_content(), Adw.HeaderBar);
      header.pack_start(menu);


      const group = Gio.SimpleActionGroup.new();

      const addAction = (name, uri) => {
        const action = Gio.SimpleAction.new(name, null);
        action.connect('activate', () => Gtk.show_uri(null, uri, Gdk.CURRENT_TIME));
        group.add_action(action);
      };


      addAction('homepage',      'https://github.com/Schneegans/Desktop-Cube');
      addAction('changelog',     'https://github.com/Schneegans/Desktop-Cube/blob/main/docs/changelog.md');
      addAction('translate',     'https://hosted.weblate.org/engage/desktop-cube/');
      addAction('bugs',          'https://github.com/Schneegans/Desktop-Cube/issues');
      addAction('donate-kofi',   'https://ko-fi.com/schneegans');
      addAction('donate-github', 'https://github.com/sponsors/Schneegans');
      addAction('donate-paypal', 'https://www.paypal.me/simonschneegans');
      addAction('show-sponsors', 'https://schneegans.github.io/sponsors');



      const aboutAction = Gio.SimpleAction.new('about', null);
      aboutAction.connect('activate', () => {


        const translators = new Set();
        this._getJSONResource('/credits/translators.json').forEach(i => {
          for (const j of Object.values(i)) {
            j.forEach(k => translators.add(k[1]));
          }
        });

        const dialog = new Adw.AboutWindow({transient_for: window, modal: true});
        dialog.set_application_icon('desktop-cube-symbolic');
        dialog.set_application_name(this.metadata.name);
        dialog.set_version(`${this.metadata.version}`);
        dialog.set_developer_name('Simon Schneegans');
        dialog.set_issue_url('https://github.com/Schneegans/Desktop-Cube/issues');
        dialog.set_translator_credits([...translators].join('\n'));
        dialog.set_copyright('© 2023 Simon Schneegans');
        dialog.set_website('https://github.com/Schneegans/Desktop-Cube');
        dialog.set_license_type(Gtk.License.GPL_3_0);

        dialog.show();
      });
      group.add_action(aboutAction);

      window.insert_action_group('prefs', group);
    });

    window.set_search_enabled(true);

    this._pages.forEach(page => {
      window.add(page);
    });



    window.connect('close-request', () => {

      Gio.resources_unregister(this._resources);
      this._resources = null;
    });
  }






  _bindImageChooserButton(settingsKey) {
    this._bind(settingsKey, 'file');
  }



  _bindAdjustment(settingsKey) {
    this._bind(settingsKey, 'value');
  }



  _bindSwitch(settingsKey) {
    this._bind(settingsKey, 'active');
  }



  _bind(settingsKey, property) {
    this._settings.bind(settingsKey, this._builder.get_object(settingsKey), property,
                        Gio.SettingsBindFlags.DEFAULT);

    const resetButton = this._builder.get_object('reset-' + settingsKey);
    resetButton.connect('clicked', () => {
      this._settings.reset(settingsKey);
    });
  }



  _getJSONResource(path) {
    const data   = Gio.resources_lookup_data(path, 0);
    const string = new TextDecoder().decode(data.get_data());
    return JSON.parse(string);
  }



  _findWidgetByType(parent, type) {
    for (const child of [...parent]) {
      if (child instanceof type) return child;

      const match = this._findWidgetByType(child, type);
      if (match) return match;
    }

    return null;
  }
}
