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

import Meta from 'gi://Meta';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Util from 'resource:///org/gnome/shell/misc/util.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {ControlsState} from 'resource:///org/gnome/shell/ui/overviewControls.js';
import {Workspace} from 'resource:///org/gnome/shell/ui/workspace.js';
















const State = {
  INACTIVE: 0,
  PENDING: 1,
  ACTIVE: 2
};


export var DragGesture =
  GObject.registerClass({
      Properties: {
        'distance': GObject.ParamSpec.double(
          'distance', 'distance', 'distance', GObject.ParamFlags.READWRITE, 0, Infinity, 0),
        'pitch': GObject.ParamSpec.double(
          'pitch', 'pitch', 'pitch', GObject.ParamFlags.READWRITE, 0, 1, 0),
        'sensitivity': GObject.ParamSpec.double(
          'sensitivity', 'sensitivity', 'sensitivity', GObject.ParamFlags.READWRITE, 1, 10, 1),
      },
      Signals: {
        'begin':  {param_types: [GObject.TYPE_UINT, GObject.TYPE_DOUBLE, GObject.TYPE_DOUBLE]},
        'update': {param_types: [GObject.TYPE_UINT, GObject.TYPE_DOUBLE, GObject.TYPE_DOUBLE]},
        'end':    {param_types: [GObject.TYPE_UINT, GObject.TYPE_DOUBLE]},
      },
    },
    class DragGesture extends GObject.Object {

  _init(actor, mode) {
    super._init();

    this._actor = actor;
    this._state = State.INACTIVE;
    this._mode  = mode;






    this._actorConnection1 = actor.connect('captured-event', (a, e) => {
      return this._handleEvent(e);
    });



    this._actorConnection2 = actor.connect('event', (a, e) => {
      if (this._lastGrab) {
        return this._handleEvent(e);
      }
      return Clutter.EVENT_PROPAGATE;
    });
  }


  destroy() {
    this._actor.disconnect(this._actorConnection1);
    this._actor.disconnect(this._actorConnection2);
  }


  _handleEvent(event) {



    if (this._mode != Main.actionMode) {
      return Clutter.EVENT_PROPAGATE;
    }



    if (Main.actionMode == Shell.ActionMode.OVERVIEW) {
      if (Main.overview._overview.controls._stateAdjustment.value !=
          ControlsState.WINDOW_PICKER) {
        return Clutter.EVENT_PROPAGATE;
      }
    }


    if (Meta.is_wayland_compositor && !Meta.is_wayland_compositor() &&
        (event.type() == Clutter.EventType.TOUCH_BEGIN ||
         event.type() == Clutter.EventType.TOUCH_UPDATE ||
         event.type() == Clutter.EventType.TOUCH_END)) {
      return Clutter.EVENT_PROPAGATE;
    }




    if (event.type() == Clutter.EventType.BUTTON_PRESS ||
        event.type() == Clutter.EventType.TOUCH_BEGIN) {

      const source = global.stage.get_event_actor(event);

      if (source) {






        if (Main.actionMode != Shell.ActionMode.OVERVIEW || source == this._actor ||
            source.get_parent() instanceof Workspace) {
          this._clickPos = event.get_coords();
          this._state    = State.PENDING;
        }
      }

      return Clutter.EVENT_PROPAGATE;
    }


    if (event.type() == Clutter.EventType.LEAVE && this._state == State.PENDING) {
      this._cancel();
      return Clutter.EVENT_PROPAGATE;
    }


    if (this._eventIsMotion(event)) {


      if (this._state != State.INACTIVE && event.type() == Clutter.EventType.MOTION &&
          (event.get_state() & Clutter.ModifierType.BUTTON1_MASK) == 0) {

        this._cancel();
        return Clutter.EVENT_PROPAGATE;
      }

      const currentPos = event.get_coords();



      if (this._state == State.PENDING) {



        const threshold = St.Settings.get().drag_threshold;

        if (Math.abs(currentPos[0] - this._clickPos[0]) > threshold ||
            Math.abs(currentPos[1] - this._clickPos[1]) > threshold) {




          if (Main.actionMode == Shell.ActionMode.NORMAL) {
            if (!this._grab()) {
              return Clutter.EVENT_PROPAGATE;
            }
          }

          this._state                 = State.ACTIVE;
          [this._lastX, this._startY] = currentPos;
          this.pitch                  = 0;
          this.emit('begin', event.get_time(), currentPos[0], currentPos[1]);
        }



        return Clutter.EVENT_PROPAGATE;
      }


      if (this._state == State.ACTIVE) {


        let deltaX  = currentPos[0] - this._lastX;
        this._lastX = currentPos[0];


        this.pitch = (this._startY - currentPos[1]) / global.screen_height;


        deltaX *= this.sensitivity;


        deltaX *= Util.lerp(1.0, global.workspaceManager.get_n_workspaces(),
                            Math.abs(this.pitch));

        this.emit('update', event.get_time(), -deltaX, this.distance);

        return Clutter.EVENT_STOP;
      }

      return Clutter.EVENT_PROPAGATE;
    }



    if (this._eventIsRelease(event)) {


      if (this._state == State.ACTIVE) {

        this._cancel();

        this.emit('end', event.get_time(), this.distance);

        return Clutter.EVENT_STOP;
      }


      this._cancel();

      return Clutter.EVENT_PROPAGATE;
    }

    return Clutter.EVENT_PROPAGATE;
  }


  _cancel() {
    if (this._lastGrab) {
      this._ungrab();
    }

    this._state = State.INACTIVE;
  }




  _grab() {
    this._lastGrab = global.stage.grab(this._actor);
    return this._lastGrab != null;
  }


  _ungrab() {
    this._lastGrab.dismiss();
    this._lastGrab = null;
  }



  _eventIsRelease(event) {
    if (event.type() == Clutter.EventType.BUTTON_RELEASE) {
      const buttonMask = Clutter.ModifierType.BUTTON1_MASK |
        Clutter.ModifierType.BUTTON2_MASK | Clutter.ModifierType.BUTTON3_MASK;


      return (event.get_state() & buttonMask) == 0;
    } else if (event.type() == Clutter.EventType.TOUCH_END) {


      if (typeof (global.display.is_pointer_emulating_sequence) === 'function') {
        return global.display.is_pointer_emulating_sequence(event.get_event_sequence());
      }

      return true;
    }

    return false;
  }



  _eventIsMotion(event) {
    if (event.type() == Clutter.EventType.MOTION) {
      return true;
    }

    if (event.type() == Clutter.EventType.TOUCH_UPDATE) {

      if (typeof (global.display.is_pointer_emulating_sequence) === 'function') {
        return global.display.is_pointer_emulating_sequence(event.get_event_sequence());
      }

      return true;
    }

    return false;
  }
});
