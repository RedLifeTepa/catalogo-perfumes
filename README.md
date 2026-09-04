# AuraERP v1.0.0 Stable

Primera versión estable del sistema comercial AuraERP.

## Módulos
- Catálogo público
- Productos y categorías
- Carrito y pedidos
- Clientes / CRM
- Ventas de contado y crédito
- Cobranza y abonos
- Dashboard
- Reportes CSV / impresión-PDF
- Bitácora
- Usuarios y roles
- Notificaciones
- Respaldos JSON
- Configuración
- PWA
- Sincronización global

## Instalación
1. Publica `docs/firestore.rules` en Firebase Firestore.
2. Mantén habilitado Email/Password en Firebase Authentication.
3. Verifica que el administrador existente tenga `activo: true` y `rol: "admin"`.
4. Publica el contenido de esta carpeta en Netlify o tu hosting HTTPS.
5. Catálogo público: `/index.html`
6. Administración: `/confi.html`

## Seguridad
Consulta `docs/SEGURIDAD.md`.

## Actualizaciones
No edites datos directamente en archivos del frontend. Los datos operativos viven en Firestore.
Antes de futuras actualizaciones genera un respaldo desde el módulo Respaldos.
