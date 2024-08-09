---
layout: post
title: Metaprogramando Haskell con Sage
author: josejuan
categories: algorithms
---

Una forma directa de resolver problemas de búsqueda es usando _backtracking_ y en Haskell es fácil y directo. Si queremos resolver el cubo de _Rubik_ sabemos que podemos dejar fíjos los ejes (X, Y y Z) y rotar únicamente las 6 caras visibles en uno u otro sentido. Así, si tenemos las rotaciones **rots** sólo debemos hacer _backtracking_ hasta llegar al estado inicial **zero**. En este caso, usaremos **Alternative** para quedarnos con una única solución (pero podríamos quedarnos con todas y sería muy similar):

```Haskell
import Control.Applicative.Alternative (asum)

solN :: Int ->String ->Cubo ->Maybe String                                 -- movimientos, solución parcial y cubo a resolver
solN 0 _ _ = Nothing                                                       -- no quedan movimientos, sin solución
solN n x c | c == zero  = Just x                                           -- solución encontrada
           | otherwise = asum [solN (n - 1) (m: x) (r c) | (m, r) <-rots]  -- la primera solución al aplicar las rotaciones

solve c = asum [solN i "" c | i <-[1..21]]                                 -- para tener la de menos movimientos (y evitar lazos)
```

Y ya está, podemos resolver el cubo de _Rubik_. Por ejemplo:

```Haskell
> solve (rot_B $ rot_L $ rot_U $ rot_l $ rot_B zero)
Just "bLulb"
```

Claro que he hecho algo de trampa, ¿dónde está la definición de **Cubo**?, ¿y **rots**?, ¿y los movimientos **rot_B**, **rot_L**, ...? Han sido generados usando <a href="http://doc.sagemath.org/html/en/index.html">Sage</a> que tiene pinta de ser una librería matemática en _Python_ (ni idea, andaba buscando ya construido el grupo generador y me salió ésta) y que permite calcular las rotaciones. Rápidamente decir que si rotamos una cara (digamos **U**) entonces _"contrarotarla"_ es rotarla 3 veces (hacer **UUU**). Y que obtenemos los índices de las caras (1, 2, ... 48; se excluyen los ejes porque permanecen fijos) y poco más.

Veamos el código para generar las rotaciones:

```python
import string

rubik = CubeGroup()

def rot(r):
  q=rubik.faces(r).items()
  return string.join(map(lambda x: "r"+str(x),filter(lambda x: x > 0,
      q[1][1][0]+q[1][1][1]+q[1][1][2]+
      q[5][1][0]+q[5][1][1]+q[5][1][2]+
      q[4][1][0]+q[4][1][1]+q[4][1][2]+
      q[0][1][0]+q[0][1][1]+q[0][1][2]+
      q[2][1][0]+q[2][1][1]+q[2][1][2]+
      q[3][1][0]+q[3][1][1]+q[3][1][2])))

def tor(n,r):
  print("rot_"+n+" (Cubo "+rot("")+") = Cubo "+rot(r))

def axis(r):
  tor(r,r)
  tor(string.lower(r),r+"*"+r+"*"+r)

rs=['U','D','R','L','F','B']

for r in rs:
  axis(r)

print("rots = ["+string.join(map(lambda x: "('"+x+"', rot_"+x+"), ('"+string.lower(x)+"', rot_"+string.lower(x)+")",rs),", ")+"]")
print("zero = Cubo "+string.join(map(str,[1..48])))
print("data Cubo = Cubo "+string.join(map(lambda x: "!Int",[1..48]))+" deriving Eq")
```

Y el código _Haskell_ metaprogramado es:

```Haskell
rot_U (Cubo r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 r16 r17 r18 r19 r20 r21 r22 r23 r24 r25 r26 r27 r28 r29 r30 r31 r32 r33 r34 r35 r36 r37 r38 r39 r40 r41 r42 r43 r44 r45 r46 r47 r48) = Cubo r3 r5 r8 r2 r7 r1 r4 r6 r33 r34 r35 r12 r13 r14 r15 r16 r9 r10 r11 r20 r21 r22 r23 r24 r17 r18 r19 r28 r29 r30 r31 r32 r25 r26 r27 r36 r37 r38 r39 r40 r41 r42 r43 r44 r45 r46 r47 r48
rot_u (Cubo r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 r16 r17 r18 r19 r20 r21 r22 r23 r24 r25 r26 r27 r28 r29 r30 r31 r32 r33 r34 r35 r36 r37 r38 r39 r40 r41 r42 r43 r44 r45 r46 r47 r48) = Cubo r6 r4 r1 r7 r2 r8 r5 r3 r17 r18 r19 r12 r13 r14 r15 r16 r25 r26 r27 r20 r21 r22 r23 r24 r33 r34 r35 r28 r29 r30 r31 r32 r9 r10 r11 r36 r37 r38 r39 r40 r41 r42 r43 r44 r45 r46 r47 r48
rot_D (Cubo r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 r16 r17 r18 r19 r20 r21 r22 r23 r24 r25 r26 r27 r28 r29 r30 r31 r32 r33 r34 r35 r36 r37 r38 r39 r40 r41 r42 r43 r44 r45 r46 r47 r48) = Cubo r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r22 r23 r24 r17 r18 r19 r20 r21 r30 r31 r32 r25 r26 r27 r28 r29 r38 r39 r40 r33 r34 r35 r36 r37 r14 r15 r16 r43 r45 r48 r42 r47 r41 r44 r46
rot_d (Cubo r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 r16 r17 r18 r19 r20 r21 r22 r23 r24 r25 r26 r27 r28 r29 r30 r31 r32 r33 r34 r35 r36 r37 r38 r39 r40 r41 r42 r43 r44 r45 r46 r47 r48) = Cubo r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r38 r39 r40 r17 r18 r19 r20 r21 r14 r15 r16 r25 r26 r27 r28 r29 r22 r23 r24 r33 r34 r35 r36 r37 r30 r31 r32 r46 r44 r41 r47 r42 r48 r45 r43
rot_R (Cubo r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 r16 r17 r18 r19 r20 r21 r22 r23 r24 r25 r26 r27 r28 r29 r30 r31 r32 r33 r34 r35 r36 r37 r38 r39 r40 r41 r42 r43 r44 r45 r46 r47 r48) = Cubo r1 r2 r38 r4 r36 r6 r7 r33 r9 r10 r11 r12 r13 r14 r15 r16 r17 r18 r3 r20 r5 r22 r23 r8 r27 r29 r32 r26 r31 r25 r28 r30 r48 r34 r35 r45 r37 r43 r39 r40 r41 r42 r19 r44 r21 r46 r47 r24
rot_r (Cubo r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 r16 r17 r18 r19 r20 r21 r22 r23 r24 r25 r26 r27 r28 r29 r30 r31 r32 r33 r34 r35 r36 r37 r38 r39 r40 r41 r42 r43 r44 r45 r46 r47 r48) = Cubo r1 r2 r19 r4 r21 r6 r7 r24 r9 r10 r11 r12 r13 r14 r15 r16 r17 r18 r43 r20 r45 r22 r23 r48 r30 r28 r25 r31 r26 r32 r29 r27 r8 r34 r35 r5 r37 r3 r39 r40 r41 r42 r38 r44 r36 r46 r47 r33
rot_L (Cubo r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 r16 r17 r18 r19 r20 r21 r22 r23 r24 r25 r26 r27 r28 r29 r30 r31 r32 r33 r34 r35 r36 r37 r38 r39 r40 r41 r42 r43 r44 r45 r46 r47 r48) = Cubo r17 r2 r3 r20 r5 r22 r7 r8 r11 r13 r16 r10 r15 r9 r12 r14 r41 r18 r19 r44 r21 r46 r23 r24 r25 r26 r27 r28 r29 r30 r31 r32 r33 r34 r6 r36 r4 r38 r39 r1 r40 r42 r43 r37 r45 r35 r47 r48
rot_l (Cubo r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 r16 r17 r18 r19 r20 r21 r22 r23 r24 r25 r26 r27 r28 r29 r30 r31 r32 r33 r34 r35 r36 r37 r38 r39 r40 r41 r42 r43 r44 r45 r46 r47 r48) = Cubo r40 r2 r3 r37 r5 r35 r7 r8 r14 r12 r9 r15 r10 r16 r13 r11 r1 r18 r19 r4 r21 r6 r23 r24 r25 r26 r27 r28 r29 r30 r31 r32 r33 r34 r46 r36 r44 r38 r39 r41 r17 r42 r43 r20 r45 r22 r47 r48
rot_F (Cubo r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 r16 r17 r18 r19 r20 r21 r22 r23 r24 r25 r26 r27 r28 r29 r30 r31 r32 r33 r34 r35 r36 r37 r38 r39 r40 r41 r42 r43 r44 r45 r46 r47 r48) = Cubo r1 r2 r3 r4 r5 r25 r28 r30 r9 r10 r8 r12 r7 r14 r15 r6 r19 r21 r24 r18 r23 r17 r20 r22 r43 r26 r27 r42 r29 r41 r31 r32 r33 r34 r35 r36 r37 r38 r39 r40 r11 r13 r16 r44 r45 r46 r47 r48
rot_f (Cubo r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 r16 r17 r18 r19 r20 r21 r22 r23 r24 r25 r26 r27 r28 r29 r30 r31 r32 r33 r34 r35 r36 r37 r38 r39 r40 r41 r42 r43 r44 r45 r46 r47 r48) = Cubo r1 r2 r3 r4 r5 r16 r13 r11 r9 r10 r41 r12 r42 r14 r15 r43 r22 r20 r17 r23 r18 r24 r21 r19 r6 r26 r27 r7 r29 r8 r31 r32 r33 r34 r35 r36 r37 r38 r39 r40 r30 r28 r25 r44 r45 r46 r47 r48
rot_B (Cubo r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 r16 r17 r18 r19 r20 r21 r22 r23 r24 r25 r26 r27 r28 r29 r30 r31 r32 r33 r34 r35 r36 r37 r38 r39 r40 r41 r42 r43 r44 r45 r46 r47 r48) = Cubo r14 r12 r9 r4 r5 r6 r7 r8 r46 r10 r11 r47 r13 r48 r15 r16 r17 r18 r19 r20 r21 r22 r23 r24 r25 r26 r1 r28 r2 r30 r31 r3 r35 r37 r40 r34 r39 r33 r36 r38 r41 r42 r43 r44 r45 r32 r29 r27
rot_b (Cubo r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 r16 r17 r18 r19 r20 r21 r22 r23 r24 r25 r26 r27 r28 r29 r30 r31 r32 r33 r34 r35 r36 r37 r38 r39 r40 r41 r42 r43 r44 r45 r46 r47 r48) = Cubo r27 r29 r32 r4 r5 r6 r7 r8 r3 r10 r11 r2 r13 r1 r15 r16 r17 r18 r19 r20 r21 r22 r23 r24 r25 r26 r48 r28 r47 r30 r31 r46 r38 r36 r33 r39 r34 r40 r37 r35 r41 r42 r43 r44 r45 r9 r12 r14
rots = [('U', rot_U), ('u', rot_u), ('D', rot_D), ('d', rot_d), ('R', rot_R), ('r', rot_r), ('L', rot_L), ('l', rot_l), ('F', rot_F), ('f', rot_f), ('B', rot_B), ('b', rot_b)]
zero = Cubo 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48
data Cubo = Cubo !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int !Int deriving Eq
```

### Referencias

* [Sage](http://doc.sagemath.org/html/en/index.html)
