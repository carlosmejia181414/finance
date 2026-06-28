# Mi Balance - JSON DB v2

Esta app guarda la información en `db.json`, no en cookies ni en el navegador.

## Funciones incluidas

- Menú lateral:
  - Registrar movimientos
  - Categorías
  - Gráficos
  - Data analytics
- Categorías en combo box.
- Sección para agregar, modificar y eliminar categorías.
- Ingresos, gastos fijos recurrentes y gastos variables.
- Gastos fijos recurrentes que se repiten cada mes.
- Tabla al costado del gráfico con monto, categoría, descripción, tipo y acción.
- Segundo gráfico con reporte estadístico por categoría.
- Gráfico anual de ingresos, gastos y ahorro.
- Data analytics con tasa de ahorro, tasa de gasto, top categorías e insights automáticos.

## Cómo probarla

Necesitas tener Node.js instalado.

1. Descomprime el ZIP.
2. Abre la carpeta en Visual Studio Code.
3. En la terminal ejecuta:

```bash
npm start
```

4. Abre en el navegador:

```txt
http://localhost:3000
```

No abras `index.html` directamente, porque esta versión necesita el servidor para escribir en `db.json`.
