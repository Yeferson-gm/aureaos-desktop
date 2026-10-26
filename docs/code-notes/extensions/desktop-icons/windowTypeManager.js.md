# Notas de extensions/desktop-icons/windowTypeManager.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 34

````text
/* This class is added to each managed window, and it's used to make it
       behave like a desktop window.

       Trusted windows will set in the title the characters @!, followed by
       the coordinates where to put the window separated by a colon, and
       ended in a semicolon. After that, it can have one or more of these
       letters:

       * B : put and always keep this window at the bottom of the stack of
             windows on screen
       * T : put and always keep this window at the top of the stack of
             windows on the screen
       * D : show this window in all desktops
       * H : hide this window from the window list
       * K : make this window a dock window (takes precedence over desktop flags)
       * F : keep the window in the same position, even if it is moved by the
             user or by the system (for example when changing screen resolution)

       Using the title is generally not a problem because the desktop windows
       do not have a title. But some other windows may have and still need to
       set a title and use this class, so adding a single blank space at the
       end of the title is equivalent to @!H, and having two blank spaces at
       the end of the title is equivalent to @!HTD. This allows use of these
       flags for decorated or titled windows.
    */
````

## Línea 138

````text
/*
       Expected managed-window title protocol after legacy normalization:

       @!<x>,<y>;<flags>[;KEY=VALUE ...]

       Examples:
       - @!120,340;BDH;I=550e8400-e29b-41d4-a716-446655440000
       - @!120,340;TH;I=550e8400-e29b-41d4-a716-446655440000

       Grammar:
       - @! introduces a DING-managed window directive
       - <x>,<y> are integer global coordinates
       - <flags> is a compact string of zero or more of:
         B, T, D, H, F, K
       - optional metadata segments follow as ;KEY=VALUE
       - multiple metadata segments are allowed for forward compatibility
       - unknown metadata keys are ignored
       - currently supported metadata:
         I=<uuid>  instance id for pinned widget windows

       Legacy compatibility is handled before parsing:
       - null title on transient dialogs -> @!H
       - one trailing space -> @!H
       - two trailing spaces -> @!HTD
    */
````

## Línea 196

````text
// Transient dialog window
````

## Línea 197

````text
// Does not have title, hide from windowlist
````

## Línea 583

````text
/* If a window is lowered below us with shortcuts,
        detect and fix DING window */
````

## Línea 706

````text
// Window manager bug - it treats request to resize window
````

## Línea 707

````text
// to monitor size as a fullscreen window request as well and makes
````

## Línea 708

````text
// the window fullscreen for some apps.
````

## Línea 709

````text
// This makes intellihide for docks/panels hide from desktop window
````

## Línea 718

````text
// Keep it raised without using DOCK so focus behavior stays normal.
````

## Línea 825

````text
/*
     This class handles DING window registration and window-type management.
     Just make one instance of it, call enable(), and whenever a window
     that you want to give "superpowers" is mapped, add it with the
     "addWindowManagedCustomJS_ding" method. That's all.
     */
````

## Línea 899

````text
/* But in Overview mode it is paramount to not change the workspace to
             emulate "stick", or the windows will appear
         */
````

## Línea 922

````text
// disconnect signals
````

## Línea 945

````text
// it is a MetaWindowActor
````

## Línea 1033

````text
// After shell unlock, window seems to lose stick property,
````

## Línea 1034

````text
// refresh window properties
````

## Línea 1073

````text
/* This class is added to each managed windowActor, and it's used to
       make it behave like a shell Actor that can accept drops from
       Gnome Shell dnd.
    */
````
