# AuraERP v1.9.8.6 - Login Restore + Cleanup Safe Fix

## Causa
v1.9.8.5 modificó firebase-config.js para incorporar writeBatch. Esa modificación alteró el módulo crítico que inicializa Firebase/Auth y provocó el error `Service firestore is not available` antes del login.

## Corrección
- Reconstruido desde v1.9.8.4, antes del cambio problemático.
- Eliminado por completo el uso de writeBatch.
- La limpieza utiliza deleteDoc sobre documentos existentes, en grupos de lectura de 100.
- Se mantiene una sola inicialización de Firebase y Firestore.
- Login/Auth conserva la arquitectura estable.
- Doble confirmación visual reforzada.
- favicon 404 sigue siendo cosmético y no bloquea el sistema.
