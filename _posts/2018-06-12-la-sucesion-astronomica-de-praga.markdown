---
layout: post
title: La sucesión del reloj astronómico de Praga
author: josejuan
categories: algorithms
---

@Jose_A_Alonso <a href="http://www.glc.us.es/~jalonso/exercitium/la-sucesion-del-reloj-astronomico-de-praga">sugirió</a> enumerar una sucesión y en Twitter la han comentado y no he visto que calculen cualquier elemento en tiempo O(1) (salvo operaciones), por lo que no he podido resistirme.

Básicamente la sucesión del reloj astronómico de Praga consiste en ir juntando dígitos de la sucesión:

```
1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2, ...
```

De forma que se obtengan todos los naturales:

```
(1), (2), (3), (4), (3, 2), (1, 2, 3), (4, 3), ...
```

Lo interesante no es enumerarlos, sino poder alcanzar cualquier natural de forma eficiente, es decir **¿cuál es la secuencia de dígitos para un N?** tal que pueda ser muy grande y por tanto no haga falta obtener los anteriores.

Como vamos a usar la raíz cuadrada de enteros, necesitamos:

```haskell
import Math.NumberTheory.Powers.Squares
```

Ahora, vemos que la sucesión de partida va de 6 en 6 dígitos (123432) y que dichos **grupos** suman 15, si consideramos los **n** tales que su secuencia termina exactamente en un grupo **g**, debe ser:

```
n (n + 1) / 2 = 15 g
```

de donde

```
n = (-1 + sqrt(120 g + 1)) / 2
```

es decir, debe existir algún **z** tal que

```
z^2 = 120 g + 1
```

Dado **n** una cota de **g** es

```
g = n (n + 1) / 30
```

y del cuadrado perfecto

```
z^2 = 4 n (n + 1) + 1
```

por lo que el número **m** que cierra grupo completo mas próximo por debajo a cierto **n** es (con coste constante)

```haskell
lowM n = let maxz = if odd w then w else (w - 1) where w = integerSquareRoot $ 4 * n * (n + 1) + 1
         in  head [m | z <- [maxz, maxz - 2..], let (g, r) = (z * z - 1) `divMod` 120, r == 0, let m = (z - 1) `div` 2, m < n]
```

Por otro lado, para alcanzar un número **n** dado el último que cierra grupo **m**, debemos restar cierto número de grupos (que suman 15) y considerar los posibles restos 1, 3, 6, 10 o 13 (no hay otros para n>10).

Eso nos da la cabecera o inicio de la secuencia que buscamos:

```haskell
cabecera n = let m = lowM n
                 j = sum [m + 1, m + 2..n - 1] -- salto hasta llegar a n
             in  case j `mod` 15 of
                   0  -> (0, 0)
                   1  -> (23432, 14)
                   3  -> (3432, 12)
                   6  -> (432, 9)
                   10 -> (32, 5)
                   13 -> (2, 2)
                   _  -> error "bug!"
```

Ahora, como queremos obtener la secuencia de números **astronómicos** ;P vamos a representarlos de forma compacta como el triplete **(h, d, t)** donde **h** es el prefijo, **d** el número de grupos enteros de en medio y **t** el sufijo.


Ahora obtener el interior y la cola es trivial:

```haskell
praga 1 = (0,0,1)
praga 2 = (0,0,2)
praga 3 = (0,0,3)
praga 4 = (0,0,4)
praga 5 = (0,0,32)
praga 6 = (0,0,123)
praga 7 = (0,0,43)
praga n = let (h, s) = cabecera n
          in  case (n - s) `divMod` 15 of
                (d, 0 ) -> (h, d, 0)
                (d, 1 ) -> (h, d, 1)
                (d, 3 ) -> (h, d, 12)
                (d, 6 ) -> (h, d, 123)
                (d, 10) -> (h, d, 1234)
                (d, 13) -> (h, d, 12343)
                _       -> error "bug!"
```

Si queremos mostrarlos sin compactar:

```haskell
showPraga (h, d, t) = (if h == 0 then "" else show h) ++ concat (replicate d "123432") ++ (if t == 0 then "" else show t)
```

Ahora ya podemos obtener la secuencia de cualquier número **astronómico** en tiempo constante (operaciones en `Integer` no son constantes)

```haskell
> praga (12345^543+127)
(432,318840093960157628622853085683780590492647672185314832251591349782946086789365739474
99458645353223523332399338144687361320512428743085526613700917724280566663878314870335800
45133239819511094984206748593348106432277159586903470226003797954498327992309848186805312
36234259966577401511567262413888193859008040219642935618470734949649073892973859225142478
37095702336389746406199795908446782529307623307688619552253132543193618118041776941309182
90707719595729427431824011801703283286782770202719108175215912329805496719890944711589523
31128046303805261384392827219495105513827248678493945175038905523067804489002608599697849
44165634151906949792002513874080083274981661108046037737174449129779257332819868431906179
52889686251601521364534531673981614520293254372573553451578443259901143311679123857670923
90390554496322920274707393113107383723588108197972568301952539120066499128101822451275711
15473151349519511538755767541708586280856935344531828373233490957681593417731003045549281
62846737135672429035178478789331032890519022788724960750000171961086975965437708140123055
41735155310883412376665538349813285172551822995774799332803350747758813950917042154392994
44017644627982678708234656884444733561525047299739568836875998638685881378638633807817015
35084065756288759519483158115215458998099878942719025845939279478611074545467653741852375
45244403995549938277611976583520829234161171238567792237010084376426443392703742802870506
38712137905746657396122902048372250671803428015060424237630738385961554522778451615252327
03633754963600279692392744938259422146757560902974014450952433281616013078543684163380154
72063069756235946230581374810495813302891628643029540821204265598422166774955343816378021
77866720118008707099780776349404523871776511196093672828466741306320072527233917492564673
75279253990987153558006465010104874743763650814652138498937003182282672502834452166398974
23038849578033692013008525444824470086212713768600749913837409430182616021180349340237147
10599014415113962683829926560258629941173872488521125917263064958195209446978714565548023
08363981957444256315022152008165055858329544037661113150441676961458934236400465549365205
68321721776855864223224899695250789833925358950691281156863965406955685466527938842773438
2,12343)
```

Y ésto es todo!

**NOTA**, si _"limpiamos"_ las ideas anteriores, podemos sacar una versión más compacta:

```haskell
praga n = let k = [1,2,3,4,5,1,2,3,4,1,2,3,4,5,1] !! fromIntegral ((n - 1) `mod` 15)
              j = (2 * n * k - 2 * n - k * k + k) `div` 2
              w = [(0,(0,0,0)),(1,(23432,14,1)),(3,(3432,12,12)),(6,(432,9,123)),(10,(32,5,1234)),(13,(2,2,12343))]
              Just (h, s, _) = lookup (j `mod` 15) w
              (d, r) = (n - s) `divMod` 15
              Just (_, _, t) = lookup r w
          in  (h, d, t)
```

Los cambios son:
1. en lugar de iterar para sacar aquel `m` que cierra grupo, podemos usar directamente los restos módulo 15.
2. en lugar de sumar esos (como mucho 5) números, calculamos `j` directamente.
3. en lugar de usar `case`, usamos `lookup` y metemos en un único `w` los prefijos y sufijos.
