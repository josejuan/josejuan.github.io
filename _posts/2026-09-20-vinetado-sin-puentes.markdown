---
layout: post
title: Viñeteado sin puentes
author: josejuan
categories: 3d printing
---

Cuando se quiere transferir un dibujo a una superficie con spray, lo habitual es recortar una plantilla: se vacían las zonas que deben quedar pintadas y el material restante hace de máscara. El método funciona… hasta que el dibujo tiene islas.

Llamo islas a cualquier trozo de la imagen que no toca el borde: la rueda de un camión, el interior de una letra, un ojo. Esas piezas no están sujetas a nada y se caen. La solución clásica es añadir **puentes**: finas tiras de material que unen cada isla con el resto de la plantilla y la mantienen en su sitio. Es la misma idea que los puentes de los troquelados o de las maquetas de plástico.

El problema es que un puente es una zona que no se pinta. Y no una zona cualquiera: es una costura que no estaba en el dibujo original. Cuantos más puentes, más se aleja la pintura transferida de la imagen de partida. Al final la plantilla decide por ti dónde poner los cortes.

Se ve bien con un ejemplo: a la izquierda, el dibujo original; a la derecha, el mismo dibujo con los puentes que hacen falta para sujetar cada isla.

![Bici: a la izquierda el dibujo sin puentes, a la derecha con los puentes que dejan costuras sin pintar](/images/vinetas1.png)

La idea de este experimento era quitar esos puentes del plano de pintura.

En vez de coser las islas entre sí, cada isla se ancla con unos nervios verticales que suben un tramo y luego convergen —como una nervadura gótica— hacia una bóveda común. Toda la sujeción vive **por encima** de la plantilla, fuera del plano por el que pasa el spray. De ahí lo de *puentes aéreos*.

La cara inferior queda plana y es solo el dibujo. La pieza se apoya sobre la superficie con esa cara hacia abajo, se le pone un peso encima y se pinta desde arriba. La pintura atraviesa los huecos exactos del diseño: ningún puente interrumpe el trazo, se reproduce la imagen íntegra.

La imagen de partida era este camión:

![Imagen de partida: un camión en blanco y negro](/images/vinetado-truck.png)

<!-- IMAGEN: cara inferior de la plantilla, el dibujo sin puentes -->

Así se ve la pirámide de nervios que construye el script: cada anclaje sube, los nervios convergen y todo se funde en la bóveda superior donde apoyar el peso.

![Pirámide de nervios que construye el script: los anclajes suben desde la plantilla y convergen hacia la bóveda superior](/images/vinetas2.png)

Todo sale como una única pieza imprimible en PLA sin soportes: los nervios nacen enterrados en cada isla, se funden en el árbol de convergencia y terminan en una bóveda plana y horizontal donde apoyar el peso. La plantilla y su estructura de sujeción son el mismo objeto, con la cara de la imagen en \(z=0\).

Y al pintar, esto es lo que queda: el trazo íntegro, sin las costuras que dejarían los puentes.

![Simulación del pintado: el camión reproducido con spray a través de la plantilla, sin costuras de puentes](/images/vinetado-pintado.png)

<span class="text-orange">(Desarrollado con <i>DeepSeek v4.1 Flash</i>)</span>

## prompt.md

```markdown
# Tarea

Tienes en esta carpeta todo lo necesario. Puedes crear un entorno Python local
(`python -m venv`) e instalar dependencias con pip (esto sí requiere red: está
autorizado). Para el resto NO necesitas mirar *NADA* a nivel de sistemas, ips,
puertos, servicios, etc. Así que *CUALQUIER COSA* que se salga de esta carpeta o
de instalar paquetes Python, piensa primero si realmente es necesario, si lo
puedes hacer aquí dentro y, en caso contrario, te paras y me explicas qué pasa.

## Objetivo

Escribir un script:

    $ python vineteado.py <config.yaml> <image.png>

que genere, a partir de una imagen B/N, un modelo 3D imprimible en PLA.

## Contexto de uso (léelo antes de diseñar nada)

La pieza resultante es una **plantilla de spray (stencil)**. El flujo real es:

1. La pieza se apoya sobre la superficie a pintar, con la cara de la imagen
   hacia abajo, plana y en contacto total.
2. Se coloca un peso encima de la estructura.
3. Se pinta con spray desde arriba: la pintura pasa por los huecos y reproduce
   el viñeteado en la superficie.
4. Se levanta la pieza.

De ahí se derivan casi todas las restricciones: por qué la cara inferior debe
ser perfectamente plana, por qué toda la estructura de sujeción va hacia arriba
y no puede invadir el plano de la imagen, y por qué arriba debe haber una
superficie plana donde apoyar el peso.

`truck.png` es un ejemplo. Asume imagen de 1 bit: **blanco = sólido, negro =
hueco**. Los blancos pueden formar islas desconectadas entre sí, así que extruir
el plano no basta: hay que sujetarlas.

## Invariantes (no negociables)

Estos son requisitos de resultado, no sugerencias. El diseño que propongas debe
satisfacerlos y debes poder demostrar que los satisface:

- **Formato**: STL binario o 3MF, en **milímetros**, cargable en Blender.
- **Malla**: cerrada (watertight), manifold, normales coherentes hacia fuera, y
  **una sola componente conexa**. Si el resultado tiene 2+ componentes, es un
  fallo, no un aviso.
- **Imprimibilidad sin soportes**: toda la geometría generada debe respetar el
  límite de voladizo de una FDM típica. Esto condiciona la forma en que los
  nervios convergen: no vale una curva "bonita" si el tramo final es demasiado
  horizontal. Si alguna zona no se puede resolver sin soporte, dímelo
  explícitamente en el informe en lugar de generarla igual.
- **Grosor mínimo realizable**: nada por debajo del mínimo imprimible con
  boquilla estándar, ni en los nervios ni en los detalles finos del stencil.
  Los detalles de la imagen más finos que ese umbral: decide qué hacer
  (engordar, eliminar, avisar) y justifícalo; lo que no vale es generarlos y
  que no se impriman.
- **Cara inferior**: plana, z=0, sin nada que sobresalga por debajo.
- **Cara superior de la bóveda**: plana y horizontal, con área suficiente para
  apoyar un peso de forma estable.
- **Determinismo**: misma entrada → misma salida, byte a byte.

## Estrategia sugerida (aquí sí eres libre)

Son pautas mías, no dogma. Puedes cambiarlas, reducirlas o ampliarlas siempre
que se cumplan los invariantes y el objetivo.

1. Cada isla necesita quedar fija en posición **y en orientación**. Para
   orientación hacen falta al menos tres puntos de anclaje no alineados; en
   islas alargadas (tipo plátano) tres puntos a lo largo del eje son casi
   colineales y no fijan el giro, así que ahí probablemente tenga más sentido
   una costilla continua a lo largo del eje que tres puntos.
2. El número, posición y grosor de los anclajes debe depender de la geometría de
   la isla: área, momentos, grosor local, alargamiento. Una isla grande
   probablemente prefiera muchos anclajes finos repartidos antes que tres
   gordos; valóralo tú.
3. Una isla muy pequeña puede acabar teniendo sentido con uno o dos puntos, o
   directamente extruida hacia arriba como pilar. Define el umbral y justifícalo.
4. Los nervios suben en vertical hasta una altura mínima (libre de spray) y
   luego convergen poco a poco, tipo nervadura de catedral gótica, hasta fundirse
   en una **bóveda común**. La rigidez del conjunto viene de esa bóveda: es un
   árbol convergente, no una malla de puentes horizontales entre islas vecinas.
   Si crees que añadir arcos horizontales entre islas adyacentes mejora la
   rigidez o reduce el voladizo, propónlo, pero decídelo tú y dímelo.
5. Capas mínimas: (a) la pieza/stencil con su espesor, (b) tramo vertical de los
   nervios hasta la altura mínima, (c) tramo de convergencia, (d) bóveda hasta
   la superficie plana superior.
6. Una hipótesis razonable es que la convergencia tenga como referencia una
   figura (círculo, óvalo, rectángulo) centrada a cierta altura, hacia la que
   apuntan todos los nervios. Evalúala; si no te convence, propón otra.
7. **Marco perimetral**: decide si conviene añadir un marco exterior opcional
   que rodee la imagen y sirva de anclaje estructural. Si el borde de la imagen
   es negro, sin marco toda la carga pasa por la bóveda. Es una decisión de
   diseño importante: razónala y déjala configurable si procede.

## Dimensionado de los nervios

Quiero que el grosor de cada nervio esté justificado, no puesto a ojo. Pero
**no quiero un cálculo con apariencia de rigor y supuestos inventados**.

El caso de carga que me importa es: la pieza se manipula agarrándola por la
bóveda y todo el conjunto cuelga (peso propio), más una componente lateral
razonable al despegarla de la superficie. Define tú el valor concreto de esa
componente y el factor de seguridad, pero **decláralos como supuestos tuyos de
forma explícita** en el informe y en el código.

Si concluyes que un modelo de fuerzas serio no aporta sobre una heurística
geométrica bien razonada (grosor en función de área/momento de la isla y
longitud del nervio), dímelo y usa la heurística. Prefiero una heurística honesta
a una viga de Euler-Bernoulli con constantes sacadas de la nada.

## Configuración

El esquema YAML lo decides tú. Requisitos:

- Como mínimo: anchura del sólido en cm (la altura sale de la relación de
  aspecto) y espesor del stencil. El resto, lo que necesites.
- Validación del fichero con mensajes de error claros (qué falta, qué rango).
- Defaults sensatos para todo excepto la anchura.
- Opción para volcar un config de ejemplo comentado.

## Salida e informe

El script debe emitir, además del modelo, un informe legible con:

- nº de islas, área y dimensiones de cada una
- puntos de anclaje elegidos por isla y por qué
- grosores calculados y supuestos usados
- comprobación de watertight / manifold / componentes conexas (usa trimesh o
  equivalente, no lo afirmes sin verificarlo)
- ángulo de voladizo máximo presente en la malla
- detalles del stencil descartados o engordados por estar bajo el mínimo
- volumen y gramos estimados de PLA
- nº de triángulos (vigila que sea manejable: simplifica contornos con
  tolerancia configurable en vez de sacar millones de triángulos)

Y además **PNGs de inspección**: proyecciones y cortes horizontales a varias
alturas. No tengo Blender a mano para cada iteración y necesito poder revisar
el resultado rápido.

## Procedimiento

1. Primero, **lee la imagen y analízala** (resolución, nº de islas, tamaños)
   antes de diseñar, para que el plan esté basado en datos reales.
2. Después, **enumera todas las ambigüedades y contradicciones que detectes en
   este documento y pregúntame**. No las resuelvas por tu cuenta.
3. Luego preséntame el plan.
4. Solo entonces, escribe código.
```

## Código fuente

El script completo, `vineteado.formateado.py`:

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""vineteado.py — genera un stencil de spray imprimible en PLA a partir de una
imagen B/N (blanco = solido, negro = hueco).

Uso:
    python vineteado.py <config.yaml> <image.png> [--out-dir DIR] [--only-analysis] [--mode tree|fan]
    python vineteado.py --example-config

Supuestos estructurales DECLARADOS (no FEA). El caso de carga es compresion de
la boveda repartida por el arbol; el fallo que gobierna nervios esbeltos es el
pandeo. Se calcula por nodo y se REPORTA como COTA INFERIOR: el modelo de dos
fuerzas ignora los momentos de las uniones rigidas y el pandeo global, y E en
FDM es anisotropo. El dimensionado primario es la heuristica geometrica por
area de isla.
"""

from __future__ import annotations

import argparse
import math
import os
import sys
from dataclasses import dataclass, field
from itertools import count
from typing import Any, Optional

import numpy as np
import yaml
from PIL import Image, ImageDraw

import scipy.ndimage as ndi
from skimage import measure, morphology, filters
from shapely.geometry import Polygon, MultiPolygon, box

import trimesh

PI = math.pi
PLA_DENSITY_G_CM3 = 1.24
Z_TOL = 1e-3
ANGLE_TOL = 0.05
STRUCT4 = np.array([[0, 1, 0], [1, 1, 1], [0, 1, 0]], bool)


class UserError(Exception):
    """Error de entrada o de geometria con mensaje claro para el usuario."""


# --- Configuracion ---------------------------------------------------------

@dataclass
class ImageCfg:
    threshold: Any = "otsu"
    invert: bool = False
    min_island_area_mm2: float = 1.0
    simplify_tol_mm: float = 0.15
    hole_fill_max_px: int = 2


@dataclass
class PartCfg:
    width_cm: Optional[float] = None
    stencil_thickness_mm: float = 1.2
    min_wall_mm: float = 0.8
    min_slot_mm: float = 0.6
    nozzle_mm: float = 0.4


@dataclass
class AnchorsCfg:
    max_spacing_mm: float = 15.0
    spacing_width_factor: float = 5.0
    max_anchors_per_island: int = 400
    anchor_margin_mm: float = 0.05


@dataclass
class RibsCfg:
    min_height_mm: float = 0.0
    width_auto: bool = True
    width_min_mm: float = 0.8
    width_max_mm: float = 3.0
    sections: int = 12
    slenderness_denom: float = 40.0


@dataclass
class StructuralCfg:
    press_force_n: float = 25.0
    safety_factor: float = 3.0
    e_pla_mpa: float = 3500.0
    k_effective: float = 1.0
    sigma_bearing_mpa: float = 50.0
    peel_check: bool = False


@dataclass
class ConvergenceCfg:
    mode: str = "tree"
    max_overhang_deg: float = 45.0
    optimize: bool = True
    merge_eps_mm: float = 0.5


@dataclass
class VaultCfg:
    shape: str = "rounded_rect"
    footprint_mm: float = 30.0
    top_area_mm2: float = 300.0
    n_sec: int = 32
    n_rings: int = 8


@dataclass
class FrameCfg:
    mode: str = "low"
    width_mm: float = 2.0
    extra_mm: float = 1.5


@dataclass
class OutputCfg:
    format: str = "stl"
    stl_binary: bool = True
    report: bool = True
    inspection_pngs: bool = True
    report_lang: str = "es"
    png_size_px: int = 1024
    strict: bool = False


@dataclass
class Config:
    image: ImageCfg = field(default_factory=ImageCfg)
    part: PartCfg = field(default_factory=PartCfg)
    anchors: AnchorsCfg = field(default_factory=AnchorsCfg)
    ribs: RibsCfg = field(default_factory=RibsCfg)
    structural: StructuralCfg = field(default_factory=StructuralCfg)
    convergence: ConvergenceCfg = field(default_factory=ConvergenceCfg)
    vault: VaultCfg = field(default_factory=VaultCfg)
    frame: FrameCfg = field(default_factory=FrameCfg)
    output: OutputCfg = field(default_factory=OutputCfg)
    raw: dict = field(default_factory=dict)


EXAMPLE_CONFIG = """\
# Configuracion de vineteado.py
# Solo `part.width_cm` es obligatorio; el resto tiene defaults sensatos.

image:
  threshold: otsu        # "otsu" o un entero 0-255
  invert: false          # true si el solido es el negro
  min_island_area_mm2: 1.0   # islas menores: se eliminan (y se avisa)
  simplify_tol_mm: 0.15      # tolerancia de simplificacion de contornos
  hole_fill_max_px: 2        # rellena poros encerrados de <= N px

part:
  width_cm:              # OBLIGATORIO: anchura fisica final de la pieza (cm)
  stencil_thickness_mm: 1.2
  min_wall_mm: 0.8       # grosor minimo imprimible (boquilla/PETG-PLA)
  min_slot_mm: 0.6       # por debajo: solo aviso
  nozzle_mm: 0.4

anchors:
  max_spacing_mm: 15.0   # paso maximo entre anclajes de una isla
  spacing_width_factor: 5.0  # paso efectivo = min(max_spacing, factor * ancho del nervio de la isla)
  max_anchors_per_island: 400   # tope de seguridad
  anchor_margin_mm: 0.05  # margen del cilindro respecto al borde de la isla

ribs:
  min_height_mm: 0.0     # h0; 0 => igual al espesor del stencil (cilindro <= base)
  width_auto: true
  width_min_mm: 0.8
  width_max_mm: 3.0
  sections: 12
  slenderness_denom: 40.0   # w >= L/denom (0 desactiva) para nervios no flojos

structural:                # SUPUESTOS DECLARADOS (ver informe)
  press_force_n: 25.0      # compresion al presionar la boveda
  safety_factor: 3.0
  e_pla_mpa: 3500.0
  k_effective: 1.0
  sigma_bearing_mpa: 50.0
  peel_check: false        # caso secundario de despegue (off)

convergence:
  mode: tree             # tree | fan (ver informe: se mide cual conviene)
  max_overhang_deg: 45.0
  optimize: true         # acerca cada nudo al centro y fusiona esferas proximas
  merge_eps_mm: 0.5      # fusiona un nudo interno con su padre si el nervio mide menos que esto

vault:
  shape: rounded_rect    # rounded_rect | ellipse
  footprint_mm: 30.0
  top_area_mm2: 300.0
  n_sec: 32
  n_rings: 8

frame:
  mode: low              # none | low | perimeter
  width_mm: 2.0
  extra_mm: 1.5

output:
  format: stl            # stl | 3mf
  stl_binary: true
  report: true
  inspection_pngs: true
  report_lang: es
  png_size_px: 1024
  strict: false
"""


def _num(sec: dict, key: str, default, lo=None, hi=None, integer=False, path=""):
    val = sec.get(key, default)
    if val is None:
        raise UserError(f"Falta '{path}{key}' (obligatorio).")
    try:
        fval = float(val)
    except (TypeError, ValueError):
        raise UserError(f"'{path}{key}' debe ser un numero (valor: {val!r}).")
    if not integer:
        if lo is not None and fval < lo:
            raise UserError(f"'{path}{key}' debe ser >= {lo} (valor: {fval}).")
        if hi is not None and fval > hi:
            raise UserError(f"'{path}{key}' debe ser <= {hi} (valor: {fval}).")
        return fval
    if abs(fval - round(fval)) > 1e-9:
        raise UserError(f"'{path}{key}' debe ser entero (valor: {val!r}).")
    ival = int(round(fval))
    if lo is not None and ival < lo:
        raise UserError(f"'{path}{key}' debe ser >= {lo} (valor: {ival}).")
    if hi is not None and ival > hi:
        raise UserError(f"'{path}{key}' debe ser <= {hi} (valor: {ival}).")
    return ival


def _sec(raw: dict, name: str, warnings: list) -> dict:
    val = raw.get(name, {})
    if val is None:
        return {}
    if not isinstance(val, dict):
        raise UserError(f"La seccion '{name}' debe ser un mapa YAML.")
    return val


def _check_unknown(sec: dict, known: set, path: str, warnings: list):
    for k in sec:
        if k not in known:
            warnings.append(f"Clave desconocida ignorada: {path}{k}")


def load_config(path: str) -> Config:
    if not os.path.isfile(path):
        raise UserError(f"No existe el fichero de configuracion: {path}")
    try:
        with open(path, "r", encoding="utf-8") as fh:
            raw = yaml.safe_load(fh)
    except yaml.YAMLError as exc:
        raise UserError(f"YAML mal formado: {exc}")
    if raw is None:
        raise UserError("El fichero de configuracion esta vacio.")
    if not isinstance(raw, dict):
        raise UserError("La raiz del YAML debe ser un mapa de secciones.")

    warnings: list = []
    cfg = Config(raw=raw)

    # image
    si = _sec(raw, "image", warnings)
    _check_unknown(si, {"threshold", "invert", "min_island_area_mm2", "simplify_tol_mm",
                        "hole_fill_max_px"}, "image.", warnings)
    thr = si.get("threshold", "otsu")
    if isinstance(thr, str):
        if thr.lower() != "otsu":
            raise UserError("image.threshold debe ser 'otsu' o un entero 0-255.")
        cfg.image.threshold = "otsu"
    else:
        cfg.image.threshold = int(_num(si, "threshold", "otsu", 0, 255, integer=True, path="image."))
    cfg.image.invert = bool(si.get("invert", False))
    cfg.image.min_island_area_mm2 = _num(si, "min_island_area_mm2", 1.0, 0.0, path="image.")
    cfg.image.simplify_tol_mm = _num(si, "simplify_tol_mm", 0.15, 0.0, path="image.")
    cfg.image.hole_fill_max_px = _num(si, "hole_fill_max_px", 2, 0, integer=True, path="image.")

    # part
    sp = _sec(raw, "part", warnings)
    _check_unknown(sp, {"width_cm", "stencil_thickness_mm", "min_wall_mm", "min_slot_mm",
                        "nozzle_mm"}, "part.", warnings)
    if sp.get("width_cm") is None:
        raise UserError("Falta 'part.width_cm' (anchura fisica final en cm). Es el unico campo obligatorio.")
    cfg.part.width_cm = _num(sp, "width_cm", None, 1.0, 200.0, path="part.")
    cfg.part.stencil_thickness_mm = _num(sp, "stencil_thickness_mm", 1.2, 0.2, 50.0, path="part.")
    cfg.part.min_wall_mm = _num(sp, "min_wall_mm", 0.8, 0.2, 20.0, path="part.")
    cfg.part.min_slot_mm = _num(sp, "min_slot_mm", 0.6, 0.0, 20.0, path="part.")
    cfg.part.nozzle_mm = _num(sp, "nozzle_mm", 0.4, 0.1, 5.0, path="part.")
    if cfg.part.min_wall_mm < cfg.part.nozzle_mm - 1e-9:
        warnings.append("part.min_wall_mm < nozzle_mm: puede no imprimirse.")
    if cfg.part.stencil_thickness_mm < cfg.part.min_wall_mm:
        warnings.append("part.stencil_thickness_mm < min_wall_mm: revisar.")

    # anchors
    sa = _sec(raw, "anchors", warnings)
    _check_unknown(sa, {"max_spacing_mm", "spacing_width_factor", "max_anchors_per_island",
                        "anchor_margin_mm"}, "anchors.", warnings)
    cfg.anchors.max_spacing_mm = _num(sa, "max_spacing_mm", 15.0, 0.5, 200.0, path="anchors.")
    cfg.anchors.spacing_width_factor = _num(sa, "spacing_width_factor", 5.0, 0.5, 50.0, path="anchors.")
    cfg.anchors.max_anchors_per_island = _num(sa, "max_anchors_per_island", 400, 1, 5000,
                                              integer=True, path="anchors.")
    cfg.anchors.anchor_margin_mm = _num(sa, "anchor_margin_mm", 0.05, 0.0, 5.0, path="anchors.")

    # ribs
    sr = _sec(raw, "ribs", warnings)
    _check_unknown(sr, {"min_height_mm", "width_auto", "width_min_mm", "width_max_mm", "sections",
                        "slenderness_denom"}, "ribs.", warnings)
    cfg.ribs.min_height_mm = _num(sr, "min_height_mm", 0.0, 0.0, 100.0, path="ribs.")
    cfg.ribs.width_auto = bool(sr.get("width_auto", True))
    cfg.ribs.width_min_mm = _num(sr, "width_min_mm", 0.8, 0.2, 20.0, path="ribs.")
    cfg.ribs.width_max_mm = _num(sr, "width_max_mm", 3.0, 0.2, 50.0, path="ribs.")
    cfg.ribs.sections = _num(sr, "sections", 12, 6, 64, integer=True, path="ribs.")
    cfg.ribs.slenderness_denom = _num(sr, "slenderness_denom", 40.0, 0.0, 1000.0, path="ribs.")
    if cfg.ribs.width_min_mm > cfg.ribs.width_max_mm:
        raise UserError("ribs.width_min_mm > ribs.width_max_mm.")

    # structural
    ss = _sec(raw, "structural", warnings)
    _check_unknown(ss, {"press_force_n", "safety_factor", "e_pla_mpa", "k_effective",
                        "sigma_bearing_mpa", "peel_check"}, "structural.", warnings)
    cfg.structural.press_force_n = _num(ss, "press_force_n", 25.0, 0.001, path="structural.")
    cfg.structural.safety_factor = _num(ss, "safety_factor", 3.0, 1.0, path="structural.")
    cfg.structural.e_pla_mpa = _num(ss, "e_pla_mpa", 3500.0, 1.0, path="structural.")
    cfg.structural.k_effective = _num(ss, "k_effective", 1.0, 0.1, path="structural.")
    cfg.structural.sigma_bearing_mpa = _num(ss, "sigma_bearing_mpa", 50.0, 0.1, path="structural.")
    cfg.structural.peel_check = bool(ss.get("peel_check", False))

    # convergence
    sc = _sec(raw, "convergence", warnings)
    _check_unknown(sc, {"mode", "max_overhang_deg", "optimize", "merge_eps_mm"}, "convergence.", warnings)
    mode = str(sc.get("mode", "tree")).lower()
    if mode not in ("tree", "fan"):
        raise UserError("convergence.mode debe ser 'tree' o 'fan'.")
    cfg.convergence.mode = mode
    cfg.convergence.max_overhang_deg = _num(sc, "max_overhang_deg", 45.0, 1.0, 80.0, path="convergence.")
    cfg.convergence.optimize = bool(sc.get("optimize", True))
    cfg.convergence.merge_eps_mm = _num(sc, "merge_eps_mm", 0.5, 0.0, 20.0, path="convergence.")

    # vault
    sv = _sec(raw, "vault", warnings)
    _check_unknown(sv, {"shape", "footprint_mm", "top_area_mm2", "n_sec", "n_rings"}, "vault.", warnings)
    shape = str(sv.get("shape", "rounded_rect")).lower()
    if shape not in ("rounded_rect", "ellipse"):
        raise UserError("vault.shape debe ser 'rounded_rect' o 'ellipse'.")
    cfg.vault.shape = shape
    cfg.vault.footprint_mm = _num(sv, "footprint_mm", 30.0, 1.0, path="vault.")
    cfg.vault.top_area_mm2 = _num(sv, "top_area_mm2", 300.0, 1.0, path="vault.")
    cfg.vault.n_sec = _num(sv, "n_sec", 32, 8, 256, integer=True, path="vault.")
    cfg.vault.n_rings = _num(sv, "n_rings", 8, 2, 64, integer=True, path="vault.")

    # frame
    sf = _sec(raw, "frame", warnings)
    _check_unknown(sf, {"mode", "width_mm", "extra_mm"}, "frame.", warnings)
    fmode = str(sf.get("mode", "low")).lower()
    if fmode not in ("none", "low", "perimeter"):
        raise UserError("frame.mode debe ser 'none', 'low' o 'perimeter'.")
    cfg.frame.mode = fmode
    cfg.frame.width_mm = _num(sf, "width_mm", 2.0, 0.2, 50.0, path="frame.")
    cfg.frame.extra_mm = _num(sf, "extra_mm", 1.5, 0.0, 50.0, path="frame.")

    # output
    so = _sec(raw, "output", warnings)
    _check_unknown(so, {"format", "stl_binary", "report", "inspection_pngs", "report_lang",
                        "png_size_px", "strict"}, "output.", warnings)
    fmt = str(so.get("format", "stl")).lower()
    if fmt not in ("stl", "3mf"):
        raise UserError("output.format debe ser 'stl' o '3mf'.")
    cfg.output.format = fmt
    cfg.output.stl_binary = bool(so.get("stl_binary", True))
    cfg.output.report = bool(so.get("report", True))
    cfg.output.inspection_pngs = bool(so.get("inspection_pngs", True))
    cfg.output.report_lang = str(so.get("report_lang", "es"))
    cfg.output.png_size_px = _num(so, "png_size_px", 1024, 128, 8192, integer=True, path="output.")
    cfg.output.strict = bool(so.get("strict", False))

    _check_unknown(raw, {"image", "part", "anchors", "ribs", "structural", "convergence", "vault",
                         "frame", "output"}, "", warnings)
    cfg.raw["_warnings"] = warnings
    return cfg


# --- Modelos de datos ------------------------------------------------------

@dataclass
class Island:
    label: int
    area_mm2: float
    area_px: int
    centroid_xy: tuple
    bbox_px: tuple
    dims_mm: tuple
    elong: float
    major_dir_xy: tuple
    min_thick_mm: float
    med_thick_mm: float
    has_holes: bool
    perimeter_mm: float
    outline_xy: np.ndarray


@dataclass
class Anchor:
    x: float
    y: float
    row: int
    col: int
    island_label: int
    kind: str
    width_mm: float
    max_width_mm: float = 0.0


@dataclass
class Node:
    xy: tuple
    z: float
    width_mm: float
    cluster: int
    subtree_area_mm2: float
    load_n: float = 0.0
    p_cr_n: float = 0.0
    p_tope_n: float = 0.0
    margin: float = float("inf")
    label: str = ""
    max_width_mm: float = float("inf")

    @property
    def xyz(self):
        return (self.xy[0], self.xy[1], self.z)


@dataclass
class Strut:
    child: Node
    parent: Node
    width_mm: float

    @property
    def length(self):
        return _dist3(self.child.xyz, self.parent.xyz)


@dataclass
class Tree:
    nodes: list
    struts: list
    root: Node
    mode: str
    total_length_mm: float
    total_material_mm3: float
    max_margin: float
    min_margin: float


def _dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def _dist3(a, b):
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)


# --- Estructural (supuestos declarados) ------------------------------------

def p_crit(w: float, L: float, E: float, K: float) -> float:
    if L <= 0 or w <= 0:
        return float("inf")
    I = PI * w ** 4 / 64.0
    return PI ** 2 * E * I / (K * L) ** 2


def p_bearing(w: float, sigma: float) -> float:
    return sigma * PI * w ** 2 / 4.0


def w_buckling(P: float, L: float, E: float, K: float, FS: float) -> float:
    if P <= 0:
        return 0.0
    val = 64.0 * FS * P * (K * L) ** 2 / (PI ** 3 * E)
    return val ** 0.25 if val > 0 else 0.0


def w_crush(P: float, sigma: float, FS: float) -> float:
    if P <= 0:
        return 0.0
    val = 4.0 * FS * P / (PI * sigma)
    return math.sqrt(val) if val > 0 else 0.0


def w_required(P: float, L: float, cfg: Config) -> float:
    s = cfg.structural
    return max(w_buckling(P, L, s.e_pla_mpa, s.k_effective, s.safety_factor),
               w_crush(P, s.sigma_bearing_mpa, s.safety_factor))


def island_nominal_width(area_mm2: float, cfg: Config) -> float:
    A_ref = 50.0
    w = 1.2 * (1.0 + 0.5 * math.log10(max(area_mm2, 1e-6) / A_ref))
    w = max(w, cfg.part.min_wall_mm)
    if cfg.ribs.width_auto:
        w = min(max(w, cfg.ribs.width_min_mm), cfg.ribs.width_max_mm)
        w = max(w, cfg.part.min_wall_mm)
    return w


def _effective_h0(cfg: Config) -> float:
    """Altura del tramo vertical de los anclajes.

    0 (por defecto) significa 'igual al espesor del stencil', de modo que el cilindro del anclaje
    nunca sobresale por encima de la base.
    """
    return max(cfg.part.stencil_thickness_mm, cfg.ribs.min_height_mm)


# --- Etapa A — imagen a mascara --------------------------------------------

def load_gray(path: str) -> np.ndarray:
    if not os.path.isfile(path):
        raise UserError(f"No existe la imagen: {path}")
    try:
        img = Image.open(path)
    except Exception as exc:
        raise UserError(f"No se puede abrir la imagen {path}: {exc}")
    return np.asarray(img.convert("L"), dtype=np.uint8)


def _ridge_pixels(skel: np.ndarray, edt: np.ndarray) -> np.ndarray:
    ridge = skel & (edt >= ndi.maximum_filter(edt, size=3) - 1e-9)
    return ridge if ridge.any() else skel


def _remove_small_islands(solid, min_px):
    lbl, n = ndi.label(solid, structure=STRUCT4)
    removed = 0
    removed_area = 0
    if n > 0:
        counts = ndi.sum(np.ones_like(lbl), lbl, index=np.arange(1, n + 1))
        for i, c in enumerate(counts, start=1):
            if c < min_px:
                solid[lbl == i] = False
                removed += 1
                removed_area += int(c)
    return solid, removed, removed_area


def binarize_and_clean(gray: np.ndarray, cfg: Config, mm_px: float, log) -> tuple:
    W = gray.shape[1]
    rep: dict = {"img_shape": gray.shape}
    thr = cfg.image.threshold
    if thr == "otsu":
        thr_val = float(filters.threshold_otsu(gray))
        rep["threshold_mode"] = "otsu"
    else:
        thr_val = float(thr)
        rep["threshold_mode"] = f"fijo={thr}"
    rep["threshold"] = thr_val
    # Convencion Otsu: el umbral t separa [0..t] (fondo) de [t+1..255] (solido); por eso se
    # compara con > y no con >=. Importante en imagenes ya binarias (0/255), donde Otsu
    # devuelve 0 y >= marcaria el fondo entero como solido.
    if gray.min() == gray.max():
        # Imagen constante: Otsu no tiene sentido (devolveria el propio valor). Se decide por
        # claridad: valor alto -> todo solido, valor bajo -> todo hueco.
        solid = np.full(gray.shape, bool(gray.flat[0] > 127))
        rep["threshold_mode"] += " (imagen constante)"
    else:
        solid = gray > thr_val
    if cfg.image.invert:
        solid = ~solid
    rep["solid_pct"] = 100.0 * solid.mean()

    # relleno de poros encerrados pequenos
    if cfg.image.hole_fill_max_px > 0:
        black = ~solid
        lbl_b, nb = ndi.label(black, structure=np.ones((3, 3)))
        border_ids = set(np.unique(np.concatenate([lbl_b[0, :], lbl_b[-1, :],
                                                   lbl_b[:, 0], lbl_b[:, -1]])))
        filled_px = 0
        for i in range(1, nb + 1):
            if i in border_ids:
                continue
            m = lbl_b == i
            a = int(m.sum())
            if a <= cfg.image.hole_fill_max_px:
                solid[m] = True
                filled_px += a
        rep["poros_rellenados_px"] = filled_px

    # eliminacion de islas diminutas
    min_px = cfg.image.min_island_area_mm2 / (mm_px ** 2)
    solid, removed, removed_area = _remove_small_islands(solid, min_px)
    n = ndi.label(solid, structure=STRUCT4)[1]
    rep["islas_eliminadas_peq"] = removed
    rep["area_eliminada_peq_px"] = removed_area

    # minimo imprimible: apertura morfologica (fuera = solido, no erosiona borde). El disco se
    # toma con radio ENTERO por exceso (ceil) para que la cota garantizada 2*r_int >= min_wall.
    r_px = cfg.part.min_wall_mm / 2.0 / mm_px
    before_area = int(solid.sum())
    r_int = 0
    if r_px >= 0.5:
        r_int = int(math.ceil(r_px))
        footprint = morphology.disk(r_int)
        pad = r_int + 1
        padded = np.pad(solid, pad, constant_values=True)
        padded = morphology.opening(padded, footprint)
        solid = padded[pad:-pad, pad:-pad]
        solid, rem2, area2 = _remove_small_islands(solid, min_px)
        rep["islas_eliminadas_post"] = rem2
        rep["area_eliminada_post_px"] = area2
    rep["apertura_r_px"] = r_px
    rep["apertura_r_px_entero"] = r_int
    rep["ancho_garantizado_mm"] = 2.0 * r_int * mm_px
    rep["area_antes_apertura_px"] = before_area
    rep["area_despues_apertura_px"] = int(solid.sum())
    n_after = ndi.label(solid, structure=STRUCT4)[1]
    rep["islas_antes_apertura"] = n
    rep["islas_despues_apertura"] = n_after

    # grosores resultantes (cresta real: maximo local sobre el esqueleto, descarta extremos)
    edt = ndi.distance_transform_edt(solid)
    skel = morphology.skeletonize(solid)
    if skel.any():
        ridge = _ridge_pixels(skel, edt)
        vals = 2.0 * edt[ridge] * mm_px
        rep["grosor_min_mm_post"] = float(vals.min())
        rep["grosor_p5_mm_post"] = float(np.percentile(vals, 5))
        rep["grosor_med_mm_post"] = float(np.median(vals))

    # huecos (negro) finos: solo aviso
    void = ~solid
    if void.any():
        edt_v = ndi.distance_transform_edt(void)
        skel_v = morphology.skeletonize(void)
        if skel_v.any():
            ridge_v = _ridge_pixels(skel_v, edt_v)
            sv = 2.0 * edt_v[ridge_v] * mm_px
            rep["hueco_min_mm"] = float(sv.min())
            rep["hueco_p5_mm"] = float(np.percentile(sv, 5))
            rep["huecos_bajo_min_pct"] = float(100.0 * (sv < cfg.part.min_slot_mm).mean())
    return solid, rep


# --- Escala ----------------------------------------------------------------

def compute_scale(gray: np.ndarray, cfg: Config) -> dict:
    H, W = gray.shape
    mm_px = cfg.part.width_cm * 10.0 / W
    return {"mm_px": mm_px, "width_mm": cfg.part.width_cm * 10.0, "height_mm": H * mm_px,
            "W_px": W, "H_px": H}


def px_to_xy(row, col, H, mm_px):
    return (np.asarray(col) * mm_px, (H - 1 - np.asarray(row)) * mm_px)


# --- Etapa B — poligonos (con jerarquia exterior/agujero) ------------------

def _explode(geom):
    if geom is None or geom.is_empty:
        return
    if isinstance(geom, Polygon):
        yield geom
    elif isinstance(geom, MultiPolygon):
        for g in geom.geoms:
            yield g
    elif hasattr(geom, "geoms"):
        for g in geom.geoms:
            yield from _explode(g)


def extract_polygons(mask: np.ndarray, scale: dict, cfg: Config, log) -> tuple:
    H, W = mask.shape
    mm_px = scale["mm_px"]
    tol_px = max(cfg.image.simplify_tol_mm / mm_px, 0.05)
    padded = np.zeros((H + 2, W + 2), dtype=np.uint8)
    padded[1:-1, 1:-1] = mask.astype(np.uint8)
    contours = measure.find_contours(padded, 0.5)
    polys = []
    raw_pts = 0
    for c in contours:
        raw_pts += len(c)
        if len(c) < 4:
            continue
        simp = measure.approximate_polygon(c, tolerance=tol_px)
        if len(simp) < 4:
            continue
        rr = simp[:, 0] - 1.0
        cc = simp[:, 1] - 1.0
        x, y = px_to_xy(rr, cc, H, mm_px)
        p = Polygon(np.column_stack([x, y]))
        if not p.is_valid:
            p = p.buffer(0)
        for g in _explode(p):
            if g.area > 0:
                polys.append(g)

    n = len(polys)
    order = sorted(range(n), key=lambda i: polys[i].area, reverse=True)
    depth = [0] * n
    parent = [-1] * n
    for ii, idx in enumerate(order):
        rep = polys[idx].representative_point()
        d = 0
        par = -1
        for jj in range(ii):
            jdx = order[jj]
            if polys[jdx].contains(rep):
                d += 1
                par = jdx
        depth[idx] = d
        parent[idx] = par

    islands = []
    for idx in range(n):
        if depth[idx] % 2 != 0:
            continue
        holes = [polys[j].exterior.coords[:] for j in range(n)
                 if parent[j] == idx and depth[j] % 2 == 1]
        try:
            poly = Polygon(polys[idx].exterior.coords[:], holes)
            if not poly.is_valid:
                poly = poly.buffer(0)
        except Exception:
            poly = polys[idx]
        for g in _explode(poly):
            if g.area > 0:
                islands.append(g)

    stats = {"n_contornos": len(contours), "puntos_crudos": raw_pts, "n_poligonos": len(islands),
             "vertices": sum(len(g.exterior.coords) for g in islands) +
                         sum(len(r.coords) for g in islands for r in g.interiors)}
    log(f"  poligonos: {len(islands)}  vertices: {stats['vertices']} "
        f"(tol {cfg.image.simplify_tol_mm} mm)")
    return islands, stats


# --- Etapa C — analisis de islas --------------------------------------------

def analyze_islands(mask: np.ndarray, scale: dict, cfg: Config, log) -> list:
    H, W = mask.shape
    mm_px = scale["mm_px"]
    labels, n = ndi.label(mask, structure=STRUCT4)
    edt = ndi.distance_transform_edt(mask)
    skel = morphology.skeletonize(mask)
    out = []
    for lab in range(1, n + 1):
        m = labels == lab
        area_px = int(m.sum())
        if area_px == 0:
            continue
        coords = np.argwhere(m)  # (row, col)
        cr, cc = coords.mean(axis=0)
        rmin, cmin = coords.min(axis=0)
        rmax, cmax = coords.max(axis=0)
        cen = coords - coords.mean(axis=0)
        cov = (cen.T @ cen) / max(len(cen), 1)
        vals, vecs = np.linalg.eigh(cov)
        lam2 = max(vals[0], 1e-9)
        lam1 = max(vals[1], 1e-9)
        elong = math.sqrt(lam1 / lam2)
        major = vecs[:, 1]  # (row, col)
        sk = skel & m
        if sk.any():
            tv = 2.0 * edt[sk]
            min_t = float(tv.min())
            med_t = float(np.median(tv))
        else:
            min_t = med_t = 2.0 * float(edt[m].max())
        filled = ndi.binary_fill_holes(m)
        has_holes = bool(filled.sum() > m.sum())
        perimeter = float(measure.perimeter(m.astype(float), neighborhood=8)) * mm_px
        x_c, y_c = px_to_xy(cr, cc, H, mm_px)
        out.append(Island(
            label=lab, area_mm2=area_px * mm_px ** 2, area_px=area_px,
            centroid_xy=(float(x_c), float(y_c)),
            bbox_px=(int(rmin), int(cmin), int(rmax), int(cmax)),
            dims_mm=((cmax - cmin + 1) * mm_px, (rmax - rmin + 1) * mm_px),
            elong=elong, major_dir_xy=(float(major[1]), float(-major[0])),
            min_thick_mm=min_t * mm_px, med_thick_mm=med_t * mm_px, has_holes=has_holes,
            perimeter_mm=perimeter, outline_xy=np.zeros((0, 2))))
    log(f"  islas (4-conexas): {len(out)}")
    return out


# --- Etapa D — anclajes ----------------------------------------------------

def _max_edt_pixel(m, edt):
    vals = np.where(m, edt, -1.0)
    idx = np.argmax(vals)
    return np.unravel_index(idx, m.shape)


def select_anchors(mask, islands, scale, cfg, log) -> tuple:
    """Coloca anclajes por cobertura.

    En cada isla (incluida la exterior) se siembran puntos de forma que todo punto de la isla
    quede a <= un paso de uno de ellos. El paso de una isla es
    min(anchors.max_spacing_mm, anchors.spacing_width_factor * ancho_nominal), de modo que las
    islas grandes (nervio mas grueso) reciben mas puntos. El primer punto va en el pixel de mayor
    EDT (mas centrado) y los siguientes en el pixel elegible mas alejado del conjunto ya sembrado.
    El radio de cada anclaje se limita con la EDT local, asi ningun cilindro sale de la isla.
    """
    H, W = mask.shape
    mm_px = scale["mm_px"]
    labels, _ = ndi.label(mask, structure=STRUCT4)
    edt = ndi.distance_transform_edt(mask)
    a_marg = cfg.anchors.anchor_margin_mm
    K = cfg.anchors.spacing_width_factor
    half_min_px = max(cfg.part.nozzle_mm / 2.0, cfg.part.min_wall_mm / 2.0) / mm_px
    cap = cfg.anchors.max_anchors_per_island
    anchors = []
    just = []
    w_by_label = {}
    rib_paths = {}
    for isl in islands:
        lab = isl.label
        m = labels == lab
        w_nom = island_nominal_width(isl.area_mm2, cfg)
        w_by_label[lab] = w_nom
        spacing_mm = min(cfg.anchors.max_spacing_mm, K * w_nom)
        spacing_px = spacing_mm / mm_px
        r0, c0, r1, c1 = (int(v) for v in isl.bbox_px)
        sub = m[r0:r1 + 1, c0:c1 + 1]
        edt_sub = edt[r0:r1 + 1, c0:c1 + 1]
        elig = sub & (edt_sub >= half_min_px)
        seeds = []
        if sub.any():
            pr, pc = _max_edt_pixel(sub, edt_sub)
            seeds.append((int(pr), int(pc)))
        while seeds and len(seeds) < cap:
            seedmask = np.zeros(sub.shape, bool)
            sarr = np.array(seeds, dtype=int)
            seedmask[sarr[:, 0], sarr[:, 1]] = True
            d = ndi.distance_transform_edt(~seedmask)
            d_sub = np.where(sub, d, -1.0)
            if d_sub.max() <= spacing_px:
                break
            d_el = np.where(elig, d, -1.0)
            if not (d_el > 0.0).any():
                break
            idx = int(np.argmax(d_el))
            seeds.append(tuple(int(v) for v in np.unravel_index(idx, sub.shape)))
        n_ok = 0
        for (pr, pc) in seeds:
            r_local = float(edt_sub[pr, pc]) * mm_px
            r_use = min(r_local * 0.98, max(r_local - a_marg, r_local * 0.5))
            width = min(w_nom, 2.0 * r_use)
            if width <= 0.0:
                continue
            x, y = px_to_xy(pr + r0, pc + c0, H, mm_px)
            anchors.append(Anchor(float(x), float(y), int(pr + r0), int(pc + c0), lab,
                                  "cobertura", width, 2.0 * r_local))
            n_ok += 1
        just.append({
            "label": lab, "area": isl.area_mm2, "elong": isl.elong, "width": w_nom, "n": n_ok,
            "kind": (f"cobertura (paso {spacing_mm:g} mm = min({cfg.anchors.max_spacing_mm:g}, "
                     f"{K:g}x ancho {w_nom:.2f} mm)): {n_ok} anclajes, radio limitado por el "
                     f"ancho local")})
    log(f"  anclajes: {len(anchors)} (cobertura; paso = min("
        f"{cfg.anchors.max_spacing_mm:g} mm, {cfg.anchors.spacing_width_factor:g}x ancho de "
        f"nervio); w en [{cfg.ribs.width_min_mm}, {cfg.ribs.width_max_mm}] mm)")
    return anchors, just, w_by_label, rib_paths


# --- Etapa E — placa, risers, marco ----------------------------------------

def build_plate(polygons, cfg, log):
    t = cfg.part.stencil_thickness_mm
    meshes = []
    for p in polygons:
        try:
            m = trimesh.creation.extrude_polygon(p, height=t)
        except Exception as exc:
            log(f"  aviso: poligono no extruible ({exc}); se omite")
            continue
        if len(m.faces) > 0:
            meshes.append(m)
    return meshes


def build_risers(anchors, cfg, tree=None):
    """Un unico cilindro por anclaje, nunca mas alto que la base.

    Altura h0 = max(espesor del stencil, ribs.min_height_mm); con el default (min_height_mm = 0)
    coincide con el espesor del stencil. El radio se toma del nervio que arranca en ese anclaje
    (ya limitado por la EDT local) para tapar su tapa inferior sin que el cilindro salga de la isla.
    """
    h0 = _effective_h0(cfg)
    sec = cfg.ribs.sections
    leaf_w = {}
    if tree is not None:
        has_kids = {id(s.parent) for s in tree.struts}
        for s in tree.struts:
            if id(s.child) in has_kids:
                continue
            k = (round(s.child.xy[0], 3), round(s.child.xy[1], 3))
            leaf_w[k] = max(leaf_w.get(k, 0.0), s.width_mm)
    out = []
    for a in anchors:
        k = (round(a.x, 3), round(a.y, 3))
        w = max(a.width_mm, leaf_w.get(k, 0.0))
        r = w / 2.0
        m = trimesh.creation.cylinder(radius=r, height=h0, sections=sec)
        m.apply_translation([a.x, a.y, h0 / 2.0])
        out.append(m)
    return out


def build_frame(polygons, scale, cfg, log):
    if cfg.frame.mode == "none":
        return []
    bg = None
    for p in polygons:
        b = p.bounds
        if (abs(b[0]) < 0.5 * scale["mm_px"] + 1e-6 and
                abs(b[1]) < 0.5 * scale["mm_px"] + 1e-6 and
                abs(b[2] - scale["width_mm"]) < 0.5 * scale["mm_px"] + 1e-6 and
                abs(b[3] - scale["height_mm"]) < 0.5 * scale["mm_px"] + 1e-6):
            bg = p
            break
    if bg is None:
        return []
    fw = cfg.frame.width_mm
    ext = Polygon(bg.exterior.coords)
    inner = ext.buffer(-fw, join_style=1, cap_style=2)
    if inner.is_empty:
        return []
    ring = ext.difference(inner).intersection(bg)
    if ring.is_empty:
        return []
    h = (cfg.part.stencil_thickness_mm + cfg.frame.extra_mm
         if cfg.frame.mode == "low" else _effective_h0(cfg))
    out = []
    for g in _explode(ring):
        try:
            out.append(trimesh.creation.extrude_polygon(g, height=h))
        except Exception:
            continue
    return out


# --- Etapa F — arbol / abanico y struts ------------------------------------

def _make_node(xy, z, width, cluster, area, label="", max_width=float("inf")):
    return Node(xy=xy, z=z, width_mm=width, cluster=cluster, subtree_area_mm2=area,
                label=label, max_width_mm=max_width)


def _slender(L, cfg):
    d = cfg.ribs.slenderness_denom
    return (L / d) if d and d > 0 else 0.0


def _leaf_tilt(parent_xyz, child_xyz):
    dx = parent_xyz[0] - child_xyz[0]
    dy = parent_xyz[1] - child_xyz[1]
    dz = parent_xyz[2] - child_xyz[2]
    if dz <= 1e-9:
        return None, 0.0
    return math.atan2(math.hypot(dx, dy), dz), dz


def _cone_half_angle(R1, R2, d):
    """Semiangulo del tronco de cono tangente (ver cono_truncado.md).

    Solo penaliza si el cono se ensancha hacia el padre (R2 > R1).
    """
    if d <= 1e-9 or R2 <= R1:
        return 0.0
    if d > R1 + R2 and d * d - R2 * R2 > 1e-9:
        S = math.sqrt(d * d + R2 * R2 - R1 * R1)
        m = (R2 * S - d * R1) / (d * d - R2 * R2)
    else:
        m = (R2 - R1) / d
    return math.atan(max(0.0, m))


def _min_parent_z(run, child_z, R1, R2, limit_rad):
    """Menor z del padre para que (inclinacion + semiangulo del cono) no supere ``limit_rad``;
    asi la cara inferior del tronco no es voladizo."""
    if run <= 1e-9:
        return child_z
    tanT = max(math.tan(limit_rad), 1e-6)
    z = child_z + run / tanT
    step = max(0.25, 0.05 * run)
    for _ in range(500):
        dz = z - child_z
        d = math.hypot(run, dz)
        tilt = math.atan2(run, dz)
        if tilt + _cone_half_angle(R1, R2, d) <= limit_rad:
            break
        z += step
    return z


def _cap_leaf_struts(struts, cfg):
    """Limita el radio de los nervios-hoja para que su tapa inferior quede enterrada en la placa
    (no genera voladizo) sin salirse de la isla.

    El nervio se prolonga hacia abajo una longitud d = r*tan(a) para que su tapa quede por debajo
    del plano z=t; su extension horizontal maxima es r*(1 + sin^2(a)/cos(a)) = r*f(a). Exigimos
    r*f(a) <= 0.98 * r_local, donde r_local = max_width_mm/2 es la mayor circunferencia inscrita
    en el anclaje, y r*sin(a) <= h0 para no atravesar la cama.
    """
    h0 = _effective_h0(cfg)
    parents = {id(s.parent) for s in struts}
    for s in struts:
        if id(s.child) in parents:
            continue
        mw = s.child.max_width_mm
        if not math.isfinite(mw) or mw <= 0:
            continue
        a, _ = _leaf_tilt(s.parent.xyz, s.child.xyz)
        if a is None:
            continue
        ca = math.cos(a)
        sa = math.sin(a)
        if ca < 1e-6:
            continue
        f = 1.0 + sa * sa / ca
        rmax = 0.98 * (mw / 2.0) / f
        if sa > 1e-9:
            rmax = min(rmax, max(0.0, (h0 - 0.05) / (2.0 * sa)))
        r = max(min(s.width_mm / 2.0, rmax), 0.05)
        s.width_mm = 2.0 * r


def _enforce_cone_overhang(all_nodes, struts, limit_rad):
    """Eleva los nudos internos lo necesario para que la cara inferior de cada tronco de cono
    (inclinacion + semiangulo) no supere ``limit_rad``.

    ``all_nodes`` debe venir en orden de creacion (hijos antes que padres); asi basta una pasada
    para propagar la elevacion hacia arriba."""
    children = {}
    for s in struts:
        children.setdefault(id(s.parent), []).append(s)
    changed = False
    for nd in all_nodes:
        kids = children.get(id(nd))
        if not kids:
            continue
        R2 = nd.width_mm / 2.0
        zreq = nd.z
        for s in kids:
            c = s.child
            run = _dist(c.xy, nd.xy)
            zreq = max(zreq, _min_parent_z(run, c.z, s.width_mm / 2.0, R2, limit_rad))
        if zreq > nd.z + 1e-9:
            nd.z = zreq
            changed = True
    return changed


def _relax_tree(all_nodes, struts, root, cfg, theta, h0):
    """Acerca cada nudo interno al centro de la pieza todo lo que permitan los angulos
    (tilt+semiangulo <= theta) y luego baja su z al minimo viable. Comprime lateralmente el arbol,
    de modo que las alturas requeridas bajan sin cambiar la topologia ni anadir nervios."""
    children = {}
    parent_of = {}
    for s in struts:
        children.setdefault(id(s.parent), []).append(s)
        parent_of[id(s.child)] = s
    internal = [n for n in all_nodes if children.get(id(n))]
    if not internal:
        return False
    leaves = [n for n in all_nodes if not children.get(id(n))]
    cxy = np.mean([n.xy for n in leaves], axis=0) if leaves else np.array(root.xy, float)

    def feasible(p, sstep, ux, uy):
        x = p.xy[0] + sstep * ux
        y = p.xy[1] + sstep * uy
        for st in children.get(id(p), []):
            c = st.child
            run = math.hypot(x - c.xy[0], y - c.xy[1])
            rise = p.z - c.z
            if rise <= 1e-9:
                return False
            d = math.hypot(run, rise)
            if (math.atan2(run, rise) +
                    _cone_half_angle(st.width_mm / 2.0, p.width_mm / 2.0, d) > theta + 1e-9):
                return False
        st = parent_of.get(id(p))
        if st is not None:
            q = st.parent
            run = math.hypot(q.xy[0] - x, q.xy[1] - y)
            rise = q.z - p.z
            if rise <= 1e-9:
                return False
            d = math.hypot(run, rise)
            if (math.atan2(run, rise) +
                    _cone_half_angle(p.width_mm / 2.0, q.width_mm / 2.0, d) > theta + 1e-9):
                return False
        return True

    moved = False
    for _ in range(60):
        any_move = False
        for p in sorted(internal, key=lambda n: n.z):
            dx = float(cxy[0] - p.xy[0])
            dy = float(cxy[1] - p.xy[1])
            dist = math.hypot(dx, dy)
            if dist > 1e-6:
                ux, uy = dx / dist, dy / dist
                lo, hi = 0.0, dist
                for _ in range(30):
                    sm = 0.5 * (lo + hi)
                    if feasible(p, sm, ux, uy):
                        lo = sm
                    else:
                        hi = sm
                if lo > 1e-4:
                    p.xy = (p.xy[0] + lo * ux, p.xy[1] + lo * uy)
                    any_move = True
            zmin = h0
            for st in children.get(id(p), []):
                c = st.child
                run = _dist(c.xy, p.xy)
                zmin = max(zmin, _min_parent_z(run, c.z, st.width_mm / 2.0, p.width_mm / 2.0, theta))
            if zmin < p.z - 1e-9:
                p.z = zmin
                any_move = True
        if not any_move:
            break
        moved = True
    return moved


def _merge_close_nodes(all_nodes, struts, root, eps):
    """Fusiona un nudo interno con su padre cuando el nervio que los une mide menos que ``eps``:
    reparenta los hijos del nudo directamente al padre y elimina el nervio y el nudo intermedio
    (dos esferas practicamente pegadas son una sola)."""
    if eps <= 0:
        return False
    changed = False
    while True:
        hit = None
        for s in struts:
            rs = (s.child.width_mm + s.parent.width_mm) / 2.0
            if any(t.parent is s.child for t in struts) and s.length <= eps + rs:
                hit = s
                break
        if hit is None:
            break
        c, p = hit.child, hit.parent
        for t in struts:
            if t.parent is c:
                t.parent = p
        struts.remove(hit)
        if c in all_nodes:
            all_nodes.remove(c)
        changed = True
    return changed


def _grow_widths_for_buckling(all_nodes, struts, cfg, A_tot):
    """Engorda cada nervio lo justo para cumplir pandeo/plastificado en su longitud final (tras
    haber elevado nudos por voladizo)."""
    child_strut = {id(s.child): s for s in struts}
    changed = False
    for nd in all_nodes:
        s = child_strut.get(id(nd))
        if s is None:
            continue
        P = cfg.structural.press_force_n * nd.subtree_area_mm2 / A_tot
        need = max(w_required(P, s.length, cfg), _slender(s.length, cfg))
        if nd.max_width_mm != float("inf"):
            need = min(need, nd.max_width_mm)
        if need > nd.width_mm + 1e-9:
            nd.width_mm = need
            s.width_mm = max(s.width_mm, need)
            changed = True
    return changed


def _cover_root(pts, step_mm=1.0):
    if len(pts) == 1:
        return tuple(pts[0])
    lo = pts.min(axis=0) - step_mm
    hi = pts.max(axis=0) + step_mm
    gx = np.arange(lo[0], hi[0] + 1e-9, step_mm)
    gy = np.arange(lo[1], hi[1] + 1e-9, step_mm)
    best = None
    for x in gx:
        dx2 = (pts[:, 0] - x) ** 2
        for y in gy:
            m = float(np.sqrt(dx2 + (pts[:, 1] - y) ** 2).max())
            if best is None or m < best[0] - 1e-12:
                best = (m, float(x), float(y))
    return (best[1], best[2])


def _finalize_tree(nodes, struts, root, mode, cfg, A_tot, log):
    for n in nodes:
        n.load_n = cfg.structural.press_force_n * n.subtree_area_mm2 / A_tot
    for n in nodes:
        out = ([s.length for s in struts if s.parent is root] if n is root
               else [s.length for s in struts if s.child is n])
        L = max(out) if out else 0.0
        n.p_cr_n = p_crit(n.width_mm, L, cfg.structural.e_pla_mpa, cfg.structural.k_effective)
        n.p_tope_n = p_bearing(n.width_mm, cfg.structural.sigma_bearing_mpa)
        n.margin = min(n.p_cr_n, n.p_tope_n) / max(n.load_n, 1e-9)
    total_len = sum(s.length for s in struts)
    total_vol = sum(PI * (s.width_mm / 2.0) ** 2 * s.length for s in struts)
    margins = [n.margin for n in nodes]
    return Tree(nodes=nodes, struts=struts, root=root, mode=mode, total_length_mm=total_len,
                total_material_mm3=total_vol, max_margin=max(margins), min_margin=min(margins))


def build_tree(anchors, islands_by_label, cfg, mode, log) -> Tree:
    h0 = _effective_h0(cfg)
    theta = math.radians(max(5.0, cfg.convergence.max_overhang_deg - 1.0))
    tanT = math.tan(theta)
    A_tot = sum(isl.area_mm2 for isl in islands_by_label.values())
    if A_tot <= 0:
        A_tot = 1.0
    cnt = count(1)
    per_label_count = {}
    for a in anchors:
        per_label_count[a.island_label] = per_label_count.get(a.island_label, 0) + 1
    leaves = []
    for a in anchors:
        isl = islands_by_label[a.island_label]
        sub = isl.area_mm2 / max(per_label_count[a.island_label], 1)
        maxw = a.max_width_mm if a.max_width_mm > 0 else float("inf")
        w0 = min(a.width_mm, maxw)
        leaves.append(_make_node((a.x, a.y), h0, w0, next(cnt), sub,
                                 label=f"isla {a.island_label}", max_width=maxw))
    struts = []

    if mode == "fan":
        pts = np.array([l.xy for l in leaves], float)
        step = max(1.0, float(np.ptp(pts, axis=0).max()) / 60.0)
        cx, cy = _cover_root(pts, step)
        z_root = max(h0 + _dist(l.xy, (cx, cy)) / tanT for l in leaves)
        R2g = max(l.width_mm for l in leaves) / 2.0
        for _ in range(8):
            z_new = z_root
            for l in leaves:
                z_new = max(z_new, _min_parent_z(_dist(l.xy, (cx, cy)), h0, l.width_mm / 2.0, R2g, theta))
            z_root = z_new
            for l in leaves:
                run = _dist(l.xy, (cx, cy))
                L = math.hypot(run, z_root - h0)
                P_l = cfg.structural.press_force_n * l.subtree_area_mm2 / A_tot
                w = max(l.width_mm, w_required(P_l, L, cfg), _slender(L, cfg))
                l.width_mm = min(w, l.max_width_mm)
            nr = max(l.width_mm for l in leaves) / 2.0
            if abs(nr - R2g) < 1e-9:
                R2g = nr
                break
            R2g = nr
        root = _make_node((cx, cy), z_root, max(l.width_mm for l in leaves), next(cnt), A_tot,
                          label="raiz")
        for l in leaves:
            struts.append(Strut(l, root, l.width_mm))
        nodes = leaves + [root]
        all_nodes = list(nodes)
    else:
        nodes = list(leaves)
        all_nodes = list(leaves)
        while len(nodes) > 1:
            xy = np.array([n.xy for n in nodes], dtype=float)
            d = np.sqrt(((xy[:, None, :] - xy[None, :, :]) ** 2).sum(axis=2))
            zv = np.array([n.z for n in nodes])
            zc = np.maximum(zv[:, None], zv[None, :]) + d / (2.0 * tanT)
            np.fill_diagonal(zc, np.inf)
            flat = int(np.argmin(zc))
            i, j = divmod(flat, len(nodes))
            if i > j:
                i, j = j, i
            a, b = nodes[i], nodes[j]
            mid = ((a.xy[0] + b.xy[0]) / 2.0, (a.xy[1] + b.xy[1]) / 2.0)
            run_a = _dist(a.xy, mid)
            run_b = _dist(b.xy, mid)
            A_p = a.subtree_area_mm2 + b.subtree_area_mm2
            P_p = cfg.structural.press_force_n * A_p / A_tot
            P_a = cfg.structural.press_force_n * a.subtree_area_mm2 / A_tot
            P_b = cfg.structural.press_force_n * b.subtree_area_mm2 / A_tot
            z_p = max(a.z + run_a / tanT, b.z + run_b / tanT, h0)
            R2g = max(a.width_mm, b.width_mm) / 2.0
            for _ in range(8):
                z_p = max(z_p, _min_parent_z(run_a, a.z, a.width_mm / 2.0, R2g, theta),
                          _min_parent_z(run_b, b.z, b.width_mm / 2.0, R2g, theta))
                La = math.hypot(run_a, z_p - a.z)
                Lb = math.hypot(run_b, z_p - b.z)
                L_p = max(La, Lb)
                a.width_mm = min(max(a.width_mm, w_required(P_a, La, cfg), _slender(La, cfg)),
                                 a.max_width_mm)
                b.width_mm = min(max(b.width_mm, w_required(P_b, Lb, cfg), _slender(Lb, cfg)),
                                 b.max_width_mm)
                w_p = max(a.width_mm, b.width_mm, w_required(P_p, L_p, cfg), _slender(L_p, cfg))
                nr = w_p / 2.0
                if abs(nr - R2g) < 1e-9:
                    R2g = nr
                    break
                R2g = nr
            parent = _make_node(mid, z_p, w_p, next(cnt), A_p, label=f"fusion {len(struts)//2 + 1}")
            struts.append(Strut(a, parent, a.width_mm))
            struts.append(Strut(b, parent, b.width_mm))
            nodes = [nodes[k] for k in range(len(nodes)) if k not in (i, j)]
            nodes.append(parent)
            all_nodes.append(parent)
        root = nodes[0]

    if cfg.convergence.optimize and mode == "tree":
        for _ in range(3):
            _relax_tree(all_nodes, struts, root, cfg, theta, h0)
            if not _merge_close_nodes(all_nodes, struts, root, cfg.convergence.merge_eps_mm):
                break

    for _ in range(8):
        _cap_leaf_struts(struts, cfg)
        grew = _grow_widths_for_buckling(all_nodes, struts, cfg, A_tot)
        moved = _enforce_cone_overhang(all_nodes, struts, theta)
        if not grew and not moved:
            break
    _cap_leaf_struts(struts, cfg)
    tree = _finalize_tree(all_nodes, struts, root, mode, cfg, A_tot, log)
    log(f"  modo {mode}: nodos={len(all_nodes)} struts={len(struts)} altura_arbol={root.z:.1f} mm  "
        f"long={tree.total_length_mm:.0f} mm  mat={tree.total_material_mm3/1000:.1f} cm3  "
        f"margen_min={tree.min_margin:.2f}")
    return tree


def _strut_mesh(p0, p1, r0, r1, sections):
    """Tronco de cono (o cilindro si r0==r1) de p0 a p1."""
    v = p1 - p0
    L = float(np.linalg.norm(v))
    if L < 1e-9 or min(r0, r1) <= 0:
        return None
    n = max(3, int(sections))
    ang = np.linspace(0.0, 2.0 * PI, n, endpoint=False)
    bot = np.column_stack([r0 * np.cos(ang), r0 * np.sin(ang), np.zeros(n)])
    top = np.column_stack([r1 * np.cos(ang), r1 * np.sin(ang), np.full(n, L)])
    ib, it = 2 * n, 2 * n + 1
    verts = np.vstack([bot, top, np.array([[0.0, 0.0, 0.0]]), np.array([[0.0, 0.0, L]])])
    faces = []
    for i in range(n):
        j = (i + 1) % n
        faces.append([i, j, n + j])
        faces.append([i, n + j, n + i])
        faces.append([ib, j, i])
        faces.append([it, n + i, n + j])
    m = trimesh.Trimesh(vertices=verts, faces=np.array(faces), process=False)
    trimesh.repair.fix_normals(m)
    m.apply_transform(trimesh.geometry.align_vectors([0, 0, 1], v / L))
    m.apply_translation(p0)
    return m


def _tangent_cone(c, p, R1, R2):
    """Tronco de cono tangente a dos esferas (ver cono_truncado.md).

    Esfera pequena R1 en ``c``, esfera grande R2 en ``p``. El cono arranca en el ecuador de R1
    (radio R1 en el centro ``c``) y llega tangente a R2 en un punto a distancia ``h`` de ``c`` con
    radio ``r < R2``. Devuelve ``(p0, p1, r0, r1)`` para el tronco, o ``None`` si degenera.
    """
    c = np.asarray(c, float)
    p = np.asarray(p, float)
    v = p - c
    d = float(np.linalg.norm(v))
    if d < 1e-9 or R1 <= 0 or R2 <= 0:
        return None
    u = v / d
    R1 = min(R1, R2)
    denom = d * d - R2 * R2
    if denom <= 1e-9:
        return (c, p, R1, R2)
    S = math.sqrt(max(0.0, d * d + R2 * R2 - R1 * R1))
    m = (R2 * S - d * R1) / denom
    if m < 0.0:
        m = 0.0
    root = math.sqrt(1.0 + m * m)
    r = R2 / root
    h = d - R2 * m / root
    if h <= 1e-9:
        return (c, p, R1, R2)
    return (c, c + u * h, R1, r)


def build_struts_meshes(tree, cfg, log):
    sec = cfg.ribs.sections
    h0 = _effective_h0(cfg)
    parents = {id(s.parent) for s in tree.struts}
    out = []
    for s in tree.struts:
        c = np.array(s.child.xyz, float)
        p = np.array(s.parent.xyz, float)
        is_leaf = id(s.child) not in parents
        R1 = s.width_mm / 2.0
        R2 = s.parent.width_mm / 2.0
        geom = _tangent_cone(c, p, R1, R2)
        if geom is None:
            continue
        p0, p1, r0, r1 = geom
        if is_leaf:
            a, _ = _leaf_tilt(p, p0)
            if a is not None:
                ca = math.cos(a)
                delta = r0 * math.tan(a) + 0.02
                if ca > 1e-9:
                    delta = min(delta, max(0.0, (h0 - 0.05) / ca))
                if delta > 0:
                    dd = p - p0
                    dd = dd / max(float(np.linalg.norm(dd)), 1e-9)
                    p0 = p0 - dd * delta
        m = _strut_mesh(p0, p1, r0, r1, sec)
        if m is None:
            continue
        out.append(m)
    if out and not all(m.is_watertight for m in out):
        raise UserError("Strut no watertight (bug interno).")
    return out


def build_joints(tree, cfg, log):
    """Esfera en cada nudo interno (ni en la base ni en la boveda).

    Cada nervio es un tronco de cono que va de la esfera de su nodo hijo a la esfera de su nodo
    padre; asi los extremos quedan siempre dentro de una esfera y no hay tapas planas colgando.
    """
    children = {}
    for s in tree.struts:
        children.setdefault(id(s.parent), []).append(s)
    root = tree.root
    out = []
    done = set()
    for s in tree.struts:
        p = s.parent
        if id(p) == id(root) or id(p) in done:
            continue
        if not children.get(id(p)):
            continue
        done.add(id(p))
        R = p.width_mm / 2.0
        m = trimesh.creation.icosphere(subdivisions=2, radius=R)
        m.apply_translation([p.xy[0], p.xy[1], p.z])
        if p.z - R < -1e-6:
            big = max(4.0 * R, 100.0)
            box_m = trimesh.creation.box(extents=[big, big, big])
            box_m.apply_translation([p.xy[0], p.xy[1], big / 2.0])
            m = trimesh.boolean.intersection([m, box_m], engine="manifold")
            if m is None or len(m.faces) == 0:
                continue
        out.append(m)
    return out


# --- Etapa G — boveda ------------------------------------------------------

def _vault_base_points(shape, r, n):
    if shape == "ellipse" or r <= 0:
        t = np.linspace(0, 2 * PI, n, endpoint=False)
        return np.column_stack([r * np.cos(t), r * np.sin(t)])
    c = 0.35 * r
    p = box(-(r - c), -(r - c), (r - c), (r - c)).buffer(c, join_style=1)
    pts = np.array(p.exterior.coords[:-1])
    if len(pts) < 3:
        t = np.linspace(0, 2 * PI, n, endpoint=False)
        return np.column_stack([r * np.cos(t), r * np.sin(t)])
    return pts


def build_vault(root: Node, cfg: Config):
    theta = math.radians(max(5.0, cfg.convergence.max_overhang_deg - 1.5))
    tanT = math.tan(theta)
    r_min = max(root.width_mm / 2.0, cfg.part.min_wall_mm / 2.0)
    r1 = max(cfg.vault.footprint_mm / 2.0, math.sqrt(cfg.vault.top_area_mm2 / PI))
    r1 = max(r1, r_min * 1.05)
    base = _vault_base_points(cfg.vault.shape, r1, cfg.vault.n_sec)
    r_eff = max(r_min * 1.05, float(np.linalg.norm(base, axis=1).max()))
    z_apex = root.z - r_min / tanT
    H = z_apex + r_eff / tanT
    m = len(base)
    verts = [[root.xy[0], root.xy[1], z_apex]]
    rings = []
    for k in range(1, cfg.vault.n_rings + 1):
        f = k / cfg.vault.n_rings
        z = z_apex + f * (H - z_apex)
        start = len(verts)
        for pt in base:
            verts.append([root.xy[0] + pt[0] * f, root.xy[1] + pt[1] * f, z])
        rings.append((start, m))
    faces = []
    s0, _ = rings[0]
    for i in range(m):
        faces.append([0, s0 + i, s0 + (i + 1) % m])
    for k in range(len(rings) - 1):
        sA, _ = rings[k]
        sB, _ = rings[k + 1]
        for i in range(m):
            jj = (i + 1) % m
            faces.append([sA + i, sA + jj, sB + jj])
            faces.append([sA + i, sB + jj, sB + i])
    st, _ = rings[-1]
    cap_i = len(verts)
    verts.append([root.xy[0], root.xy[1], H])
    for i in range(m):
        faces.append([cap_i, st + i, st + (i + 1) % m])
    mesh = trimesh.Trimesh(vertices=np.array(verts, float), faces=np.array(faces, int), process=True)
    if mesh.volume < 0:
        mesh.invert()
    trimesh.repair.fix_normals(mesh)
    return mesh, H


# --- Etapa H — union -------------------------------------------------------

def union_all(meshes, log):
    meshes = [m for m in meshes if m is not None and len(m.faces) > 0]
    if not meshes:
        raise UserError("No hay geometria que unir.")
    log(f"  uniendo {len(meshes)} cuerpos...")
    try:
        out = trimesh.boolean.union(meshes, engine="manifold")
    except Exception as exc:
        log(f"  union en lote fallida ({exc}); incremental...")
        out = meshes[0]
        for m in meshes[1:]:
            out = trimesh.boolean.union([out, m], engine="manifold")
    if isinstance(out, (list, tuple)):
        out = trimesh.util.concatenate(out)
    if not out.is_watertight:
        out.merge_vertices()
        trimesh.repair.fix_normals(out)
    return out


# --- Etapa I — verificacion ------------------------------------------------

def verify(mesh, cfg, log) -> dict:
    rep = {"watertight": bool(mesh.is_watertight),
           "winding_consistent": bool(mesh.is_winding_consistent),
           "euler_number": int(mesh.euler_number)}
    try:
        parts = mesh.split(only_watertight=False)
        rep["body_count"] = len(parts)
    except Exception:
        rep["body_count"] = 1
    rep["volume_mm3"] = float(mesh.volume)
    rep["triangles"] = int(len(mesh.faces))
    rep["vertices"] = int(len(mesh.vertices))
    rep["grams"] = float(mesh.volume) / 1000.0 * PLA_DENSITY_G_CM3

    v = mesh.vertices
    zmin = float(v[:, 2].min())
    zmax = float(v[:, 2].max())
    rep["z_min"] = zmin
    rep["z_max"] = zmax

    normals = mesh.face_normals
    nz = normals[:, 2]
    downward = nz < -1e-6
    tri = mesh.triangles
    on_bed = np.all(tri[:, :, 2] < Z_TOL, axis=1)
    area = mesh.area_faces
    e0 = np.linalg.norm(tri[:, 0] - tri[:, 1], axis=1)
    e1 = np.linalg.norm(tri[:, 1] - tri[:, 2], axis=1)
    e2 = np.linalg.norm(tri[:, 2] - tri[:, 0], axis=1)
    perim = e0 + e1 + e2
    inradius = np.where(perim > 0, 2.0 * area / perim, 0.0)
    area_min = max(1e-3, (cfg.part.nozzle_mm / 2.0) ** 2)
    r_res = cfg.part.nozzle_mm / 2.0
    resolvable = (area >= area_min) & (inradius >= r_res)
    # Facetas degeneradas (area practicamente nula): las genera la union booleana en las costuras
    # entre cuerpos y no representan superficie imprimible alguna, por lo que se excluyen de las
    # estadisticas de voladizo (pero se cuentan y se informan aparte).
    degenerate = area < 1e-6
    dn = downward & ~on_bed & ~degenerate
    ang_all = np.where(dn, np.degrees(np.arccos(np.clip(nz, -1, 1))) - 90.0, 0.0)
    lim = cfg.convergence.max_overhang_deg + ANGLE_TOL
    exceed = dn & (ang_all > lim)
    micro_exceed = exceed & ~resolvable
    real_exceed = exceed & resolvable
    rep["overhang_area_min_mm2"] = area_min
    rep["overhang_resolving_radius_mm"] = r_res
    rep["overhang_degenerate_faces"] = int((degenerate & (downward & ~on_bed)).sum())
    rep["overhang_micro_faces"] = int(micro_exceed.sum())
    rep["overhang_micro_max"] = float(ang_all[micro_exceed].max()) if micro_exceed.any() else 0.0
    rep["overhang_max_all"] = float(ang_all[dn].max()) if dn.any() else 0.0
    sig = dn & resolvable
    if sig.any():
        ang = ang_all[sig]
        rep["overhang_max"] = float(ang.max())
        rep["overhang_p99"] = float(np.percentile(ang, 99))
        rep["overhang_faces_gt"] = int(real_exceed.sum())
        k = int(np.argmax(np.where(sig, ang_all, -999.0)))
        rep["overhang_at"] = mesh.triangles[k].mean(axis=0).tolist()
    else:
        rep["overhang_max"] = 0.0
        rep["overhang_p99"] = 0.0
        rep["overhang_faces_gt"] = int(real_exceed.sum())
    return rep


# --- Export + informe + PNGs -----------------------------------------------

def export_model(mesh, cfg, out_dir, base, log) -> str:
    if cfg.output.format == "3mf":
        path = os.path.join(out_dir, base + "_model.3mf")
        mesh.export(path, file_type="3mf")
    else:
        path = os.path.join(out_dir, base + "_model.stl")
        data = mesh.export(file_type="stl")
        with open(path, "wb") as fh:
            fh.write(data)
    log(f"  modelo -> {path}")
    return path


def _fmt_table(rows, headers):
    widths = [len(h) for h in headers]
    for r in rows:
        for i, c in enumerate(r):
            widths[i] = max(widths[i], len(str(c)))
    lines = ["  ".join(str(h).ljust(widths[i]) for i, h in enumerate(headers))]
    lines.append("  ".join("-" * widths[i] for i in range(len(headers))))
    for r in rows:
        lines.append("  ".join(str(c).ljust(widths[i]) for i, c in enumerate(r)))
    return "\n".join(lines)


def write_report(path, cfg, scale, mask_rep, poly_stats, islands, anchor_just, anchors, trees, tree,
                 verify_rep, H, warnings, log, mode_used):
    s = cfg.structural
    L = ["=" * 72, "INFORME vineteado.py", "=" * 72]
    if warnings:
        L.append("")
        L.append("AVISOS DE CONFIGURACION:")
        for w in warnings:
            L.append("  - " + w)
    L.append("")
    L.append("1. IMAGEN")
    L.append(f"  tamano: {mask_rep['img_shape'][1]} x {mask_rep['img_shape'][0]} px")
    L.append(f"  umbral: {mask_rep['threshold']:.1f} ({mask_rep['threshold_mode']})")
    L.append(f"  solido: {mask_rep['solid_pct']:.1f} %")
    L.append(f"  poros rellenados: {mask_rep.get('poros_rellenados_px', 0)} px")
    L.append("")
    L.append("2. MINIMO IMPRIMIBLE (politica: eliminar + avisar)")
    L.append(f"  min_wall = {cfg.part.min_wall_mm} mm (apertura r="
             f"{mask_rep.get('apertura_r_px', 0):.2f} px -> "
             f"{mask_rep.get('apertura_r_px_entero', 0)} px entero; ancho "
             f"garantizado >= {mask_rep.get('ancho_garantizado_mm', 0):.2f} mm)")
    L.append(f"  islas antes/despues: {mask_rep.get('islas_antes_apertura')} "
             f"-> {mask_rep.get('islas_despues_apertura')}")
    L.append(f"  area eliminada por apertura: "
             f"{mask_rep.get('area_antes_apertura_px', 0) - mask_rep.get('area_despues_apertura_px', 0)} px")
    L.append(f"  islas diminutas eliminadas: {mask_rep.get('islas_eliminadas_peq', 0)}"
             f" ({mask_rep.get('area_eliminada_peq_px', 0)} px)")
    if mask_rep.get("islas_eliminadas_post", 0):
        L.append(f"  fragmentos < area_min creados por la apertura y eliminados: "
                 f"{mask_rep['islas_eliminadas_post']} "
                 f"({mask_rep.get('area_eliminada_post_px', 0)} px)")
    if "grosor_min_mm_post" in mask_rep:
        L.append(f"  grosor solido resultante: min {mask_rep['grosor_min_mm_post']:.2f}, "
                 f"p5 {mask_rep['grosor_p5_mm_post']:.2f}, "
                 f"mediana {mask_rep['grosor_med_mm_post']:.2f} mm")
    if "hueco_min_mm" in mask_rep:
        L.append(f"  hueco (negro): min {mask_rep['hueco_min_mm']:.2f}, "
                 f"p5 {mask_rep['hueco_p5_mm']:.2f} mm; "
                 f"{mask_rep.get('huecos_bajo_min_pct', 0):.1f} % del esqueleto "
                 f"de huecos < min_slot ({cfg.part.min_slot_mm} mm) [solo aviso]")
    L.append("")
    L.append("3. ESCALA")
    L.append(f"  mm/px = {scale['mm_px']:.5f}")
    L.append(f"  pieza: {scale['width_mm']:.1f} x {scale['height_mm']:.1f} mm")
    L.append(f"  altura final H = {H:.1f} mm")
    L.append("")
    L.append("4. ISLAS Y ANCLAJES")
    L.append(f"  contornos: {poly_stats['n_contornos']} ({poly_stats['puntos_crudos']} pts crudos), "
             f"poligonos finales: {poly_stats['n_poligonos']}, vertices: {poly_stats['vertices']}")
    rows = [[isl.label, f"{isl.area_mm2:.1f}", f"{isl.elong:.2f}",
             f"{isl.min_thick_mm:.2f}/{isl.med_thick_mm:.2f}", jus["n"], f"{jus['width']:.2f}",
             jus["kind"]] for isl, jus in zip(islands, anchor_just)]
    L.append(_fmt_table(rows, ["isla", "area mm2", "elong", "grosor min/med", "n_ancl", "w mm",
                               "justificacion"]))
    L.append("")
    L.append("5. SUPUESTOS ESTRUCTURALES DECLARADOS (no FEA)")
    L.append(f"  caso: COMPRESION en la boveda, P = {s.press_force_n} N, FS = {s.safety_factor}")
    L.append(f"  E_PLA = {s.e_pla_mpa} MPa, K_efectivo = {s.k_effective}, "
             f"sigma_aplastamiento = {s.sigma_bearing_mpa} MPa")
    L.append(f"  reparto de carga por AREA de isla del subarbol.")
    L.append(f"  theta_max voladizo = {cfg.convergence.max_overhang_deg} deg, "
             f"w_min = {cfg.part.min_wall_mm} mm")
    L.append(f"  caso de despegue (peel): {'ACTIVADO' if s.peel_check else 'desactivado'}")
    L.append("  LIMITACION: modelo de dos fuerzas; ignora momentos de uniones")
    L.append("  rigidas y pandeo global; E en FDM es anisotropo. Es COTA INFERIOR.")
    L.append("")
    L.append("6. NERVIOS")
    if anchors:
        ws = [a.width_mm for a in anchors]
        L.append(f"  anclajes: {len(anchors)}; w min/med/max = "
                 f"{min(ws):.2f}/{np.median(ws):.2f}/{max(ws):.2f} mm")
    L.append(f"  altura vertical h0 = {_effective_h0(cfg):.2f} mm "
             f"(= max(espesor stencil, ribs.min_height_mm); "
             f"cilindro nunca mas alto que la base)")
    L.append("")
    L.append("7. ARBOL DE CONVERGENCIA (modo usado: %s)" % mode_used)
    L.append(f"  nodos: {len(tree.nodes)}, struts: {len(tree.struts)}")
    L.append(f"  altura del arbol (raiz): {tree.root.z:.1f} mm")
    L.append(f"  longitud total de nervios: {tree.total_length_mm:.0f} mm")
    L.append(f"  material de nervios: {tree.total_material_mm3/1000.0:.1f} cm3")
    L.append("  comparativa de modos:")
    for t in trees:
        L.append(f"    - {t.mode}: altura_raiz={t.root.z:.1f} mm, long={t.total_length_mm:.0f} mm, "
                 f"mat={t.total_material_mm3/1000.0:.1f} cm3, margen_min={t.min_margin:.2f}")
    L.append("")
    L.append("8. TABLA ESTRUCTURAL POR NODO (cota inferior)")
    rows = [[nd.label, f"{nd.xy[0]:.1f}", f"{nd.xy[1]:.1f}", f"{nd.z:.1f}", f"{nd.width_mm:.2f}",
             f"{nd.load_n:.2f}", f"{nd.p_cr_n:.2f}", f"{nd.p_tope_n:.2f}", f"{nd.margin:.2f}"]
            for nd in tree.nodes]
    L.append(_fmt_table(rows, ["nodo", "x", "y", "z", "w", "P_N", "P_cr", "P_tope", "margen"]))
    L.append("")
    L.append("9. BOVEDA")
    L.append(f"  forma {cfg.vault.shape}, huella {cfg.vault.footprint_mm} mm, "
             f"area superior objetivo {cfg.vault.top_area_mm2} mm2, cima z={H:.1f}")
    L.append("")
    L.append("10. VERIFICACION (trimesh)")
    L.append(f"  watertight: {verify_rep['watertight']}")
    L.append(f"  normales coherentes: {verify_rep['winding_consistent']}")
    L.append(f"  componentes conexas: {verify_rep['body_count']}")
    L.append(f"  Euler: {verify_rep['euler_number']}")
    L.append(f"  z_min = {verify_rep['z_min']:.4f} (debe ser ~0)  z_max = {verify_rep['z_max']:.2f}")
    L.append(f"  voladizo maximo (superficies resolubles): {verify_rep['overhang_max']:.2f} deg "
             f"(p99 {verify_rep['overhang_p99']:.2f}); "
             f"caras > limite: {verify_rep['overhang_faces_gt']}")
    if verify_rep.get("overhang_at"):
        a = verify_rep["overhang_at"]
        L.append(f"  voladizo max en ({a[0]:.1f}, {a[1]:.1f}, {a[2]:.1f})")
    L.append(f"  voladizo maximo global (incluye micro-facetas sub-boquilla, "
             f"excluye degeneradas): {verify_rep['overhang_max_all']:.2f} deg")
    L.append(f"  criterio de resolubilidad: area >= {verify_rep['overhang_area_min_mm2']:.4f} mm2 "
             f"y radio inscrito >= {verify_rep['overhang_resolving_radius_mm']:.2f} mm "
             f"(media boquilla)")
    L.append(f"  micro-facetas que superan el limite pero son sub-boquilla: "
             f"{verify_rep['overhang_micro_faces']} "
             f"(voladizo max {verify_rep['overhang_micro_max']:.2f} deg; "
             f"no imprimibles, artefactos de costura de la union booleana)")
    L.append(f"  facetas degeneradas (area ~0, no imprimibles, generadas por "
             f"la union): {verify_rep.get('overhang_degenerate_faces', 0)}")
    L.append("")
    L.append("11. MATERIAL")
    L.append(f"  volumen: {verify_rep['volume_mm3']/1000.0:.2f} cm3")
    L.append(f"  PLA (rho={PLA_DENSITY_G_CM3} g/cm3): {verify_rep['grams']:.1f} g")
    L.append(f"  triangulos: {verify_rep['triangles']} ({verify_rep['vertices']} vertices)")
    L.append("")
    L.append("=" * 72)
    text = "\n".join(L) + "\n"
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)
    log(f"  informe -> {path}")
    return text


# --- PNGs de inspeccion ----------------------------------------------------

def _new_canvas(size):
    img = Image.new("RGB", (size, size), (255, 255, 255))
    return img, ImageDraw.Draw(img)


def _transform(vals, bounds, size, margin=20, flip_y=True):
    (x0, y0, x1, y1) = bounds
    w = max(x1 - x0, 1e-9)
    h = max(y1 - y0, 1e-9)
    s = (size - 2 * margin) / max(w, h)
    pts = (np.asarray(vals) - np.array([x0, y0])) * s + margin
    if flip_y:
        pts[:, 1] = size - pts[:, 1]
    return pts


def png_top(mask, scale, anchors, tree, vault_footprint, path, size, mm_px):
    H = scale["H_px"]
    W = scale["W_px"]
    img = Image.new("RGB", (W, H), (255, 255, 255))
    px = img.load()
    ys, xs = np.nonzero(mask)
    for y, x in zip(ys, xs):
        px[x, y] = (60, 60, 60)
    d = ImageDraw.Draw(img)
    colors = {"cobertura": (0, 170, 0)}
    for a in anchors:
        c = colors.get(a.kind, (0, 170, 0))
        r_px = max(2.0, (a.width_mm / 2.0) / mm_px)
        d.ellipse([a.col - r_px, a.row - r_px, a.col + r_px, a.row + r_px], fill=c)
    if tree is not None:
        for s in tree.struts:
            x0 = s.child.xy[0] / mm_px
            y0 = H - 1 - s.child.xy[1] / mm_px
            x1 = s.parent.xy[0] / mm_px
            y1 = H - 1 - s.parent.xy[1] / mm_px
            d.line([x0, y0, x1, y1], fill=(255, 140, 0), width=1)
        rx = tree.root.xy[0] / mm_px
        ry = H - 1 - tree.root.xy[1] / mm_px
        d.ellipse([rx - 4, ry - 4, rx + 4, ry + 4], outline=(200, 0, 200), width=2)
    if vault_footprint:
        fx, fy, r = vault_footprint
        cx = fx / mm_px
        cy = H - 1 - fy / mm_px
        rr = r / mm_px
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=(200, 0, 200), width=2)
    img.save(path)


def png_silhouette(mesh, axes, path, size):
    tris = mesh.triangles[:, :, axes]
    flat = tris.reshape(-1, 2)
    bounds = (flat[:, 0].min(), flat[:, 1].min(), flat[:, 0].max(), flat[:, 1].max())
    img, d = _new_canvas(size)
    pts = _transform(flat, bounds, size).reshape(-1, 3, 2)
    for tri in pts:
        d.polygon([tuple(p) for p in tri], fill=(70, 70, 70))
    img.save(path)


def _draw_path_section(path3d, d, bounds, size, color):
    for entity in path3d.entities:
        try:
            pts = entity.discrete(path3d.vertices)[:, :2]
        except Exception:
            continue
        if len(pts) < 2:
            continue
        p = _transform(pts, bounds, size)
        d.line([tuple(q) for q in p], fill=color, width=1, joint="curve")


def png_sections(mesh, scale, path_dir, size, log):
    lo = mesh.bounds[0]
    hi = mesh.bounds[1]
    levels = [scale["mm_px"] * 0.5, scale["mm_px"] * 1.5, hi[2] * 0.25, hi[2] * 0.5, hi[2] * 0.75,
              hi[2] - 0.2]
    for z in levels:
        if z <= 0 or z >= hi[2]:
            continue
        try:
            sec = mesh.section(plane_origin=[0, 0, z], plane_normal=[0, 0, 1])
        except Exception:
            continue
        if sec is None:
            continue
        img, d = _new_canvas(size)
        _draw_path_section(sec, d, (lo[0], lo[1], hi[0], hi[1]), size, (20, 20, 20))
        img.save(os.path.join(path_dir, f"corte_z_{z:.1f}mm.png"))
    cx = (lo[0] + hi[0]) / 2.0
    cy = (lo[1] + hi[1]) / 2.0
    for axis, name in ((0, "x"), (1, "y")):
        origin = [0, 0, 0]
        origin[axis] = cx if axis == 0 else cy
        normal = [0, 0, 0]
        normal[axis] = 1
        try:
            sec = mesh.section(plane_origin=origin, plane_normal=normal)
        except Exception:
            continue
        if sec is None:
            continue
        img, d = _new_canvas(size)
        bounds = (lo[1], lo[2], hi[1], hi[2]) if axis == 0 else (lo[0], lo[2], hi[0], hi[2])
        _draw_path_section(sec, d, bounds, size, (20, 20, 20))
        img.save(os.path.join(path_dir, f"corte_vertical_{name}.png"))


# --- Pipeline --------------------------------------------------------------

def run(config_path, image_path, out_dir, only_analysis=False, mode_override=None, log=print):
    cfg = load_config(config_path)
    warnings = cfg.raw.pop("_warnings", [])
    for w in warnings:
        log("  AVISO: " + w)
    os.makedirs(out_dir, exist_ok=True)
    base = os.path.splitext(os.path.basename(image_path))[0]

    log("[A] imagen -> mascara")
    gray = load_gray(image_path)
    H, W = gray.shape
    mm_px_pre = cfg.part.width_cm * 10.0 / W
    mask, mask_rep = binarize_and_clean(gray, cfg, mm_px_pre, log)
    if not mask.any():
        raise UserError("La mascara esta vacia tras umbral y limpieza "
                        "(imagen toda hueco o detalles bajo el minimo).")
    scale = compute_scale(gray, cfg)
    mm_px = scale["mm_px"]

    log("[B] contornos/poligonos")
    polygons, poly_stats = extract_polygons(mask, scale, cfg, log)
    if not polygons:
        raise UserError("No se genero ningun poligono.")

    log("[C] analisis de islas")
    islands = analyze_islands(mask, scale, cfg, log)
    islands_by_label = {i.label: i for i in islands}
    if not islands:
        raise UserError("No hay islas tras la limpieza.")

    log("[D] anclajes")
    anchors, anchor_just, w_by_label, rib_paths = select_anchors(mask, islands, scale, cfg, log)

    if only_analysis:
        _analysis_report(out_dir, base, cfg, scale, mask_rep, poly_stats, islands, anchor_just,
                         anchors, warnings, log)
        png_top(mask, scale, anchors, None, None, os.path.join(out_dir, base + "_top.png"),
                cfg.output.png_size_px, mm_px)
        return

    log("[E] placa / marco")
    plate = build_plate(polygons, cfg, log)
    frame = build_frame(polygons, scale, cfg, log)

    log("[F] convergencia")
    mode = mode_override or cfg.convergence.mode
    trees = []
    for m in ("tree", "fan"):
        trees.append(build_tree(anchors, islands_by_label, cfg, m, log))
    tree = next(t for t in trees if t.mode == mode)
    risers = build_risers(anchors, cfg, tree)
    log(f"  placa={len(plate)} risers={len(risers)} marco={len(frame)}")
    strut_meshes = build_struts_meshes(tree, cfg, log)
    joint_meshes = build_joints(tree, cfg, log)

    log("[G] boveda")
    vault_mesh, H_final = build_vault(tree.root, cfg)
    log(f"  boveda: cima z={H_final:.1f} mm")

    log("[H] union")
    all_meshes = plate + risers + strut_meshes + joint_meshes + frame + [vault_mesh]
    mesh = union_all(all_meshes, log)

    log("[I] verificacion")
    verify_rep = verify(mesh, cfg, log)
    log(f"  watertight={verify_rep['watertight']} componentes={verify_rep['body_count']} "
        f"voladizo_max={verify_rep['overhang_max']:.2f} deg triangulos={verify_rep['triangles']}")
    if verify_rep["body_count"] != 1:
        raise UserError(f"FALLO: el modelo tiene {verify_rep['body_count']} componentes "
                        f"(debe ser 1).")
    if verify_rep["overhang_faces_gt"] > 0:
        msg = (f"AVISO: {verify_rep['overhang_faces_gt']} caras superan theta_max; voladizo max "
               f"{verify_rep['overhang_max']:.1f} deg")
        log("  " + msg)
        warnings.append(msg)
        if cfg.output.strict:
            raise UserError(msg)

    log("[J] export")
    model_path = export_model(mesh, cfg, out_dir, base, log)

    if cfg.output.report:
        write_report(os.path.join(out_dir, base + "_informe.txt"), cfg, scale, mask_rep, poly_stats,
                     islands, anchor_just, anchors, trees, tree, verify_rep, H_final, warnings, log, mode)

    if cfg.output.inspection_pngs:
        pdir = os.path.join(out_dir, base + "_inspeccion")
        os.makedirs(pdir, exist_ok=True)
        png_top(mask, scale, anchors, tree,
                (tree.root.xy[0], tree.root.xy[1],
                 max(cfg.vault.footprint_mm / 2.0, math.sqrt(cfg.vault.top_area_mm2 / PI))),
                os.path.join(pdir, "proyeccion_superior.png"), cfg.output.png_size_px, mm_px)
        png_silhouette(mesh, [0, 2], os.path.join(pdir, "proyeccion_frente.png"), cfg.output.png_size_px)
        png_silhouette(mesh, [1, 2], os.path.join(pdir, "proyeccion_lado.png"), cfg.output.png_size_px)
        png_sections(mesh, scale, pdir, cfg.output.png_size_px, log)
        log(f"  PNGs -> {pdir}")
    return mesh


def _analysis_report(out_dir, base, cfg, scale, mask_rep, poly_stats, islands, anchor_just, anchors,
                     warnings, log):
    L = ["INFORME (solo analisis)", "=" * 60, ""]
    for w in warnings:
        L.append("AVISO: " + w)
    L.append(f"imagen {mask_rep['img_shape'][1]}x{mask_rep['img_shape'][0]} "
             f"umbral {mask_rep['threshold']:.1f} solido {mask_rep['solid_pct']:.1f}%")
    L.append(f"escala {scale['mm_px']:.5f} mm/px  pieza "
             f"{scale['width_mm']:.1f}x{scale['height_mm']:.1f} mm")
    L.append(f"islas {len(islands)} anclajes {len(anchors)}")
    L.append(f"poligonos {poly_stats['n_poligonos']} vertices {poly_stats['vertices']}")
    rows = [[j["label"], f"{j['area']:.1f}", f"{j['elong']:.2f}", j["n"], f"{j['width']:.2f}",
             j["kind"]] for j in anchor_just]
    L.append(_fmt_table(rows, ["isla", "area", "elong", "n", "w", "tipo"]))
    txt = "\n".join(L) + "\n"
    p = os.path.join(out_dir, base + "_informe.txt")
    with open(p, "w", encoding="utf-8") as fh:
        fh.write(txt)
    log(f"  informe -> {p}")


# --- CLI -------------------------------------------------------------------

def main(argv=None):
    p = argparse.ArgumentParser(
        description="Genera un stencil de spray imprimible a partir de una imagen B/N.")
    p.add_argument("config", nargs="?", help="fichero YAML de configuracion")
    p.add_argument("image", nargs="?", help="imagen PNG/JPG B/N")
    p.add_argument("--example-config", action="store_true",
                   help="vuelca un YAML de ejemplo comentado y sale")
    p.add_argument("--out-dir", default=".", help="directorio de salida")
    p.add_argument("--only-analysis", action="store_true",
                   help="solo Etapas A-D: informe y PNG, sin malla")
    p.add_argument("--mode", choices=["tree", "fan"], help="fuerza el modo de convergencia")
    args = p.parse_args(argv)

    if args.example_config:
        print(EXAMPLE_CONFIG)
        return 0
    if not args.config or not args.image:
        p.error("Se requieren <config.yaml> e <image.png> (o usa --example-config).")
    try:
        run(args.config, args.image, args.out_dir, only_analysis=args.only_analysis,
            mode_override=args.mode)
    except UserError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
```
