---
layout: post
title: Monoide de configuraciones
author: josejuan
categories: java
---

Los conceptos matemáticos como _Monoide_ te permiten entender fácilmente las propiedades e implicaciones de ciertas estructuras y aplicarlas con rápidez. En este caso ha salido un curioso _kata_ en el que se mezclan conceptos matemáticos (_Monoide_), programación funcional (la mónada `Optional` de _Java 8_ al usar `flatMap`), cierta utilidad (configuración ubícua) y una estructura al más clásico estilo _POO_ ¿curioso no?

Normalmente todas las aplicaciones necesitan configuración y aunque existen ciertos patrones, se puede afirmar que la configuración de una aplicación no es ubícua, es decir, debes saber dónde y cómo se configura en cada caso y, además, quizás no sea la forma más adecuada para tu despliegue particular. Es común poder fijar configuraciones vía la línea de comandos (ej. en _Java_ usando algo como `-Dparametro=valor`), las variables de entorno (como en `PARAMETRO=valor ./programa.exe`), archivos de configuración (_xml_, _json_, _yaml_, _properties_, ...), base de datos, sistemas distribuidos (como _ZooKeeper_) y en fin, una innumerable cantidad de formas.

Que los diferentes orígenes de la configuración se apliquen por defecto es relativamente frecuente y, al hacerlo, las configuraciones como las anteriores forman un monoide al aplicar sucesivamente una detrás de otra hasta que cierto valor está definido:

```
Configuración = Origen1 | Origen2 | ... | PorDefecto
```

Así, lo primero que necesitamos, es un monoide:

```Java
public interface Monoid<T> {
    T mappend(T other);
}
```

Por otro lado, necesitamos poder referenciar las configuraciones. Típicamente sería la dirección de un recurso (_URL_), un espacio de nombres (`app.ui.color`), etc. Como queremos abstraer ese direccionamiento, podríamos dejarlo como:

```Java
public interface ConfigKey {
    String getName();
}
```

En que `getName` permite usar ese direccionamiento en cualquier escenario (digamos que es una serialización).

Y ya está, ya tenemos todo lo necesario para tener configuración ubícua (monoidalmente). Lo que vamos a hacer es definir un proveedor de configuración:

```Java
public abstract class ConfigProvider<E extends ConfigKey> implements Monoid<ConfigProvider<E>> {

    public abstract Optional<String>  getString (E key);
    public abstract Optional<Integer> getInteger(E key);
    public abstract Optional<Boolean> getBoolean(E key);

    @Override
    public ConfigProvider<E> mappend(final ConfigProvider<E> b) {
        final ConfigProvider<E> a = this;
        return new ConfigProvider<E>() {
            @Override public Optional<String>  getString (E key) { return or(ConfigProvider::getString , key); }
            @Override public Optional<Integer> getInteger(E key) { return or(ConfigProvider::getInteger, key); }
            @Override public Optional<Boolean> getBoolean(E key) { return or(ConfigProvider::getBoolean, key); }

            private <Z> Optional<Z> or(BiFunction<ConfigProvider<E>, E, Optional<Z>> g, E key) {
                final Optional<Z> r = g.apply(a, key);
                return r.isPresent() ? r : g.apply(b, key); // where is applicative/alternative?
            }
        };
    }
}
```

No hay mucho que decir, nuestro proveedor de configuración (`ConfigProvider`) lo hará de cierto tipo de claves de configuración y será un monoide. El tipo de configuración que podemos recuperar (a este nivel de abstracción, un proveedor especializado podría saber leer estructuras más complejas) son cadenas, números y booleanos. La operación monoidal es inmediata.

Podríamos terminar aquí el _kata_ pero claro, queda un poco fría la cosa, así que vamos a implementar algunos _backends_ y cacharrear un rato.

Una de las cosas curiosas que he descubierto hace poco de _Java_ es que las enumeraciones son _"raras"_ (me lo siguen pareciendo), porque realmente son clases, pero no lo son... bueno que más da, el caso es que vamos a restringir que algunas cosas _"raras"_ (como las enumeraciones) tengan persistencia. Eso lo podemos hacer así:

```Java
public interface EnumBackend {
    Optional<String> getPersistence();
}
```

En que símplemente decimos que cierto objeto deberá poder darnos su valor (si está disponible).

Mirar que curiosa (por decir algo) queda una enumeración en _Java_:

```Java
public enum MyEnumConfig implements EnumBackend, ConfigKey {

    SERVICE_ENDPOINT {
        @Override
        public Optional<String> getPersistence() {
            return Optional.of("http://www.google.es");
        }
    },

    CONNECTION_TIMEOUT {
        @Override
        public Optional<String> getPersistence() {
            return Optional.of("300");
        }
    },

    ENABLED {
        @Override
        public Optional<String> getPersistence() {
            return Optional.of("true");
        }
    };

    @Override
    public String getName() {
        return name();
    }

}
```

Claro que le estamos pidiendo mucho: que sea una clave de configuración y a la vez ¡que nos de los valores por defecto!

Antes de crear el proveedor de configuración, nos damos cuenta que los valores obtenidos desde persistencia (cadenas en este caso) deberán ser deserializados (parseados), por lo que podemos implementar una abstracción que nos haga ese paso y lo tendremos gratis para todas las persistencias de este tipo:

```Java
public abstract class KeyValueProvider<E extends ConfigKey> extends ConfigProvider<E> {

    @Override
    public Optional<Integer> getInteger(E key) {
        return getString(key).flatMap(KeyValueProvider::parseInt);
    }

    @Override
    public Optional<Boolean> getBoolean(E key) {
        return getString(key).flatMap(KeyValueProvider::parseBool);
    }

    private static Optional<Integer> parseInt(String data) {
        try {
            return Optional.of(Integer.parseInt(data));
        } catch (Exception ignore) {
            return Optional.empty();
        }
    }

    private static Optional<Boolean> parseBool(String data) {
        if("true" .equalsIgnoreCase(data)) return Optional.of(true );
        if("false".equalsIgnoreCase(data)) return Optional.of(false);
        return Optional.empty();
    }
}
```

Esta abstracción asume que estará disponible la recuperación de valores desde cadenas, por lo que usa `getString` para parsear otros valores (¡por cierto! `flatMap` es la acción monádica `bind`).

Con esta abstracción, tener un proveedor de configuración desde enumeraciones es inmediato:

```Java
public class EnumProvider<E extends Enum<E> & ConfigKey & EnumBackend> extends KeyValueProvider<E> {
    @Override
    public Optional<String> getString(E key) {
        return key.getPersistence();
    }
}
```

Pero también desde las variables de entorno:

```Java
public class EnvironmentProvider<E extends ConfigKey> extends KeyValueProvider<E> {
    @Override
    public Optional<String> getString(E key) {
        return Optional.ofNullable(System.getenv(key.getName()));
    }
}
```

Desde los parámetros de la _JVM_:

```Java
public class SystemPropertyProvider<E extends ConfigKey> extends KeyValueProvider<E> {
    @Override
    public Optional<String> getString(E key) {
        return Optional.ofNullable(System.getProperty(key.getName()));
    }
}
```

Desde archivos de propiedades:

```Java
public class PropertiesProvider<E extends ConfigKey> extends KeyValueProvider<E> {

    private final Optional<Properties> file;

    public PropertiesProvider(String filePath) {
        file = readFile(filePath);
    }

    @Override
    public Optional<String> getString(E key) {
        return file.flatMap(p -> Optional.ofNullable(p.getProperty(key.getName())));
    }

    private static Optional<Properties> readFile(String filePath) {
        try (FileInputStream fs = new FileInputStream(filePath)) {
            final Properties p = new Properties();
            p.load(fs);
            return Optional.of(p);
        } catch (IOException ignore) {
            return Optional.empty();
        }
    }
}
```

¡Eh! ¡la culpa de que `readFile` sea tan feo no es mía!

Y así desde cualquier _backend_ que se nos ocurra. Lo interesante, es que podemos ordenar todos esos _backend_ para que sobreescriban sucesivamente la configuración por defecto. Por ejemplo, generar una configuración típica en que lo que más prioridad podría tener es la línea de comandos, luego las variables de entorno, después un archivo de configuración y por último los valores por defecto _hardcodeados_ sería combinar monoidalmente esas configuraciones particulares:

```Java
printMyConfig(
  new SystemPropertyProvider<MyEnumConfig>()
    .mappend(new EnvironmentProvider<>())
    .mappend(new PropertiesProvider<>("/home/josejuan/tmp/foo.properties"))
    .mappend(new EnumProvider<>()));
```

Cuya salida sería:

```
Optional[http://www.haskell.org]
Optional[250]
Optional[false]
```

Al haber yo configurado en la _JVM_ el valor `-DCONNECTION_TIMEOUT=250`, como variable de entorno `SERVICE_ENDPOINT=http://www.haskell.org` y en el archivo en cuestión una línea con `ENABLED=false`.

¡Y eso es todo!


### Referencias

* [Código en GitHub](https://github.com/josejuan/java-monoid-config/tree/master/src/main/java/com/foo)
* [Monoide](https://es.wikipedia.org/wiki/Monoide)
