# Notas de extensions/desktop-cube/src/Skybox.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 26

````text
//////////////////////////////////////////////////////////////////////////////////////////
````

## Línea 27

````text
// This file contains two classes, the Skybox (which is an actor) and the SkyboxEffect, //
````

## Línea 28

````text
// which is applied to the Skybox actor.                                                //
````

## Línea 29

````text
//                                                                                      //
````

## Línea 30

````text
// SkyboxEffect loads a given texture and interprets it as a 360° panorama in           //
````

## Línea 31

````text
// equirectangular projection. It uses the current perspective of the stage to draw a   //
````

## Línea 32

````text
// perspectively correct portion of this panorama. It has an additional pitch and yaw   //
````

## Línea 33

````text
// parameter controlling the horizontal and vertical rotation of the camera.            //
````

## Línea 34

````text
//                                                                                      //
````

## Línea 35

````text
// Since GNOME 51, Shell.GLSLEffect has been removed from gnome-shell. On newer         //
````

## Línea 36

````text
// versions, we therefore use Clutter.ShaderEffect instead. Unlike Shell.GLSLEffect, it //
````

## Línea 37

````text
// only manages a single Cogl.Snippet automatically (returned by                        //
````

## Línea 38

````text
// vfunc_get_static_snippet()), so we let it handle the fragment shader (which is also  //
````

## Línea 39

````text
// required for its uniform bookkeeping to kick in) and add the vertex shader snippet   //
````

## Línea 40

````text
// to the pipeline ourselves.                                                           //
````

## Línea 41

````text
//////////////////////////////////////////////////////////////////////////////////////////
````

## Línea 53

````text
// In the vertex shader, we compute the view space position of the actor's corners.
````

## Línea 76

````text
// The fragment shader uses the interpolated viewspace position to compute a view ray.
````

## Línea 77

````text
// This ray is rotated according to the pitch and yaw values.
````

## Línea 90

````text
// The methods shared by both backends. They are added to the prototype of the class
````

## Línea 91

````text
// below before it is registered with GObject.
````

## Línea 93

````text
// Load a texture asynchronously.
````

## Línea 110

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/commit/44b84e458a22046fedb85701ea25ad08ecc0d43f
````

## Línea 152

````text
// This is called once per class to create the fragment shader snippet which is
````

## Línea 153

````text
// then shared by all instances of this class. Clutter.ShaderEffect only wires up
````

## Línea 154

````text
// its automatic uniform handling for this static snippet, so the vertex snippet
````

## Línea 155

````text
// is added manually in vfunc_paint_target() below.
````

## Línea 161

````text
// For each draw call, we have to set some uniform values.
````

## Línea 166

````text
// The vertex snippet is not managed automatically, so add it once per
````

## Línea 167

````text
// pipeline (a new one may be created e.g. when the actor is resized).
````

## Línea 206

````text
// This is called once to setup the Cogl.Pipeline.
````

## Línea 217

````text
// For each draw call, we have to set some uniform values.
````

## Línea 234

````text
//////////////////////////////////////////////////////////////////////////////////////////
````

## Línea 235

````text
// The Skybox is a simple actor which applies the above effect to itself. It also has   //
````

## Línea 236

````text
// the pitch and yaw properties - these are directly forwarded to the effect.           //
````

## Línea 237

````text
//////////////////////////////////////////////////////////////////////////////////////////
````

## Línea 239

````text
// clang-format off
````

## Línea 248

````text
// clang-format on
````

## Línea 252

````text
// Apply the effect.
````

## Línea 256

````text
// Make sure that the overview background is transparent.
````

## Línea 259

````text
// Forward the yaw and pitch values.
````

## Línea 263

````text
// Revert to the original overview background appearance.
````
