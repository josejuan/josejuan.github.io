---
layout: post
title: Dependencias e indirecciones
author: josejuan
categories: software development
---

## Teorema fundamental del desarrollo de software

Medio en serio medio en broma, el _FTSE_ afirma que cualquier problema en _software_ puede resolverse añadiendo una indirección. Básicamente se trata de no resolver el problema y asumir que _"otro alguien lo hará"_.

Este _"principio"_ es ubícuo en *todo* lo que tiene que ver con la informática y, *aparentemente*, funciona bastante bien. Gracias a él, por ejemplo, podemos comprarnos una gran variedad de dispositivos (impresoras, cámaras, teclados, ...) porque nuestro sistema operativo añade una indirección que será resuelta por el _driver_ de dicho dispositivo. El concepto de *interface* en programación permite que accesos a bases de datos (_oracle_, _postgresql_, ...), escritura de _logs_ (_stdout_, base de datos, servicio externo/centralizado, ...), etc. sigan directamente este principio.

En *Java*, el _FTSE_ está institucionalizado mediante los *JSR*, en los que únicamente se suministra una implementación *de la indirección* para _"verificar"_ la correcta definición de la especificación.

## Dependencia

La *RAE* define dependencia como _"relación de origen o conexión"_ y me gustaría destacar *conexión*. Creo que la gente cuando establece una dependencia olvida que *está fijando una conexión entre dos partes de un sistema*, no sólo aprovechándose, (re)utilizando esa indirección (abstracción) y con frecuencia, las consecuencias (el coste) de esa conexión parece ignorarse.

Las dependencias no son sólo enlaces estáticos o dinámicos entre nuestros módulos, cuando añadimos un parámetro a una función, estamos añadiendo una dependencia, y cuando decidimos el tipo de ese parámetro, estamos afectando también a la forma e implicaciones de esa dependencia. Es por ello que es recomendable minimizar el alcance (_scope_) de cualquier estructura y hacerla lo más estricta posible, para minimizar las dependecias que ella expone. En cuanto a las que inyecta, la cosa es mucho más complicada y es lo que me motivó _tuitear_ _"Si hoy tengo cierto proceso f(x,y) ¿cuándo, cómo, porqué, es mejor A o B? A) inyecto a f los valores x e y (ej. `f(U.x, V.y)`) B) inyecto a f el contexto (ej. `f(U, V)`)"_.

## Transitividad

Conozco muy pocos programadores (y conozco muchos y muy buenos) que no olviden analizar la transitividad de las conexiones (dependencias) que establecen. El coste acumulado de las dependencias de un sistema es *mucho mayor* que la suma individual de esas dependencias. _"Dependency hell"_ es sólo una de las más evidentes consecuencias de esa transitividad, ¿cuántos equipos de desarrollo llevan un control de sus dependencias, interdependencias transitivas y *estiman* (porque implica futuro) el riesgo de poder ser resueltas en el futuro? Pues _"Dependency hell"_ proviene de eso. Otras consecuencias menos obvias tratarían sobre la contención de la complejidad (más relaciones más complejidad), flexibilidad del sistema (más relaciones menos control), confiabilidad (más relaciones más riesgo y difícil hacer _QA_), escalabilidad (más relaciones más difícil distribuirlas o incluso distribuidas, orquestarlas, rendimiento, etc.), etc.

## P vs NP

Encontrar el conjunto óptimo de versiones en un repositorio para satisfacer las dependencias del módulo que queremos compilar es _NP-hard_. Lo llamativo de ésto, no es que podamos o no, o lleve más o menos tiempo compilar nuestro módulo; lo destacable, es que no debemos subestimar (menospreciar, descuidar) las dependencias pues, que sea _NP-hard_, nos está diciendo algo sobre la naturaleza de este problema, es decir, de lo importante que es lo que tenemos entre manos.

## Gestores de dependencias

Sí, no hace falta saber que es un problema _NP-hard_ para darse cuenta que resolver las dependencias es un problema ubícuo y recurrente en informática. Mires a donde mires hay problemas con las dependencias, basta ver la gran cantidad de _"soluciones"_ (y no están todas en la lista claro) actuales <a href="https://en.wikipedia.org/wiki/List_of_software_package_management_systems">List of software package management systems</a> y *en todas*, te encuentras más pronto que tarde con alguno de sus *innumerables* problemas ¡que pretenden resolver!

Hasta que alguien encuentre una solución global al problema (_"el Internet de las dependencias"_) seremos las personas (quizás alguna _IA_ en el futuro) las que debamos atender a esos problemas que siempre se producen por la explosión en complejidad que produce la transitividad de las dependencias, por tanto, sea cual sea la solución adoptada, *debería permitir una solución adhoc* por parte del humano, esto implica, que el número de pasos transitivos en la resolución de dependencias debe ser el menor posible, de otro modo frente a ese inevitable problema, el pobre humano se encontrará inmerso en una cadena interminable de fallos muy difíciles de resolver.


## Referencias

* <a href="https://en.wikipedia.org/wiki/Fundamental_theorem_of_software_engineering">Fundamental theorem of software engineering</a>
* <a href="https://en.wikipedia.org/wiki/Dependency_hell">Dependency hell</a>
* <a href="https://stackoverflow.com/questions/28099683/algorithm-for-dependency-resolution">Dependency resolution is NP-hard</a>
* <a href="https://en.wikipedia.org/wiki/List_of_software_package_management_systems">List of software package management systems</a>
