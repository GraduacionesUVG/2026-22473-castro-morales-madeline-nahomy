/** Configuración de Vite: alias, servidor de desarrollo con cabeceras de seguridad y proyectos de prueba de Vitest. */

/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

const dirname = import.meta.dirname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['lucide-react', 'pdfjs-dist'],
  },
  server: {
    headers: {
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "connect-src 'self' https://*.amazonaws.com http://localhost:* ws://localhost:*",
        "img-src 'self' data: blob: https://*.amazonaws.com http://localhost:*",
        "frame-ancestors 'none'",
      ].join('; '),
    },
  },
  test: {
    projects: [{
      extends: true,
      test: {
        name: 'unit',
        environment: 'node',
        include: ['src/**/*.test.ts'],
      },
    }, {
      extends: true,
      plugins: [
        storybookTest({
          configDir: path.join(dirname, '.storybook')
        })
      ],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});
