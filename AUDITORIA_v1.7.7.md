# Auditoría v1.7.7

Hallazgos confirmados:
1. `catalogo.js` actual tenía una sola definición de Próximos lanzamientos, pero `index.html` seguía cargando `js/catalogo.js` sin versionado. El Service Worker usaba cache-first para JavaScript. Esto explica que el navegador siguiera ejecutando una copia histórica con dos filtros.
2. `confi.html` mostraba el diseño simple, pero las preguntas dependían de un archivo JavaScript separado. La evidencia demostraba que ese runtime no estaba ejecutándose, porque el HTML permanecía en `Preparando consultas...`.
3. Se eliminó esa dependencia: las 20 preguntas ahora existen físicamente en `confi.html` y el manejador se instala al principio de `app.js`, archivo que ya sabemos que carga porque el resto del administrador funciona.
4. El Service Worker ahora usa network-first/no-store para HTML, CSS y JS.

Validaciones:
- app.js: sintaxis Node OK.
- catalogo.js: sintaxis Node OK.
- 20 botones estáticos presentes en confi.html.
- Una sola definición especial de Próximos lanzamientos en catalogo.js.
