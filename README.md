# GymIA

Un asistente de entrenamiento inteligente potenciado por IA, construido con la última tecnología web.

## 🚀 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Estilos:** [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) + [Lucide Icons](https://lucide.dev/)
- **Base de Datos & Auth:** [Firebase](https://firebase.google.com/)
- **Autenticación:** [Auth.js (NextAuth)](https://authjs.dev/)
- **IA:** [Groq SDK](https://groq.com/)
- **Gestión de Estado:** [Zustand](https://zustand-demo.pmnd.rs/) + [React Query](https://tanstack.com/query/latest)
- **Validación:** [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/)

## 🛠️ Configuración del Proyecto

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio-url>
cd GymIA
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp .env.example .env
```

Asegúrate de llenar todas las variables en `.env`:

- **Firebase Public Config**: Obtenlas de la consola de Firebase.
- **Groq API Key**: Necesaria para las funciones de IA.
- **Auth Secret**: Genera uno seguro con `openssl rand -base64 32`.
- **Firebase Admin SDK**: Genera una nueva clave privada desde la consola de Firebase (Service Accounts) y pega el JSON minificado.

### 4. Ejecutar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Despliegue en Vercel

Este proyecto está optimizado para ser desplegado en [Vercel](https://vercel.com).

1. Importa tu repositorio en Vercel.
2. Configura las variables de entorno (Environment Variables) copiando los valores de tu `.env` local.
   - **IMPORTANTE**: Genera un nuevo `AUTH_SECRET` para producción.
   - Actualiza `AUTH_URL` con tu dominio de Vercel (ej. `https://tu-proyecto.vercel.app`).
3. Despliega.

## 📄 Licencia

Este proyecto es privado y de uso personal.
