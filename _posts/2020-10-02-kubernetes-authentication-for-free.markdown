---
layout: post
title: Kubernetes, authentication for free
author: josejuan
categories: software deployment
---

## Introducción

En <a href="2020-10-01-kubernetes-una-vision-practica.html">*Kubernetes, una visión práctica*</a> vimos como desplegar automáticamente una aplicación. *Kubernetes* nos permite además *decorarla* desde su definición en el *codebase* con cualquier artefacto que necesitemos. En este post veremos cómo añadir, *for free*, autenticación a nuestra plataforma.

Para ésto <a href="https://www.keycloak.org/">*Keycloak*</a> es una estupenda herramienta.

## Paso 1: personalizar la imagen de *keycloak*

La imagen base de *keycloak* levanta una instancia pelada que hay que configurar, pero nosotros queremos que **todo esté automatizado**, por lo que añadiremos un *script* que luego usaremos en el *lifecycle* de *kubernetes*. La creación de la imagen puede ser:

```sql
FROM jboss/keycloak:11.0.2
COPY ./images/keycloak/keycloak-set-up /keycloak-set-up
USER root
RUN chmod +x /keycloak-set-up
RUN sed -i 's/jboss.http.port:[0-9]\+/jboss.http.port:8081/g' /opt/jboss/keycloak/standalone/configuration/standalone-ha.xml
USER 1000
```

Donde añadimos nuestro *script*, le damos permiso de ejecución y ya de paso nos ponemos un puerto más cómodo en el *JBoss*.

Vale, con eso ya tenemos una imagen con nuestro *script*.

## Paso 2: hacer el *build* de la imagen

Igual que hacíamos con nuestro servidor, debemos generar la imagen a partir del *Dockerfile* creado, así, añadimos a la *pipe* del *Action* de *GitHub*:

```yaml
- name: Build and push keycloak
  uses: docker/build-push-action@v2
  with:
    context: .
    file: ./images/keycloak/Dockerfile
    platforms: linux/amd64
    push: true
    tags: myrepo/gol:keycloak-${{ steps.ebranch.outputs.branch }}
```

Vale, ya tenemos la imagen creada y subida a nuestro repositorio.

## Paso 3: añadir *keycloak* a nuestro despliegue

Añadir un *pod* con *keycloack* es modificar nuestra definición de despliegue *kubernetes* añadiendo:

```yaml
apiVersion: v1
kind: Pod
metadata:
  namespace: gol-main
  name: keycloak
  labels:
    type: keycloak
spec:
  imagePullSecrets:
    - name: regcred
  containers:
    - name: keycloak
      image: myrepo/gol:keycloak-main
      imagePullPolicy: Always
      env:
        - name: KEYCLOAK_USER
          value: "admin"
        - name: KEYCLOAK_PASSWORD
          value: "SECRET_KEYCLOAK_ADMIN_PASSWORD"
        - name: PROXY_ADDRESS_FORWARDING
          value: "true"
      lifecycle:
        postStart:
          exec:
            command: ["/bin/bash", "-c", "/keycloak-set-up"]
      ports:
        - name: http
          containerPort: 8081
      readinessProbe:
        httpGet:
          path: /auth/realms/master
          port: 8081
```

Hemos creado un único *secret*, el del password por defecto al levantarse el *pod*.

Vale, ya será desplegado *keycloak* en nuestra nube.

## Paso 4: establecer configuración inicial

Queremos cargar automáticamente en *keycloak* la configuración inicial que precisemos, en este caso un *Client* de autenticación. Habíamos comentado que lo haríamos en el *script* `keycloak-set-up` usando el comando *kcreg.sh*:

```shell
#!/bin/bash

# from deployment secrets
# KEYCLOAK_USER=...
# KEYCLOAK_PASSWORD=...

KREG=/opt/jboss/keycloak/bin/kcreg.sh
KEYCLOAK_URL=http://keycloak:8081/auth
KEYCLOAK_REALM=master

# wait for keycloak available
while [ "`curl -s -w %{http_code} -o /dev/null $KEYCLOAK_URL/`" != "200" ]
do
  sleep 5
  echo "`date`: waiting for keycloak..." >> /tmp/keycloak-set-up.log
done
echo "`date`: keycloak ready" >> /tmp/keycloak-set-up.log

$KREG config credentials --server $KEYCLOAK_URL --realm $KEYCLOAK_REALM --user $KEYCLOAK_USER --password $KEYCLOAK_PASSWORD

echo "`date`: logged in" >> /tmp/keycloak-set-up.log

$KREG create -f - <<EOF
{
  "clientId" : "golauth",
  "surrogateAuthRequired" : false,
  "enabled" : true,
  "alwaysDisplayInConsole" : false,
  "clientAuthenticatorType" : "client-secret",
  "redirectUris" : [ "http://www.keycloak.config.authentication.site" ],
  "webOrigins" : [ ],
  "notBefore" : 0,
  "bearerOnly" : false,
  "consentRequired" : false,
  "standardFlowEnabled" : true,
  "implicitFlowEnabled" : false,
  "directAccessGrantsEnabled" : true,
  "serviceAccountsEnabled" : false,
  "publicClient" : true,
  "frontchannelLogout" : false,
  "protocol" : "openid-connect",
  "attributes" : {
    "saml.assertion.signature" : "false",
    "saml.force.post.binding" : "false",
    "saml.multivalued.roles" : "false",
    "saml.encrypt" : "false",
    "saml.server.signature" : "false",
    "saml.server.signature.keyinfo.ext" : "false",
    "exclude.session.state.from.auth.response" : "false",
    "saml_force_name_id_format" : "false",
    "saml.client.signature" : "false",
    "tls.client.certificate.bound.access.tokens" : "false",
    "saml.authnstatement" : "false",
    "display.on.consent.screen" : "false",
    "saml.onetimeuse.condition" : "false"
  },
  "authenticationFlowBindingOverrides" : { },
  "fullScopeAllowed" : true,
  "nodeReRegistrationTimeout" : -1,
  "defaultClientScopes" : [ "web-origins", "role_list", "profile", "roles", "email" ],
  "optionalClientScopes" : [ ]
}
EOF

echo "`date`: done" >> /tmp/keycloak-set-up.log
```

Primero esperamos que se levante *JBoss* con *keycloak*, luego registramos las credenciales del usuario *admin* y finalmente inyectamos la configuración del *Client* que queremos.

¿Cómo generamos o extraemos una configuración desde *keycloak*?

```bash
$ /opt/jboss/keycloak/bin/kcreg.sh config credentials --server $KEYCLOAK_URL --realm $KEYCLOAK_REALM --user $KEYCLOAK_USER --password $KEYCLOAK_PASSWORD
Logging into http://localhost:8081/auth/ as user admin of realm master
$ /opt/jboss/keycloak/bin/kcreg.sh get golauth
{
  "id" : "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "clientId" : "golauth",
  "surrogateAuthRequired" : false,
  "enabled" : true,
  "alwaysDisplayInConsole" : false,
...
```

En otros escenarios y en entornos productivos que requieran copias de seguridad o persistencia, consultar:

1. <a href="https://www.keycloak.org/docs/latest/server_admin/index.html#_export_import">Export/Import</a>
1. <a href="https://hub.docker.com/r/jboss/keycloak">jboss/keycloak</a> (ver bases de datos)

Vale, ya podemos configurar **declarativamente** nuestro *keycloak*.

## Paso 5: inyectar los *secret* al despliegue

Como los *secrets* no deben estar en plano en el código, debemos inyectar como hacíamos al ejecutar el comando. Actualizando también la *pipe* cambiando:

```yaml
- name: Kubernetes apply
  run: |
    cat cloud/${GITHUB_REF##*/}_cloud.yml | \
      sed 's/DOCKER_CONFIGJSON/${{ secrets.DOCKER_CONFIGJSON }}/' | \
      sed 's/SECRET_KEYCLOAK_ADMIN_PASSWORD/${{ secrets.KEYCLOAK_ADMIN_PASSWORD }}/' | \
      ssh cloud 'microk8s kubectl apply -f -'
```

Ahora sí, se despliega el servidor *keycloak* y se pone en marcha todo lo anterior.

Vale, ya tenemos *keycloak* desplegado y autoconfigurado.

## Paso 6: configurar los servicios para consultar a *keycloak*

*keycloak* tiene múltiples clientes para los servicios que requieran autenticar, las aplicaciones que requieran autenticarse, proveedores de autenticación (*GitHub*, *Google*, *Twitter*, *Facebook*, ...). Por ejemplo en *Java* con *Spring Boot* viene a ser suficiente con añadir las dependencias:

```xml
        <dependency>
            <groupId>org.keycloak</groupId>
            <artifactId>keycloak-spring-boot-starter</artifactId>
            <version>11.0.2</version>
        </dependency>
    </dependencies>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.keycloak.bom</groupId>
                <artifactId>keycloak-adapter-bom</artifactId>
                <version>11.0.2</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
```

Y en la configuración de *spring boot* algo como:

```bash
keycloak.security-constraints[0].auth-roles[0] = user
keycloak.security-constraints[0].security-collections[0].patterns[0] = /v1/*

keycloak.realm = master
keycloak.auth-server-url = http://keycloak:8081/auth/
keycloak.ssl-required = external
keycloak.resource = golauth
keycloak.public-client = true
keycloak.confidential-port = 0
keycloak.use-resource-role-mappings = true
keycloak.enabled = true
```

Que dado que nuestro *keycloak* va implícita en nuestro despliegue puede ir fija en el *codebase*.

Vale, ya tenemos securizado nuestros servicios.

## Paso 6: probar la autenticación

Probemos primero que el servicio está protegido:

```bash
$ curl -v http://localhost:8080/v1/status
...
< HTTP/1.1 302
...
< Location: http://keycloak:8081/auth/realms/master/protocol/openid-connect/...
...
```

Bien, redirige a la url de autenciación. Ahora veamos si autenticando entramos:

```bash
$ TOKEN=`curl -s -X POST "http://keycloak:8081/auth/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=pepito" \
    -d "password=grillo" \
    -d 'grant_type=password' \
    -d 'client_id=golauth' | jq -r .access_token`

$ curl -s -H "Authentication: Bearer $TOKEN" http://apiserver:8080/v1/status
local-env
```

Y ya está, tenemos autenticación y autorización con todo el soporte de *keycloak*.


## Referencias

* <a href="https://www.adictosaltrabajo.com/2016/09/28/integracion-de-keycloak-con-angularjs-y-spring-boot/">Integración de Keycloak con AngularJS y Spring Boot</a>
* <a href="https://www.keycloak.org/docs-api/5.0/rest-api/index.html">Keycloak REST API</a>
* <a href="https://www.keycloak.org/docs/4.8/authorization_services/">Keycloak Authorization Services</a>
* <a href="https://access.redhat.com/documentation/en-us/red_hat_single_sign-on/7.1/html/securing_applications_and_services_guide/client_registration_cli">Keycloak Client Registration CLI</a>
