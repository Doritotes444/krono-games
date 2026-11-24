# KRONO — Portal Minimalista de Promoción y Venta de Videojuegos

Sitio web responsive (PC y móvil) desarrollado como **Componente 1** de la evidencia **GA1-37371-AA4-EV01** (*Sitio Web de Solución TIC e Informe Técnico* — Ficha **3413974**, SENA).

## URL Pública Activa
- **Sitio desplegado:** https://doritotes444.github.io/krono-games/

## Características principales
- **Diseño minimalista y adaptable (PC y móvil):** Interfaz editorial clara con modo oscuro opcional, navegación intuitiva y soporte completo para dispositivos móviles.
- **Catálogo curado de todas las épocas (1995–2026):**
  - *Nuevos lanzamientos* (2025–2026)
  - *Modernos esenciales* (2018–2024)
  - *Clásicos atemporales* (1995–2011)
- **Filtros por secciones y facetas:** Pestañas de sección (*Todos*, *Para ti*, *Nuevos lanzamientos*, *Modernos esenciales*, *Clásicos atemporales*, *Ofertas*), búsqueda instantánea (atajo `/`), filtro por plataforma, género, ordenamiento y selector de moneda (**COP / USD**).
- **Experiencia personalizada por el usuario:** Motor de afinidad en tiempo real según épocas, géneros, plataformas y presupuesto; perfiles rápidos, lista de deseos y biblioteca digital persistente en `localStorage`.
- **Inicio de sesión multiproveedor:** Flujo interactivo con **Google**, **Facebook**, **Discord**, **Correo electrónico** y **Teléfono con verificación SMS (OTP de 6 dígitos)**.
- **Multimedia e interactividad:** Tráilers oficiales integrados de YouTube con carga bajo demanda, fichas técnicas detalladas, carrito de compras con cupones (`SENA2026`, `KRONO15`, `RETRO10`) y generación simulada de claves digitales, mapa interactivo (OpenStreetMap) y formulario de contacto funcional con validación y radicado.

## Estructura del proyecto
```text
krono-games/
├── index.html          # Estructura semántica HTML5, secciones y modales
├── css/styles.css      # Sistema de diseño minimalista (claro/oscuro + responsive)
├── js/data.js          # Catálogo curado de 12 videojuegos, épocas y cupones
├── js/app.js           # Motor de personalización, filtros, auth, carrito y contacto
└── assets/images/      # Ilustraciones optimizadas en WebP y SVG
```
