/** @type {import('next').NextConfig} */
const nextConfig = {
  // Schakel TypeScript-controle uit tijdens de build
  typescript: {
    // !! WAARSCHUWING !!
    // Typefouten worden genegeerd in productiebuilds.
    // Dit is alleen bedoeld voor het deployen met lint-fouten.
    ignoreBuildErrors: true,
  },
  // Schakel ESLint-controle uit tijdens de build
  eslint: {
    // !! WAARSCHUWING !!
    // ESLint-fouten worden genegeerd in productiebuilds.
    // Dit is alleen bedoeld voor het deployen met lint-fouten.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
