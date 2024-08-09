---
layout: post
title: CoMultiplicación, CoCubo y un árbol infinito de CoTrimorfos
author: josejuan
categories: algorithms
---

@Jose_A_Alonso <a href="http://www.glc.us.es/~jalonso/exercitium/numeros-trimorficos/">sugirió</a> un problema que básicamente pasa por enumerar los números _trimórficos_. Tras aportar una solución _"al vuelo"_ arrastrando explícitamente un estado, quise reimplementarlo usando corecursión.

## Números trimórficos

Se dice que un número es trimórfico si es prefijo de su cubo.

Por ejemplo 501^3 es 125751501 que empieza en 501, luego es trimórfico.

## Los números trimórficos forman un árbol

Es fácil ver que los números trimórficos formal un árbol o quizás sea más fácil ver que podemos multiplicar _"en columnas"_ en lugar de _"por filas"_ como nos enseñaron en la escuela.

```
    3  0  2           3  0  2           3  0  2
 x  5  3  1        x  5  3  1        x  5  3  1
-----------       -----------       -----------
 +        2  ==>         0  2  ==>      3  0  2  ==> ...
-----------        +     6           +  0  6
          2       -----------          10
                         6  2       -----------
                                        3  6  2
```

Por tanto, si un número es trimórfico, sus prefijos son trimórficos, porque acabamos de ver que el resultado de multiplicar los prefijos, debe coincidir con los mismos prefijos, es decir, deben ser trimórficos.

## Multiplicación perezosa

Podemos implementar directamente una multiplicación perezosa usando el algoritmo anterior (el de toda la vida), algo como:

```Haskell
(.*) :: Integral a => [a] -> [a] -> [a]
(.*) = m 0 0 [] []
  where m 0 _   _   _ [] [] = []
        m q r xxs yys [] [] = w (q - 1) r xxs yys [0] [0]
        m q r xxs yys xs [] = m q r xxs yys xs [0]
        m q r xxs yys [] ys = m q r xxs yys [0] ys
        m q r xxs yys xs ys = w (q + 1) r xxs yys xs ys
        w q r xxs yys (x:xs) (y:ys) = let (xxs', yys') = (x:xxs, y:yys)
                                          (r', d) = (r + sum (zipWith (*) xxs' (reverse yys'))) `divMod` 10
                                      in  d: m q r' xxs' yys' xs ys

cubo :: Integral a => [a] -> [a]
cubo xs = xs .* xs .* xs
```

Esa operación de elevar al cubo también es perezosa. Para verificar si un número es trimórfico está bien, pero nosotros queremos recorrer el árbol de prefijos, de tal forma que sólo entraremos por las ramas que son trimórficas, el resto de ramas no las recorreremos. La implementación perezosa tiene un gran problema, si vamos multiplicando un prefijo, no podemos usarlo para calcular múltiples sufijos (bajar por las ramas del árbol).

Podemos mantener un estado e ir avanzando por pasos o bien podemos usar corecursión.

## CoMultiplicación

La comultiplicación consiste en poder iniciar una multiplicación y recuperar una _"congelación"_ del proceso que continua. La forma usual en _Haskell_ es crear un tipo como:

```Haskell
newtype CoMul a = CoMul { coMul :: a -> a -> (a, CoMul a) }
```

Que significa que multiplicamos dos dígitos (de la columna que sea) y obtenemos el dígito resultante final de esa columna y la continuación de la _comultiplicación_.

El estado necesario para mantener todos los dígitos involucrados en las sucesivas columnas al multiplicar y que es enviado al siguiente paso no lo podemos eliminar, pero la corecursión nos permite ocultarlo en la clausura, así, la siguiente función calcula un paso de multiplicación, a partir del resto de la suma anterior `r`, los dígitos obtenidos hasta ahora del primer número `xs`, los dígitos obtenidos hasta ahora del segundo número `ys` y los dos nuevos dígitos `x` e `y`:

```Haskell
comul :: Integral a => a -> [a] -> [a] -> a -> a -> (a, CoMul a)
comul r xs ys x y = let (xs', ys') = (x:xs, y:ys)
                        (r', d) = (r + sum (zipWith (*) xs' (reverse ys'))) `divMod` 10
                    in  (d, CoMul $ comul r' xs' ys')
```

El paso inicial **vacío** de la corecursión al multiplicar, lo creamos así:

```Haskell
mul :: Integral a => CoMul a
mul = CoMul $ comul 0 [] []
```

En que como se ve, devolvemos una _comultiplicación_ lista para recibir los dos primeros dígitos.

Por ejemplo, sabemos que `3 x 4 = 12` entonces:

```Haskell
> :t mul
mul :: Integral a => CoMul a
> :t coMul mul
coMul mul :: Integral a => a -> a -> (a, CoMul a)
> fst $ (coMul mul) 3 4
2
```

## CoCubo

Dada la comultiplicación, obtener el cocubo es inmediato:

```Haskell
newtype CoCubo a = CoCubo { coCubo :: a -> (a, CoCubo a) }

cocubo :: Integral a => CoMul a -> CoMul a -> a -> (a, CoCubo a)
cocubo cm cc x = let (y, cm') = (coMul cm) x x
                     (z, cc') = (coMul cc) y x
                 in  (z, CoCubo $ cocubo cm' cc')

cubo :: Integral a => CoCubo a
cubo = CoCubo $ cocubo mul mul
```

Como se ve, el estado necesario (que queda oculto en la clausura de `cocubo`) son dos comultiplicaciones y el `cubo` vacío es el `cocubo` de dos comultiplicaciones vacías.

```Haskell
> :t cubo
cubo :: Integral a => CoCubo a
> :t coCubo cubo
coCubo cubo :: Integral a => a -> (a, CoCubo a)
> fst $ (coCubo cubo) 7
3
```

## CoTrimorfos (o cotrimórficos)

En el último ejemplo anterior, el `cocubo` de `7` ha dado `3`, luego `7` **no es** trimórfico; es éste precisamente el `check` que debemos hacer para ir expandiendo una rama entre las alternativas (los dígitos del 0 al 9).

Por tanto, un _cotrimorfismo_ será una corecursión que nos da un dígito del prefijo y una lista de _cotrimorfismos_ (o ninguno si no puede crecer más). Algo como:

```Haskell
newtype CoTrimorfos a = CoTrimorfo { coTrimorfo :: (a, [CoTrimorfos a]) }
```

El `check` es como digo inmediato si entendemos el ejemplo anterior, pues para crecer la rama, basta ver si el siguiente dígito del cubo es el que entregamos:

```Haskell
cotrimorficos :: Integral a => [CoTrimorfos a]
cotrimorficos = grow cubo
  where grow cubo = concatMap (check cubo) [0..9]
        check cubo x = let (y, cubo') = (coCubo cubo) x
                       in  if x == y
                             then [CoTrimorfo (x, grow cubo')]
                             else []
```

¡Y ya está!, ya tenemos los infinitos números trimórficos enumerados eficientemente (se obtienen directamente sin ningún esfuerzo de _"tanteo"_).

## Obteniendo todos los números trimórficos

El árbol anterior nos sirve para poder buscar eficientemente sobre todo el espacio de los trimórficos, por ejemplo podríamos buscar aquellos que **no sean** prefijos (es decir, son nodos terminales), podríamos buscar trimórficos con ciertas propiedades (ej. contengan ciertos dígitos), etc... Pero nos piden enumerarlos, una forma es recorrer en profundidad, por ejemplo:

```Haskell
trimorfos :: (Read a, Show a, Integral a) => [a]
trimorfos = map (read . concatMap show) $ tail $ rec [([], cotrimorficos)]
  where rec cs = filter zero (fst <$> cs) ++ rec [(x:xs, c) | (xs, ts) <- cs, (x, c) <- coTrimorfo <$> ts]
        zero (0:_) = False
        zero    _  = True
```

En que quedan ordenados por número de dígitos, pero no dentro de ese grupo (sería fácil reordenarlos):

```Haskell
> take 20 trimorfos
[1,4,5,6,9,51,24,25,75,76,49,99,501,251,751,624,125,625,375,875]
(0.02 secs, 1,205,104 bytes)

> trimorfos !! 4000
498344728067219066704172400942344661978124266907875359446166985080646361371663840
490292193418819095816595244778618461409128782984384317032481734288865727376631465
191049880294479608146737605039571968937146718013756190554629968147642639039530073
191081698029385098900621665095808638110005574234232308961090041066199773922562599
18212890625
(2.63 secs, 3,267,314,496 bytes)
```

## Chequeando trimórficos

Otra operación interesante puede ser verificar si un número es trimórfico, no hace falta calcular su cubo, podemos recorrer perezosamente el árbol de trimórficos y ver si está o no bajando directamente por la ramas:

```Haskell
esTrimorfo :: Integral a => a -> Bool
esTrimorfo = rec cotrimorficos
  where rec cs n = case n `divMod` 10 of
                     (0, 0) -> True
                     (r, d) -> case lookup d (coTrimorfo <$> cs) of
                                  Nothing -> False
                                  Just cs -> rec cs r
```

Por ejemplo:

```Haskell
> esTrimorfo 49834472806721906670417240094234466197812426690787535944616698508064
636137166384049029219341881909581659524477861846140912878298438431703248173428886
572737663146519104988029447960814673760503957196893714671801375619055462996814764
263903953007319108169802938509890062166509580863811000557423423230896109004106619
977392256259918212890625
True
(0.12 secs, 128,547,104 bytes)
```

## Código completo

```Haskell
newtype CoMul a = CoMul { coMul :: a -> a -> (a, CoMul a) }

comul :: Integral a => a -> [a] -> [a] -> a -> a -> (a, CoMul a)
comul r xs ys x y = let (xs', ys') = (x:xs, y:ys)
                        (r', d) = (r + sum (zipWith (*) xs' (reverse ys'))) `divMod` 10
                    in  (d, CoMul $ comul r' xs' ys')

mul :: Integral a => CoMul a
mul = CoMul $ comul 0 [] []

newtype CoCubo a = CoCubo { coCubo :: a -> (a, CoCubo a) }

cocubo :: Integral a => CoMul a -> CoMul a -> a -> (a, CoCubo a)
cocubo cm cc x = let (y, cm') = (coMul cm) x x
                     (z, cc') = (coMul cc) y x
                 in  (z, CoCubo $ cocubo cm' cc')

cubo :: Integral a => CoCubo a
cubo = CoCubo $ cocubo mul mul

newtype CoTrimorfos a = CoTrimorfo { coTrimorfo :: (a, [CoTrimorfos a]) }

cotrimorficos :: Integral a => [CoTrimorfos a]
cotrimorficos = grow cubo
  where grow cubo = concatMap (check cubo) [0..9]
        check cubo x = let (y, cubo') = (coCubo cubo) x
                       in  if x == y
                             then [CoTrimorfo (x, grow cubo')]
                             else []

trimorfos :: (Read a, Show a, Integral a) => [a]
trimorfos = map (read . concatMap show) $ tail $ rec [([], cotrimorficos)]
  where rec cs = filter zero (fst <$> cs) ++ rec [(x:xs, c) | (xs, ts) <- cs, (x, c) <- coTrimorfo <$> ts]
        zero (0:_) = False
        zero    _  = True

esTrimorfo :: Integral a => a -> Bool
esTrimorfo = rec cotrimorficos
  where rec cs n = case n `divMod` 10 of
                     (0, 0) -> True
                     (r, d) -> case lookup d (coTrimorfo <$> cs) of
                                  Nothing -> False
                                  Just cs -> rec cs r
```
