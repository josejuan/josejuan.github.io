---
title: Kubernetes, ingress routing
author: josejuan
tags: software deployment
---

## Introducción

En <a href="2020-10-02-kubernetes-authentication-for-free.html">*Kubernetes, authentication for free*</a> vimos como desplegar un servicio de autenticación (*keycloak*) para usarlo en nuestros servicios. Ahora que tenemos varios servicios públicos en nuestra nube y, además, dicho despliegue puede estar replicado múltiples veces (tantas como ramas deseemos), necesitamos una forma de crear automáticamente un enrutado para recursos dentro de la nube.

Ésto podemos lograrlo únicamente cambiando la declaración de nuestra nube (el archivo único *rama_cloud.yml*).

## Paso 0: obtén un controlador *ingress* en tu nube

Cualquier nube *kubernetes* proveerá un *ingress controller*, que no es más que cierta pieza **interna** de la nube que resolverá los *kind: ingress*. En nuestro caso, el *nginx ingress controller* que en *microk8s* se activa con:

```bash
$ microk8s enable ingress
```

Para tu nube concreta puede haber ciertas particularidades pero en general, las subsiguientes definiciones deberían funcionar.

## Paso 1: enrutar dominios de internet

En mi caso, la intención es enrutar todos los subdominios de mi dominio principal al mismo balaceador (el de la nube), básicamente un par de entradas *DNS* como:

```bash
organización.com.        IN      A       123.123.123.123
*.organización.com.      IN      CNAME   organización.com
```

Vale, ya no tenemos que hacer nada más para exponer recursos para cualquier despliegue en la organización.

## Paso 2: exponer recursos concretos

Las decisiones aquí van a ser más de negocio (ej. *seo*) o limitaciones de terceros (ej. *akamai*, *CORS*, ...) que nuestras. Por ejemplo podemos separar los servicios de autenticación de las *api* de los *UI* de los ... usando subdominios (ej. *(auth|api|www).organización.com*) o usando *subpaths* (ej. *www.organización.com/(pub|api|auth)*). En cada caso únicamente tenemos que ajustar nuestra definición, aquí pongo un ejemplo usando esos tres tipos de recursos:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress
  namespace: frontal
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  rules:
    - host: api.foo.org
      http:
        paths:
        - path: /legacy
          pathType: Prefix
          backend:
            service:
              name: oldmonster
              port:
                number: 8080
        - path: /v1
          pathType: Prefix
          backend:
            service:
              name: apiserver
              port:
                number: 8080
    - host: www.foo.org
      http:
        paths:
        - path: /pub
          pathType: Prefix
          backend:
            service:
              name: webserver
              port:
                number: 8080
        - path: /auth
          pathType: Prefix
          backend:
            service:
              name: keycloak
              port:
                number: 8080
```

Ahora en cada caso, el tráfico debería ser enrutado a cada despliegue.

## Paso 3: securizar el frontal

Podemos securizar el frontal instalando directamente en nuestro *ingress* un certificado.

Una vez que obtienes uno (ver refs para firmar uno de pruebas), es añadirlo como secret y usar *tls* en la declaración del *ingress*, veamos cómo.

Creamos un certificado autofirmado (o usamos uno de una entidad de confianza claro):

```bash
$ openssl req -newkey rsa:2048 -nodes -keyout my.key -x509 -days 365 -out my.crt
...
$ cat my.key | base64
ésto pa'l secret
$ cat my.crt | base64
ésto pa'l secret
```

Añadimos un par de secrets en nuestro *GitHub* llamados **SSL_CERT_KEY** y **SSL_CERT_CRT** con esas salidas en *base64*.

Actualizamos nuestra *Action* de *GitHub* para que propague los valores al desplegar la nube:

```yaml
...
  - name: Kubernetes apply
    run: |
      cat cloud/${GITHUB_REF##*/}_cloud.yml | \
        sed 's/BASE64_SSL_CERT_CRT/${{ secrets.SSL_CERT_CRT }}/g' | \
        sed 's/BASE64_SSL_CERT_KEY/${{ secrets.SSL_CERT_KEY }}/g' | \
        ...
```

Creamos el *secret* de la nube añadiendo:

```yaml
---
apiVersion: v1
kind: Secret
metadata:
  name: sslcerts
  namespace: gol-main
data:
  tls.crt: BASE64_SSL_CERT_CRT
  tls.key: BASE64_SSL_CERT_KEY
type: kubernetes.io/tls
---
```

Y cambiamos el *ingress* para usar *tls* con ese certificado:

```yaml
spec:
  tls:
    - hosts:
        - BRANCH_ORG_NAME.WWW_ORG_NAME
      secretName: sslcerts
```

Y ya está, ya está securizada toda nuestra nube.

## Paso 4: probar

Si invocamos a nuestro servicio obtenemos la redirección a la autenticación:

```bash
$ curl -k -I https://main.myorg.org/v1/status
HTTP/2 302
server: nginx/1.19.0
date: Sat, 31 Oct 2020 17:40:07 GMT
location: https://main.myorg.org/auth/realms/master/protocol/openid-connect/auth?response_type=code&client_id=golauth&redirect_uri=https%3A%2F%2Fmain.myorg.org%3A0%2Fv1%2Fstatus&state=69e3f27b-8601-4544-b677-ba6b97763a24&login=true&scope=openid
...
```

Genial y si autenticamos:

```bash
$ curl -s -k -X POST "https://main.myorg.org/auth/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=pepito" \
    -d "password=grillo" \
    -d 'grant_type=password' \
    -d 'client_id=golauth' | jq .
{
  "access_token": "ey43c4...6SlA",
  "expires_in": 60,
  "refresh_expires_in": 1800,
  "refresh_token": "eyJhbG...0AI",
  "token_type": "bearer",
  "not-before-policy": 0,
  "session_state": "0a8f7ec4-855d-4e3-8133-fe99b382a1d7",
  "scope": "email profile"
}
```

Conseguido, tenemos nuestra nube securizada.

## Paso 5: microk8s y TLS

Hay un bug en *microk8s* que hace que use el certificado por defecto, como era inseguro, nos ha funcionado el test, porque tanto daba que fuera un inseguro que otro. Al probar con certificados reales, el problema ha aparecido.

Si necesitas varios certificados, espero que tu nube no tenga un bug y funcionen los pasos previos. En *microk8s* podemos forzar a usar nuestro certificado (pero sólo podremos tener uno para toda la nube).

Creamos el certificado para toda la nube, por ejemplo:

```bash
$ kubectl create secret tls sslcerts -n default --key ca.key --cert ca.crt
secret/sslcerts created
```

Nota: si precisas una cadena de certificados, pon el tuyo el primero, en otro caso la verificación de clave no pasará.

Ahora reinstalamos *ingress* indicando el certificado por defecto a usar:

```bash
$ microk8s.enable ingress:default-ssl-certificate=default/sslcerts
Enabling Ingress
Setting default/sslcerts as default ingress certificate
...
```



## Referencias

* <a href="https://microk8s.io/docs/addon-ingress">MicroK8S Ingress Controller</a>
* <a href="https://www.ibm.com/support/knowledgecenter/SSMNED_2018/com.ibm.apic.cmc.doc/task_apionprem_gernerate_self_signed_openSSL.html">Self signed SSL</a>
* <a href="https://wp.dejvino.com/2014/09/adding-certificates-to-java-keystore/">Add Cert to Java</a>
