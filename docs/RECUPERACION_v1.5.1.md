# AuraERP v1.5.1 - Recuperación funcional

## Causa encontrada
El módulo Clientes fue reemplazado en v1.4.0 por CRM Avanzado, pero `app.js` conservó una línea heredada que ejecutaba:

`$("#refreshClients").onclick = loadClients`

El botón `refreshClients` ya no existía. JavaScript lanzaba un error al iniciar y detenía la ejecución del archivo justo después del módulo Productos.

Por eso:
- Productos sí cargaba.
- Dashboard quedaba en cero.
- Inventario no cargaba.
- Clientes/CRM no funcionaba.
- Pedidos, Ventas y Cobranza no cargaban.
- Reportes, Documentos, Notificaciones e Inteligencia no terminaban de inicializar.
- La sincronización automática tampoco llegaba a registrarse.

## Corrección
- Se eliminó el punto único de fallo.
- Los handlers heredados ahora son defensivos.
- El login ejecuta una sincronización global completa.
- La sincronización usa `Promise.allSettled`: un módulo con error ya no bloquea los demás.
- Buscadores/filtros se ampliaron y son responsive.
