---
layout: post
title: Blender Cut Disk Tool
author: josejuan
categories: tools
---

A la hora de preparar piezas para imprimir, es habitual tener que trocearlas
para que quepan adecuadamente en la cama de la impresora o por cuestiones de
reducción u optimización de soportes.

Sin embargo y sorprendentemente, todas las herramientas a mi alcance son toscas
torpes y con un control nulo o inexistente sobre el corte. Por ejemplo en *Prusa Slicer*,
debes hacer un corte completo sobre un plano y la forma de elegir el plano es
girándolo y moviéndolo lo que hace muy difícil el ajuste e imposible de usar en
cortes complejos.

Así que hice el siguiente plugin que funciona en *Blender 5.0*.

## El problema

A veces tenemos piezas complejas que hay que cortar en formas simples con control total, en las que hay brazos largos
y bucles que nos interesa cortar de cierta forma.

![blender_cut_1.png](/images/blender_cut_1.png)

## La solución

Obligar al usuario a definir un plano o rotarlo y moverlo es un engorro. En su lugar, este addon permite definir un corte
a partir de la propia superficie local en la que queremos hacer el corte. Básicamente nos permite definir cómodamente
un _"disco de corte"_ en el que además le podemos definir cierto grosor de holgura y un machihembrado.

Para definir los puntos simplemente rodeamos más o menos la zona que queremos cortar. Sobre esos puntos se creará el
_convex hull_ que definirá el disco de corte y ya está.

![blender_cut_1.png](/images/blender_cut_2.png)

Nos habrá creado una nueva pieza (el disco de corte con o sin machihembrado) en que, por ejemplo, puede haber muy cerca
otras partes de la geometría (los cuernos del dragón) que no afectan al corte ni se ven afectados por él.

![blender_cut_1.png](/images/blender_cut_3.png)

Con esa pieza simplemente hacemos un booleano de resta (_difference_) sobre la pieza original y listo.

![blender_cut_1.png](/images/blender_cut_4.png)

Ya tenemos la geometría separada, con holgura para el grosor del PLA (u otro material) y con un machihembrado que nos
permite unir las piezas fácilmente.

![blender_cut_1.png](/images/blender_cut_5.png)

## El script

Sin más el script del addon, revisa que es seguro, guárdalo en un fichero e instálalo en _Blender_.

```python
bl_info = {
    "name": "Cut Disk Tool (Verts + Breadcrumbs + Hat + Remesh)",
    "author": "Jose",
    "version": (1, 6, 2),
    "blender": (5, 0, 0),
    "location": "View3D > Sidebar (N) > Cut Disk",
    "category": "Mesh",
}

import bpy
import bmesh
import json
from math import atan2, sqrt
from mathutils import Vector
from bpy.props import FloatProperty, StringProperty, BoolProperty, IntProperty
from bpy_extras import view3d_utils

import gpu
from gpu_extras.batch import batch_for_shader

EPS = 1e-9


# -----------------------------
# Utils
# -----------------------------
def _normalize(v: Vector) -> Vector:
    l = v.length
    return v if l < EPS else (v / l)


def _best_fit_normal(points_world):
    """Normal por PCA (signo arbitrario) con fallback."""
    try:
        import numpy as np
        P = np.array([[p.x, p.y, p.z] for p in points_world], dtype=float)
        M = P.mean(axis=0)
        X = P - M
        cov = X.T @ X
        w, vecs = np.linalg.eigh(cov)
        n = vecs[:, 0]
        return _normalize(Vector((float(n[0]), float(n[1]), float(n[2]))))
    except Exception:
        M = sum(points_world, Vector()) / len(points_world)
        n = Vector()
        for i in range(len(points_world)):
            a = points_world[i] - M
            b = points_world[(i + 1) % len(points_world)] - M
            n += a.cross(b)
        if n.length < EPS:
            n = Vector((0, 0, 1))
        return _normalize(n)


def _stabilize_normal_sign(n: Vector) -> Vector:
    ax, ay, az = abs(n.x), abs(n.y), abs(n.z)
    if ax >= ay and ax >= az:
        return n if n.x >= 0 else -n
    if ay >= ax and ay >= az:
        return n if n.y >= 0 else -n
    return n if n.z >= 0 else -n


def _make_plane_basis(n: Vector):
    up = Vector((0, 0, 1)) if abs(n.z) < 0.9 else Vector((0, 1, 0))
    u = _normalize(up.cross(n))
    if u.length < EPS:
        u = _normalize(Vector((1, 0, 0)).cross(n))
    v = _normalize(n.cross(u))
    return u, v


def _dedupe_consecutive(points, tol=1e-6):
    out = []
    for p in points:
        if not out or (p - out[-1]).length > tol:
            out.append(p)
    if len(out) >= 3 and (out[0] - out[-1]).length <= tol:
        out.pop()
    return out


def _points_to_json(points_world):
    return json.dumps([[p.x, p.y, p.z] for p in points_world])


def _points_from_json(s):
    if not s:
        return []
    arr = json.loads(s)
    return [Vector((float(x), float(y), float(z))) for x, y, z in arr]


def _get_window_region(context):
    for r in context.area.regions:
        if r.type == 'WINDOW':
            return r
    return None


def _mouse_to_window_region_xy(context, event):
    region = _get_window_region(context)
    if region is None:
        return None, None, None
    rx = event.mouse_x - region.x
    ry = event.mouse_y - region.y
    if rx < 0 or ry < 0 or rx >= region.width or ry >= region.height:
        return None, None, None
    return region, int(rx), int(ry)


def _raycast_active_object_world(context, region, mx, my):
    obj = context.active_object
    if not obj or obj.type != "MESH":
        return None

    rv3d = context.space_data.region_3d
    origin = view3d_utils.region_2d_to_origin_3d(region, rv3d, (mx, my))
    direction = view3d_utils.region_2d_to_vector_3d(region, rv3d, (mx, my)).normalized()

    depsgraph = context.evaluated_depsgraph_get()
    ok, loc, normal, face_index, hit_obj, _ = context.scene.ray_cast(depsgraph, origin, direction, distance=1.0e18)
    if not ok or hit_obj is None:
        return None

    try:
        if hit_obj.original != obj:
            return None
    except Exception:
        if hit_obj.name != obj.name:
            return None

    return loc.copy()


def _set_active(context, obj):
    vl = context.view_layer
    vl.objects.active = obj
    for o in vl.objects:
        o.select_set(False)
    obj.select_set(True)


def _apply_boolean(context, target_obj, cutter_obj, operation: str):
    mod = target_obj.modifiers.new(name=f"__BOOL_{operation}", type='BOOLEAN')
    mod.operation = operation
    mod.solver = 'EXACT'
    mod.object = cutter_obj
    _set_active(context, target_obj)
    bpy.ops.object.modifier_apply(modifier=mod.name)


def _apply_remesh_sharp(context, obj, octree_depth: int, scale: float):
    """
    Remesh SHARP para hacer el sólido más “watertight” antes del boolean.
    """
    if obj is None or obj.type != 'MESH':
        return
    mod = obj.modifiers.new(name="__REMESH_SHARP", type='REMESH')
    # API típica de Blender: mode SHARP
    if hasattr(mod, "mode"):
        mod.mode = 'SHARP'
    if hasattr(mod, "octree_depth"):
        mod.octree_depth = int(octree_depth)
    if hasattr(mod, "scale"):
        mod.scale = float(scale)
    # algunas builds tienen sharpness, otras no
    if hasattr(mod, "sharpness"):
        mod.sharpness = 1.0

    _set_active(context, obj)
    bpy.ops.object.modifier_apply(modifier=mod.name)


def _delete_object(obj):
    if obj is None:
        return
    if obj.name not in bpy.data.objects:
        return
    mesh = obj.data
    bpy.data.objects.remove(obj, do_unlink=True)
    if mesh and mesh.users == 0:
        bpy.data.meshes.remove(mesh)


# -----------------------------
# Geometry builders
# -----------------------------
def _create_extruded_polygon_object(context, name, poly3_world, M, n, thickness):
    me = bpy.data.meshes.new(name + "_Mesh")
    me.from_pydata([tuple(p) for p in poly3_world], [], [list(range(len(poly3_world)))])
    me.update()

    obj = bpy.data.objects.new(name, me)
    context.collection.objects.link(obj)

    bm2 = bmesh.new()
    bm2.from_mesh(me)
    bm2.faces.ensure_lookup_table()
    if not bm2.faces:
        bm2.free()
        raise RuntimeError("No se creó la cara del disco (polígono degenerado).")

    face = bm2.faces[0]
    res = bmesh.ops.extrude_face_region(bm2, geom=[face])
    extruded_verts = [e for e in res["geom"] if isinstance(e, bmesh.types.BMVert)]

    bmesh.ops.translate(bm2, verts=extruded_verts, vec=n * thickness)
    bmesh.ops.translate(bm2, verts=list(bm2.verts), vec=-n * (thickness * 0.5))
    bmesh.ops.recalc_face_normals(bm2, faces=list(bm2.faces))

    bm2.to_mesh(me)
    bm2.free()
    return obj


def _create_box_prism(context, name, u, v, size_u, size_v, height, base_on_plane_world, height_dir_world):
    hu = size_u * 0.5
    hv = size_v * 0.5

    b0 = base_on_plane_world + u * (-hu) + v * (-hv)
    b1 = base_on_plane_world + u * ( hu) + v * (-hv)
    b2 = base_on_plane_world + u * ( hu) + v * ( hv)
    b3 = base_on_plane_world + u * (-hu) + v * ( hv)

    top_off = _normalize(height_dir_world) * height
    t0 = b0 + top_off
    t1 = b1 + top_off
    t2 = b2 + top_off
    t3 = b3 + top_off

    verts = [b0, b1, b2, b3, t0, t1, t2, t3]
    faces = [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [0, 1, 5, 4],
        [1, 2, 6, 5],
        [2, 3, 7, 6],
        [3, 0, 4, 7],
    ]

    me = bpy.data.meshes.new(name + "_Mesh")
    me.from_pydata([tuple(p) for p in verts], [], faces)
    me.update()

    obj = bpy.data.objects.new(name, me)
    context.collection.objects.link(obj)
    return obj


def _convex_hull_2d(points_xy):
    """
    Devuelve el convex hull (CCW) usando monotonic chain.
    points_xy: iterable de (x,y)
    """
    pts = list(points_xy)
    # Dedupe exacta
    uniq = []
    seen = set()
    for x, y in pts:
        k = (float(x), float(y))
        if k in seen:
            continue
        seen.add(k)
        uniq.append(k)
    if len(uniq) < 3:
        return uniq

    uniq.sort()  # (x,y)

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower = []
    for p in uniq:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0.0:
            lower.pop()
        lower.append(p)

    upper = []
    for p in reversed(uniq):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0.0:
            upper.pop()
        upper.append(p)

    hull = lower[:-1] + upper[:-1]
    return hull


def _create_mesh_object_from_bmesh(context, name: str, bm: bmesh.types.BMesh):
    me = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(me)
    bm.free()
    me.update()
    obj = bpy.data.objects.new(name, me)
    context.collection.objects.link(obj)
    return obj


def _bm_add_tri(bm, v1, v2, v3, desired_normal: Vector):
    # Crea triángulo, corrigiendo winding según desired_normal.
    p1, p2, p3 = v1.co, v2.co, v3.co
    n = (p2 - p1).cross(p3 - p1)
    if n.dot(desired_normal) < 0.0:
        v2, v3 = v3, v2
    try:
        bm.faces.new((v1, v2, v3))
    except ValueError:
        # Cara duplicada o degenerada: ignorar.
        pass


def _bm_add_quad_as_tris(bm, a, b, c, d, desired_normal: Vector):
    # Quad (a,b,c,d) en ese orden, partido en dos triángulos.
    _bm_add_tri(bm, a, b, c, desired_normal)
    _bm_add_tri(bm, a, c, d, desired_normal)


def _quad_corner_order_and_label_fn(view_dir: Vector, n_ref: Vector):
    """
    Para un cuadrilátero axis-aligned (u,v) centrado en 0,
    devuelve:
      - order: lista de índices de corners en orden CCW visto desde view_dir
      - label_fn(x,y)-> idx corner más "natural" (por cuadrantes) consistente con ese orden
    Corners base en 2D:
      A: (+,+)
      B: (-,+)
      C: (-,-)
      D: (+,-)
    """
    ccw = (view_dir.dot(n_ref) >= 0.0)
    if ccw:
        # A,B,C,D
        order = (0, 1, 2, 3)

        def label_fn(x, y):
            if x >= 0.0 and y >= 0.0:
                return 0  # A
            if x < 0.0 and y >= 0.0:
                return 1  # B
            if x < 0.0 and y < 0.0:
                return 2  # C
            return 3      # D
    else:
        # CW en 2D para que sea CCW visto desde -n: A,D,C,B
        order = (0, 3, 2, 1)

        def label_fn(x, y):
            if x >= 0.0 and y >= 0.0:
                return 0  # A
            if x >= 0.0 and y < 0.0:
                return 1  # D (pero en esta permutación es idx=1)
            if x < 0.0 and y < 0.0:
                return 2  # C
            return 3      # B

    return order, label_fn


def _triangulate_ring_outer_to_inner_quad(bm, *, outer_verts, outer_xy, inner_verts, inner_xy, outward: Vector, n_ref: Vector):
    """
    Triangula una "corona" convexa entre un outer loop (convexo) y un inner loop cuadrilateral,
    usando el esquema por cuadrantes (equivalente a 'más cercano' en la práctica).
    outer_xy debe estar en CCW en 2D respecto a +n_ref.
    outward es la normal exterior deseada de la cara (±d).
    """
    if len(outer_verts) != len(outer_xy):
        raise RuntimeError("outer_verts/outer_xy desalineados.")

    order, label_fn = _quad_corner_order_and_label_fn(outward, n_ref)

    # Reordenar outer para que sea CCW visto desde outward
    outer_idx = list(range(len(outer_xy)))
    if outward.dot(n_ref) < 0.0:
        outer_idx.reverse()

    # Inner verts en orden CCW visto desde outward
    inner_ord = [inner_verts[i] for i in order]
    inner_xy_ord = [inner_xy[i] for i in order]

    # Labels por cuadrantes (consistentes con inner_ord)
    labels = []
    for i in outer_idx:
        x, y = outer_xy[i]
        labels.append(label_fn(x, y))

    # Triangulación (buffer circular)
    m = len(outer_idx)
    for t in range(m):
        i = outer_idx[t]
        j = outer_idx[(t + 1) % m]
        ki = labels[t]
        kj = labels[(t + 1) % m]

        vi = outer_verts[i]
        vj = outer_verts[j]

        if ki == kj:
            _bm_add_tri(bm, inner_ord[ki], vi, vj, outward)
        else:
            # puente entre corners adyacentes
            _bm_add_tri(bm, inner_ord[ki], vi, inner_ord[kj], outward)
            _bm_add_tri(bm, inner_ord[kj], vi, vj, outward)


def _create_disk_hat_direct(context, *,
                            name: str,
                            hull_xy,  # CCW en 2D respecto a +n
                            M: Vector,
                            n: Vector,
                            u: Vector,
                            v: Vector,
                            thickness: float,
                            L: float,
                            hat_on_positive_side: bool):
    """
    Construcción determinista, sin booleans:
      - Disco convexo (hull) extruido thickness centrado en M
      - Sombrero: cubo (solo caras exteriores) emergiendo desde la tapa "d"
      - Hueco interno: prisma rectangular (caras internas) abierto por la tapa contraria
    """
    H = thickness
    d = n if hat_on_positive_side else -n

    if L <= 2.0 * H + 1e-12:
        # Sin sombrero: cae a disco simple.
        poly3 = [M + u * x + v * y for x, y in hull_xy]
        return _create_extruded_polygon_object(context, name, poly3, M, n, H)

    side_inner = L - 2.0 * H
    if side_inner <= 0.0 + 1e-12:
        poly3 = [M + u * x + v * y for x, y in hull_xy]
        return _create_extruded_polygon_object(context, name, poly3, M, n, H)

    # Planos en d
    z0 = M - 0.5 * H * d          # tapa contraria al sombrero (apertura hueco)
    z1 = M + 0.5 * H * d          # tapa hacia donde sale el sombrero (emerge cubo)
    z2 = z0 + (L - H) * d         # techo interior (cara inferior del techo)
    z3 = z0 + L * d               # tapa superior del cubo

    # Outer hull verts (en ambos planos del disco)
    outer_xy = list(hull_xy)
    N = len(outer_xy)
    bm = bmesh.new()

    outer0 = []
    outer1 = []
    for x, y in outer_xy:
        outer0.append(bm.verts.new(z0 + u * x + v * y))
        outer1.append(bm.verts.new(z1 + u * x + v * y))

    # Square (cubo) corners en z1 y z3
    hL = 0.5 * L
    # A(+,+), B(-,+), C(-,-), D(+,-)
    sq2d = [(+hL, +hL), (-hL, +hL), (-hL, -hL), (+hL, -hL)]
    square1 = [bm.verts.new(z1 + u * x + v * y) for x, y in sq2d]
    square3 = [bm.verts.new(z3 + u * x + v * y) for x, y in sq2d]

    # Rect (hueco) corners en z0 y z2
    hI = 0.5 * side_inner
    rc2d = [(+hI, +hI), (-hI, +hI), (-hI, -hI), (+hI, -hI)]
    rect0 = [bm.verts.new(z0 + u * x + v * y) for x, y in rc2d]
    rect2 = [bm.verts.new(z2 + u * x + v * y) for x, y in rc2d]

    bm.verts.ensure_lookup_table()

    # ---- Caras exteriores del disco ----

    # Paredes exteriores (hull) entre z0 y z1
    for i in range(N):
        j = (i + 1) % N
        a, b, c, ddd = outer0[i], outer0[j], outer1[j], outer1[i]
        # Normal aproximada radial hacia fuera
        mid = (a.co + b.co + c.co + ddd.co) * 0.25
        radial = (mid - M) - n * ((mid - M).dot(n))
        desired = radial.normalized() if radial.length > EPS else Vector((0, 0, 0))
        _bm_add_quad_as_tris(bm, a, b, c, ddd, desired)

    # Tapa inferior (z0): hull con agujero rect0, outward = -d
    _triangulate_ring_outer_to_inner_quad(
        bm,
        outer_verts=outer0,
        outer_xy=outer_xy,
        inner_verts=rect0,
        inner_xy=rc2d,
        outward=-d,
        n_ref=n
    )

    # Tapa superior del disco (z1): hull con agujero square1, outward = +d
    _triangulate_ring_outer_to_inner_quad(
        bm,
        outer_verts=outer1,
        outer_xy=outer_xy,
        inner_verts=square1,
        inner_xy=sq2d,
        outward=+d,
        n_ref=n
    )

    # ---- Caras exteriores del cubo (sombrero) ----

    # Paredes del cubo desde z1 hasta z3 (4 caras)
    for i in range(4):
        j = (i + 1) % 4
        a, b, c, ddd = square1[i], square1[j], square3[j], square3[i]
        mid = (a.co + b.co + c.co + ddd.co) * 0.25
        radial = (mid - M) - n * ((mid - M).dot(n))
        desired = radial.normalized() if radial.length > EPS else Vector((0, 0, 0))
        _bm_add_quad_as_tris(bm, a, b, c, ddd, desired)

    # Tapa superior del cubo (z3): square3, outward = +d
    _bm_add_quad_as_tris(bm, square3[0], square3[1], square3[2], square3[3], +d)

    # ---- Caras internas del hueco rectangular ----

    # Paredes internas (4 caras) desde z0 hasta z2: normales hacia el interior del hueco
    for i in range(4):
        j = (i + 1) % 4
        # OJO: para que la normal apunte hacia dentro del hueco, invertimos el quad.
        a, b, c, ddd = rect0[j], rect0[i], rect2[i], rect2[j]
        mid = (a.co + b.co + c.co + ddd.co) * 0.25
        radial_in = (M - mid) - n * ((M - mid).dot(n))
        desired = radial_in.normalized() if radial_in.length > EPS else Vector((0, 0, 0))
        _bm_add_quad_as_tris(bm, a, b, c, ddd, desired)

    # Techo del hueco (cara "inferior" del techo), en z2: rect2, outward hacia el hueco = -d
    _bm_add_quad_as_tris(bm, rect2[0], rect2[1], rect2[2], rect2[3], -d)

    # Normales coherentes
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

    return _create_mesh_object_from_bmesh(context, name, bm)



def _scale_object_mesh_in_plane(obj, M, u, v, n, scale_in_plane: float):
    if abs(scale_in_plane - 1.0) < 1e-12:
        return
    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    for vert in bm.verts:
        p = Vector(vert.co)
        d = p - M
        cu = d.dot(u)
        cv = d.dot(v)
        cn = d.dot(n)
        vert.co = M + u * (cu * scale_in_plane) + v * (cv * scale_in_plane) + n * cn
    bm.to_mesh(me)
    bm.free()
    me.update()


# -----------------------------
# Core: create cutter from points (with hat)
# -----------------------------
def create_cut_disk_from_points(context, *,
                                points_world,
                                thickness: float,
                                scale_in_plane: float,
                                obj_name: str,
                                show_in_front: bool,
                                wire: bool,
                                order_mode: str,
                                make_hat: bool,
                                hat_square_ratio: float,
                                hat_on_positive_side: bool,
                                remesh_before_boolean: bool,
                                remesh_octree_depth: int,
                                remesh_scale: float):

    if len(points_world) < 3:
        raise RuntimeError("Necesitas al menos 3 puntos.")

    pts = _dedupe_consecutive(points_world)
    if len(pts) < 3:
        raise RuntimeError("Tras limpiar puntos repetidos, no queda polígono válido.")

    M = sum(pts, Vector()) / len(pts)

    n = _best_fit_normal(pts)
    if n.length < EPS:
        raise RuntimeError("No pude calcular una normal válida.")
    n = _stabilize_normal_sign(n)

    u, v = _make_plane_basis(n)

    # Proyectar a plano + coords 2D
    pts2 = []
    for p in pts:
        d = (p - M).dot(n)
        pp = p - n * d
        x = (pp - M).dot(u)
        y = (pp - M).dot(v)
        pts2.append((x, y))

    # Radio estimado
    R = 0.0
    for x, y in pts2:
        R = max(R, sqrt(x * x + y * y))

    # Orden / contorno
    if make_hat:
        hull_xy = _convex_hull_2d(pts2)
        if len(hull_xy) < 3:
            raise RuntimeError("Convex hull inválido (puntos degenerados).")

        # Recentrar M al "centro de masas" del hull (centroide 2D area-weighted)
        A = 0.0
        cx = 0.0
        cy = 0.0
        for i in range(len(hull_xy)):
            x0, y0 = hull_xy[i]
            x1, y1 = hull_xy[(i + 1) % len(hull_xy)]
            cr = x0 * y1 - x1 * y0
            A += cr
            cx += (x0 + x1) * cr
            cy += (y0 + y1) * cr
        if abs(A) > EPS:
            cx /= (3.0 * A)
            cy /= (3.0 * A)
        else:
            cx = sum(x for x, _ in hull_xy) / len(hull_xy)
            cy = sum(y for _, y in hull_xy) / len(hull_xy)

        M = M + u * cx + v * cy
        hull_xy = [(x - cx, y - cy) for x, y in hull_xy]

        # Recalcular radio con el hull ya centrado
        R = 0.0
        for x, y in hull_xy:
            R = max(R, sqrt(x * x + y * y))

        poly3 = [M + u * x + v * y for x, y in hull_xy]
    else:
        if order_mode == "ANGLE":
            cx = sum(x for x, _ in pts2) / len(pts2)
            cy = sum(y for _, y in pts2) / len(pts2)
            order = sorted(range(len(pts2)), key=lambda i: atan2(pts2[i][1] - cy, pts2[i][0] - cx))
        else:
            order = list(range(len(pts2)))

        poly3 = [M + u * pts2[i][0] + v * pts2[i][1] for i in order]

    poly3 = _dedupe_consecutive(poly3)
    if len(poly3) < 3:
        raise RuntimeError("Polígono inválido.")

    # Guardar estado
    prev_mode = context.mode
    prev_active = context.view_layer.objects.active
    prev_sel = [o for o in context.selected_objects]

    if context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')

    # 1) Disco (y sombrero determinista, sin booleans)
    if make_hat:
        diameter = max(2.0 * R, EPS)
        L = max(hat_square_ratio * diameter, EPS)
        # hull_xy viene del bloque de orden cuando make_hat=True
        disk_obj = _create_disk_hat_direct(
            context,
            name=obj_name,
            hull_xy=hull_xy,
            M=M, n=n, u=u, v=v,
            thickness=thickness,
            L=L,
            hat_on_positive_side=hat_on_positive_side
        )
        # Remesh (si se pidió): ahora se aplica AL FINAL, porque no hay booleans
        if remesh_before_boolean:
            _apply_remesh_sharp(context, disk_obj, remesh_octree_depth, remesh_scale)
    else:
        disk_obj = _create_extruded_polygon_object(context, obj_name, poly3, M, n, thickness)
    # 3) Escalar en el plano al final
    _scale_object_mesh_in_plane(disk_obj, M, u, v, n, scale_in_plane)

    # Visual
    disk_obj.show_in_front = bool(show_in_front)
    disk_obj.display_type = 'WIRE' if wire else 'SOLID'

    # Restaurar selección/activo y modo
    for o in context.view_layer.objects:
        o.select_set(False)
    for o in prev_sel:
        if o and o.name in bpy.data.objects:
            o.select_set(True)
    if prev_active and prev_active.name in bpy.data.objects:
        context.view_layer.objects.active = bpy.data.objects[prev_active.name]

    if prev_mode == 'EDIT_MESH':
        bpy.ops.object.mode_set(mode='EDIT')

    return disk_obj


# -----------------------------
# Operator 1: from selected verts
# -----------------------------
def _selected_verts_world(context):
    obj = context.active_object
    if not obj or obj.type != "MESH":
        raise RuntimeError("El objeto activo no es una malla.")
    if context.mode != "EDIT_MESH":
        raise RuntimeError("Debes estar en Edit Mode.")
    bm = bmesh.from_edit_mesh(obj.data)
    sel = [v for v in bm.verts if v.select]
    if len(sel) < 3:
        raise RuntimeError("Selecciona al menos 3 vértices.")
    mw = obj.matrix_world
    return [mw @ v.co for v in sel]


class MESH_OT_cut_disk_from_verts(bpy.types.Operator):
    bl_idname = "mesh.cut_disk_from_verts"
    bl_label = "Crear disco de corte (vértices seleccionados)"
    bl_options = {'REGISTER', 'UNDO'}

    preview: BoolProperty(name="Preview", default=True)
    thickness: FloatProperty(name="Holgura H (grosor)", default=0.02, min=0.000001, unit='LENGTH')
    scale_in_plane: FloatProperty(name="Inflado S (en el plano)", default=1.05, min=0.000001)
    obj_name: StringProperty(name="Nombre", default="CutDisk")
    show_in_front: BoolProperty(name="In Front", default=False)
    wire: BoolProperty(name="Wire", default=False)
    angle_order: BoolProperty(name="Ordenar por ángulo", default=True)

    make_hat: BoolProperty(name="Hat (sombrero)", default=False)
    hat_square_ratio: FloatProperty(name="Tamaño cubo (%)", default=0.30, min=0.01, max=2.0)
    hat_on_positive_side: BoolProperty(name="Sombrero hacia +normal", default=True)

    remesh_before_boolean: BoolProperty(name="Remesh Sharp antes de boolean", default=True)
    remesh_octree_depth: IntProperty(name="Remesh Octree Depth", default=7, min=4, max=10)
    remesh_scale: FloatProperty(name="Remesh Scale", default=0.99, min=0.1, max=1.0)

    @classmethod
    def poll(cls, context):
        o = context.active_object
        return o and o.type == "MESH" and context.mode == "EDIT_MESH"

    def invoke(self, context, event):
        return self.execute(context)

    def draw(self, context):
        l = self.layout
        l.prop(self, "preview")
        col = l.column()
        col.enabled = self.preview
        col.prop(self, "thickness")
        col.prop(self, "scale_in_plane")
        col.prop(self, "angle_order")
        col.prop(self, "obj_name")
        col.prop(self, "show_in_front")
        col.prop(self, "wire")

        l.separator()
        l.prop(self, "make_hat")
        h = l.column()
        h.enabled = self.make_hat
        h.prop(self, "hat_square_ratio")
        h.prop(self, "hat_on_positive_side")
        h.separator()
        h.prop(self, "remesh_before_boolean")
        rr = h.column()
        rr.enabled = self.make_hat and self.remesh_before_boolean
        rr.prop(self, "remesh_octree_depth")
        rr.prop(self, "remesh_scale")

    def execute(self, context):
        if not self.preview:
            return {'FINISHED'}
        try:
            pts = _selected_verts_world(context)
            create_cut_disk_from_points(
                context,
                points_world=pts,
                thickness=self.thickness,
                scale_in_plane=self.scale_in_plane,
                obj_name=self.obj_name,
                show_in_front=self.show_in_front,
                wire=self.wire,
                order_mode="ANGLE" if self.angle_order else "CLICK",
                make_hat=self.make_hat,
                hat_square_ratio=self.hat_square_ratio,
                hat_on_positive_side=self.hat_on_positive_side,
                remesh_before_boolean=self.remesh_before_boolean,
                remesh_octree_depth=self.remesh_octree_depth,
                remesh_scale=self.remesh_scale,
            )
        except Exception as e:
            self.report({'ERROR'}, str(e))
            return {'CANCELLED'}
        return {'FINISHED'}


# -----------------------------
# Operator 2: breadcrumbs
# -----------------------------
class MESH_OT_cut_disk_breadcrumbs(bpy.types.Operator):
    bl_idname = "mesh.cut_disk_breadcrumbs"
    bl_label = "Crear disco de corte (migas sobre superficie)"
    bl_options = {'REGISTER', 'UNDO'}

    thickness: FloatProperty(name="Holgura H (grosor)", default=0.02, min=0.000001, unit='LENGTH')
    scale_in_plane: FloatProperty(name="Inflado S (en el plano)", default=1.05, min=0.000001)
    obj_name: StringProperty(name="Nombre", default="CutDisk")
    show_in_front: BoolProperty(name="In Front", default=False)
    wire: BoolProperty(name="Wire", default=False)

    make_hat: BoolProperty(name="Hat (sombrero)", default=False)
    hat_square_ratio: FloatProperty(name="Tamaño cubo (%)", default=0.30, min=0.01, max=2.0)
    hat_on_positive_side: BoolProperty(name="Sombrero hacia +normal", default=True)

    remesh_before_boolean: BoolProperty(name="Remesh Sharp antes de boolean", default=True)
    remesh_octree_depth: IntProperty(name="Remesh Octree Depth", default=7, min=4, max=10)
    remesh_scale: FloatProperty(name="Remesh Scale", default=0.99, min=0.1, max=1.0)

    points_json: StringProperty(name="(interno) puntos", default="[]")

    @classmethod
    def poll(cls, context):
        o = context.active_object
        return o and o.type == "MESH" and context.area and context.area.type == "VIEW_3D"

    def _draw_callback(self):
        pts = getattr(self, "_points", None)
        if not pts:
            return

        shader = gpu.shader.from_builtin('UNIFORM_COLOR')

        # Mostrar siempre por delante (sin z-buffer)
        gpu.state.depth_test_set('NONE')
        gpu.state.depth_mask_set(False)
        gpu.state.blend_set('ALPHA')
        gpu.state.point_size_set(12.0)
        try:
            gpu.state.line_width_set(2.0)
        except Exception:
            pass

        coords = [p.to_tuple() for p in pts]

        shader.bind()
        shader.uniform_float("color", (1, 0, 0, 1))

        # Path del usuario
        batch = batch_for_shader(shader, 'LINE_STRIP', {"pos": coords})
        batch.draw(shader)

        # Puntos
        batch_p = batch_for_shader(shader, 'POINTS', {"pos": coords})
        batch_p.draw(shader)

        # Restaurar estado
        gpu.state.blend_set('NONE')
        gpu.state.depth_mask_set(True)
        gpu.state.depth_test_set('LESS_EQUAL')

    def _start_preview(self, context):
        if getattr(self, "_handle", None) is None:
            self._handle = bpy.types.SpaceView3D.draw_handler_add(
                self._draw_callback, (), 'WINDOW', 'POST_VIEW'
            )
        context.area.tag_redraw()

    def _stop_preview(self, context):
        h = getattr(self, "_handle", None)
        if h is not None:
            bpy.types.SpaceView3D.draw_handler_remove(h, 'WINDOW')
            self._handle = None
        if context.area:
            context.area.tag_redraw()

    def _finish(self, context):
        self._stop_preview(context)
        if context.area:
            context.area.header_text_set(None)
        context.window.cursor_modal_restore()

    def invoke(self, context, event):
        self._points = []
        self._handle = None
        self.points_json = "[]"

        self._start_preview(context)

        context.window.cursor_modal_set('CROSSHAIR')
        if context.area:
            context.area.header_text_set(
                "MODO MIGAS: Ctrl+LMB añade | Backspace borra | Enter confirma | Esc cancela | (orbit: MMB/Alt+LMB)"
            )

        context.window_manager.modal_handler_add(self)
        return {'RUNNING_MODAL'}

    def modal(self, context, event):
        if event.type in {'MIDDLEMOUSE', 'WHEELUPMOUSE', 'WHEELDOWNMOUSE', 'WHEELINMOUSE', 'WHEELOUTMOUSE'}:
            return {'PASS_THROUGH'}
        if event.alt and event.type in {'LEFTMOUSE', 'RIGHTMOUSE'}:
            return {'PASS_THROUGH'}

        if event.type == 'ESC' and event.value == 'PRESS':
            self._finish(context)
            return {'CANCELLED'}

        if event.type in {'RET', 'NUMPAD_ENTER'} and event.value == 'PRESS':
            if len(self._points) < 3:
                self.report({'ERROR'}, "Necesitas al menos 3 migas.")
                return {'RUNNING_MODAL'}
            self.points_json = _points_to_json(self._points)
            self._finish(context)
            return self.execute(context)

        if event.type == 'BACK_SPACE' and event.value == 'PRESS':
            if self._points:
                self._points.pop()
                self.points_json = _points_to_json(self._points)
                if context.area:
                    context.area.tag_redraw()
            return {'RUNNING_MODAL'}

        if event.type == 'LEFTMOUSE':
            if event.value == 'PRESS' and event.ctrl:
                region, mx, my = _mouse_to_window_region_xy(context, event)
                if region is not None:
                    hit = _raycast_active_object_world(context, region, mx, my)
                    if hit is not None:
                        self._points.append(hit)
                        self.points_json = _points_to_json(self._points)
                        if context.area:
                            context.area.tag_redraw()
                return {'RUNNING_MODAL'}
            return {'PASS_THROUGH'}

        return {'RUNNING_MODAL'}

    def execute(self, context):
        try:
            pts = _points_from_json(self.points_json)
            if len(pts) < 3:
                raise RuntimeError("No hay suficientes migas.")
            create_cut_disk_from_points(
                context,
                points_world=pts,
                thickness=self.thickness,
                scale_in_plane=self.scale_in_plane,
                obj_name=self.obj_name,
                show_in_front=self.show_in_front,
                wire=self.wire,
                order_mode="CLICK",
                make_hat=self.make_hat,
                hat_square_ratio=self.hat_square_ratio,
                hat_on_positive_side=self.hat_on_positive_side,
                remesh_before_boolean=self.remesh_before_boolean,
                remesh_octree_depth=self.remesh_octree_depth,
                remesh_scale=self.remesh_scale,
            )
        except Exception as e:
            self.report({'ERROR'}, str(e))
            return {'CANCELLED'}
        return {'FINISHED'}


# -----------------------------
# UI Panel
# -----------------------------
class VIEW3D_PT_cut_disk_panel(bpy.types.Panel):
    bl_label = "Cut Disk"
    bl_idname = "VIEW3D_PT_cut_disk_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "Cut Disk"

    def draw(self, context):
        layout = self.layout
        layout.operator("mesh.cut_disk_from_verts", icon='VERTEXSEL')
        layout.separator()
        layout.operator("mesh.cut_disk_breadcrumbs", icon='CURSOR')
        layout.label(text="Migas: Ctrl+LMB para poner puntos; navega con MMB/Alt+LMB.")


classes = (
    MESH_OT_cut_disk_from_verts,
    MESH_OT_cut_disk_breadcrumbs,
    VIEW3D_PT_cut_disk_panel,
)


def register():
    for c in classes:
        bpy.utils.register_class(c)


def unregister():
    for c in reversed(classes):
        bpy.utils.unregister_class(c)


if __name__ == "__main__":
    register()
```
