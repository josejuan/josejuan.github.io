---
layout: post
title: Timbre de casa domotizado
author: josejuan
categories: 3d printing electronic
---

## Introducción

Pues se me rompió el timbre (el cutre zumbador que ponen en todas las casas) de la puerta de casa y buscaba un reemplazo,
pero ninguno me satisfacía, así que se me ocurrió que podría, con un simple **ESP8266** sustituir el zumbador por un
trivial sensor que enviara la señal a mi **HTPC** (que uso para muchas cosas). Con eso, podría reproducir cualquier sonido
desde los altavoces del salón y, de gratis, enviarme un mensaje a _Telegram_ para saber en todo momento, esté donde esté,
si alguien llama a la puerta.

## Cableado

No tuve que hacer ni cambiar ningún cableado, ya que por fortuna, el cable común del zumbador y el pulsador pasan por la
misma caja de la pared, poco cable eso sí, pero pude dividirlo sin mucho problema, quedando el antes y después:

![Circuito timbre antes y después](/images/timbre-circuito.png)

## Circuito

Únicamente un hilo del esquema anterior es _"electrónica"_ por lo que las dos placas (la fuente de alimentación y la
_Pico Zero_) están en la misma caja del zumbador, tal cual, sin encapsular ni nada.

### Fuente de alimentación

La fuente de alimentación de **1,3 €** es una **WX-DC12003** bien maja, porque es pequeña, consume muy poco y puede
entregar los nada despreciables **0,7A** a **5V**:

![Fuente de alimentación](/images/WX-DC12003.png)

### Controlador

El controlador es el fantástico **ESP8266** que tiene _Wifi_ y permite conectarlo fácilmente y controlar o leer de
sensores de forma trivial:

![ESP8266](/images/ESP8266.png)

## Programación

### Micropython

Aparte de conectar a la red _Wifi_ únicamente debemos llamar al servidor de nuestra elección cuando el pulsador pase
de bajo a alto (el pin está invertido en este caso):

```python
import network
import time
from machine import Pin, Timer
import urequests

net_ssid = 'ZZZZ'
net_pass = 'xxxxxx'
net_ipst = '192.168.110.201'
net_mask = '255.255.255.0'
net_gate = '192.168.110.1'
net__dns = '8.8.8.8'

station = network.WLAN(network.STA_IF)
station.active(True)
station.ifconfig((net_ipst, net_mask, net_gate, net__dns))
station.connect(net_ssid, net_pass)

def checkConnection(msg):
  if not station.isconnected():
    station.connect(net_ssid, net_pass)
    for i in range(0, 60):
      if station.isconnected():
        break
      time.sleep(1)
    if not station.isconnected():
      time.sleep(300)
      machine.reset()
    print("Conectado a WiFi (" + msg + "):", station.ifconfig())

checkConnection("boot")

pulsador = Pin(2, Pin.IN, Pin.PULL_UP)

def send(url):
  respuesta = urequests.get("http://192.168.0.2/" + url)
  respuesta.close()

def sendStatus(value):
  send("timbre_status?v=" + value)

tk = Timer(-1)

def dingDong():
  send("timbre")
  print("DING!")

def gpioHandler(pin):
  global sk
  if pin.value() == 0:
    tk.init(period=50, mode=Timer.ONE_SHOT, callback=lambda t: dingDong())
  else:
    tk.deinit()

pulsador.irq(trigger=Pin.IRQ_FALLING | Pin.IRQ_RISING, handler=gpioHandler)

while True:
  checkConnection("reconnect")
  sendStatus("alive")
  time.sleep(60)
```

### HTPC

Bueno, las llamadas anteriores que realiza el **ESP8266** ya permiten hacer lo que haga falta, yo de por medio tengo
un _nginx_ y un servidor que centraliza diferentes peticiones de asistente (por ejemplo, puedo publicar fácilmente
un nuevo script y que esté disponible), en este caso por ejemplo, cuando pulsan al timbre, miramos si ya está sonando
el timbre (en cuyo caso ignoramos la pulsación actual), noticiamos por _Telegram_ y tomamos el siguiente sonido de la
carpeta de sonidos para el timbre:

```shell
#!/bin/bash

if ps -AF | grep -q m[pP]layer.*timbre
then
  echo "sonando"
else
  echo "LLAMAN A LA PUERTA" | /home/josejuan/bin/telegram2jj 2>&1 | cat - > /dev/null
  if ! [ -f /home/josejuan/.assistant/.timbre ]
  then
    echo 1 > /home/josejuan/.assistant/.timbre
  fi
  N=`cat /home/josejuan/.assistant/.timbre`
  N=$((N + 1))
  echo $N > /home/josejuan/.assistant/.timbre
  ls /home/josejuan/.assistant/timbre/*mp3 | sort > /home/josejuan/.assistant/.timbre.list
  M=`cat /home/josejuan/.assistant/.timbre.list | wc -l`
  K=$(( N % M  + 1 ))
  SOUND=`cat /home/josejuan/.assistant/.timbre.list | tail -n+$K | head -n1`
  mplayer -really-quiet -volume 150 $SOUND
fi
```