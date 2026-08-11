# TÖHÖ Hub Partner Portal

Quiero desarrollar una plataforma web B2B llamada TÖHÖ HUB, exclusiva para distribuidores de TÖHÖ.

La plataforma NO será una tienda online tradicional y NO tendrá pagos ni checkout.

Su función principal será permitir que nuestros distribuidores:

 Consulten su información comercial.

 Consulten su nivel de distribuidor.

 Vean sus descuentos.

 Exploren un catálogo visual premium.

 Consulten productos y toda su información.

 Vean disponibilidad aproximada mediante estados de inventario.

 Agreguen productos y cantidades a una cotización.

 Envíen solicitudes de cotización a su ejecutivo comercial.

 Consulten el historial de cotizaciones y pedidos.

 Consulten sus compras acumuladas.

 Vean cuánto les falta para alcanzar el siguiente nivel.

 Consulten promociones.

 Gestionen sus datos.

 Accedan a recursos comerciales.

Por otro lado, TÖHÖ tendrá un Panel Administrativo completo para gestionar distribuidores, productos, catálogo, precios, inventarios, promociones, cotizaciones, pedidos, vendedores y contenido.

1. CONCEPTO GENERAL

La plataforma debe sentirse como una combinación entre:

 Un portal B2B premium.

 Un dashboard SaaS moderno.

 Un catálogo editorial de productos.

 Un sistema de cotizaciones.

NO debe sentirse como Shopify ni como una tienda de ecommerce tradicional.

El objetivo es que un distribuidor entre y sienta que tiene acceso a una plataforma profesional exclusiva de TÖHÖ.

El diseño debe inspirarse en los mockups proporcionados.

Dirección visual

Usar:

 Diseño limpio.

 Mucho espacio en blanco.

 Tarjetas con bordes suaves.

 Bordes ligeramente redondeados.

 Sombras muy sutiles.

 Tipografía moderna y elegante.

 Jerarquía visual clara.

 Iconografía minimalista.

 Badges para estados.

 Elementos gráficos discretos.

 Animaciones suaves.

 Microinteracciones.

 Diseño responsive.

La interfaz debe sentirse premium, tecnológica y profesional.

No utilizar una estética genérica de dashboard administrativo.

2. ESTRUCTURA GENERAL DE LA APLICACIÓN

La aplicación tendrá dos grandes tipos de usuarios:

DISTRIBUIDOR

Puede:

 Ver Dashboard.

 Ver Catálogo.

 Crear cotizaciones.

 Ver sus cotizaciones.

 Ver pedidos.

 Ver historial.

 Ver favoritos.

 Ver promociones.

 Ver recursos.

 Ver perfil.

 Consultar su nivel.

 Consultar descuentos.

 Consultar compras acumuladas.

ADMINISTRADOR

Puede administrar absolutamente todo:

 Distribuidores.

 Usuarios.

 Vendedores.

 Productos.

 Marcas.

 Categorías.

 Inventario.

 Precios.

 Promociones.

 Catálogo.

 Cotizaciones.

 Pedidos.

 Contenido.

 Recursos.

 Estadísticas.

3. LOGIN

Los distribuidores NO podrán registrarse por su cuenta.

Las cuentas serán creadas exclusivamente por TÖHÖ desde el Panel Administrativo.

Al crear una cuenta se asignará:

 Nombre.

 Empresa.

 RFC.

 Email.

 Teléfono.

 Dirección.

 Usuario/email.

 Contraseña.

 Nivel.

 Vendedor asignado.

Niveles:

BRONZE

20% de descuento.

SILVER

25% de descuento.

GOLD

30% de descuento.

El distribuidor podrá iniciar sesión libremente una vez que TÖHÖ haya creado y activado su cuenta.

Debe existir recuperación de contraseña.

El administrador también debe poder:

 Cambiar contraseña.

 Restablecer acceso.

 Desactivar cuenta.

 Reactivar cuenta.

4. VENDEDORES

Actualmente existen dos vendedores:

Carlos

Atiende:

 Bronze

 Silver

Xime

Atiende:

 Gold

Pero NO hacer esto rígido en código.

El administrador debe poder cambiar el vendedor asignado desde el panel.

Cada distribuidor debe tener un vendedor asignado.

5. DASHBOARD DEL DISTRIBUIDOR

El dashboard debe inspirarse directamente en el mockup proporcionado.

Debe mostrar:

Encabezado

Ejemplo:

Bienvenido, Ricardo

Mostrar:

 Nombre del distribuidor.

 Empresa.

 Nivel.

 Ejecutivo asignado.

Ejemplo:

Ricardo Mendoza

Ferretería Mendoza & Hijos
Ejecutivo: Carlos

6. PROGRESO DE NIVEL

Mostrar una tarjeta grande:

PROGRESO DE NIVEL

Ejemplo:

Silver → Gold

Mostrar:

Te faltan $112,550 para alcanzar Gold

Mostrar barra de progreso.

También mostrar:

 Compras acumuladas.

 Meta del siguiente nivel.

 Porcentaje de progreso.

Los límites deben ser configurables desde el panel administrativo.

NO hardcodear los valores.

7. TARJETAS DEL DASHBOARD

Mostrar tarjetas como:

NIVEL ACTUAL

Silver

DESCUENTO VIGENTE

25%

Sobre precio lista.

COMPRAS ACUMULADAS

$187,450

COTIZACIONES ACTIVAS

3

Las cifras deben venir de la base de datos.

8. COTIZACIONES RECIENTES

Mostrar una tabla:

 ID cotización.

 Fecha.

 Número de productos.

 Total.

 Estado.

 Acciones.

Ejemplo:

COT-2026-0089
20/06/2026
12 productos
$34,580
Pendiente

Estados:

 Borrador

 Pendiente

 En revisión

 Aprobada

 Confirmada

 Rechazada

 Cancelada

Permitir:

 Ver.

 Duplicar.

 Descargar PDF.

 Continuar cotización.

9. PEDIDOS CONFIRMADOS

Mostrar:

 ID pedido.

 Fecha.

 Productos.

 Total.

 Estado.

Estados:

 Pedido recibido

 En revisión

 Disponibilidad confirmada

 Pedido aprobado

 En preparación

 Enviado

 Entregado

 Cancelado

10. PROMOCIONES

El dashboard debe tener una sección:

Promociones Exclusivas

Mostrar tarjetas visuales de productos promocionados.

Cada promoción puede tener:

 Imagen.

 Marca.

 Producto.

 Precio anterior.

 Precio promocional.

 Badge.

Ejemplos:

 OFERTA

 NUEVO

 ÚLTIMAS PIEZAS

 LIQUIDACIÓN

 REMATE

El administrador podrá crear y modificar promociones.

11. CATÁLOGO

El catálogo será un módulo dentro de TÖHÖ HUB.

NO debe parecer una tienda tradicional.

Debe sentirse como un catálogo digital premium.

El distribuidor podrá navegar por:

 Marcas.

 Categorías.

 Promociones.

 Productos nuevos.

 Productos destacados.

Marcas iniciales:

 Leatherman

 Ledlenser

 Gerber

 Olight

 Coast

 Fenix

 GearWrench

 Nitecore

 4Monster

 Wooderful Life

Pero las marcas deben ser completamente administrables.

12. DISEÑO DEL CATÁLOGO

La vista principal debe utilizar tarjetas visuales grandes.

Cada tarjeta debe mostrar únicamente información esencial:

 Imagen.

 Marca.

 Nombre.

 SKU.

 Estado de disponibilidad.

 Precio lista.

 Precio distribuidor.

 Descuento.

 Botón para agregar a cotización.

NO saturar la tarjeta con especificaciones.

La experiencia debe priorizar fotografía de producto y diseño.

13. FILTROS

El catálogo debe permitir filtrar por:

Marca

Categoría

Disponibilidad

 Disponible

 Bajo inventario

 Consultar existencia

 Agotado

Precio

Mínimo / máximo.

Promociones

Mostrar solamente productos promocionados.

Buscar

Buscar por:

 SKU.

 Nombre.

 Marca.

 Categoría.

También permitir ordenar:

 Relevancia.

 Precio menor a mayor.

 Precio mayor a menor.

 Nombre A-Z.

 Nombre Z-A.

 Más nuevos.

 Más vendidos.

14. INVENTARIO

NO mostrar cantidades exactas al distribuidor.

Solo mostrar:

🟢 Disponible

🟡 Bajo inventario

🔵 Consultar existencia

🔴 Agotado

Sin embargo, el distribuidor podrá solicitar cualquier cantidad.

Por ejemplo:

Stock visual:

Bajo inventario

El usuario puede solicitar:

20 unidades

El sistema NO debe impedirlo.

La solicitud será revisada posteriormente por el vendedor.

15. PRODUCTO

Al hacer clic en una tarjeta se abre la página completa del producto.

Esta página debe tener una experiencia visual similar a una página de producto premium de ecommerce, inspirada en la página actual de TOHO.

Debe incluir:

Galería

Hasta aproximadamente 6 imágenes.

Video

Un video asociado al producto.

Información

 Marca.

 Nombre.

 SKU.

 Descripción.

 Características.

 Especificaciones.

 Información adicional.

 Precio lista.

 Precio distribuidor.

 Porcentaje de descuento.

 Ahorro.

 Disponibilidad.

Ejemplo:

Precio lista:

$2,890

Precio distribuidor:

$2,168

Silver · 25% OFF

Ahorras:

$722

16. PRODUCTOS Y PRECIOS

Cada producto debe tener:

 SKU.

 Nombre.

 Marca.

 Categoría.

 Precio lista.

 Inventario.

 Estado.

 Descripción.

 Características.

 Especificaciones.

 Imágenes.

 Video.

 Promoción.

 Orden.

 Fecha de creación.

El precio mostrado al distribuidor debe calcularse automáticamente según su nivel.

Bronze

Precio lista × 0.80

Silver

Precio lista × 0.75

Gold

Precio lista × 0.70

NO almacenar precios Bronze/Silver/Gold manualmente si no es necesario.

El sistema debe calcularlos automáticamente a partir del precio lista y del descuento configurado.

17. IMPORTACIÓN DE EXCEL

Esta función es MUY importante.

El administrador debe poder cargar productos mediante Excel/CSV.

La importación debe poder manejar:

 SKU.

 Nombre.

 Marca.

 Categoría.

 Precio lista.

 Stock.

 Estado.

 Descripción.

 Características.

 Especificaciones.

 Imagen principal.

 Imágenes adicionales.

 Video.

 Promoción.

Debe existir una interfaz:

Importar productos

 Descargar plantilla.

 Subir Excel.

 Validar información.

 Mostrar errores.

 Previsualizar cambios.

 Confirmar importación.

Si un SKU ya existe:

Actualizar producto

Si no existe:

Crear producto

Nunca duplicar productos por error.

18. ADMINISTRACIÓN INDIVIDUAL

También debe ser posible crear productos manualmente.

El administrador podrá:

 Crear.

 Editar.

 Duplicar.

 Desactivar.

 Eliminar.

 Cambiar imágenes.

 Cambiar precio.

 Cambiar inventario.

 Cambiar marca.

 Cambiar categoría.

 Cambiar promoción.

19. COTIZACIÓN

La cotización funciona como un carrito tradicional, pero NO existe checkout.

El botón principal debe decir:

Agregar a cotización

Nunca:

"Comprar"

"Comprar ahora"

"Checkout"

20. CARRITO / MI COTIZACIÓN

Debe existir una sección:

Mi Cotización

Mostrar:

 Producto.

 SKU.

 Precio lista.

 Precio distribuidor.

 Cantidad.

 Subtotal.

 Ahorro.

Permitir modificar cantidades.

Ejemplo:

Wave+
10 unidades
$2,168 c/u
Subtotal $21,680

21. RESUMEN DE COTIZACIÓN

Mostrar:

Subtotal precio lista.

Descuento Silver 25%.

Ahorro total.

Total estimado.

Ejemplo:

Subtotal:

$113,820

Descuento:

-$30,756

Total estimado:

$83,064 MXN

Mostrar claramente:

Esta cotización es un estimado. El total final puede variar según disponibilidad y condiciones comerciales vigentes.

22. COMENTARIOS

Antes de enviar:

Campo:

Comentarios para tu ejecutivo

Ejemplo:

Necesito entrega antes del 30 de junio.

23. ENVÍO DE COTIZACIÓN

Al hacer clic:

Enviar solicitud a Carlos

Debe:

 Generar número automático.

Ejemplo:

COT-2026-0090

 Guardar cotización.

 Asociar distribuidor.

 Asociar vendedor.

 Guardar productos.

 Guardar cantidades.

 Guardar precios en el momento de la solicitud.

 Guardar descuento aplicado.

 Guardar comentarios.

 Enviar notificación al vendedor.

24. NOTIFICACIONES

El vendedor debe recibir:

Email

Nuevo pedido/cotización.

Ejemplo:

Nueva cotización #COT-2026-0090

Distribuidor:

Ferretería Mendoza & Hijos

Nivel:

Silver

Vendedor:

Carlos

Total estimado:

$83,064

Productos:

10 × Wave+
5 × MH10
8 × Warrior 3
15 × Suspension NXT
20 × Curl Multitool

Comentarios del distribuidor.

25. NOTIFICACIÓN POR WHATSAPP

También debe existir una opción para enviar la notificación mediante WhatsApp.

La arquitectura debe permitir integrar posteriormente WhatsApp Business API.

No depender exclusivamente de WhatsApp para el funcionamiento.

El sistema debe seguir funcionando aunque WhatsApp no esté conectado.

26. INVENTARIO AL APROBAR

IMPORTANTE:

El inventario NO se descuenta cuando el distribuidor genera la cotización.

El inventario solamente se descuenta cuando el vendedor:

APRUEBA EL PEDIDO

Esto debe evitar que las cotizaciones bloqueen inventario innecesariamente.

27. PANEL DEL VENDEDOR / ADMIN

El vendedor debe poder revisar:

 Nuevas cotizaciones.

 Distribuidor.

 Nivel.

 Productos.

 Cantidades solicitadas.

 Inventario.

 Precio.

 Descuento.

 Total.

 Comentarios.

Y cambiar el estado.

28. ESTADOS

Utilizar exactamente este flujo:

Pedido recibido

↓

En revisión

↓

Disponibilidad confirmada

↓

Pedido aprobado

↓

En preparación

↓

Enviado

↓

Entregado

También permitir:

Rechazado

Cancelado

29. PANEL ADMINISTRATIVO

Crear un panel completo.

Menú:

Dashboard

Distribuidores

Productos

Marcas

Categorías

Inventario

Cotizaciones

Pedidos

Promociones

Catálogo

Recursos

Vendedores

Estadísticas

Configuración

30. DISTRIBUIDORES

El administrador podrá:

 Crear.

 Editar.

 Desactivar.

 Cambiar contraseña.

 Cambiar nivel.

 Cambiar vendedor.

 Ver historial.

 Ver compras.

 Ver cotizaciones.

 Ver pedidos.

Perfil del distribuidor:

 Nombre.

 Empresa.

 RFC.

 Email.

 Teléfono.

 Dirección.

 Nivel.

 Descuento.

 Vendedor.

 Compras acumuladas.

 Fecha de registro.

 Última actividad.

31. COMPRAS ACUMULADAS

El sistema debe calcular automáticamente:

Compras acumuladas

Con base en pedidos aprobados/completados.

NO contar cotizaciones rechazadas.

NO contar borradores.

NO contar cotizaciones pendientes.

32. NIVELES

Configurar:

Bronze → 20%

Silver → 25%

Gold → 30%

Pero los porcentajes deben poder modificarse desde administración.

También configurar las metas.

Ejemplo:

Silver → Gold
Meta: $300,000

Mostrar:

Te faltan $112,550 para alcanzar Gold.

33. FAVORITOS

Los distribuidores podrán marcar productos como favoritos.

Crear sección:

Favoritos

34. HISTORIAL

Mostrar:

 Cotizaciones.

 Pedidos.

 Fechas.

 Totales.

 Estados.

Permitir buscar y filtrar.

35. CENTRO DE RECURSOS

Crear sección donde TÖHÖ pueda subir recursos para distribuidores:

 Catálogos.

 PDFs.

 Fichas técnicas.

 Imágenes.

 Videos.

 Material comercial.

 Logos.

 Banners.

El administrador podrá crear categorías.

36. PERFIL

El distribuidor podrá consultar:

 Nombre.

 Empresa.

 RFC.

 Email.

 Teléfono.

 Dirección.

 Vendedor.

 Nivel.

Permitir editar información autorizada.

Los campos sensibles pueden requerir intervención administrativa.

37. PANEL ADMINISTRATIVO — ESTADÍSTICAS

Mostrar métricas:

 Distribuidores activos.

 Cotizaciones del mes.

 Pedidos del mes.

 Ventas confirmadas.

 Productos más cotizados.

 Marcas más solicitadas.

 Distribuidores con mayor compra.

 Cotizaciones pendientes.

 Pedidos pendientes.

Utilizar gráficos limpios.

38. CATÁLOGO ADMINISTRABLE

El administrador debe poder organizar el catálogo.

Debe poder:

 Crear secciones.

 Cambiar orden.

 Destacar productos.

 Destacar marcas.

 Crear banners.

 Crear colecciones.

 Cambiar orden de productos.

Permitir ordenar productos por:

 Precio.

 Nombre.

 SKU.

 Fecha.

 Manual.

La interfaz debe permitir modificar el orden sin tocar código.

39. EXPERIENCIA VISUAL DEL CATÁLOGO

Este punto es MUY importante.

Quiero que el catálogo tenga una experiencia mucho más visual que una cuadrícula ecommerce tradicional.

La tarjeta debe funcionar como una pieza editorial.

Fotografía grande.

Información mínima.

Diseño limpio.

Al hacer clic:

Producto → Página de producto completa

No quiero que la tarjeta tenga toda la ficha técnica.

La tarjeta únicamente necesita:

Imagen

Marca

Nombre

SKU

Disponibilidad

Precio distribuidor

Descuento

Agregar a cotización

40. RESPONSIVE

La aplicación debe funcionar perfectamente en:

 Desktop.

 Laptop.

 Tablet.

 Mobile.

En mobile:

El menú lateral debe convertirse en navegación móvil.

El carrito/cotización debe ser fácilmente accesible.

Las tarjetas de productos deben adaptarse.

Las tablas deben convertirse en tarjetas cuando sea necesario.

41. TECNOLOGÍA

La aplicación debe construirse utilizando una arquitectura moderna y escalable.

Preferencia:

Frontend: React / Next.js

Backend: Supabase

Base de datos: PostgreSQL mediante Supabase

Autenticación: Supabase Auth

Storage: Supabase Storage

La aplicación debe poder desplegarse posteriormente en:

Vercel

No depender de Shopify.

La plataforma será independiente de:

toho.com.mx

NO crear integración con Shopify por ahora.

42. BASE DE DATOS

Diseñar correctamente las relaciones entre:

users

distributors

sellers

brands

categories

products

product_images

product_videos

inventory

quotes

quote_items

orders

order_items

promotions

favorites

resources

notifications

catalog_sections

catalog_items

level_settings

activity_logs

Utilizar relaciones apropiadas y UUIDs.

No duplicar información innecesariamente.

43. SEGURIDAD

Es fundamental implementar permisos por rol.

Un distribuidor:

NO puede ver otros distribuidores.

NO puede ver cotizaciones de otros.

NO puede modificar precios.

NO puede modificar inventario.

NO puede modificar descuentos.

NO puede acceder al panel administrativo.

NO puede acceder a información interna.

El administrador tiene acceso completo.

Utilizar Row Level Security de Supabase correctamente.

44. PRECIOS

Los precios son confidenciales.

Un distribuidor solamente puede ver:

Precio lista.

Su precio distribuidor.

Su descuento.

Nunca debe poder consultar directamente precios de otros niveles.

Ejemplo:

Un Silver:

Precio lista: $2,890

Precio Silver: $2,168

No mostrar:

Bronze: $2,312

Gold: $2,023

45. EXPERIENCIA DE USUARIO

Quiero una experiencia muy fluida.

Por ejemplo:

Entrar:

Bienvenido, Ricardo

↓

Ver:

Silver · 25%

↓

Ver:

Te faltan $112,550 para Gold

↓

Explorar promociones.

↓

Entrar a:

Catálogo

↓

Ver producto.

↓

Agregar:

10 unidades

↓

Ir a:

Mi Cotización

↓

Revisar ahorro.

↓

Agregar comentario.

↓

Enviar solicitud a Carlos

↓

Mostrar:

Cotización enviada correctamente

COT-2026-0090

Tu ejecutivo Carlos recibió tu solicitud y revisará disponibilidad.

46. REGLAS IMPORTANTES

NO agregar pagos.

NO agregar checkout.

NO agregar registro público.

NO mostrar cantidades exactas de inventario.

NO descontar inventario al crear cotización.

NO permitir que el distribuidor modifique precios.

NO permitir que el distribuidor vea otros distribuidores.

NO depender de Shopify.

NO diseñar una tienda ecommerce tradicional.

47. DISEÑO

Tomar como referencia los mockups proporcionados por el usuario.

Mantener:

 Sidebar.

 Dashboard modular.

 Tarjetas.

 Indicadores.

 Tablas.

 Badges.

 Barra de progreso.

 Botones turquesa.

 Gris claro.

 Blanco.

 Tipografía moderna.

 Espaciado generoso.

Pero mejorar la experiencia para que se sienta propia de TÖHÖ HUB.

El logo debe utilizarse como:

TÖHÖ Hub

La plataforma debe transmitir:

Profesionalidad + exclusividad + tecnología + outdoor + herramientas.

48. NO CREAR TODO COMO UN MOCKUP ESTÁTICO

Quiero una aplicación funcional.

Los botones deben funcionar.

Los formularios deben guardar información.

Las cotizaciones deben persistir.

Los usuarios deben autenticarse.

Los descuentos deben calcularse automáticamente.

Los productos deben venir de la base de datos.

La importación Excel debe funcionar.

Los estados deben actualizarse.

Las relaciones entre distribuidores, vendedores, cotizaciones y pedidos deben funcionar.

No crear datos falsos como solución definitiva.

Utilizar datos demo únicamente para mostrar la interfaz inicialmente.

49. DESARROLLO POR ETAPAS

NO intentar construir todo sin estructura.

Primero crear:

FASE 1

Arquitectura.

Base de datos.

Autenticación.

Roles.

Panel administrativo básico.

Distribuidores.

Vendedores.

Niveles.

FASE 2

Productos.

Marcas.

Categorías.

Inventario.

Importación Excel.

Precios.

Descuentos.

FASE 3

Catálogo.

Página de producto.

Filtros.

Búsqueda.

Favoritos.

Promociones.

FASE 4

Cotizaciones.

Carrito.

Cantidades.

Comentarios.

PDF.

Envío.

Notificaciones.

FASE 5

Pedidos.

Estados.

Inventario al aprobar.

Historial.

FASE 6

Dashboard.

Estadísticas.

Progreso de niveles.

Centro de recursos.

FASE 7

Pulido visual.

Responsive.

Animaciones.

Microinteracciones.

Optimización.

Seguridad.

50. OBJETIVO FINAL

El resultado debe ser una plataforma llamada:

TÖHÖ HUB

que funcione como el centro digital de operaciones para nuestros distribuidores.

El distribuidor no debe sentir que está entrando a una simple tienda.

Debe sentir que está entrando a su portal profesional exclusivo de TÖHÖ.

La experiencia principal debe ser:

Dashboard → Catálogo → Producto → Cotización → Ejecutivo → Pedido → Historial

y todo debe estar conectado.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6b46d27d-c3a8-4f74-a75b-a81b3380f5a2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
