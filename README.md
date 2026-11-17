# CONGENIA: Sistema de Apoyo a la Decisión Clínica para Condiciones Genéticas Pediátricas - Módulo de Interfaz de Usuario

## Descripción

El Hospital Regional de Cobán no cuenta con un registro estructurado de los pacientes
pediátricos y neonatales con sospecha de condiciones genéticas, y estos casos pueden perderse
en el texto libre del Sistema de Información Hospitalaria SADC. CONGENIA es una plataforma,
desarrollada por un equipo multidisciplinario, que atiende ese problema. Este repositorio
contiene su **módulo de interfaz de usuario**: la aplicación web con la que cada perfil del
hospital trabaja en el sistema.

La aplicación se compone de tres interfaces:

- **Ficha clínica móvil (residentes de Pediatría).** El médico inicia sesión, busca al paciente
  por número de historia clínica en SADC (o lo registra manualmente si no existe) y llena la
  ficha: datos de la consulta, datos demográficos y familiares, consentimiento informado
  firmado en pantalla por el padre, madre o representante legal, signos de alerta con fotografías
  de los hallazgos dismórficos, estudios de gabinete y observaciones. Una vez enviada, los cambios posteriores se solicitan como **adendas**.
- **Validación CIE-10 (estadista).** Una interfaz *human-in-the-loop* en la que el estadista
  revisa por lotes los códigos CIE-10 sugeridos por inteligencia artificial para cada
  diagnóstico y los acepta, corrige o rechaza antes de confirmar el lote.
- **Panel de consulta (personal administrativo).** Reportería con gráficas sobre la producción
  ambulatoria y las fichas registradas, y un agente conversacional que responde preguntas sobre
  esa información agregada sin mostrar datos de pacientes individuales.

El panel incluye además la búsqueda de fichas registradas y la revisión de adendas, en la que el
médico responsable aprueba o rechaza los cambios que solicitó el residente. El acceso se controla
por rol mediante inicio de sesión con Keycloak (OpenID Connect).

Este módulo es solo el frontend, por lo que consume la API del backend de CONGENIA.

## Tecnologías Utilizadas

- React 19 y TypeScript 5.9
- Vite 8 (servidor de desarrollo y build)
- React Router 7
- Recharts (gráficas de reportería)
- oidc-client-ts (autenticación OpenID Connect con Keycloak)
- jsPDF y pdf.js (generación y visualización de PDF)
- Vitest y Storybook (pruebas unitarias y catálogo de componentes)
- ESLint (análisis estático)
- Docker y Nginx (imagen de producción)

## Requisitos Previos

- Node.js v22 o superior (versión indicada en `src/.nvmrc`)
- pnpm 11.23.0 (se activa con Corepack, incluido en Node.js; la versión está fijada en `src/package.json`)
- Para usar el sistema con datos reales: la API del backend de CONGENIA y un servidor Keycloak con el realm `congenia` y el cliente `congenia-web`
- Docker (opcional, solo para construir la imagen de producción)

## Instalación

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/lemoonchild/2026-22473-castro-morales-madeline-nahomy.git
   cd 2026-22473-castro-morales-madeline-nahomy
   ```

2. Instalar dependencias:

   ```bash
   cd src
   corepack enable
   pnpm install --frozen-lockfile
   ```

3. Configurar variables de entorno (desde la carpeta `src`):

   ```bash
   cp .env.example .env
   # Editar .env con las configuraciones correspondientes
   ```

   Para conectarse al backend, definir `VITE_API_BASE_URL` (URL de la API), `VITE_OIDC_AUTHORITY`
   (URL del realm de Keycloak) y `VITE_OIDC_CLIENT_ID`, y dejar `VITE_ALLOW_DEV_SESSION=false`.

   Para revisar la interfaz **sin backend ni Keycloak**, usar en cambio:

   ```env
   VITE_APP_ENV=development
   VITE_ALLOW_DEV_SESSION=true
   VITE_USE_FICHA_SEARCH_MOCK=true
   ```

   Así se abre una sesión de desarrollo con un médico ficticio con todos los permisos, y la
   búsqueda de fichas, la revisión de adendas y la validación CIE-10 usan datos de prueba. La
   reportería sí necesita la API.

4. Ejecutar el proyecto:

   ```bash
   pnpm dev
   ```

   La aplicación queda disponible en `http://localhost:5173`: la ficha clínica en `/` y el panel en
   `/dashboard`.

### Otros comandos

Desde la carpeta `src`:

| Comando | Descripción |
|---|---|
| `pnpm build` | Verificación de tipos y build de producción en `dist/` |
| `pnpm preview` | Sirve localmente el build de `dist/` |
| `pnpm test` | Pruebas unitarias con Vitest |
| `pnpm lint` | Análisis estático con ESLint |
| `pnpm storybook` | Catálogo de componentes con datos de prueba en `http://localhost:6006` |

El README de [`src/`](./src/README.md) documenta todas las variables de entorno, la imagen de
Docker y la estructura del código.

## Capturas

Las capturas de pantalla del sistema se encuentran en [`/capturas`](./capturas), ordenadas
según el flujo de uso:

| Capturas | Contenido |
|---|---|
| 01–02 | Inicio de sesión y búsqueda de pacientes (móvil) |
| 03–30 | Llenado de la ficha clínica: consulta, datos demográficos, consentimiento informado, signos de alerta, estudios de gabinete, observaciones y ficha guardada |
| 31–42 | Solicitud de adenda: agregar o reemplazar signos y exámenes, y enviar la solicitud |
| 43–46 | Registro manual de un paciente que no existe en SADC |
| 47–48 | Panel: búsqueda de fichas y detalle de un registro |
| 49–54 | Validación CIE-10: lotes, sugerencias de la IA, corrección y declaración de responsabilidad |
| 55–57 | Reportería y agente conversacional de datos |
| 58–60 | Revisión de adendas por el médico responsable |

## Demo

El video demostrativo se encuentra en [`/demo/demo.mp4`](./demo/demo.mp4).

## Documentación

- El informe final del proyecto está disponible en [`/docs/informe_final.pdf`](./docs/informe_final.pdf).
- El consentimiento de uso de foto y video firmado se encuentra en [`/docs/consentimiento_firmado.pdf`](./docs/consentimiento_firmado.pdf).

## Autores

- Madeline Nahomy Castro Morales — 22473

Asesor: Gabriel Brolo

## Licencia

Este proyecto se distribuye bajo la licencia [MIT](./src/LICENSE).
