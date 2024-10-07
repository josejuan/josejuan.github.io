---
layout: post
title: T800 impreso en 3D con motor
author: josejuan
categories: 3d printing electronic
---

## Introducción

Aparte de las _"manualidades"_ típicas que un romerales suele acometer a lo largo de su vida de curiosidad, nunca había
hecho ningún mecanismo mecánico, si bien sí había visto y curioseado muchos con anterioridad. Llevado por la nostalgia
al ver mi viejo soldador de punta fina (con 35 años a sus espaldas), la búsqueda de una excusa para imprimir algo y ahora
que la **IA** nos va a reemplazar a todos; se me ocurrió imprimir el busto de un _T800_ pero que girara la cabeza.

## El modelo

Hay muchos sitios donde obtener modelos de bastantes cosas, encontré este modelo del _T800_ que ya tenía todas las piezas
separadas, lo cual facilita mucho el preparar las partes para imprimir:

![Busto T800 completo](/images/t800-3d-model.png)

Sin embargo, no tenía intención de imprimir tantas piezas, por lo que la idea era ensanchar el cuello para que cupiese
un rodamiento y el motor y ya.

## Impresión de la cabeza

![T800 despiece cabeza](/images/t800-3d-head.png)

Uniendo y dividiendo piezas, buscamos el encaje adecuado para imprimir en la impresora. Hay cierta práctica aquí (de la
que no tengo mucha) a la hora de buscar las mejores divisiones, tamaño, ... por ejemplo un problema importante es que
las piezas no se imprimen perfectas (debido a cambios en la temperatura mientras se imprimen) por lo que si tienes una
pieza que hace de _"puente"_ (por ejemplo la quijada de la imagen) luego **no van a encajar** por lo que o bien ocultamos
la unión (haciendo el corte en otro lugar) o machiembramos la pieza, pues me vi negro para encajarla después (usando
abrazaderas y pegando con cola a la vieja usanza).

![T800 cabeza impresa](/images/t800-head.jpeg)

## Engranaje del cuello

Hacer el cuello fue lo más complicado y divertido de todo el proceso, montón de piezas y restricciones, buscar el tipo
de engranaje más adecuado, posición del motor, estrategia de parada de fin de recorrido, etc...

![T800 despiece cuello](/images/t800-cuello-despiece.png)

Quedó muy bien y el motor y el engranaje funcionaban perfectamente, el rodamiento y su eje, **con poco peso** no tenían
problema en girar.

![T800 engranajes](/images/t800-engranajes.png)

<video controls><source src="/images/t800-engranaje.mp4" type="video/mp4"></video>

Sin embargo, mi ninguna experiencia me hizo ser demasiado optimista en cuanto a la fuerza y holgura angular de los rodamientos
que utilicé, que fueron los cojinetes **GIAK KFL08**:

![T800 eje](/images/t800-engranaje-eje.png)

La cabeza resultó ser demasiado pesada y el cojinete, aunque puse dos unidos por una barra de acero, tenía suficiente
holgura angular (poca rigidez radial) como para que el movimiento de precesión fuera demasiado pronunciado y el engranaje
apoyara impidiendo el movimiento para el motor.

Sin duda alguien con experiencia lo habría previsto y quizás elegido un rodamiento tipo **Slewing Bearing**:

![Rodamiento Slewing Bearing](/images/slewing-bearing.png)

## El motor

El motor era un sencillo **28BYJ-48 ULN2003**:

![Motor 28BYJ-48 ULN2003](/images/28BYJ-48-ULN2003.png)

Con suficiente potencia para mover la cabeza... si el cojinete hubiera sido el correcto. En cuanto a la programación es
muy sencilla, además, el **RP2040** (una _Pico Zero_) tiene un sensor interno y así podíamos monitorizar si se calentaba
mucho:

```python
import time
from machine import Pin

sensor_temp = machine.ADC(4)
conversion_factor = 3.3 / (65535)

IN1 = Pin(0,Pin.OUT)
IN2 = Pin(1,Pin.OUT)
IN3 = Pin(2,Pin.OUT)
IN4 = Pin(3,Pin.OUT)

pins = [IN1, IN2, IN3, IN4]
steps_forward = [
    [IN1],
    [IN1, IN2],
    [IN2],
    [IN2, IN3],
    [IN3],
    [IN3, IN4],
    [IN4],
    [IN4, IN1],
]
steps_backward = steps_forward[::-1]
current_step = 0

t0 = time.ticks_ms()

def set_pins_low(pins):
    [pin.low() for pin in pins]

def set_pins_high(pins):
    [pin.high() for pin in pins]
while True:
    t = time.ticks_ms() - t0

    if int(t / 4000) % 2 == 0:
        steps = steps_forward
        current_step += 1
    else:
        steps = steps_backward

    if current_step == len(steps):
        current_step = 0

    high_pins = steps[current_step]
    set_pins_low(pins)
    set_pins_high(high_pins)

    time.sleep_us(3000)

    if t % 1000 == 0:
        reading = sensor_temp.read_u16() * conversion_factor
        temperature = 27 - (reading - 0.706)/0.001721
        print(temperature)
```

## Los ojos LED y control

Lo ideal cuando hablamos del **T800** son dos _LED_ rojos de toda la vida, pero con ellos no podíamos controlar la
intensidad en un humilde **RP2040**, podríamos haber puesto dos **RGB** pero por fortuna, los pines admiten modulación
por anchura de pulso (**PWM**), por lo que controlar la intensidad es inmediato.

Como la idea es poder controlarlo remotamente pero en una estantería, está conectado directamente al **HTPC** del salón
y por tanto se puede leer simplemente de la entrada estándar y así permitir cuatro modos:

* apagado, LEDs apagados.
* pensando, LEDs fluctuando suavemente.
* hablando, LEDs fluctuando rápidamente.
* encendidos, LEDs encendidos continuamente.

```python
import sys
import select
import machine
import time
import math
import random

led = machine.PWM(machine.Pin(11, machine.Pin.OUT))

class TermRead:
    def __init__(self):
        self.spoll = select.poll()
        self.spoll.register(sys.stdin, select.POLLIN)
    def read(self):
        txt = ''
        while self.spoll.poll(0):
            txt += sys.stdin.read(1)
        return txt

term = TermRead()
t = 0
mode = 1

while True:
    txt = term.read().strip()
    if txt != '':
        if txt == 'off':
            mode = 0
        if txt == 'pensando':
            mode = 1
        if txt == 'hablando':
            mode = 2
        if txt == 'on':
            mode = 3
        print('****', txt, 'MODE', mode)

    time.sleep(0.01)

    if mode == 0:
        led.duty_u16(0)
    if mode == 1:
        t = t + 1
        k = math.floor(32767 + 32767 * math.cos(0.03 * t))
        led.duty_u16(k)
    if mode == 2:
        t = t + 3 * random.random()
        k = math.floor(32767 + 32767 * math.cos(0.3 * t))
        led.duty_u16(k)
    if mode == 3:
        led.duty_u16(2 * 32767)
```

## Control y sonido

El **HTPC** del salón en realidad es un pequeño servidor que hace muchas cosas y desde un panel muy _ad hoc_ controlo,
entre otras cosas, el **T800**, pudiendo controlar las luces y predefinir las míticas frases de la película _"Terminator"_:

![T800 control panel](/images/t800-control.png)

Cinco botones son suficientes para controlar este humilde engendro con el siguiente resultado final:

<div>
    <img src="/images/t800-final.png" alt="T800 final" style="float: left" width="500">
    <video controls width="200px"><source src="/images/t800.mp4" type="video/mp4"></video>
</div>
