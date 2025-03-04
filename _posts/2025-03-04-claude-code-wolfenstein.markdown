---
layout: post
title: Claude Code Wolfenstein
author: josejuan
categories: IA
---

Siguiendo con los _katas_ para tomar el pulso a **Claude Code**, le pedimos hacer un _raycasting_, icono de los que empezábamos la carrera por aquel entonces.

Esta vez le he pedido un raycasting muy básico, con mapas en ficheros json y sin texturas. El tio se ha liado a montar un servidor en node porque se me olvidó decirle que era un _SPA_ y lo tuvo que refactorizar.

La verdad es que no se si funcionará, pero la primera impresión **impresiona**:

![Wolfenstein 3D 1](/images/wolfenstein1.png)

Pero no, ha cometido unos cuantos errores en la codificación inicial, pero hay que reconocerle que tras esos dos fallos, funciona perfectamente ¡y con minimapa!

![Wolfenstein 3D 2](/images/wolfenstein2.png)

En un ray casting, si no se corrige, como estamos tratando de forma angular, cada una de las barras verticales de nuestro foco visual se produce un efecto ojo de pez bastante feo:

![Wolfenstein 3D 3](/images/wolfenstein3.png)

Le pedimos que lo corrija y lo hace perfectamente y a la primera:

![Wolfenstein 3D 4](/images/wolfenstein4.png)

Ahora le pedimos que añada texturas, que nos diga como las creamos. Nos dice después de hacer todo que de 64x64 pero es demasiada poca calidad y le decimos que lo corrija para que las texturas puedan ser de 256x256. Se queda bastante rato refactorizando (no parecía un cambio tan drástico), pero al fin lo hace:

![Wolfenstein 3D 5](/images/wolfenstein5.png)

Tiene algún bug que no procesa bien otros mapas, pero pasándole la consola con el error él ha sabido solucionarlo. La verdad es que luce sorprendentemente bien.

Le pedimos que añada suelo y techo, por no complicar, que sea el mismo para todos los mapas y _"valdosas"_, no lo hace mal del todo, pero el texturizado es horroroso en el sentido de que no se _"mueve"_ correctamente (no lo pinta respecto el punto de vista):

![Wolfenstein 3D 6](/images/wolfenstein6.png)

Le pedimos que lo corrija intentando describirle cómo se desajusta al movernos, lo intenta un par de veces pero no lo hace bien, los sistemas de coordenadas no coinciden. Lo intenta una y otra vez gastando mis escasos euros de crédito.

![Wolfenstein 3D 7](/images/wolfenstein7.png)

Pero no termina de atinar, solo tras varios intentos es que se da cuenta que la corrección de ojo de pez en los muros debe aplicarla al suelo y techo y se ve _"casi"_ correctamente, ya que hay un pequeño efecto ojo de pez en suelo y techo:

![Wolfenstein 3D 7](/images/wolfenstein8.png)

Que le pedimos que corrija pero aún lo aumenta más:

![Wolfenstein 3D 7](/images/wolfenstein9.png)

Entonces le advertimos que lo ha aumentado (no disminuido) y que lo corrija, pero el pobre no da para más, no encuentra la relación entre la geometría de los muros (el raycasting) y el suelo y techo.

El coste total han sido **5,04 $**.

El código final han sido solo **781 líneas** incluyendo los mapas (más del doble si dejamos los comentarios que ha dejado).

El juego creado por **Claude Code** está en:

[Wolfenstein by Claude Code](/static/wolfenstein/index.html)
