# AuraERP v1.9.8.7 - Recovery build

Esta versión vuelve a la base v1.9.8.3, anterior a la herramienta de limpieza.

## Qué se conserva
- Login/Auth de la rama estable.
- Firebase config original de la rama estable.
- Centro de Documentos.
- Quiénes somos y mejoras públicas existentes hasta v1.9.8.3.

## Qué se retira temporalmente
- Limpieza selectiva de datos.
- Cambios writeBatch/deleteDoc.
- Cualquier modificación de firebase-config relacionada con limpieza.

## Service Worker
Se añadió únicamente una protección para ignorar esquemas no HTTP/HTTPS como `chrome-extension://`, evitando el error `Failed to execute put on Cache`.

No se modificó app.js ni firebase-config.js.
