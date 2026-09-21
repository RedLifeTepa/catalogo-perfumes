# AuraERP v1.9.7.2 - Login Root Cause Fix

Causa real encontrada: el nuevo Centro de Documentos eliminó los botones antiguos del HTML, pero app.js todavía ejecutaba `.onclick` sobre esos IDs inexistentes. Esto generaba un error JavaScript durante el arranque.

Correcciones:
- Bindings antiguos de Documentos ahora son defensivos.
- Eliminada la carga automática heredada del Centro de Documentos.
- Documentos carga sólo con usuario autenticado.
- Navegación protegida ante elementos inexistentes.
- Login, email, password y observador Firebase Auth verificados.
- Sintaxis app.js validada.
