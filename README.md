# GymIA

Un ecosistema de entrenamiento inteligente potenciado por IA, diseñado para conectar a entrenadores y atletas con herramientas de última generación. Optimizado para dispositivos móviles y construido con un enfoque en rendimiento, diseño y escalabilidad.

## 🚀 Características Principales

### Para Entrenadores
- **Dashboard Avanzado**: Visualización completa de métricas de atletas, rutinas activas y carga de trabajo.
- **Gestión de Atletas**: Perfiles detallados, seguimiento de progreso y asignación de planes.
- **Constructor de Rutinas con IA**: Generación automática de planes de entrenamiento personalizados basados en objetivos, nivel y equipamiento.
- **Biblioteca de Ejercicios**: Gestión centralizada de ejercicios con categorización muscular detallada.

### Para Atletas
- **Modo Entreno (Live)**: Interfaz optimizada para el gimnasio con cronómetro de descanso, registro de series (RPE/Peso) y validación de PRs.
- **Progreso Visual**: Gráficos interactivos de volumen, frecuencia y medidas corporales.
- **Asistente IA en Tiempo Real**: 
  - Generación de calentamientos específicos.
  - Alternativas de ejercicios si el equipamiento está ocupado.
  - Chat contextual sobre técnica y ejecución.
- **Historial Completo**: Registro detallado de cada sesión y récord personal.

## 🛠️ Tech Stack

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router, Server Actions)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- **Iconos:** [Lucide React](https://lucide.dev/)
- **Base de Datos:** [Firebase Firestore](https://firebase.google.com/) (Admin SDK)
- **Autenticación:** [Auth.js (NextAuth v5)](https://authjs.dev/)
- **IA:** [Groq SDK](https://groq.com/) (Llama 3 / Mixtral)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Gestión de Estado:** Server State (React Query / Server Components) + Client State (Hooks)
- **Validación:** [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/)

## 🏗️ Estado del Proyecto (Refactorización Reciente)

El proyecto ha pasado por una refactorización mayor para garantizar robustez y mantenibilidad:
- **Tipado Estricto**: Eliminación del 95% de tipos `any`, implementando interfaces robustas (`Routine`, `Exercise`, `SetLog`, `Athlete`).
- **Arquitectura de Componentes**: Separación clara de responsabilidades en componentes de UI (`warmup-generator`, `train-console`, `workout-session`).
- **Mejoras de UI/UX**: Estandarización de estilos (bordes `rounded-4xl`, gradientes modernos), feedback visual mejorado y lazy loading de componentes pesados.

## ⚙️ Configuración Local

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repositorio-url>
   cd GymIA
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   pnpm install
   ```

3. **Variables de Entorno**
   Crea un archivo `.env` en la raíz con:
   ```env
   # Auth
   AUTH_SECRET="tu-secreto-generado"
   AUTH_URL="http://localhost:3000"

   # Firebase Admin (Service Account Minificada)
   FIREBASE_PROJECT_ID="tu-project-id"
   FIREBASE_CLIENT_EMAIL="tu-email-service-account"
   FIREBASE_PRIVATE_KEY="tu-private-key"

   # IA
   GROQ_API_KEY="tu-api-key-groq"
   ```

4. **Ejecutar**
   ```bash
   npm run dev
   ```

## 📄 Licencia

Este proyecto es privado y de uso personal.
