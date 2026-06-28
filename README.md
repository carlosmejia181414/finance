
# Mi Balance - Versión corregida responsive

Esta versión corrige problemas comunes y está optimizada para celular.

## Cómo probar

1. Descomprime el ZIP.
2. Abre la carpeta en Visual Studio Code.
3. Abre la terminal dentro de la carpeta.
4. Ejecuta:

```bash
npm start
```

5. Abre en el navegador:

```txt
http://localhost:3000
```

## Importante

No abras `index.html` directamente. Esta app necesita el servidor de Node.js para guardar datos en `db.json`.

## Qué incluye

- Diseño responsive para celular.
- Categorías en combo box.
- Agregar, editar y eliminar categorías.
- Ingresos, gastos fijos recurrentes y gastos variables.
- Gráficos mensuales, por categoría, anuales y tendencia.
- Data analytics con alertas, sugerencias, comparativos y proyección anual.
- Datos guardados en `db.json`.


## Data Analytics Pro agregado

Esta versión agrega reportes más avanzados:

- Panel financiero ejecutivo.
- Top categorías con % sobre ingreso y % sobre gasto.
- Pareto 80/20 para detectar las categorías que más pesan.
- Variación por categoría vs mes anterior.
- Compromisos recurrentes ordenados por día de pago.
- Análisis de gastos variables: frecuencia, ticket promedio, mínimo y máximo.
- Matriz anual por categoría y mes.
- Score financiero de 0 a 100.
- Calidad de datos: movimientos sin descripción, categorías sin uso, montos inválidos.
- Plan de optimización para acercarse a una meta de ahorro del 20%.
- Alertas, sugerencias e insights mejorados.


## Gráficos Pro agregado

La sección `Gráficos` ahora incluye más visualizaciones:

- Distribución mensual.
- Gasto por categoría.
- Ingresos, gastos y ahorro por mes.
- Tendencia de gastos y ahorro.
- Pareto de gastos.
- Porcentaje de gasto por categoría.
- Gastos fijos vs variables por mes.
- Ahorro acumulado anual.
- Gastos acumulados anuales.
- Ingreso vs gasto mensual.
- Score visual 50/30/20.
- Heatmap anual por categoría.
- Tabla resumen de indicadores gráficos.


## Corrección de puerto ocupado

Si el puerto 3000 está ocupado, la app ahora buscará automáticamente el siguiente puerto disponible:

- 3001
- 3002
- 3003
- etc.

Cuando ejecutes:

```bash
npm start
```

revisa la terminal. Ahí verás exactamente qué URL abrir, por ejemplo:

```txt
http://localhost:3001
```

## Gastos recurrentes

Los gastos fijos recurrentes se registran una sola vez y se repiten automáticamente todos los meses futuros desde la fecha original.

Ejemplo:

- Si registras `Renta` el 5 de enero, aparecerá el 5 de febrero, 5 de marzo, 5 de abril, etc.
- Si el día no existe en un mes, por ejemplo 31 de enero, en febrero se ajusta al último día válido.
