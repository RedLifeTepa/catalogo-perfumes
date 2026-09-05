# AuraERP v1.7.7 - Auditoría y corrección de caché/runtime

- Auditoría real del código antes de modificar.
- Corregida causa del filtro duplicado: JS histórico retenido por Service Worker.
- index.html carga `catalogo.js?v=1.7.7`.
- Service Worker usa network-first para HTML/CSS/JS.
- Las 20 preguntas del asistente están escritas directamente en el HTML.
- El asistente ya no depende de intelligence.js/intelligence-simple.js.
- El manejador de preguntas está al inicio de app.js.
- Firebase se consulta al primer clic.
- Respuesta aparece debajo de los botones.
