"""Exports game models (GLB) from the previz block-outs into public/models/.

    blender -b --factory-startup -P previz/blender/export_glb.py -- [ilyra imp ...]

Every part stays a named node with its own pivot (pelvis, thigh_L, neck2_3, ...), so the game can pose
and animate the model by rotating parts, the way v1's models.ts did. Materials are flattened to one
colour (the part's top colour) plus emission, which glTF carries without baking."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402

import pv_common as C  # noqa: E402
import pv_creatures as K  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
WANT = argv or ["ilyra", "imp"]
POSE = {"ilyra": "walk"}
OUT = os.path.join(C.ROOT, "public", "models")
os.makedirs(OUT, exist_ok=True)

scene = bpy.context.scene
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob)

_flat = {}


def emission_of(m):
    if not m or not m.node_tree:
        return None
    for n in m.node_tree.nodes:
        if n.bl_idname == "ShaderNodeEmission":
            return tuple(n.inputs["Color"].default_value[:3]), n.inputs["Strength"].default_value
        if n.bl_idname == "ShaderNodeBsdfPrincipled":
            s = n.inputs["Emission Strength"]
            if not s.is_linked and s.default_value > 0:
                return tuple(n.inputs["Emission Color"].default_value[:3]), s.default_value
    return None


def flat(m):
    """One plain Principled material per source material: base colour, roughness, emission."""
    if m.name in _flat:
        return _flat[m.name]
    f = bpy.data.materials.new(f"g_{m.name}")
    f.use_nodes = True
    b = f.node_tree.nodes["Principled BSDF"]
    col = tuple(m.diffuse_color[:3])
    b.inputs["Base Color"].default_value = (*col, 1.0)
    b.inputs["Roughness"].default_value = 0.75
    metal = 0.0
    for n in m.node_tree.nodes if m.node_tree else []:
        if n.bl_idname == "ShaderNodeBsdfPrincipled" and not n.inputs["Metallic"].is_linked:
            metal = n.inputs["Metallic"].default_value
            b.inputs["Roughness"].default_value = n.inputs["Roughness"].default_value if not n.inputs["Roughness"].is_linked else 0.75
    b.inputs["Metallic"].default_value = metal
    e = emission_of(m)
    if e:
        b.inputs["Emission Color"].default_value = (*e[0], 1.0)
        b.inputs["Emission Strength"].default_value = min(e[1], 12.0)
        if not m.node_tree.nodes.get("Principled BSDF"):
            b.inputs["Base Color"].default_value = (*e[0], 1.0)
    _flat[m.name] = f
    return f


def export(key):
    coll = bpy.data.collections.new(f"export_{key}")
    scene.collection.children.link(coll)
    r = K.build(key, coll, pose=POSE.get(key), lights=False) if key == "ilyra" else K.build(key, coll, pose=POSE.get(key))
    K.ground_rig(r)
    r.root.name = key
    for name, ob in r.objs.items():
        ob.name = name
        for slot in ob.material_slots:
            if slot.material:
                slot.material = flat(slot.material)
    for ob in scene.objects:
        ob.select_set(False)
    for ob in coll.objects:
        ob.select_set(True)
    path = os.path.join(OUT, f"{key}.glb")
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", use_selection=True, export_yup=True, export_apply=False,
        export_lights=False, export_cameras=False, export_materials="EXPORT", export_animations=False,
