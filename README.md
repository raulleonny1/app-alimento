# App Alimentos

PWA para distribución de alimentos en bolsas para beneficiados.

## Funciones

- **Beneficiados**: Registro con familiares y restricciones (diabetes / sensible al azúcar)
- **Alimentos**: Registro por código de barras con escáner de cámara
- **Distribución**: Divide productos entre beneficiados, excluyendo azúcar a quienes no pueden consumirlo
- **Historial**: Guarda cada sesión de distribución en Firestore

## Requisitos

- Node.js 18+
- Cuenta Firebase con Firestore habilitado

## Configuración de Firestore

En la consola de Firebase, crea una base de datos Firestore y configura estas reglas (modo desarrollo):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> Para producción, agrega autenticación y reglas más restrictivas.

## Instalación

```bash
npm install
npm run dev
```

Abre en el celular la URL que muestra Vite (usa la IP de tu red local).

## Instalar como PWA en Android

1. Abre la app en Chrome
2. Menú (⋮) → "Instalar aplicación" o "Agregar a pantalla de inicio"

## Build para producción

```bash
npm run build
npm run preview
```

Despliega la carpeta `dist/` en Firebase Hosting, Vercel o Netlify.
