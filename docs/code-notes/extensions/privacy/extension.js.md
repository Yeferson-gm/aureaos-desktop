# Notas de extensions/privacy/extension.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 10

````text
//Required for GNOME 50 and earlier
````

## Línea 19

````text
//Extension system imports
````

## Línea 22

````text
//Constants for menu display modes
````

## Línea 29

````text
//Custom PopupMenuItem with an icon, label and switch
````

## Línea 50

````text
//Set an icon for the indicator
````

## Línea 56

````text
//GSettings access
````

## Línea 65

````text
//Reset the settings
````

## Línea 85

````text
//Schema, key, bind flags
````

## Línea 91

````text
//Create menu entries for each setting toggle
````

## Línea 94

````text
//GSettings key to bind to
````

## Línea 95

````text
//Toggle switch to bind to
````

## Línea 96

````text
//Property to share
````

## Línea 97

````text
//Binding flags
````

## Línea 100

````text
//Add each item to the main menu
````

## Línea 104

````text
//Separator to separate reset option
````

## Línea 107

````text
//Create a submenu for the reset option, to prevent a misclick
````

## Línea 117

````text
//Class for individual privacy quick settings toggles
````

## Línea 121

````text
//Set up the quick setting toggle
````

## Línea 128

````text
//GSettings access
````

## Línea 131

````text
//Bind the setting and toggle together
````

## Línea 133

````text
//GSettings key to bind to
````

## Línea 134

````text
//UI element to bind to
````

## Línea 135

````text
//Property to share
````

## Línea 136

````text
//Bind flag
````

## Línea 142

````text
//Class for the privacy quick settings group
````

## Línea 146

````text
//Set up the quick setting toggle
````

## Línea 153

````text
//Set a menu header
````

## Línea 156

````text
//Open the menu or toggle all settings when the body is clicked
````

## Línea 159

````text
//Enable / disable every setting according to its bind flag
````

## Línea 170

````text
//GSettings access
````

## Línea 175

````text
//Display name, icon name
````

## Línea 182

````text
//Schema, key, bind flags
````

## Línea 190

````text
//Create menu entries for each setting toggle
````

## Línea 196

````text
//Update subtitle when settings changed
````

## Línea 202

````text
//Link the setting value and the switch state
````

## Línea 204

````text
//GSettings key to bind to
````

## Línea 205

````text
//Toggle switch to bind to
````

## Línea 206

````text
//Property to share
````

## Línea 207

````text
//Binding flags
````

## Línea 210

````text
//Add each item to the main menu
````

## Línea 214

````text
//Set the subtitle
````

## Línea 218

````text
//Add extension settings entry
````

## Línea 229

````text
//Hide the settings when the screen is locked
````

## Línea 233

````text
//Set initial enabled / disabled
````

## Línea 238

````text
//If all of the privacy settings are disabled, set enableToggle to true
````

## Línea 247

````text
//Set the state of the menu toggle
````

## Línea 252

````text
//Skip if disabled
````

## Línea 257

````text
//Get the number of enabled settings
````

## Línea 269

````text
//If no settings are enabled, display 'Private'
````

## Línea 272

````text
//If 1 setting is enabled, mention it by name
````

## Línea 275

````text
//If multiple are enabled, display how many
````

## Línea 276

````text
//Translators: this displays how many settings are enabled, e.g. '1 allowed'
````

## Línea 282

````text
//Disconnect from settings
````

## Línea 294

````text
//Info to create toggles: settingName, settingIcon, settingSchema, settingKey, settingBindFlag
````

## Línea 301

````text
//Create a quick setting toggle for each privacy setting
````

## Línea 311

````text
//Add the toggle to the system menu
````

## Línea 318

````text
//Destroy each created quick settings toggle
````

## Línea 323

````text
//Remove each tracked entry
````

## Línea 330

````text
//Create quick settings group and add to the system menu
````

## Línea 345

````text
//Create and setup indicator and menu
````

## Línea 348

````text
//Add menu entries
````

## Línea 351

````text
//Get position to insert icon (left or right)
````

## Línea 357

````text
//Add to panel
````

## Línea 362

````text
//Destroy the indicator
````

## Línea 371

````text
//Create new extension
````

## Línea 374

````text
//Create menu
````

## Línea 379

````text
//Disconnect listeners, then destroy the menu and class
````

## Línea 398

````text
/*
     - Return DisplayMode.QuickToggles if quick settings are enabled
       - If quick settings grouping is also enabled, return DisplayMode.QuickGroup instead
     - Otherwise return DisplayMode.Indicators
    */
````

## Línea 414

````text
//Create the correct type of menu
````

## Línea 417

````text
//When settings change, recreate the menu
````

## Línea 419

````text
//Destroy existing menu and create new menu
````

## Línea 426

````text
//Create the correct type of menu, from preferences and capabilities
````

## Línea 444

````text
//Destroy the menu, if created
````
