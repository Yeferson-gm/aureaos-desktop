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
import Meta from 'gi://Meta';
import Clutter from 'gi://Clutter';
import Graphene from 'gi://Graphene';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Util from 'resource:///org/gnome/shell/misc/util.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Config from 'resource:///org/gnome/shell/misc/config.js';
import {PressureBarrier} from 'resource:///org/gnome/shell/ui/layout.js';
import {WorkspacesView, FitMode} from 'resource:///org/gnome/shell/ui/workspacesView.js';
import {SwipeTracker} from 'resource:///org/gnome/shell/ui/swipeTracker.js';
import {WorkspaceAnimationController} from 'resource:///org/gnome/shell/ui/workspaceAnimation.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import * as utils from './src/utils.js';
import {DragGesture} from './src/DragGesture.js';
import {Skybox} from './src/Skybox.js';






const [GS_VERSION] = Config.PACKAGE_VERSION.split('.').map(s => Number(s));


const MAX_VERTICAL_ROTATION = 50;


const PADDING_V_ROTATION = 0.2;

export default class DesktopCube extends Extension {
  _lastWorkspaceWidth = 0;





  enable() {


    this._settings = this.getSettings();


    this._origEndGesture            = SwipeTracker.prototype._endGesture;
    this._origUpdateWorkspacesState = WorkspacesView.prototype._updateWorkspacesState;
    this._origGetSpacing            = WorkspacesView.prototype._getSpacing;
    this._origUpdateVisibility      = WorkspacesView.prototype._updateVisibility;
    this._origPrepSwitch = WorkspaceAnimationController.prototype._prepareWorkspaceSwitch;
    this._origFinalSwitch = WorkspaceAnimationController.prototype._finishWorkspaceSwitch;


    const extensionThis = this;








    WorkspacesView.prototype._updateVisibility = function() {
      this._workspaces.forEach((w) => {
        w.show();
      });
    };










    WorkspacesView.prototype._getSpacing = function(box, fitMode, vertical) {

      const origValue =
        extensionThis._origGetSpacing.apply(this, [box, fitMode, vertical]);

      if (fitMode == FitMode.ALL) {
        return origValue;
      }


      const overlapValue = -this._workspaces[0].get_preferred_width(box.get_size()[1])[1];


      const cubeMode = extensionThis._getCubeMode(this);
      return Util.lerp(origValue, overlapValue, cubeMode);
    };




    WorkspacesView.prototype._updateWorkspacesState = function() {

      const faceCount = this._workspaces.length;
      if (faceCount <= 1) {
        extensionThis._origUpdateWorkspacesState.apply(this);
        return;
      }










      if ((new Error()).stack.includes('fitModeNotify')) {
        return;
      }





      const appDrawerMode = extensionThis._getAppDrawerMode(this);
      const overviewMode  = extensionThis._getOverviewMode(this);
      const cubeMode      = extensionThis._getCubeMode(this);






      let workspaceWidth = extensionThis._lastWorkspaceWidth;
      const bg           = this._workspaces[0]._background;
      if (bg.get_stage() && bg.allocation.get_width() > 0) {
        workspaceWidth = bg.allocation.get_width();


        workspaceWidth +=
          overviewMode * 2 * extensionThis._settings.get_int('workpace-separation');

        extensionThis._lastWorkspaceWidth = workspaceWidth;
      }


      const faceAngle = extensionThis._getFaceAngle(faceCount);


      const centerDepth = extensionThis._getCenterDist(workspaceWidth, faceAngle);



      this.pivot_point_z = -centerDepth;
      this.set_pivot_point(0.5, 0.5);
      this.rotation_angle_x = extensionThis._pitch.value * MAX_VERTICAL_ROTATION;






      const [depthOffset, explode] = extensionThis._getExplodeFactors(
        this._scrollAdjustment.value, extensionThis._pitch.value, centerDepth,
        this._monitorIndex);


      this._workspaces.forEach((w, index) => {

        w.stateAdjustment.value = overviewMode;



        w.pivot_point_z = -centerDepth;


        w.translation_z = -depthOffset;



        w.rotation_angle_y =
          Math.pow(cubeMode, 1.5) * (-this._scrollAdjustment.value + index) * faceAngle;


        const dist = Math.clamp(index - this._scrollAdjustment.value, -1, 1);




        if (faceCount <= 4) {
          w.translation_x =
            dist * overviewMode * extensionThis._settings.get_int('horizontal-stretch');
        } else {
          w.translation_x = 0;
        }


        const opacityA = extensionThis._settings.get_int('active-workpace-opacity');
        const opacityB = extensionThis._settings.get_int('inactive-workpace-opacity');
        const opacity  = Util.lerp(opacityA, opacityB, Math.abs(dist));
        w._background.set_opacity(Util.lerp(255, opacity, overviewMode));






        const scale = Util.lerp(1, 0.94, Math.abs(dist) * appDrawerMode);
        w.set_scale(scale, scale);



        if (explode > 0.001) {

          const sortedActors = w._container.layout_manager._sortedWindows;



          sortedActors.forEach((windowActor, j) => {
            windowActor.translation_z = explode * (j + 1) / sortedActors.length;
          });




          if (sortedActors.length > 1) {
            extensionThis._depthSortWindowActors(w._container.get_children(),
                                                 this._monitorIndex);
          }
        }





        w._container.translation_z = 1;
        extensionThis._depthSortWindowActors(w.get_children(), this._monitorIndex);
      });



      extensionThis._depthSortCubeFaces(this._workspaces);
    };














    const updateMonitorGroup = (group) => {



      group._container.translation_x = -group._container.x;


      const faceAngle = extensionThis._getFaceAngle(group._workspaceGroups.length);


      const centerDepth =
        extensionThis._getCenterDist(group._workspaceGroups[0].width, faceAngle);



      group._container.pivot_point_z = -centerDepth;
      group._container.set_pivot_point(0.5, 0.5);
      group._container.rotation_angle_x =
        extensionThis._pitch.value * MAX_VERTICAL_ROTATION;






      const [depthOffset, explode] = extensionThis._getExplodeFactors(
        group.progress, extensionThis._pitch.value, centerDepth, group._monitor.index);


      group._workspaceGroups.forEach((child, i) => {
        child.set_pivot_point_z(-centerDepth);
        child.set_pivot_point(0.5, 0.5);
        child.rotation_angle_y   = (i - group.progress) * faceAngle;
        child.translation_z      = -depthOffset;
        child.clip_to_allocation = false;


        child.translation_x = -child.x;


        child._background.opacity = 255 * (1.0 - Math.abs(extensionThis._pitch.value));




        if (explode > 0.001) {
          const windowActors = global.get_window_actors().filter(w => {
            return child._shouldShowWindow(w.meta_window);
          });



          windowActors.forEach((windowActor, j) => {
            const record = child._windowRecords.find(r => r.windowActor === windowActor);
            if (record) {
              record.clone.translation_z = explode * (j + 1) / windowActors.length;
            }
          });




          extensionThis._depthSortWindowActors(child.get_children(),
                                               group._monitor.index);
        }
      });



      extensionThis._depthSortCubeFaces(group._workspaceGroups);


      if (this._skybox) {
        this._skybox.yaw =
          2 * Math.PI * group.progress / global.workspaceManager.get_n_workspaces();
      }
    };






    WorkspaceAnimationController.prototype._prepareWorkspaceSwitch = function() {





      extensionThis._origPrepSwitch.apply(this, []);


      this._switchData.monitors.forEach(m => {

        m._desktopCubeProgressID =
          m.connect('notify::progress', () => updateMonitorGroup(m));


        const orig              = m.updateSwipeForMonitor;
        m.updateSwipeForMonitor = function(progress, baseMonitorGroup) {
          orig.apply(m, [progress, baseMonitorGroup]);
          updateMonitorGroup(m);
        };
      });



      if (extensionThis._skybox) {
        extensionThis._skybox.get_parent().remove_child(extensionThis._skybox);
        Main.uiGroup.insert_child_above(extensionThis._skybox, global.window_group);




        if (Meta.prefs_get_workspaces_only_on_primary()) {
          const monitor =
            global.display.get_monitor_geometry(global.display.get_primary_monitor());
          extensionThis._skybox.width  = monitor.width;
          extensionThis._skybox.height = monitor.height;
          extensionThis._skybox.x      = monitor.x;
          extensionThis._skybox.y      = monitor.y;
        }
      }
    };


    WorkspaceAnimationController.prototype._finishWorkspaceSwitch = function(...params) {
      this._switchData.monitors.forEach(m => {
        if (m._desktopCubeProgressID) {
          m.disconnect(m._desktopCubeProgressID);
          delete m._desktopCubeProgressID;
        }
      });

      extensionThis._origFinalSwitch.apply(this, params);


      if (extensionThis._skybox) {
        extensionThis._skybox.get_parent().remove_child(extensionThis._skybox);
        global.stage.insert_child_below(extensionThis._skybox, null);

        if (Meta.prefs_get_workspaces_only_on_primary()) {
          extensionThis._skybox.width  = global.stage.width;
          extensionThis._skybox.height = global.stage.height;
          extensionThis._skybox.x      = global.stage.x;
          extensionThis._skybox.y      = global.stage.y;
        }
      }
    };









    this._pitch = new St.Adjustment({actor: global.stage, lower: -1, upper: 1});







    this._pitch.connect('notify::value', () => {
      if (Main.actionMode == Shell.ActionMode.OVERVIEW) {
        Main.overview._overview._controls._workspacesDisplay._overviewAdjustment.notify(
          'value');
      }
    });














    SwipeTracker.prototype._endGesture = function(time, distance, isTouchpad) {

      this._history.append(time, 0);


      extensionThis._origEndGesture.apply(this, [time, distance, isTouchpad]);
    };


    if (this._settings.get_boolean('enable-desktop-dragging')) {
      this._addDesktopDragGesture();
    }

    this._settings.connect('changed::enable-desktop-dragging', () => {
      if (this._settings.get_boolean('enable-desktop-dragging')) {
        this._addDesktopDragGesture();
      } else {
        this._removeDesktopDragGesture();
      }
    });


    if (this._settings.get_boolean('enable-panel-dragging')) {
      this._addPanelDragGesture();
    }

    this._settings.connect('changed::enable-panel-dragging', () => {
      if (this._settings.get_boolean('enable-panel-dragging')) {
        this._addPanelDragGesture();
      } else {
        this._removePanelDragGesture();
      }
    });


    if (this._settings.get_boolean('enable-overview-dragging')) {
      this._addOverviewDragGesture();
    }

    this._settings.connect('changed::enable-overview-dragging', () => {
      if (this._settings.get_boolean('enable-overview-dragging')) {
        this._addOverviewDragGesture();
      } else {
        this._removeOverviewDragGesture();
      }
    });







    const updateSkybox = () => {

      if (this._skybox) {
        this._skybox.destroy();
        delete this._skybox;
      }

      const file = this._settings.get_string('background-panorama');


      if (file != '') {
        try {
          this._skybox = new Skybox(file);


          global.stage.insert_child_below(this._skybox, null);


          global.stage.bind_property('width', this._skybox, 'width',
                                     GObject.BindingFlags.SYNC_CREATE);
          global.stage.bind_property('height', this._skybox, 'height',
                                     GObject.BindingFlags.SYNC_CREATE);

        } catch (error) {
          utils.debug('Failed to set skybox: ' + error);
        }
      }
    };


    this._settings.connect('changed::background-panorama', updateSkybox);
    updateSkybox();


    this._pitch.connect('notify::value', () => {
      if (this._skybox) {
        this._skybox.pitch = (this._pitch.value * MAX_VERTICAL_ROTATION) * Math.PI / 180;
      }
    });



    this._workspaceAdjustmentID =
      Main.overview._overview.controls._workspaceAdjustment.connect(
        'notify::value', () => {
          if (this._skybox) {
            this._skybox.yaw = 2 * Math.PI *
              Main.overview._overview.controls._workspaceAdjustment.value /
              global.workspaceManager.get_n_workspaces();
          }
        });

















    this._pressureBarrier =
      new PressureBarrier(this._settings.get_int('edge-switch-pressure'), 1000, 0);


    this._settings.connect('changed::edge-switch-pressure', () => {
      this._pressureBarrier._threshold = this._settings.get_int('edge-switch-pressure');
    });




    this._pressureBarrier._onBarrierHit = function(barrier, event) {
      barrier._isHit = true;



      if (this._isTriggered) return;

      if (this._eventFilter && this._eventFilter(event)) return;




      let slide    = this._getDistanceAlongBarrier(barrier, event);
      let distance = this._getDistanceAcrossBarrier(barrier, event);

      if (distance >= this._threshold) {
        this._trigger();
        return;
      }




      if (slide > distance) return;

      this._lastTime = event.time;

      this._trimBarrierEvents();
      distance = Math.min(15, distance);

      this._barrierEvents.push([event.time, distance]);
      this._currentPressure += distance;

      if (this._currentPressure >= this._threshold) this._trigger();
    };


    const createBarriers = () => {
      if (this._leftBarrier) {
        this._pressureBarrier.removeBarrier(this._leftBarrier);
        this._leftBarrier.destroy();
      }

      if (this._rightBarrier) {
        this._pressureBarrier.removeBarrier(this._rightBarrier);
        this._rightBarrier.destroy();
      }


      if (GS_VERSION <= 45) {
        this._leftBarrier = new Meta.Barrier({
          display: global.display,
          x1: 0,
          x2: 0,
          y1: 1,
          y2: global.stage.height,
          directions: Meta.BarrierDirection.POSITIVE_X,
        });

        this._rightBarrier = new Meta.Barrier({
          display: global.display,
          x1: global.stage.width,
          x2: global.stage.width,
          y1: 1,
          y2: global.stage.height,
          directions: Meta.BarrierDirection.NEGATIVE_X,
        });
      } else {
        this._leftBarrier = new Meta.Barrier({
          backend: global.backend,
          x1: 0,
          x2: 0,
          y1: 1,
          y2: global.stage.height,
          directions: Meta.BarrierDirection.POSITIVE_X,
        });

        this._rightBarrier = new Meta.Barrier({
          backend: global.backend,
          x1: global.stage.width,
          x2: global.stage.width,
          y1: 1,
          y2: global.stage.height,
          directions: Meta.BarrierDirection.NEGATIVE_X,
        });
      }

      this._pressureBarrier.addBarrier(this._leftBarrier);
      this._pressureBarrier.addBarrier(this._rightBarrier);
    };


    this._stageAllocationID = global.stage.connect('notify::allocation', createBarriers);
    createBarriers();




    this._pressureBarrier.connect('trigger', () => {
      const direction =
        this._leftBarrier._isHit ? Meta.MotionDirection.LEFT : Meta.MotionDirection.RIGHT;

      const newWorkspace =
        global.workspace_manager.get_active_workspace().get_neighbor(direction);

      if (Main.actionMode == Shell.ActionMode.NORMAL && this._draggedWindow &&
          this._settings.get_boolean('enable-desktop-edge-switch')) {
        Main.wm.actionMoveWindow(this._draggedWindow, newWorkspace);
      } else if (Main.actionMode == Shell.ActionMode.NONE && Main.overview.visible &&
                 this._settings.get_boolean('enable-overview-edge-switch')) {
        newWorkspace.activate(global.get_current_time());
      }
    });


    this._grabOpBeginID = global.display.connect('grab-op-begin', (d, win, op) => {
      if (op == Meta.GrabOp.MOVING) {
        this._draggedWindow = win;
      }
    });


    this._grabOpEndID = global.display.connect('grab-op-end', (d, win, op) => {
      if (op == Meta.GrabOp.MOVING) {
        this._draggedWindow = null;
      }
    });















    const updateMonitorPerspective = () => {

      this._disablePerspectiveCorrection();


      this._enablePerMonitorPerspective =
        this._settings.get_boolean('per-monitor-perspective') &&
        global.display.get_n_monitors() > 1;


      if (this._enablePerMonitorPerspective) {
        this._enablePerspectiveCorrection();
      }
    };

    this._settings.connect('changed::per-monitor-perspective', updateMonitorPerspective);
    this._monitorsChangedID = global.backend.get_monitor_manager().connect(
      'monitors-changed', updateMonitorPerspective);

    updateMonitorPerspective();
  }



  disable() {


    SwipeTracker.prototype._endGesture              = this._origEndGesture;
    WorkspacesView.prototype._updateWorkspacesState = this._origUpdateWorkspacesState;
    WorkspacesView.prototype._getSpacing            = this._origGetSpacing;
    WorkspacesView.prototype._updateVisibility      = this._origUpdateVisibility;
    WorkspaceAnimationController.prototype._prepareWorkspaceSwitch = this._origPrepSwitch;
    WorkspaceAnimationController.prototype._finishWorkspaceSwitch = this._origFinalSwitch;


    this._removeDesktopDragGesture();
    this._removePanelDragGesture();
    this._removeOverviewDragGesture();


    if (this._skybox) {
      this._skybox.destroy();
      this._skybox = null;
    }

    Main.overview._overview.controls._workspaceAdjustment.disconnect(
      this._workspaceAdjustmentID);


    global.stage.disconnect(this._stageAllocationID);
    global.display.disconnect(this._grabOpBeginID);
    global.display.disconnect(this._grabOpEndID);

    this._pressureBarrier.destroy();
    this._leftBarrier.destroy();
    this._rightBarrier.destroy();

    this._pressureBarrier = null;
    this._leftBarrier     = null;
    this._rightBarrier    = null;
    this._pitch           = null;


    this._disablePerspectiveCorrection();
    global.backend.get_monitor_manager().disconnect(this._monitorsChangedID);


    this._settings = null;
  }




  _inhibitCulling(actor) {
    if (actor.mapped) {
      actor.inhibit_culling();
      actor._culling_inhibited_by_desktop_cube = true;
      actor.get_children().forEach(c => this._inhibitCulling(c));
    }
  };



  _uninhibitCulling(actor) {
    if (actor._culling_inhibited_by_desktop_cube) {
      delete actor._culling_inhibited_by_desktop_cube;
      actor.uninhibit_culling();
      actor.get_children().forEach(c => this._uninhibitCulling(c));
    }
  };


  _getAppDrawerMode(workspacesView) {
    return workspacesView._fitModeAdjustment.value;
  }



  _getOverviewMode(workspacesView) {
    return workspacesView._overviewAdjustment.value -
      2 * this._getAppDrawerMode(workspacesView);
  }



  _getCubeMode(workspacesView) {
    return 1 - this._getAppDrawerMode(workspacesView)
  }


  _getFaceAngle(faceCount) {




    if (this._settings.get_boolean('last-first-gap')) {
      return (faceCount == 2 ? 90 : 180) / (faceCount - 1);
    }


    return 360.0 / faceCount;
  }


  _getCenterDist(workspaceWidth, faceAngle) {
    let centerDepth = workspaceWidth / 2;
    if (faceAngle < 180) {
      centerDepth /= Math.tan(faceAngle * 0.5 * Math.PI / 180);
    }
    return centerDepth;
  }




  _depthSortCubeFaces(actors) {

    const copy = actors.slice();
    copy.sort((a, b) => {
      return Math.abs(b.rotation_angle_y) - Math.abs(a.rotation_angle_y);
    });


    const parent = actors[0].get_parent();
    for (let i = 0; i < copy.length; i++) {
      parent.set_child_at_index(copy[i], i);
    }
  }






  _depthSortWindowActors(actors, monitorIndex) {


    if (actors.length <= 1) {
      return;
    }


    const camera = new Graphene.Point3D({
      x: global.stage.width / 2,
      y: global.stage.height / 2,
      z: global.stage.height /
        (2 * Math.tan(global.stage.perspective.fovy / 2 * Math.PI / 180))
    });


    const parent = actors[0].get_parent();



    if (this._enablePerMonitorPerspective) {

      let monitor;

      if (!Meta.is_wayland_compositor || Meta.is_wayland_compositor()) {



        monitor = global.display.get_monitor_geometry(monitorIndex);

      } else {



        monitor =
          global.display.get_monitor_geometry(global.display.get_primary_monitor());
      }

      camera.x = monitor.x + monitor.width / 2;
      camera.y = monitor.y + monitor.height / 2;
    }


    const distances = actors.map((a, i) => {

      const onActor = a.apply_relative_transform_to_point(
        null, new Graphene.Point3D({x: 0, y: 0, z: 0}));


      const aboveActor = a.apply_relative_transform_to_point(
        null, new Graphene.Point3D({x: 0, y: 0, z: 1000}));


      const normal = new Graphene.Point3D({
        x: aboveActor.x - onActor.x,
        y: aboveActor.y - onActor.y,
        z: aboveActor.z - onActor.z,
      });

      const length =
        Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
      normal.x /= length;
      normal.y /= length;
      normal.z /= length;

      onActor.x -= camera.x;
      onActor.y -= camera.y;
      onActor.z -= camera.z;


      return {
        index: i,
        distance: onActor.x * normal.x + onActor.y * normal.y + onActor.z * normal.z
      };
    });


    distances.sort((a, b) => {
      return Math.abs(b.distance) - Math.abs(a.distance);
    });


    const copy = distances.map(e => {
      return actors[e.index];
    });


    for (let i = 0; i < copy.length; i++) {
      parent.set_child_at_index(copy[i], i);
    }
  }









  _getExplodeFactors(hRotation, vRotation, centerDepth, monitorIndex) {




    const hFactor = 1.0 - 2.0 * Math.abs(hRotation % 1 - 0.5);
    const vFactor = Math.abs(vRotation);





    const monitor = global.display.get_monitor_geometry(monitorIndex);
    const cornerDist =
      Math.sqrt(Math.pow(centerDepth, 2) + Math.pow(monitor.width / 2, 2));
    const hDepthOffset =
      this._settings.get_double('window-parallax') * (cornerDist - centerDepth);



    const hExplode = hDepthOffset;



    const vExplode = this._settings.get_boolean('do-explode') ?
      Math.max(monitor.width, monitor.height) / 2 :
      0;
    const diameter = 2 * (vExplode + centerDepth);
    const camDist =
      monitor.height / (2 * Math.tan(global.stage.perspective.fovy / 2 * Math.PI / 180));
    const vDepthOffset =
      (1 + PADDING_V_ROTATION) * diameter * camDist / monitor.width - centerDepth;


    const depthOffset = Math.max(hFactor * hDepthOffset, vFactor * vDepthOffset);
    const explode     = Math.max(hFactor * hExplode, vFactor * vExplode);





    const windowPickerFactor =
      Math.min(1.0, 2.0 - Main.overview._overview.controls._stateAdjustment.value);

    return [depthOffset * windowPickerFactor, explode * windowPickerFactor];
  }










  _enablePerspectiveCorrection() {

    this._stageBeforeUpdateID = global.stage.connect('before-update', (stage, view) => {

      if (!Main.overview.visible && Main.wm._workspaceAnimation._switchData == null) {
        return;
      }




      let cameraX, cameraY;

      if (!Meta.is_wayland_compositor || Meta.is_wayland_compositor()) {



        cameraX = view.layout.x + view.layout.width / 2;
        cameraY = view.layout.y + view.layout.height / 2;

      } else {



        const currentMonitorRect =
          global.display.get_monitor_geometry(global.display.get_current_monitor());

        cameraX = currentMonitorRect.x + currentMonitorRect.width / 2;
        cameraY = currentMonitorRect.y + currentMonitorRect.height / 2;
      }



      const camOffsetX = stage.width / 2 - cameraX;
      const camOffsetY = cameraY - stage.height / 2;

      const z_near = stage.perspective.z_near;
      const z_far  = stage.perspective.z_far;



      const A = 0.57735025882720947265625;
      const B = 0.866025388240814208984375;
      const C = 0.86162912845611572265625;
      const D = 0.00872653536498546600341796875;

      const z_2d = z_near * A * B * C / D + z_near;



      const top    = z_near * Math.tan(stage.perspective.fovy * Math.PI / 360.0);
      const left   = -top * stage.perspective.aspect;
      const right  = top * stage.perspective.aspect;
      const bottom = -top;

      const left_2d_plane   = left / z_near * z_2d;
      const right_2d_plane  = right / z_near * z_2d;
      const bottom_2d_plane = bottom / z_near * z_2d;
      const top_2d_plane    = top / z_near * z_2d;

      const width_2d_start  = right_2d_plane - left_2d_plane;
      const height_2d_start = top_2d_plane - bottom_2d_plane;

      const width_scale  = width_2d_start / stage.width;
      const height_scale = height_2d_start / stage.height;




      const offsetX = camOffsetX * width_scale / z_2d * z_near;
      const offsetY = camOffsetY * height_scale / z_2d * z_near;


      view.get_framebuffer().frustum(left + offsetX, right + offsetX, bottom + offsetY,
                                     top + offsetY, z_near, z_far);



      view.get_framebuffer().push_matrix();
      view.get_framebuffer().translate(camOffsetX * width_scale,
                                       camOffsetY * height_scale, 0);








      if (Main.overview.visible) {
        this._inhibitCulling(Main.overview._overview.controls._workspacesDisplay);
      } else if (Main.wm._workspaceAnimation._switchData) {
        Main.wm._workspaceAnimation._switchData.monitors.forEach(m => {
          this._inhibitCulling(m);
        });
      }
    });


    this._stageAfterUpdateID = global.stage.connect('after-update', (stage, view) => {

      if (!Main.overview.visible && Main.wm._workspaceAnimation._switchData == null) {
        return;
      }

      view.get_framebuffer().pop_matrix();
      view.get_framebuffer().perspective(stage.perspective.fovy, stage.perspective.aspect,
                                         stage.perspective.z_near,
                                         stage.perspective.z_far);


      if (Main.overview.visible) {
        this._uninhibitCulling(Main.overview._overview.controls._workspacesDisplay);
      } else if (Main.wm._workspaceAnimation._switchData) {
        Main.wm._workspaceAnimation._switchData.monitors.forEach(m => {
          this._uninhibitCulling(m);
        });
      }
    });
  }


  _disablePerspectiveCorrection() {

    if (this._stageBeforeUpdateID) {
      global.stage.disconnect(this._stageBeforeUpdateID);
      this._stageBeforeUpdateID = 0;
    }

    if (this._stageAfterUpdateID) {
      global.stage.disconnect(this._stageAfterUpdateID);
      this._stageAfterUpdateID = 0;
    }
  }







  _addDragGesture(actor, tracker, mode) {
    const gesture = new DragGesture(actor, mode);

    if (utils.shellVersionIsAtLeast(49, 'beta')) {
      gesture.connect('begin', tracker._beginTouchpadGesture.bind(tracker));
      gesture.connect('update', tracker._updateTouchpadGesture.bind(tracker));
      gesture.connect('end', tracker._endTouchpadGesture.bind(tracker));
    } else {
      gesture.connect('begin', tracker._beginGesture.bind(tracker));
      gesture.connect('update', tracker._updateGesture.bind(tracker));
      gesture.connect('end', tracker._endTouchGesture.bind(tracker));
    }

    tracker.bind_property('distance', gesture, 'distance',
                          GObject.BindingFlags.SYNC_CREATE);


    this._settings.bind('mouse-rotation-speed', gesture, 'sensitivity',
                        Gio.SettingsBindFlags.GET);


    gesture.bind_property('pitch', this._pitch, 'value', 0);






    const gestureEndID = tracker.connect('end', (g, duration) => {
      this._pitch.remove_transition('value');
      this._pitch.ease(0, {
        duration: Math.max(500 * Math.abs(this._pitch.value), duration),
        mode: Clutter.AnimationMode.EASE_OUT_CUBIC,
      });
    });



    return {
      actor: actor,
      tracker: tracker,
      gesture: gesture,
      trackerConnection: gestureEndID
    };
  }



  _removeDragGesture(info) {
    info.gesture.destroy();
    info.tracker.disconnect(info.trackerConnection);
  }



  _addDesktopDragGesture() {


    const tracker = Main.wm._workspaceAnimation._swipeTracker;
    let actor     = Main.layoutManager._backgroundGroup;
    const mode    = Shell.ActionMode.NORMAL;




    tracker.allowLongSwipes = true;



    this._origBackgroundReactivity = actor.reactive;
    actor.reactive                 = true;

    this._desktopDragGesture = this._addDragGesture(actor, tracker, mode);
  }



  _addPanelDragGesture() {


    const tracker = Main.wm._workspaceAnimation._swipeTracker;
    const actor   = Main.panel;
    const mode    = Shell.ActionMode.NORMAL;




    tracker.allowLongSwipes = true;

    if (GS_VERSION >= 50) {




      this._origPanelReactivity = actor.reactive;
      actor.reactive            = true;






      if (actor._clickGesture) {
        this._origPanelClickGestureEnabled = actor._clickGesture.enabled;
        actor._clickGesture.enabled        = false;
      }
    } else {


      this._origPanelTryDragWindow = actor._tryDragWindow;
      actor._tryDragWindow = () => Clutter.EVENT_PROPAGATE;
    }

    this._panelDragGesture = this._addDragGesture(actor, tracker, mode);
  }



  _addOverviewDragGesture() {


    const tracker = Main.overview._overview._controls._workspacesDisplay._swipeTracker;
    const actor   = Main.layoutManager.overviewGroup;
    const mode    = Shell.ActionMode.OVERVIEW;

    this._overviewDragGesture = this._addDragGesture(actor, tracker, mode);
  }



  _removeDesktopDragGesture() {
    if (this._desktopDragGesture) {


      this._desktopDragGesture.tracker.allowLongSwipes = false;


      this._desktopDragGesture.actor.reactive = this._origBackgroundReactivity;

      this._removeDragGesture(this._desktopDragGesture);

      delete this._desktopDragGesture;
    }
  }



  _removePanelDragGesture() {
    if (this._panelDragGesture) {


      this._panelDragGesture.tracker.allowLongSwipes = false;

      if (GS_VERSION >= 50) {

        this._panelDragGesture.actor.reactive = this._origPanelReactivity;


        if (this._panelDragGesture.actor._clickGesture &&
            this._origPanelClickGestureEnabled !== undefined) {
          this._panelDragGesture.actor._clickGesture.enabled =
            this._origPanelClickGestureEnabled;
          delete this._origPanelClickGestureEnabled;
        }
      } else {

        this._panelDragGesture.actor._tryDragWindow = this._origPanelTryDragWindow;
      }

      this._removeDragGesture(this._panelDragGesture);

      delete this._panelDragGesture;
    }
  }



  _removeOverviewDragGesture() {
    if (this._overviewDragGesture) {
      this._removeDragGesture(this._overviewDragGesture);

      delete this._overviewDragGesture;
    }
  }
}


function init() {
  return new Extension();
}
