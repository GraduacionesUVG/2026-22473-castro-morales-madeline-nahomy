# CONGENIA M1: Frontend

Aplicación web de CONGENIA para el registro de la **ficha clínica genética** y el **dashboard** de seguimiento (búsqueda de fichas, revisión de adendas, corrección CIE-10 y reportería con agente de datos).

Construida con React 19, TypeScript, Vite, React Router, Recharts y `oidc-client-ts` (inicio de sesión con Keycloak).

El backend vive en un repositorio aparte: [CONGENIA-M1-SERVER](https://github.com/CONGENIAGT/CONGENIA-M1-SERVER).

## Requisitos

| Herramienta | Versión |
|---|---|
| Node.js | 22 o superior (ver `.nvmrc`) |
| pnpm | 11.23.0 (fijado en `package.json`, se activa con Corepack) |
| Docker | Opcional, solo para la imagen de producción |

## Instalación

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
```

## Ejecución en desarrollo

```bash
pnpm dev
```

La aplicación queda en `http://localhost:5173`:

- `/`: captura de la ficha clínica.
- `/dashboard`: dashboard (requiere el permiso `dashboard`).

### Sin backend ni Keycloak

Para revisar la interfaz sin levantar los demás servicios, en `.env`:

```env
VITE_APP_ENV=development
VITE_ALLOW_DEV_SESSION=true
VITE_USE_FICHA_SEARCH_MOCK=true
```

Con eso se abre una sesión de desarrollo con un médico ficticio con todos los permisos, y la búsqueda de fichas, la bandeja de adendas y la corrección CIE-10 usan datos de prueba en memoria. La reportería sí necesita la API. Para ver todas las pantallas con datos sin ningún servicio está Storybook (`pnpm storybook`).

### Con backend

1. Levantar la API siguiendo el README de `CONGENIA-M1-SERVER` (por defecto en `http://localhost:3000`).
2. Levantar Keycloak con el realm `congenia` y el cliente `congenia-web`.
3. Ajustar `VITE_API_BASE_URL`, `VITE_OIDC_AUTHORITY` y `VITE_OIDC_CLIENT_ID` en `.env`, y dejar `VITE_ALLOW_DEV_SESSION=false`.

## Variables de entorno

Se leen de `.env` durante el desarrollo y el build. En el contenedor se pueden sobrescribir al arrancar con las mismas variables sin el prefijo `VITE_` (ver [Docker](#docker)).

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_BASE_URL` | URL base de la API de CONGENIA. Vacía significa mismo origen. | mismo origen |
| `VITE_OIDC_AUTHORITY` | URL del realm de Keycloak. | `<origen>/realms/congenia` |
| `VITE_OIDC_CLIENT_ID` | Cliente OIDC de la aplicación. | `congenia-web` |
| `VITE_APP_ENV` | Entorno: `development`, `test` o `production`. | `development` |
| `VITE_ALLOW_DEV_SESSION` | `true` activa la sesión de desarrollo sin Keycloak ni SADC. | `false` |
| `VITE_USE_FICHA_SEARCH_MOCK` | `true`/`false` fuerza los datos de prueba de la búsqueda de fichas. Vacía: activos solo con `APP_ENV=test`. | vacía |
| `VITE_USE_ADENDAS_MOCK` | `true`/`false` fuerza los datos de prueba de la bandeja de adendas. Vacía: activos con `APP_ENV` `development` o `test`. | vacía |
| `VITE_USE_CIE10_MOCK` | `true`/`false` fuerza los datos de prueba de la revisión CIE-10. Vacía: activos con `APP_ENV` `development` o `test`. | vacía |

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo con recarga en caliente. |
| `pnpm build` | Verificación de tipos y build de producción en `dist/`. |
| `pnpm preview` | Sirve localmente el build de `dist/`. |
| `pnpm lint` | Análisis estático con ESLint. |
| `pnpm test` | Pruebas unitarias con Vitest. |
| `pnpm storybook` | Catálogo de componentes en `http://localhost:6006`. |
| `pnpm build-storybook` | Build estático de Storybook en `storybook-static/`. |

## Docker

```bash
docker build -t congenia-frontend .
docker run --rm -p 8080:80 \
  -e API_BASE_URL=http://localhost:3000 \
  -e OIDC_AUTHORITY=http://localhost:8082/realms/congenia \
  -e APP_ENV=production \
  congenia-frontend
```

La aplicación queda en `http://localhost:8080`. Al arrancar, el script `docker-entrypoint.d/40-congenia-runtime-config.sh` genera `config.js` con las variables `API_BASE_URL`, `OIDC_AUTHORITY`, `OIDC_CLIENT_ID`, `APP_ENV`, `ALLOW_DEV_SESSION` y `USE_*_MOCK`, así que la misma imagen sirve para cualquier entorno sin reconstruirla.

## Estructura

```
src/
├── app/            Enrutador y rutas de la aplicación
├── components/
│   ├── forms/      Secciones y pantallas de la ficha clínica
│   └── ui/         Componentes base reutilizables
├── config/         Configuración de arranque y notificaciones
├── features/
│   ├── auth/       Sesión, permisos y guardas de ruta
│   ├── dashboard/  Búsqueda, adendas, CIE-10 y reportería
│   ├── ficha-clinica/      Conversión del formulario al modelo de la ficha
│   ├── ficha-provisional/  Fichas de pacientes que no existen en SADC
│   └── patient/            Visor de fichas registradas
├── hooks/          Hooks compartidos
├── services/       Clientes de la API y datos de prueba
├── types/          Tipos de dominio
└── utils/          Utilidades
```

Las pruebas unitarias están junto al código (`*.test.ts`) y las historias de Storybook junto a cada componente (`*.stories.tsx`).

## Licencia

[MIT](LICENSE)
