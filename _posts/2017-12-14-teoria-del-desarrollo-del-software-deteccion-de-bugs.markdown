---
layout: post
title: Teoría del desarrollo del software; detección de bugs
author: josejuan
categories: software development
---

De forma recurrente me sorprendo por el (aparentemente) poco interés en aplicar técnicas _"ancestrales"_ al desarrollo del software que en otras áreas han dado tan buenos resultados. La estadística y el cálculo de probabilidades (desde el genial _conde de Buffon_) se aplica con enorme éxito en sistemas complejos de analizar de forma determinista. Desde hace bastante tiempo me pregunto por qué no veo cosas como _"Si la P d q cualquier código tuyo tenga bugs es dl 50% y la d q tu test los descubra es dl 50%, tu código es buggy en ~38% pues P≈B(1-D+DB)"_ <a href="https://twitter.com/__josejuan__/status/648138545660620800">🐦 </a>.

En el desarrollo de _software_ sin duda hay muchas **opiniones**, pero no muchas técnicas contrastadas con una sólida base teórica que ayuden (sobre todo a grandes equipos de desarrollo) a medir y dirigir los recursos hacia los _"puntos calientes"_ de la aplicación. Ya no digamos para técnicas más sofisticadas como _"¿Te imaginas un lenguaje que te pidiera anotaciones (ej. de tipo) basándose en la probabilidad de bug (rojo) o de optimización (naranja)?"_ <a href="https://twitter.com/__josejuan__/status/406050784984309760">🐦 </a>.

Como son pocos y éste me ha gustado, me apetecía tenerlo traducido.

**Título original:** <a href="http://stevemcconnell.com/articles/gauging-software-readiness-with-defect-tracking/">_"Gauging Software Readiness With Defect Tracking"_</a> _(Vol. 14, No. 3, May/June 1997)_

-----------------------------------------------

En el competitivo mercado de software comercial, las empresas de software se sienten obligadas a lanzar software en el momento en que está listo. Su tarea es traicionera, pisando la línea divisoria entre liberar software de mala calidad temprano y software de alta calidad tarde. Una buena respuesta a la pregunta _"¿Es el software lo suficientemente bueno para lanzarlo ahora?"_ puede ser crítico para la supervivencia de una empresa. La respuesta a veces se basa en el instinto visceral, pero varias técnicas pueden poner este juicio sobre una base más firme.

## Densidad de _bugs_

Una de las maneras más fáciles de juzgar si un programa está listo para ser liberado es medir su densidad de _bugs_ - el número de _bugs_ por línea de código. Suponga que la primera versión de su producto, GigaTron 1.0, consistiera en 100.000 líneas de código, que usted detectó 650 _bugs_ antes de la publicación del software, y que se reportaron 50 _bugs_ más después de la publicación del software. Por lo tanto, el software tenía un número total de 700 _bugs_, y una densidad de _bugs_ de 7 _bugs_ por cada mil líneas de código (KLOC).

Supongamos que GigaTron 2.0 consistió en 50.000 líneas de código adicionales, que usted detectó 400 _bugs_ antes de la liberación, y otros 75 después de la liberación. La densidad total de _bugs_ de esa liberación sería de 475 _bugs_ totales divididos entre 50.000 nuevas líneas de código, o 9.5 _bugs_ por KLOC.

Ahora suponga que está tratando de decidir si GigaTron 3.0 es lo suficientemente confiable como para entregarlo. Consta de 100.000 nuevas líneas de código, y ha detectado 600 _bugs_ hasta ahora, o 6 _bugs_ por KLOC. A menos que tenga una buena razón para pensar que su proceso de desarrollo ha mejorado con este proyecto, su experiencia le llevará a esperar entre 7 y 10 _bugs_ por KLOC. El número de _bugs_ que usted debe intentar encontrar variará dependiendo del nivel de calidad que está buscando. Si desea eliminar el 95 por ciento de todos los _bugs_ antes de la liberación, deberá detectar entre 650 y 950 _bugs_ antes del lanzamiento. Esta técnica sugiere que el producto no está listo para su envío.

Cuantos más datos de proyecto históricos tenga, más confianza tendrá en sus objetivos de densidad de _bugs_ previos a la liberación. Si usted tiene datos de sólo dos proyectos y el rango es tan amplio como 7 a 10 _bugs_ por KLOC, eso deja mucho espacio para un juicio experto sobre si el tercer proyecto será más parecido al primero o segundo. Pero si usted ha rastreado los datos de _bugs_ para 10 proyectos y ha encontrado que su tasa promedio de _bugs_ de por vida es de 7.4 _bugs_ por KLOC con una desviación estándar de 0.4 _bugs_, usted puede tener confianza en esos datos.

## Agrupación de _bugs_

Otra técnica sencilla de predicción de _bugs_ consiste en separar los informes de _bugs_ en dos grupos. Llámelos grupo A y grupo B. A continuación, realice un seguimiento de los _bugs_ en estos dos grupos por separado. La distinción entre los dos grupos es arbitraria. Podría poner todos los _bugs_ descubiertos los lunes, miércoles y fines de semana en el grupo A, y el resto de los _bugs_ en el grupo B. O podrías dividir a su equipo de pruebas por el medio y poner la mitad de sus _bugs_ reportados en un grupo, la mitad en el otro. No importa realmente cómo se haga la división, siempre y cuando ambos grupos de informes operen independientemente y ambos prueben el alcance completo del producto.

Una vez que se crea una distinción entre los dos grupos, se realiza un seguimiento del número de _bugs_ notificados en el grupo A, el número en el grupo B y (aquí está la parte importante) el número de _bugs_ que se notifican tanto en el grupo A como en el grupo B. El número de _bugs_ únicos notificados en un momento dado es:

  _bugs_<sub>Únicos</sub> = _bugs_<sub>A</sub> + _bugs_<sub>B</sub> - _bugs_<sub>AyB</sub>

El número de _bugs_ totales puede entonces ser aproximado por la fórmula:

  _bugs_ <sub>Total</sub> = (_bugs_<sub>A</sub> * _bugs_<sub>B</sub>) / _bugs_<sub>AyB</sub>

Si el proyecto GigaTron 3.0 tiene 400 _bugs_ en el grupo A, 350 _bugs_ en el grupo B y 150 de los _bugs_ en ambos grupos, el número de _bugs_ únicos detectados sería de 400 + 350 - 150 = 600. Si el proyecto GigaTron 3.0 tiene 400 _bugs_ en el grupo A, 350 _bugs_ en el grupo B y 150 de los _bugs_ en ambos grupos, el número de _bugs_ únicos detectados sería de 400 + 350 - 150 = 600. El número aproximado de _bugs_ totales sería 400 * 350 / 150 = 933. Esta técnica sugiere que quedan por detectar aproximadamente 333 _bugs_ (aproximadamente un tercio de los _bugs_ totales estimados); el aseguramiento de la calidad en este proyecto todavía tiene un largo camino por recorrer.

## Sembrado de _bugs_

La siembra de _bugs_ es una práctica en la que un grupo inserta intencionadamente _bugs_ en un programa para su detección por otro grupo. La relación entre el número de _bugs_ detectados y el número total de _bugs_ sembrados proporciona una idea aproximada del número total de _bugs_ no sembrados que se han detectado.

Suponga que en GigaTron 3.0 ha introducido intencionalmente el programa con 50 errores. Para obtener el mejor efecto, los errores sembrados deben cubrir la totalidad de la funcionalidad del producto y toda la gama de severidades, desde errores de colisión hasta errores cosméticos.

Suponga que en un punto del proyecto, cuando usted crea que las pruebas están casi completas, mira el informe del _bug_ sembrado. Usted encuentra que se han reportado 31 _bugs_ sembrados y 600 _bugs_ _"reales"_. Se puede estimar el número total de _bugs_ con la fórmula:

  _reales_<sub>Totales</sub> = (_sembrados_<sub>Totales</sub> / _sembrados_<sub>Encontrados</sub>) * _reales_<sub>Encontrados</sub>

Esta técnica sugiere que GigaTron 3.0 tiene aproximadamente 50 / 31 * 600 = 967 _bugs_ totales.

Para utilizar la siembra de _bugs_, debe sembrar los _bugs_ antes del comienzo de las pruebas cuya eficacia desea determinar. Si su prueba utiliza métodos manuales y no tiene una manera sistemática de cubrir el mismo campo de pruebas dos veces, usted debe sembrar _bugs_ antes de que comience la prueba. Si su prueba utiliza pruebas de regresión completamente automatizadas, usted puede sembrar _bugs_ virtualmente en cualquier momento para determinar la efectividad de las pruebas automatizadas.

Un problema común con los programas de sembrado de _bugs_ es el olvido de eliminar los _bugs_ sembrados. Otro problema común es que la eliminación de los _bugs_ sembrados introduce nuevos errores. Para prevenir estos problemas, asegúrese de eliminar todos los _bugs_ sembrados antes de las pruebas finales del sistema y la liberación del producto. Un estándar de implementación útil para los errores sembrados es exigir que sólo se implementen añadiendo una o dos líneas de código que crean el error; este estándar garantiza que puede eliminar los errores sembrados de forma segura simplemente eliminando las líneas de código erróneas.

## Modelado de _bugs_

Un colega mío recientemente agregó varios cientos de líneas de código a un programa existente en una sola sesión. La primera vez que compiló el código, obtuvo una compilación limpia sin errores. Su codificación inicial parecía ser perfecta. Sin embargo, cuando intentó probar la nueva funcionalidad, descubrió que no existía. Cuando reexaminó su nuevo código, descubrió que su trabajo había sido incrustado entre un preprocesador de macros que desactivaba el nuevo código. Cuando movió el nuevo código fuera del alcance de la macro, produjo el número habitual de errores del compilador.

Con los _bugs_ de software, ninguna noticia suele ser mala noticia. Si el proyecto ha llegado a una etapa tardía con pocos _bugs_ reportados, hay una tendencia natural a pensar: "Finalmente lo hicimos bien y creamos un programa con casi ningún _bug_" En realidad, ninguna noticia es más a menudo el resultado de pruebas insuficientes que de prácticas superlativas de desarrollo.

Algunas de las herramientas más sofisticadas de estimación y control de proyectos de software contienen una funcionalidad de modelado de _bugs_ que puede predecir el número de _bugs_ que se espera encontrar en cada punto del proyecto. Comparando los _bugs_ realmente detectados con el número pronosticado, usted puede evaluar si su proyecto se mantiene al día con la detección de _bugs_ o si se queda rezagado.

## Combinaciones

Evaluar las combinaciones de densidad de _bugs_, grupos de _bugs_ y siembra de _bugs_ le dará más confianza de la que podría tener en cualquiera de las técnicas individualmente. Examinando la densidad del _bug_ solo en GigaTron 3.0 sugirió que usted debe esperar 700 a 1000 _bugs_ totales, y que usted debe quitar 650 a 950 antes de la liberación del producto para alcanzar el 95 por ciento de eliminación del _bug_ antes de la liberación. Si usted ha detectado 600 _bugs_, la información de densidad de _bugs_ por sí sola podría llevarle a declarar el producto "casi listo para enviar", pero el análisis de agrupación de _bugs_ calcula que GigaTron 3.0 producirá aproximadamente 933 _bugs_ totales. Comparando los resultados de esas dos técnicas sugiere que usted debe esperar un conteo total de _bugs_ hacia el extremo superior del rango de densidad de _bugs_ en lugar del extremo inferior. Debido a que la técnica de siembra de _bugs_ también estima un número total de _bugs_ en los 900s, GigaTron 3.0 parece ser un programa relativamente defectuoso.

## Recursos

La literatura popular no tiene mucho que decir sobre la predicción de _bugs_. Una excepción notable es el libro de Glenford Myers de 1976, Software Reliability (Wiley). Lawrence H. Putnam y Ware Myers discuten el tema específico del modelado de _bugs_ con cierta profundidad en Measures for Excellence (Yourdon Press 1992).


### Referencias

* [Gauging Software Readiness With Defect Tracking](http://stevemcconnell.com/articles/gauging-software-readiness-with-defect-tracking/)
