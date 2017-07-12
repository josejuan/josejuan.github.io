---
title: Java Either
author: josejuan
tags: java functional programming
---

Cuando lanzo una excepción **X**, nunca es para atrapar **X** en algún otro sitio. Para mi una excepción es un caso que no se cómo controlar, ante el cual no se cómo responder y por tanto ¿para que atraparla? Sin embargo sí lanzo excepciones (_¡genéricas!_) habitualmente para reflejar, precisamente, aquellos casos que no se o no quiero controlar. Nunca me ha gustado la programación preventiva porque **añade relaciones y comportamientos que no controlo**. Me siento cómodo elevando una excepción desde un sitio muy lejano (ej. un _backend_) dejando que se manifieste en otro sitio diametralmente opuesto (ej. una interfaz de usuario). Seguramente sabes que lanzar excepciones genéricas es una mala práctica (véase por ejemplo la regla `squid : S00112` que dice _"Generic exceptions Error, RuntimeException, Throwable and Exception should never be thrown"_) por eso suelo usar excepciones más acordes como `IllegalStateException` pero rara vez suele importar demasiado.

El uso tradicional de las excepciones es manejar **dos** situaciones ante cierto proceso: éxito o fracaso. Sin embargo nuestros procesos no suelen ser tan sencillos ¿que pasa si atrapamos una excepción por un fracaso, realizamos una acción alternativa y ésta también falla? ¿elevamos dos excepciones? ¿sólo la última? ¿una nueva? ¿y si lanzo procesos concurrentes cuyo orden de excepción es impredecible? ¿y si quién lanzó el proceso no es quien recibe el resultado? etc... y así entramos en cuestiones relacionadas con el control del flujo de nuestros programas basados en excepciones que, por lo que yo alcanzo a ver, no termina muy bien (a modo de ejemplo, en la documentación de la interfaz <a href="https://docs.oracle.com/javase/8/docs/api/java/util/List.html">java.util.List</a> aparece **65 veces** la palabra _exception_ con perlas como _"It is not inconceivable that someone might wish to implement a list that prohibits duplicates, by throwing runtime exceptions when the user attempts to insert them, but we expect this usage to be rare"_ y seguramente lo más errado sea precisamente, que de raro nada).

Podría resumirse el infierno de las excepciones diciendo que _"no son componibles"_, que significa que no nos permiten reorganizar nuestro código de forma que podamos formar estructuras más complejas a partir de estructuras más simples manteniendo, simultáneamente, la coherencia y cohesión entre todas las partes.

Admito que puede haber un sesgo importante (dado que no tengo métricas objetivas) pero usar un estilo funcional en lenguajes como `C#` o `Java` hacen que no deje de sorprenderme de que tras una codificación o refactorización importante sin ejecutar (pero sí con la compilación en segundo plano) resulte sin problemas en la intención que pretendía, tengo un convencimiento muy alto de que es el estilo aplicativo/monádico quien tiene la culpa.

Sería largo comentar (y para mi buscar referencias) de los intentos de los lenguajes _mainstream_ por incluir capacidades funcionales. Siento una mezcla de risa, tristeza y alegría al ver intentos como `Optional` o `Stream` (de `Java 8`) o el `for { ... } yield` de `Scala`. Hay que admitir que se encuentran en el peor de los contextos para incluir ese tipo de estructuras y, aunque suelen quedarse en un _"sí pero no"_, retrospectivamente **son realmente admirables los avances en estos lenguajes**.

Pero adolecen de características que permitan representar adecuadamente, tanto desde el sistema de tipos como desde la sintáxis, el estilo aplicativo que tan buenos resultados da. No por nada desde hace mucho tiempo librerías y frameworks intentan integrar de una u otra forma ese estilo, desde **jQuery** allá por 2006 hasta (lo comentaba ayer <a href="https://twitter.com/_jmgomez_/status/884814297829957632">Juan M Gómez</a>) combinados como `TS + Baconjs + Node`.

## Estilo aplicativo (y monádico)

Hace muchos años que no necesito mucho más que `Either` y `Tuple` para tener un marco digno con el que poder hacer composiciones aplicativas. Por supuesto `Maybe`, listas perezosas, algunos _helpers_, etc... son útiles, pero eso y disponer de _lambdas_ es realmente lo único imprescindible. No suelo usar grandes librerías funcionales porque suelo tener problemas de integración con la plataforma u otras librerías y además si bien en `C#` podíamos extender los tipos con nuevos métodos, en `Java` ésto no es posible (que yo sepa), por lo que deberé esperar a que incluyan _"do notation"_.

### `parseInt`

El método `parseInt` en _Java_ eleva la excepción `NumberFormatException` **rompiendo** miserablemente el flujo de nuestro proceso en el caso que ocurra ¿cómo enlazo las acciones que debo hacer en caso de éxito con **todas** las posibles acciones que puedo hacer en caso de error?

```Java
  ...aquí hago cosas...
  int x = parseInt(...);
  ...por aquí uso x...
  int y = parseInt(...);
  ...por aquí uso x e y...
```

¿Cómo debo organizar las capturas de esa excepción si quiero fijar un valor por defecto?, pues algo así

```Java
  int x = parseIntOr(..., 33);
```

¿Y si quiero hacer algo para tomar acción alternativa (en lugar de un valor por defecto podría intentar parsear otra cadena)?

```Java
  int x = parseIntOr(input1, () -> parseIntOr(input2, () -> ...));
```

¿Y si en lugar de `N` cadenas tenemos una lista?

```Java
  int x = parseAnyIntOf(inputList);
```

¿Y si ninguno es _success_?

```Java
  int x = parseAnyIntOfOrElse(inputList1, () -> parseAnyIntOfOrElse(inputList2, ...));
```

Estamos aplicando estrategias _ad hoc_ en cada caso y **creando funciones específicas**, una refactorización implica reestructurar la estrategia pero además, ¿y si los resultados (éxito o fracaso) de `x` e `y` están relacionados? (por ejemplo, si hemos usado el valor _"failback"_ de `x` debemos usar el valor _"failback"_ de `y` salvo que no esté disponible en que intentaremos usar el oríginal de `y`, etc...) ¿cómo combinamos los éxitos o fracasos de ambos? Supongo que crearíamos funciones y más funciones para considerar esos nuevos flujos.

### `Either`

`Either<L,R>` es un tipo genérico que puede contener o un valor u otro pero nunca ambos y suele darse más relevancia al derecho `R` (de `right` de `success`) por lo que las implementaciones (al contrario que en `Tuple<A,B>` por ejemplo) no suelen ser simétricas (no hay un `bind` sobre `L` por ejemplo). Habitualmente a `L` se le llama `left` y representa `error` mientras que a `R` se le llama `right` y representa `success` **pero no siempre es así** (y veremos un caso más adelante).

Por lo demás podemos verlo como un objeto _"normal y corriente"_ con métodos normales y corrientes como `boolean isRight()` que nos dirá si cierta instancia tiene un valor en `R` o `boolean isLeft()` tiene un valor en `L`. También otros como `L getLeft()` y `R getRight()` que nos permitirán recuperar de nuevo su valor **y que lanzarán sendas excepciones si intentamos recuperar L habiendo R o al revés**.

Así las cosas, si tenemos sendos constructores `Either<L,R> left(L);` y `Either<L,R> right(R);` que construyen instancias de ese genérico, podríamos reformular nuestro `parseInt` como:

```Java
Either<Error, Integer> parseInt(String x) {
    try {
        return right(Integer.parseInt(x));
    } catch (NumberFormatException ex) {
        return left(error(ex.getLocalizedMessage()));
    }
}
```

Dónde `error` construye cierto tipo que representa un mensaje de error (podría ser el mismo tipo `Throwable` pero yo quiero que sea monoidal, ya veremos por qué), intentamos parsear y crear un `right` y en caso de excepción devolvemos un `left` con el error.

Para representar todos los casos anteriores, no necesitamos nada más que las propias estructuras que suministra `Either`:

```Java
int x = parseInt(input).orElse(33);
int x = parseInt(input1)
            .or(e -> parseInt(input2))
            .or(e -> parseInt(input3))
            ...
            .orElse(33);
int x = sequence(inputStream.map(this::parseInt)).map(Either::flip).flip().orElse(33);
```

Además, en todos los casos las evaluaciones son perezosas, es decir, sólo se realizan aquellos _"parseos"_ que son necesarios para cumplir el objetivo. `flip` invierte una instancia `Either<L,R>` convirtiéndola en una `Either<R,L>`, `sequence` evalúa perezosamente parando si hay un fallo, por lo que en la última línea realmente estamos parando al primer `success` (no al primer `error`), al invertir de nuevo podemos evaluar si hace falta el valor por defecto `33`.

En caso de relacionarse de alguna forma los parseos (ej. una intrincada relación de valores a parsear, _failback_ y por defecto de `y` según esté disponible el de `x`) haríamos construcciones **locales usando estructuras genéricas de `Either`** como:

```Java
QuaFunction<String, String, Integer, String, Integer> parseY =
  (y1, y2, d, x) -> parseInt(x).bind(x -> parseInt(y1)
                             .orElse(e -> parseInt(y2))
                             .or(d)
                             .map(y -> tuple(x, y)))

Tuple<Integer, Integer> xy = parseXY(inputY1, failbackY1, defaultY1, inputX   )
                    .or(e -> parseXY(inputY2, failbackY2, defaultY2, failbackX)
                    .orElse(tuple(defaultX, defaultY3);
```

Éste baile de valores queda mejor con la sintáxis de _Haskell_, algo como:

```Haskell
let parseXY y1 y2 d x = (, parseInt y1 <|> parseInt y2 <||> d) <$> parseInt x
    xy = parseXY inputY1 failbackY1 defaultY1 inputX
     <|> parseXY inputY2 failbackY2 defaultY2 failbackX
     <||> (defaultX, defaultY3)
```


### Referencias

* [Código en GitHub](https://github.com/josejuan/java-monoid-config/tree/master/src/main/java/com/foo)
* [Monoide](https://es.wikipedia.org/wiki/Monoide)
