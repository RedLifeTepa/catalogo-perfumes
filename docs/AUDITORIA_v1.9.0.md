# Auditoría AuraERP v1.9.0

## Alcance
Revisión estática y hardening de la rama v1.8.0 antes del Release Candidate.

## Validaciones ejecutadas
- Sintaxis JavaScript con Node para app.js, catalogo.js, public-pages.js y firebase-config.js.
- Integridad de archivos críticos.
- Búsqueda de funciones duplicadas.
- Búsqueda de bindings DOM potencialmente inválidos.
- Revisión de runtimes heredados de Inteligencia.
- Revisión de caché/versionado.
- Protección del carrito ante localStorage corrupto.
- Normalización del mínimo de mayoreo.
- Manejo global de errores y pérdida de conexión.
- Encabezados de seguridad para hosting compatible.

## Hallazgos previos
Funciones duplicadas detectadas: 0
- Ninguna

Bindings DOM faltantes detectados a nivel global: 2
- Línea 192: #savePayment
- Línea 252: #saveUser

Runtimes IA heredados encontrados: 2
- intelligence-simple.js
- intelligence.js

## Correcciones v1.9.0
- Eliminados runtimes de Inteligencia obsoletos que ya no se utilizaban.
- Manejo de errores globales no bloqueante.
- Estado online/offline integrado.
- Refresco al volver a la pestaña.
- Carrito tolerante a localStorage dañado.
- Mínimo de mayoreo normalizado a 3.
- Encabezados de seguridad `_headers`.
- Cache bust completo v1.9.0.
- Accesibilidad básica en enlaces públicos.

## Archivos críticos faltantes
- Ninguno

## Nota
Esta auditoría valida código y estructura. Las pruebas funcionales reales de Firebase, reglas, móvil, pedido→venta, cobranza, restauración y permisos deben ejecutarse sobre el despliegue de prueba porque dependen de datos y autenticación reales.
