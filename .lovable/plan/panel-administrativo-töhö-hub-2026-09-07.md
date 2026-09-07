# Panel administrativo TÖHÖ HUB

Objetivo: separar por completo la experiencia del equipo TÖHÖ (panel administrativo) de la del distribuidor, sobre lo que ya existe, sin romper nada de lo actual.

Lo que ya funciona hoy y se reutiliza: distribuidores, vendedores, niveles con descuento configurable, productos con imágenes y video, inventario, cotizaciones, pedidos, importación Excel/CSV, promociones y recursos. Todo eso se mueve a la nueva estructura, no se rehace.

## Cuenta inicial

- Se crea samanta.fernandez@toho.com.mx como **Super Admin** con contraseña temporal segura (te la muestro una sola vez en el chat, no queda guardada en texto plano).
- En su primer ingreso la plataforma la obliga a definir una contraseña nueva antes de poder usar el panel.
- La cuenta existente samanta.fernandez@toho.com (distribuidora de prueba) se conserva aparte.

## Fases

### Fase 1 — Base de roles, permisos y seguridad
- Nuevo rol **super_admin** además de admin, vendedor y distribuidor.
- Lista de permisos granulares (ver catálogo, crear/editar/eliminar productos, inventario, marcas, categorías, distribuidores, pedidos, cotizaciones, promociones, vendedores, administradores, configuración) asignables por administrador. Super Admin siempre tiene todos.
- Rutas del panel bajo `/admin/*` protegidas en pantalla **y** validadas en el servidor en cada operación: un distribuidor que escriba la URL a mano no entra ni obtiene datos.
- Registro de actividad (audit log) con administrador, acción, módulo, elemento afectado, cambios y fecha, con filtros.
- Invitaciones por correo con enlace único que expira; el usuario crea su propia contraseña. Reenviar, cancelar, ver fecha de envío y de aceptación. Nunca se envían contraseñas.

### Fase 2 — Dashboard administrativo
Pantalla propia, distinta a la del distribuidor: totales de distribuidores (activos, pendientes, Bronze/Silver/Gold), productos (activos, inactivos, sin inventario, inventario bajo), ventas, pedidos y cotizaciones recientes, nuevos distribuidores y actividad administrativa reciente, con gráficas.

### Fase 3 — Catálogo
Sección Catálogo con Marcas, Categorías, Subcategorías, Colecciones y Etiquetas.
- Marcas con logo, descripción, banner, orden y activo/inactivo. Se precargan Leatherman, Ledlenser, Olight, Coast, Gerber, GearWrench, Nitecore, Wooderful Life y Fenix; se pueden agregar más.
- Categorías y subcategorías con orden, visibilidad y asignación de productos.
- Colecciones y etiquetas nuevas, para agrupar productos sin tocar código.

### Fase 4 — Productos
- Listado preparado para miles de productos: búsqueda, filtros por marca, categoría, disponibilidad e inventario, orden y paginación.
- Crear, editar, duplicar, activar/desactivar y eliminar con confirmación.
- Precios: lista/MSRP, precio calculado por nivel (Bronze/Silver/Gold, tomados de configuración, no del código) y precio promocional.
- Multimedia: 6 o más imágenes, arrastrar para ordenar, imagen principal, miniatura y video.
- **Especificaciones por categoría**: cada categoría define sus propios campos (lúmenes, alcance, torque, etc.) y el producto los llena; se agregan campos nuevos desde el panel.
- Botón **Vista previa** que muestra el producto tal como lo verá el distribuidor.

### Fase 5 — Inventario, importación y exportación
- Inventario con SKU, stock, mínimo, estado (en stock, bajo, agotado, próximamente) y última actualización; ajuste manual y masivo.
- Importación con plantilla descargable, validación con errores antes de aplicar, SKU como identificador único y resumen final (creados, actualizados, con error, duplicados, omitidos).
- Exportación a Excel/CSV: todos, por marca, por categoría, activos, agotados e inventario.

### Fase 6 — Personas, pedidos y promociones
- Distribuidores: crear, editar, activar/suspender, cambiar nivel, asignar vendedor, ver pedidos, cotizaciones e historial, restablecer acceso y reenviar invitación.
- Administradores: crear, editar, activar/desactivar, eliminar, asignar permisos, ver último acceso y cerrar sus sesiones.
- Vendedores configurables (regla actual: Bronze y Silver → Carlos, Gold → Xime, editable).
- Pedidos y cotizaciones con todos sus datos y estados.
- Promociones con fechas, descuento especial y asignación a productos, categorías, marcas y niveles.

## Nota técnica
Se agregan tablas para permisos, invitaciones, colecciones, etiquetas y plantillas de especificaciones por categoría, más columnas de inventario mínimo y visibilidad. Las tablas actuales no se eliminan ni se renombran, así que los datos existentes siguen funcionando. Cada operación del panel valida rol y permiso del lado del servidor con RLS.

Empiezo por las fases 1 y 2 (cuenta Super Admin, roles/permisos, rutas protegidas, audit log y dashboard) y sigo en orden.
