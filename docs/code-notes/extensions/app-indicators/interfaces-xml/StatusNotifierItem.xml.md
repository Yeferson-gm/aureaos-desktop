# Notas de extensions/app-indicators/interfaces-xml/StatusNotifierItem.xml

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 1

````text
<!-- Based on:
 https://invent.kde.org/frameworks/knotifications/-/blob/master/src/org.kde.StatusNotifierItem.xml
-->
````

## Línea 13

````text
<!-- An additional path to add to the theme search path to find the icons specified above. -->
````

## Línea 19

````text
<!-- main icon -->
````

## Línea 20

````text
<!-- names are preferred over pixmaps -->
````

## Línea 23

````text
<!--struct containing width, height and image data-->
````

## Línea 35

````text
<!-- Requesting attention icon -->
````

## Línea 38

````text
<!--same definition as image-->
````

## Línea 47

````text
<!-- tooltip data -->
````

## Línea 49

````text
<!--(iiay) is an image-->
````

## Línea 50

````text
<!-- We disable this as we don't support tooltip, so no need to go through it
    <property name="ToolTip" type="(sa(iiay)ss)" access="read">
        <annotation name="org.qtproject.QtDBus.QtTypeName" value="KDbusToolTipStruct"/>
    </property>
    -->
````

## Línea 56

````text
<!-- interaction: the systemtray wants the application to do something -->
````

## Línea 58

````text
<!-- we're passing the coordinates of the icon, so the app knows where to put the popup window -->
````

## Línea 86

````text
<!-- Signals: the client wants to change something in the status
    <signal name="NewTitle">
    </signal>

    <signal name="NewIcon">
    </signal>

    <signal name="NewAttentionIcon">
    </signal>

    <signal name="NewOverlayIcon">
    </signal>
    -->
````

## Línea 99

````text
<!-- We disable this as we don't support tooltip, so no need to go through it
    <signal name="NewToolTip">
    </signal>
    -->
````

## Línea 104

````text
<!--
    <signal name="NewStatus">
        <arg name="status" type="s"/>
    </signal>
    -->
````

## Línea 111

````text
<!-- The following items are not supported by specs, but widely used
    <signal name="NewIconThemePath">
        <arg type="s" name="icon_theme_path" direction="out" />
    </signal>

    <signal name="NewMenu"></signal>
    -->
````

## Línea 119

````text
<!-- ayatana labels -->
````

## Línea 120

````text
<!-- These are commented out because GDBusProxy would otherwise require them,
         but they are not available for KDE indicators
    -->
````

## Línea 123

````text
<!--<signal name="XAyatanaNewLabel">
        <arg type="s" name="label" direction="out" />
        <arg type="s" name="guide" direction="out" />
    </signal>
    <property name="XAyatanaLabel" type="s" access="read" />
    <property name="XAyatanaLabelGuide" type="s" access="read" />-->
````
