---
title: Kubernetes, automated integration testing
author: josejuan
tags: software deployment
---

## Introducción

En <a href="2020-10-03-kubernetes-ingress-routing.html">*Kubernetes, ingress routing*</a> vimos como exponer públicamente todos nuestros servicios de forma cómoda y segura. Ahora es el momento de añadir otro servicio que nos permita realizar tests de integración para asegurar que todos esos servicios están funcionando de forma correcta y para ello utilizaremos el prometedor <a href="https://www.cypress.io/">Cypress</a>.

## Paso 1: instalar *Cypress*

Básicamente miramos la documentación, pensamos la mejor forma de intregrar el testing en nuestro codebase y listo.

Vale, ya tenemos *Cypress* preparador para crear tests.

## Paso 2: crear los tests de integración

Por ejemplo podemos crear un tests que verifique que nuestro servidor *Keycloak* del otro día esté levantado y bien configurado:

```js
context('Keycloak Admin', () => {

    beforeEach(() => {
        cy.visit(Cypress.env('BASE_SITE_URL') + 'auth/');
    });

    it('Admin can login', () => {

        cy  .get('.welcome-header > h1')
            .contains('Welcome to Keycloak');

        cy  .contains('Administration Console')
            .click();

        cy  .get('#username')
            .type(Cypress.env('KEYCLOAK_USER'));

        cy  .get('#password')
            .type(Cypress.env('KEYCLOAK_PASSWORD'));

        cy  .get('#kc-login')
            .click();

        cy  .contains('Clients')
            .click();

        cy  .contains('golauth')
            .click();

    });

});
```

Vale, ya tenemos un test agnóstico de nuestro despliegue concreto.

## Paso 3: crear imágen

Aunque podemos (y debemos) lanzar los test desde cualquier entorno (desacoplado de la nube), parece buen idea lanzar junto con el despliegue todos los test de integración que tengamos para que nos den un rápido, seguro y automatizado diagnóstico de todo el sistema.

Para ello creamos una imagen *Docker* que realice dicha acción:

```bash
FROM cypress/base:10
RUN npm install --save-dev cypress
RUN $(npm bin)/cypress verify
COPY ./test/cypress/cypress/integration /cypress/integration
CMD ["sh", "-c", "$(npm bin)/cypress run --config-file false --no-exit --headless --env BASE_SITE_URL=$BASE_SITE_URL,KEYCLOAK_USER=$KEYCLOAK_USER,KEYCLOAK_PASSWORD=$KEYCLOAK_PASSWORD"]
```

Aunque requiere un esfuerzo mayor al diseñar los tests, yo prefiero que todos los tests de integración sean agnósticos del despliegue y conjunto de datos, por lo que con definir unas pocas variables de entorno podremos efectuar todas las pruebas. En otros escenarios, añadir *fixtures* de configuración será más adecuado.

Vale, ya tenemos una imagen que lanza automáticamente los tests de integración dado un entorno concreto.

## Paso 4: generar imagen al desplegar

Como en el resto de componentes, generamos automáticamente la imagen añadiendo la acción de *GitHub*:

```yaml
      - name: Build and push cypress
        uses: docker/build-push-action@v2
        with:
          context: .
          file: ./images/cypress/Dockerfile
          platforms: linux/amd64
          push: true
          tags: myrepo/gol:cypress-${{ steps.ebranch.outputs.branch }}
```

Vale, ya tenemos la imagen generada para nuestro despliegue concreto.

## Paso 5: crear definición en la nube

Ahora en la nube podemos usar nuestros tests de múltiples formas, por ejemplo en un estilo de redespliegue *blue / green* **totalmente automatizado** podríamos desplegar una nueva versión que quede **oculta en ingress** y que tras lanzarse los tests y dar *success* se hiciera el cambio de contexto en el *ingress controller*. Sólo si se han ejecutado **todos** los tests de integración de forma satisfactoria, la vieja versión desplegada será reemplazada por la nueva versión.

En este caso simplemente creamos un *pod* que lanzará los tests y quedará a la espera por si queremos acceder a él a mirar resultados:

```yml
apiVersion: v1
kind: Pod
metadata:
  namespace: gol-BRANCH_ORG_NAME
  name: cypress
  labels:
    type: cypress
spec:
  imagePullSecrets:
    - name: regcred
  containers:
    - name: cypress
      image: myrepo/gol:cypress-BRANCH_ORG_NAME
      imagePullPolicy: Always
      env:
        - name: BASE_SITE_URL
          value: "https://BRANCH_ORG_NAME.WWW_ORG_NAME/"
        - name: KEYCLOAK_USER
          value: "admin"
        - name: KEYCLOAK_PASSWORD
          value: "SECRET_KEYCLOAK_ADMIN_PASSWORD"
      ports:
        - containerPort: 8080
      readinessProbe:
        httpGet:
          path: /foo/bar
          port: 8080
```

Vale, el despliegue ya levantará y ejecutará los tests una vez todos los *pods* (habitualmente via *deployments*) estén disponibles.

## Paso 6: probar configuración

Una vez deplegado el entorno, si miramos los logs del *pod* de *cypress* vemos:

```bash
$ kubectl logs pod cypress-main -n gol-main

==================================================================================

  (Run Starting)

  ┌──────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    5.5.0                                                            │
  │ Browser:    Electron 85 (headless)                                           │
  │ Specs:      1 found (keycloak.admin.spec.js)                                 │
  └──────────────────────────────────────────────────────────────────────────────┘


──────────────────────────────────────────────────────────────────────────────────

  Running:  keycloak.admin.spec.js                                        (1 of 1)


  Keycloak Admin
    ✓ Admin can login (5241ms)


  1 passing (7s)


  (Results)

  ┌──────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                              │
  │ Passing:      1                                                              │
  │ Failing:      0                                                              │
  │ Pending:      0                                                              │
  │ Skipped:      0                                                              │
  │ Screenshots:  0                                                              │
  │ Video:        true                                                           │
  │ Duration:     6 seconds                                                      │
  │ Spec Ran:     keycloak.admin.spec.js                                         │
  └──────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF
  -  Finished processing: /.../videos/keycloak.admin.spec.js.mp4    (0 seconds)


=================================================================================

  (Run Finished)


       Spec                           Tests  Passing  Failing  Pending  Skipped
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ ✔  keycloak.admin.spec.js   00:06     1        1        -        -        - │
  └─────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!        00:06     1        1        -        -        -
```

Y ya está, tenemos validación automática para cada despliegue.

## Referencias

* <a href="https://cypress.io">Cypress</a>
* <a href="https://docs.cypress.io/guides/tooling/reporters.html#Examples">Cypress reporting</a>
