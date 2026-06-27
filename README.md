# Control de Balance con JSON como base de datos

Esta versión NO guarda la información en cookies, ni en `localStorage`, ni en el navegador.

Los datos se guardan en el archivo:

```txt
db.json
```

Ese archivo simula una base de datos simple.

## Funciones incluidas

- Registrar ingresos
- Registrar gastos fijos recurrentes
- Registrar gastos variables
- El saldo restante se muestra como `Ahorro`
- Los gastos fijos se registran una sola vez y se repiten cada mes
- Tabla al costado del gráfico mensual con:
  - Monto
  - Categoría
  - Descripción
  - Tipo de gasto
- Gráfico mensual
- Gráfico anual
- Exportar la base de datos en formato JSON

## Cómo usar la app

Necesitas tener Node.js instalado.

### 1. Abrir la carpeta del proyecto

En la terminal, entra a la carpeta:

```bash
cd balance_json_db_app
```

### 2. Iniciar el servidor

```bash
npm start
```

### 3. Abrir la app

En tu navegador abre:

```txt
http://localhost:3000
```

## Dónde se guardan los datos

Cada vez que agregas o eliminas un movimiento, se actualiza automáticamente el archivo:

```txt
db.json
```

Ejemplo:

```json
{
  "transactions": [
    {
      "id": "123",
      "date": "2026-06-05",
      "type": "fixed",
      "category": "Renta",
      "amount": 1200,
      "description": "Pago mensual"
    }
  ]
}
```

## Nota importante

No abras directamente `index.html` con doble clic, porque esta versión necesita el servidor local para poder leer y escribir en `db.json`.


## Editar gastos fijos recurrentes

En la tabla que aparece al costado del gráfico mensual, los gastos fijos tienen un botón `Editar`.

Al hacer clic:

1. El gasto fijo se carga en el formulario principal.
2. Puedes cambiar fecha, categoría, monto o descripción.
3. Presiona `Guardar cambios`.
4. El cambio se guarda en `db.json` y se aplica a toda la serie recurrente.

También puedes cancelar la edición con el botón `Cancelar edición`.
