# Diagnóstico Inteligencia v1.7.2

## Causa
La interfaz de v1.7.1 eliminó el formulario manual (`aiForm`, `aiQuestion`, `refreshAI`), pero `app.js` conservó inicializadores heredados de v1.6.x. Al intentar asignar eventos a elementos que ya no existían, JavaScript podía detenerse antes de:
- dibujar las 20 preguntas;
- consultar Firebase;
- actualizar los contadores.

Esto coincide con la evidencia: `Cargando datos...`, 20 consultas sin botones y todos los contadores en 0.

## Corrección
- Un único arranque defensivo del Centro de Inteligencia.
- Eliminación de handlers obsoletos.
- Consultas Firebase con `Promise.allSettled`.
- Una colección con error ya no bloquea las demás.
- Diagnóstico visible de carga parcial/error.
- Botones forzados visibles mediante CSS.
