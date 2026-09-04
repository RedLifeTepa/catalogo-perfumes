# Seguridad AuraERP v1.0.0 Stable

## Cambios críticos

1. El catálogo público ya NO puede leer ni escribir la colección `clientes`.
2. Los datos de contacto del visitante solo se almacenan dentro del pedido público.
3. El CRM se resuelve por teléfono únicamente después de que un usuario autorizado convierte el pedido en venta.
4. Un usuario nuevo no puede asignarse rol `admin` desde el frontend.
5. Los abonos son inmutables.
6. Venta + pago inicial + pedido + cliente se actualizan mediante transacción.
7. Abono + saldo de venta + saldo del cliente se actualizan mediante transacción.
8. Un pedido confirmado no puede convertirse una segunda vez.
9. Las escrituras públicas de pedidos validan campos mínimos y lista de productos.
10. Lecturas privadas requieren perfil activo.

## Primer administrador

Conserva tu administrador existente. Para usuarios futuros:
- créalos en Firebase Authentication;
- crea/autoriza su documento `usuarios/{uid}` desde un administrador;
- asigna el rol desde AuraERP.

No publiques reglas temporales abiertas para crear administradores.
