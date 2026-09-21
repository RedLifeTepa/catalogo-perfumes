# AuraERP v1.9.7.1 - Login Lifecycle Fix

- El Centro de Documentos ya no consulta Firebase antes de iniciar sesión.
- La carga de Ventas/Pedidos/Clientes/Kardex ocurre únicamente al abrir Documentos con un usuario autenticado.
- Todos los bindings nuevos de Documentos son defensivos.
- Se preserva completo el Centro de Documentos v1.9.7.0.
- No se modifican credenciales, Firebase Auth ni reglas.
