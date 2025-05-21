---
layout: post
title: Lucky Numbers y o3-mini-high
author: josejuan
categories: algorithms IA
---

El algoritmo descrito en <a href="/algorithms/2025/01/23/a000959-lucky-numbers.html">A000959 Lucky Numbers</a> es con diferencia el más eficiente en términos de operaciones que conozco (y del que estoy feliz por ser el autor y lo hayan querido referenciar en <a href="https://oeis.org/A000959">OEIS: A000959</a> **:)**).

Sin embargo, tiene una constante multiplicativa muy alta y el consumo de memoria es muy alto (Haskell **xD**), es por ello que pedí a **o3-mini-high** que, si tomando el algoritmo en *Haskell*, se le ocurría una forma rápida de implementarla en **C**. Al principio tratamos de implementar estructuras *Okasaki* en *C* puro, pero no funcionaba bien y, el sencillo *Zipper* en *Haskell* se le atragantaba **xD**.

Pero dándole más libertad, se le ocurrió la siguiente y genial implementación de la que quiero destacar las chispas de inteligencia **genuinas de o3-mini-high**:

1. aunque el cálculo de una posición (un número) puede evaluarse, se dió cuenta que si lo importante es la velocidad, merecía tenerlo en un array.
1. el árbol de *Fenwick* no es tan óptimo como el *Finger-Zipper-Tree* pero la constante multiplicativa es tan brutalmente baja, que era ideal para aplicar a este problema.
1. el uso de un array binario para mantener vivos es otra genialidad, porque pasa a *O(1)* un coste *O(log n)*.

El hecho de que un *LLM* sea capaz de *"entender"* perfectamente el código en *Haskell*, poder hacer una implementación funcional en *C*, y además, saber identificar estructuras óptimas y adaptarlas al problema concreto para cumplir el objetivo de máxima velocidad me parece, literalmente alucinante.

En fin, posteriormente con alguna modificación (como eliminar el primer array por tema de optimización de memoria o pasar el array de bits a un bit array), tenemos aquí un brutal algoritmo creado básicamente por una *IA* que enumera los números de la suerte hasta una cota dada:

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#define GET_BIT(arr, i) (((arr)[(i) >> 3] >> ((i) & 7)) & 1)
#define SET_BIT(arr, i) ((arr)[(i) >> 3] |= (1 << ((i) & 7)))
#define CLEAR_BIT(arr, i) ((arr)[(i) >> 3] &= ~(1 << ((i) & 7)))
#define cand(z) (2 * (z) - 1)

static void fenw_update(int64_t *F, int64_t n, int64_t i, int64_t delta) {
    for (; i <= n; i += i & -i)
        F[i] += delta;
}

static int64_t fenw_find_kth(int64_t *F, int64_t n, int64_t k) {
    int64_t idx = 0, bit;
    for (bit = 1; bit <= n; bit <<= 1);
    for (bit >>= 1; bit; bit >>= 1) {
        if (idx + bit <= n && F[idx + bit] < k) {
            k -= F[idx + bit];
            idx += bit;
        }
    }
    return idx + 1;
}

int main(int argc, char *argv[]){
    if (argc != 2) {
        fprintf(stderr, "Usage: %s max\n", argv[0]);
        return 1;
    }
    int64_t X = atoll(argv[1]);
    if (X < 1)
        return 1;
    int64_t m = (X + 1) / 2;
    uint8_t *alive = calloc((m + 7) / 8, sizeof(uint8_t));
    int64_t *F = malloc((m + 1) * sizeof(int64_t));
    if (!alive || !F) {
        perror("malloc");
        return 1;
    }
    for (int64_t i = 1; i <= m; i++) {
        SET_BIT(alive, i);
        F[i] = 1;
    }
    for (int64_t i = 1; i <= m; i++) {
        int64_t j = i + (i & -i);
        if (j <= m)
            F[j] += F[i];
    }
    int64_t total = m;
    int64_t k = 2;
    while (k <= total) {
        int64_t pos = fenw_find_kth(F, m, k);
        int64_t lucky = cand(pos);
        if (lucky > total)
            break;
        int64_t step = lucky;
        int64_t posToRemove = step;
        while (posToRemove <= total) {
            int64_t r = fenw_find_kth(F, m, posToRemove);
            fenw_update(F, m, r, -1);
            CLEAR_BIT(alive, r);
            total--;
            posToRemove += step - 1;
        }
        k++;
    }
    int64_t cnt = 0;
    for (int64_t i = 1; i <= m; i++) {
        if (GET_BIT(alive, i) && cand(i) <= X) {
            cnt++;
            printf("%lld %lld\n", cnt, cand(i));
        }
    }
    free(alive);
    free(F);
    return 0;
}
```

Por ejemplo:

```bash
$ gcc -Ofast -march=native -flto -funroll-loops -fipa-pta -fomit-frame-pointer -ffast-math o3.64.c -o o3.64
$ time -f "%e, %M" ./o3.64.2.2 10000000000 > lucky.10g.o3
1507.61, 39674240
$ tail lucky.10g.o3
418348035 9999999807
418348036 9999999853
418348037 9999999883
418348038 9999999895
418348039 9999999903
418348040 9999999921
418348041 9999999937
418348042 9999999957
418348043 9999999985
418348044 9999999997
```

Es decir, ha calculado los primeros ~420 millones de números de la suerte, hasta 10e10, en 25 minutos. ¡Nada mal! **xD**

Para ver que el coste viene siendo *O(n log n)*, lanzamos hasta 10e9, 0.5e9, 0.1e9, ... y tenemos:

```bash
$ time -f "%e, %M" ./o3.64.2.2 1000000000 > /dev/null
124.46, 3968772
$ time -f "%e, %M" ./o3.64.2.2 500000000 > /dev/null
58.56, 1984928
$ time -f "%e, %M" ./o3.64.2.2 100000000 > /dev/null
9.92, 398200
```

## Actualización 2025-03-01

Como siempre la cabeza insatisfecha, incapaz de encontrar alguna propiedad interesante que explotar, se conforma con arañar ciclos y ciclos... sugerí <a href="https://oeis.org/A000959">publicar en OEIS</a> una versión mucho más eficiente que hace uso de una jerarquía de árboles de Fenwick y bitmaps a nivel de palabra (64 bits), reduciendo a casi 1 bit por número y mejorando la afinidad de caché. Por supuesto todo ello con la ayuda de _J. Bille, I. Larsen, I. L. Gørtz, et al. “Succinct Partial Sums and Fenwick Trees.” ESA 2017_ y creo que fue `o3`.

Por comparar, ahora los tiempos anteriores son:

```bash
$ time -f "%e, %M" ./oo3.c.exec 1000000000 > /dev/null
71.02, 97928
$ time -f "%e, %M" ./oo3.c.exec 500000000 > /dev/null
29.62, 52124
$ time -f "%e, %M" ./oo3.c.exec 100000000 > /dev/null
3.69, 15472
```
