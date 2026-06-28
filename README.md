# Mi Balance - JSON DB v3 Analytics

Esta versión amplía el módulo **Data analytics** para administrar y analizar mejor tus gastos.

La información se guarda en:

```txt
db.json
```

No usa cookies ni `localStorage`.

## Funciones incluidas

- Menú lateral:
  - Registrar movimientos
  - Categorías
  - Gráficos
  - Data analytics
- Categorías en combo box.
- Agregar, editar y eliminar categorías.
- Ingresos, gastos fijos recurrentes y gastos variables.
- Gastos fijos recurrentes automáticos cada mes.
- Tabla al costado del gráfico con monto, categoría, descripción, tipo y acción.
- Gráfico mensual.
- Gráfico por categoría.
- Gráfico anual.
- Gráfico de tendencia de gastos y ahorro.

## Data analytics avanzado

Incluye:

- Tasa de ahorro.
- Tasa de gasto.
- Gastos fijos sobre gastos totales.
- Gastos variables sobre gastos totales.
- Gasto diario estimado.
- Ahorro proyectado anual.
- Categoría más alta.
- Meses con datos.
- Top categorías del mes.
- Reporte 50/30/20.
- Comparativo vs mes anterior.
- Promedios anuales.
- Proyección anual.
- Alertas de gasto.
- Sugerencias automáticas.
- Insights generales.

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
