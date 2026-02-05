import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Habilitar React Compiler para optimización automática
  reactCompiler: true,

  // Configuración de imágenes remotas
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google avatars
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.ytimg.com", // YouTube thumbnails
        pathname: "/**",
      },
    ],
  },

  // Optimización experimental de caché del cliente
  experimental: {
    staleTimes: {
      dynamic: 30, // Páginas dinámicas cachean 30 segundos
      static: 180, // Páginas estáticas cachean 3 minutos
    },
  },
};

export default nextConfig;

