---
layout: post
title: Onyx Docker Setup
author: josejuan
categories: ia
---

# Onyx Docker: Guía de Despliegue Completo

> **Versión:** 1.0 — Abril 2026
> **Onyx:** v3.2.3 (imagen `latest`)
> **Objetivo:** Levantar Onyx 100% funcional con un solo comando, sin configurar LLM ni servicios externos.
> **Tiempo estimado:** ~10 minutos (dependiendo de la velocidad de descarga).

---

## Índice

1. [Qué se despliega](#1-qué-se-despliega)
2. [Requisitos previos](#2-requisitos-previos)
3. [Despliegue rápido (copy-paste)](#3-despliegue-rápido-copy-paste)
4. [Verificación](#4-verificación)
5. [Persistencia de datos](#5-persistencia-de-datos)
6. [Operaciones habituales](#6-operaciones-habituales)
7. [Configuración del LLM](#7-configuración-del-llm)
8. [Personalización](#8-personalización)
9. [Limpieza total](#9-limpieza-total)
10. [Troubleshooting](#10-troubleshooting)
11. [Referencia de servicios](#11-referencia-de-servicios)

---

## 1. Qué se despliega

Onyx en modo **Standard** levanta **12 contenedores** totalmente autocontenidos:

| Servicio | Imagen | Función |
|----------|--------|---------|
| `api_server` | `onyxdotapp/onyx-backend` | API REST principal |
| `background` | `onyxdotapp/onyx-backend` | Workers Celery (indexación, tareas) |
| `web_server` | `onyxdotapp/onyx-web-server` | Frontend Next.js |
| `nginx` | `nginx:1.25.5-alpine` | Reverse proxy (puerto 80/3000) |
| `relational_db` | `postgres:15.2-alpine` | Base de datos principal |
| `index` | `vespaengine/vespa` | Motor de búsqueda vectorial |
| `opensearch` | `opensearchproject/opensearch` | Indexación full-text |
| `cache` | `redis:7.4-alpine` | Caché y broker Celery |
| `minio` | `minio/minio` | Almacenamiento de ficheros (S3-compatible) |
| `inference_model_server` | `onyxdotapp/onyx-model-server` | Modelos de embeddings (inferencia) |
| `indexing_model_server` | `onyxdotapp/onyx-model-server` | Modelos de embeddings (indexación) |
| `code-interpreter` | `onyxdotapp/code-interpreter` | Ejecución de código Python |

**Espacio en disco para imágenes:** ~17 GB
**RAM mínima recomendada:** 10 GB (16 GB ideal)

**No se configura ningún LLM.** Onyx arrancará y funcionará, pero para usar el chat necesitarás configurar un proveedor LLM desde el panel de administración (ver [sección 7](#7-configuración-del-llm)).

---

## 2. Requisitos previos

- **Docker Engine** ≥ 24.0
- **Docker Compose** ≥ 2.24.0 (plugin `docker compose`, no `docker-compose` legacy)
- **Puertos libres:** 80 y 3000 (ambos mapean al nginx de Onyx)
- **RAM disponible:** ≥ 10 GB
- **Disco libre:** ≥ 20 GB
- **`openssl`** (para generar el secreto de autenticación)
- **`curl`** (para descargar ficheros de configuración)

Verificar:

```bash
docker --version          # Docker version 24.x+
docker compose version    # Docker Compose version v2.24.0+
free -h                   # Mem total >= 10 GB
df -BG .                  # Disco libre >= 20 GB
```

---

## 3. Despliegue rápido (copy-paste)

### Paso único: ejecutar este bloque

Elige dónde instalar Onyx definiendo `ONYX_DIR`. Por defecto:

```bash
export ONYX_DIR="${ONYX_DIR:-$HOME/onyx_deploy}"
```

Luego ejecuta el bloque completo:

```bash
#!/bin/bash
set -e

# ── Directorio de instalación ──────────────────────────────────────
export ONYX_DIR="${ONYX_DIR:-$HOME/onyx_deploy}"
GITHUB_RAW="https://raw.githubusercontent.com/onyx-dot-app/onyx/main/deployment"

echo "📁 Creando estructura en $ONYX_DIR ..."
mkdir -p "$ONYX_DIR/deployment"
mkdir -p "$ONYX_DIR/data/nginx/local"

# ── Descargar ficheros de configuración ────────────────────────────
echo "⬇️  Descargando configuración de GitHub ..."
curl -fsSL -o "$ONYX_DIR/deployment/docker-compose.yml" \
  "$GITHUB_RAW/docker_compose/docker-compose.yml"

for f in app.conf.template run-nginx.sh mcp_upstream.conf.inc.template mcp.conf.inc.template; do
  curl -fsSL -o "$ONYX_DIR/data/nginx/$f" "$GITHUB_RAW/data/nginx/$f"
done
chmod +x "$ONYX_DIR/data/nginx/run-nginx.sh"

# ── Crear .env ─────────────────────────────────────────────────────
echo "🔧 Generando .env ..."
USER_AUTH_SECRET=$(openssl rand -hex 32)

cat > "$ONYX_DIR/deployment/.env" << EOF
IMAGE_TAG=latest
AUTH_TYPE=basic
USER_AUTH_SECRET="${USER_AUTH_SECRET}"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(openssl rand -hex 16)
COMPOSE_PROFILES=s3-filestore
FILE_STORE_BACKEND=s3
OPENSEARCH_FOR_ONYX_ENABLED=true
LOG_LEVEL=info
LOG_ONYX_MODEL_INTERACTIONS=False
POSTGRES_HOST=relational_db
VESPA_HOST=index
REDIS_HOST=cache
MODEL_SERVER_HOST=inference_model_server
INDEXING_MODEL_SERVER_HOST=indexing_model_server
INTERNAL_URL=http://api_server:8080
S3_ENDPOINT_URL=http://minio:9000
S3_AWS_ACCESS_KEY_ID=minioadmin
S3_AWS_SECRET_ACCESS_KEY=minioadmin
S3_FILE_STORE_BUCKET_NAME=onyx-file-store-bucket
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
EOF

# ── Descargar imágenes ─────────────────────────────────────────────
echo "⬇️  Descargando imágenes Docker (~17 GB) ..."
cd "$ONYX_DIR/deployment"
docker compose pull --quiet

# ── Arrancar ───────────────────────────────────────────────────────
echo "🚀 Arrancando Onyx ..."
docker compose up -d

# ── Esperar a que la API esté lista ────────────────────────────────
echo "⏳ Esperando a que Onyx esté listo (migraciones + arranque) ..."
for i in $(seq 1 60); do
  HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    echo ""
    echo "✅ Onyx está listo en: http://localhost:3000"
    echo "   Crea tu cuenta de administrador en: http://localhost:3000/auth/signup"
    echo "   (El primer usuario registrado será automáticamente administrador)"
    exit 0
  fi
  printf "\r   Intento %d/60 — HTTP %s ..." "$i" "$HTTP_CODE"
  sleep 10
done

echo ""
echo "⚠️  Timeout tras 10 minutos. Comprueba los logs:"
echo "   cd $ONYX_DIR/deployment && docker compose logs --tail 50"
```

> **Nota:** El script genera contraseñas aleatorias para PostgreSQL y el secreto de autenticación. Se almacenan en `$ONYX_DIR/deployment/.env`.

---

## 4. Verificación

### 4.1. Comprobar que todos los contenedores están corriendo

```bash
cd "$ONYX_DIR/deployment" && docker compose ps
```

Deben aparecer **12 contenedores** con estado `Up`. Los que tienen healthcheck mostrarán `(healthy)`:

```
onyx-api_server-1               Up (healthy)
onyx-background-1               Up
onyx-cache-1                    Up
onyx-code-interpreter-1         Up
onyx-index-1                    Up
onyx-indexing_model_server-1    Up (healthy)
onyx-inference_model_server-1   Up (healthy)
onyx-minio-1                    Up (healthy)
onyx-nginx-1                    Up
onyx-opensearch-1               Up
onyx-relational_db-1            Up (healthy)
onyx-web_server-1               Up
```

### 4.2. Health check por API

```bash
curl -s http://localhost:3000/api/health
# {"success":true,"message":"ok","data":null}
```

### 4.3. Registrar usuario y hacer login por API

```bash
# Registrar (el primer usuario es admin)
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"MiPassword123!","has_web_login":true}'

# Login
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@example.com&password=MiPassword123!" \
  -c /tmp/onyx-cookies.txt -w "\nHTTP %{http_code}\n"

# Verificar sesión
curl -s http://localhost:3000/api/me -b /tmp/onyx-cookies.txt | python3 -m json.tool
```

### 4.4. Acceso por navegador

Abre [http://localhost:3000](http://localhost:3000) y crea tu cuenta. El primer usuario registrado es automáticamente **administrador**.

---

## 5. Persistencia de datos

Onyx usa **Docker named volumes** para toda su persistencia. Los datos sobreviven a reinicios de contenedores (`docker compose stop/start`) y a recreaciones (`docker compose up -d`).

### Volúmenes y su contenido

| Volumen | Contenido | Tamaño típico |
|---------|-----------|---------------|
| `onyx_db_volume` | Base de datos PostgreSQL (usuarios, config, histórico de chats) | ~50 MB inicial |
| `onyx_vespa_volume` | Índices vectoriales Vespa | ~1 GB inicial |
| `onyx_opensearch-data` | Índices full-text OpenSearch | ~500 KB inicial |
| `onyx_minio_data` | Ficheros subidos por usuarios | Variable |
| `onyx_model_cache_huggingface` | Modelos de embeddings (inferencia) | ~1.8 GB |
| `onyx_indexing_huggingface_model_cache` | Modelos de embeddings (indexación) | ~1.8 GB |
| `onyx_file-system` | Almacenamiento de documentos (Craft) | Variable |
| `onyx_api_server_logs` | Logs del API server | Pequeño |
| `onyx_background_logs` | Logs de workers | Pequeño |
| `onyx_inference_model_server_logs` | Logs del model server | Pequeño |
| `onyx_indexing_model_server_logs` | Logs del model server de indexación | Pequeño |

### Hacer backup de los volúmenes críticos

Los volúmenes **esenciales** para backup son:

```bash
# Base de datos (lo más importante)
docker exec onyx-relational_db-1 pg_dumpall -U postgres > onyx_backup.sql

# O backup completo de volúmenes Docker
docker run --rm -v onyx_db_volume:/data -v $(pwd):/backup alpine \
  tar czf /backup/onyx_db_volume.tar.gz -C /data .
```

### Restaurar un backup

```bash
# Restaurar base de datos
cat onyx_backup.sql | docker exec -i onyx-relational_db-1 psql -U postgres
```

### ⚠️ Los volúmenes se destruyen con `docker compose down -v`

El flag `-v` **elimina permanentemente** todos los volúmenes. Usa `docker compose down` (sin `-v`) si solo quieres parar y eliminar contenedores manteniendo los datos.

---

## 6. Operaciones habituales

### Parar Onyx (conservando datos)

```bash
cd "$ONYX_DIR/deployment" && docker compose stop
```

### Arrancar Onyx (tras un stop)

```bash
cd "$ONYX_DIR/deployment" && docker compose start
```

### Reiniciar un servicio concreto

```bash
cd "$ONYX_DIR/deployment" && docker compose restart api_server
```

### Ver logs

```bash
# Todos los servicios
cd "$ONYX_DIR/deployment" && docker compose logs -f --tail 100

# Un servicio concreto
docker compose logs -f api_server
docker compose logs -f background
```

### Actualizar a nueva versión

```bash
cd "$ONYX_DIR/deployment"
docker compose pull
docker compose up -d --force-recreate
```

### Usar una versión específica

Edita `.env` y cambia `IMAGE_TAG`:

```bash
# En $ONYX_DIR/deployment/.env
IMAGE_TAG=v0.8.0   # o la versión deseada
```

Luego:

```bash
cd "$ONYX_DIR/deployment"
docker compose pull
docker compose up -d --force-recreate
```

---

## 7. Configuración del LLM

Onyx se despliega **sin ningún LLM configurado**. Para que el chat funcione, necesitas conectar al menos un proveedor LLM.

### Pasos

1. Accede al **Admin Panel** → [http://localhost:3000/admin/configuration/llm](http://localhost:3000/admin/configuration/llm)
2. Haz clic en **"Add LLM Provider"**
3. Selecciona tu proveedor (OpenAI, Google/Vertex AI, Anthropic, Azure, Ollama, etc.)
4. Introduce tu API key y selecciona el modelo
5. Guarda y marca como **Default**

### Proveedores soportados

Onyx soporta (entre otros):

- **OpenAI** — `gpt-4o`, `gpt-4o-mini`, etc.
- **Anthropic** — `claude-sonnet-4-20250514`, etc.
- **Google Vertex AI** — `gemini-2.0-flash`, etc.
- **Azure OpenAI**
- **Ollama** (local) — para ejecutar modelos localmente
- **AWS Bedrock**
- **LiteLLM** compatible

Para instrucciones detalladas, consulta la documentación oficial:
**[https://docs.onyx.app/configuration/llm](https://docs.onyx.app/configuration/llm)**

---

## 8. Personalización

### Cambiar el puerto de acceso

Si el puerto 3000 (o 80) está ocupado, edita `.env`:

```bash
# En $ONYX_DIR/deployment/.env — añade:
HOST_PORT=8888
HOST_PORT_80=8080
```

Luego recrea:

```bash
cd "$ONYX_DIR/deployment" && docker compose up -d
```

Accede en: `http://localhost:8888`

### Desactivar autenticación (solo desarrollo)

```bash
# En .env
AUTH_TYPE=disabled
```

### Usar almacenamiento PostgreSQL en vez de MinIO

Si prefieres no usar MinIO para ficheros:

```bash
# En .env
COMPOSE_PROFILES=
FILE_STORE_BACKEND=postgres
```

Esto elimina el contenedor MinIO y almacena ficheros en PostgreSQL.

### Exponer puertos internos (desarrollo)

Para acceder directamente a los servicios internos, usa el overlay de desarrollo:

```bash
cd "$ONYX_DIR/deployment"

# Descargar el overlay dev
curl -fsSL -o docker-compose.dev.yml \
  "https://raw.githubusercontent.com/onyx-dot-app/onyx/main/deployment/docker_compose/docker-compose.dev.yml"

# Arrancar con puertos expuestos
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Puertos expuestos en modo dev:

| Servicio | Puerto |
|----------|--------|
| API Server | 8080 |
| PostgreSQL | 5432 |
| Vespa | 19071, 8081 |
| OpenSearch | 9200 |
| Redis | 6379 |
| MinIO | 9004, 9005 |
| Code Interpreter | 8000 |
| Model Server | 9000 |

---

## 9. Limpieza total

Para eliminar **todo** (contenedores, volúmenes, imágenes, directorio):

```bash
cd "$ONYX_DIR/deployment"

# Parar y eliminar contenedores + volúmenes
docker compose down -v

# Eliminar imágenes de Onyx
docker images --format '{{.ID}} {{.Repository}}' | \
  grep -E 'onyxdotapp|vespaengine|opensearchproject|minio/minio|postgres:15.2|nginx:1.25.5|redis:7.4' | \
  awk '{print $1}' | xargs -r docker rmi --force

# Eliminar directorio de instalación
rm -rf "$ONYX_DIR"
```

---

## 10. Troubleshooting

### `api_server` se reinicia con error de contraseña PostgreSQL

```
asyncpg.exceptions.InvalidPasswordError: password authentication failed for user "postgres"
```

**Causa:** Condición de carrera entre la inicialización de PostgreSQL y el primer intento de conexión del api_server, o un volumen `onyx_db_volume` residual de un despliegue anterior con otra contraseña.

**Solución:**

```bash
# Opción 1: Esperar — el api_server tiene restart: unless-stopped y reintentará
# Opción 2: Si persiste, resetear la contraseña manualmente
PASS=$(grep POSTGRES_PASSWORD "$ONYX_DIR/deployment/.env" | cut -d= -f2)
docker exec onyx-relational_db-1 psql -U postgres -c "ALTER USER postgres PASSWORD '$PASS';"
docker restart onyx-api_server-1
```

**Prevención:** Si haces `docker compose down -v`, los volúmenes se eliminan y el siguiente `up` inicializa PostgreSQL limpio con la contraseña del `.env`.

### nginx se reinicia en bucle

**Causa:** `api_server` o `web_server` no están listos.

**Solución:** Esperar. Nginx reintenta hasta que los upstream estén disponibles. Si persiste más de 5 minutos, comprobar los logs del api_server.

### OpenSearch falla por `vm.max_map_count`

```
max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
```

**Solución (requiere privilegios root en el host):**

```bash
sudo sysctl -w vm.max_map_count=262144
# Para hacerlo permanente:
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

### Los modelos de embeddings tardan en descargarse

La primera vez, los model servers descargan modelos de HuggingFace (~1.8 GB cada uno). Esto se cachea en los volúmenes `onyx_model_cache_huggingface` y `onyx_indexing_huggingface_model_cache`. Posteriores arranques son mucho más rápidos.

### No puedo chatear ("No LLM configured")

Esto es normal. Este despliegue **no incluye LLM**. Configura uno desde el Admin Panel (ver [sección 7](#7-configuración-del-llm)).

---

## 11. Referencia de servicios

### Arquitectura de red

```
                         ┌─────────────┐
  Puerto 80/3000 ──────▶ │    nginx    │
                         └──────┬──────┘
                       ┌────────┴────────┐
                       ▼                 ▼
                 ┌───────────┐    ┌────────────┐
                 │ api_server│    │ web_server │
                 └─────┬─────┘    └────────────┘
           ┌───────┬───┴───┬──────────┬──────────┐
           ▼       ▼       ▼          ▼          ▼
      ┌────────┐┌─────┐┌───────┐┌──────────┐┌───────┐
      │postgres││redis││ vespa ││opensearch││ minio │
      └────────┘└─────┘└───────┘└──────────┘└───────┘
                            ▲
                     ┌──────┴─────┐
                     │ background │──▶ model_servers (x2)
                     └────────────┘
```

### Endpoints internos

| Servicio | URL interna | Healthcheck |
|----------|------------|-------------|
| API Server | `http://api_server:8080` | `GET /health` |
| Web Server | `http://web_server:3000` | — |
| PostgreSQL | `relational_db:5432` | `pg_isready` |
| Vespa | `http://index:19071` | — |
| OpenSearch | `http://opensearch:9200` | — |
| Redis | `cache:6379` | — |
| MinIO | `http://minio:9000` | `mc ready local` |
| Inference Model | `http://inference_model_server:9000` | `GET /api/health` |
| Indexing Model | `http://indexing_model_server:9000` | `GET /api/health` |

### Estructura de ficheros del despliegue

```
$ONYX_DIR/
├── deployment/
│   ├── docker-compose.yml          ← Compose principal (descargado de GitHub)
│   └── .env                        ← Configuración (generado por el script)
└── data/
    └── nginx/
        ├── app.conf.template       ← Config nginx
        ├── run-nginx.sh            ← Script de arranque nginx
        ├── mcp_upstream.conf.inc.template
        ├── mcp.conf.inc.template
        └── local/                  ← Para configs nginx personalizadas
```

---

## Resumen de un vistazo

| Qué | Cómo |
|-----|------|
| **Instalar** | Ejecutar el script de la [sección 3](#3-despliegue-rápido-copy-paste) |
| **Acceder** | http://localhost:3000 |
| **Primer usuario** | Registrarse → automáticamente admin |
| **Configurar LLM** | Admin Panel → Configuration → LLM |
| **Parar** | `cd $ONYX_DIR/deployment && docker compose stop` |
| **Arrancar** | `cd $ONYX_DIR/deployment && docker compose start` |
| **Actualizar** | `docker compose pull && docker compose up -d --force-recreate` |
| **Backup BD** | `docker exec onyx-relational_db-1 pg_dumpall -U postgres > backup.sql` |
| **Destruir todo** | `docker compose down -v` + eliminar imágenes (ver [sección 9](#9-limpieza-total)) |

