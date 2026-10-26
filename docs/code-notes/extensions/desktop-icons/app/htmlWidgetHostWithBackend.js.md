# Notas de extensions/desktop-icons/app/htmlWidgetHostWithBackend.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 223

````text
// Read stdout (protocol messages)
````

## Línea 233

````text
// Read stderr (debug/logs)
````

## Línea 282

````text
// Backend expects newline-delimited JSON objects. Known outbound shapes:
````

## Línea 283

````text
//  - hello:  {type, instanceId, widgetId, mode, config}
````

## Línea 284

````text
//  - request {type, id, method, params}
````

## Línea 334

````text
// Ignore per-line handler errors
````

## Línea 461

````text
// Inbound JSON objects are expected to be of type response, event or log.
````

## Línea 462

````text
//  - response: {type, id, ok, result, error}
````

## Línea 463

````text
//  - event:    {type, name, payload}
````

## Línea 464

````text
//  - log:      {type, level, message}
````

## Línea 465

````text
// with author-defined 'name' and custom JSON 'payload'
````
