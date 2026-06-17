"""
このリポジトリのCI環境では未実行。Blenderローカルで `blender -b -P tools/generate_dog_glb.py` を実行してください。
"""

import bpy
from math import pi
from mathutils import Euler, Quaternion, Vector

# 既存データをクリーンアップ
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

scene = bpy.context.scene
scene.frame_start = 0
scene.frame_end = 160

# --- マテリアル作成 ---
def make_material(name, hex_color):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    principled = nodes.get('Principled BSDF')
    rgb = [(hex_color >> 16 & 0xFF) / 255.0, (hex_color >> 8 & 0xFF) / 255.0, (hex_color & 0xFF) / 255.0, 1.0]
    principled.inputs['Base Color'].default_value = rgb
    principled.inputs['Metallic'].default_value = 0.0
    principled.inputs['Roughness'].default_value = 0.6
    return material

materials = {
    'Dog_Body_Mat': make_material('Dog_Body_Mat', 0x8A6547),
    'Dog_Ear_Mat': make_material('Dog_Ear_Mat', 0x5A3D27),
    'Dog_Nose_Mat': make_material('Dog_Nose_Mat', 0x1A1A1A),
    'Dog_Eye_Mat': make_material('Dog_Eye_Mat', 0x101010),
    'Dog_Paw_Mat': make_material('Dog_Paw_Mat', 0xD8B99B),
}

# --- ノード階層の構築 ---
root = bpy.data.objects.new('DogRoot', None)
scene.collection.objects.link(root)
root.empty_display_type = 'PLAIN_AXES'

body_mesh = bpy.data.meshes.new('BodyMesh')
bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=10, radius=0.4, location=(0, 0.58, 0))
body_obj = bpy.context.active_object
body_obj.name = 'Body'
body_obj.data = bpy.data.meshes.new_from_object(body_obj, preserve_all_data_layers=True, depsgraph=bpy.context.evaluated_depsgraph_get())
bpy.ops.object.delete()
body_obj.data.materials.append(materials['Dog_Body_Mat'])
scene.collection.objects.link(body_obj)
body_obj.parent = root

bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.35, location=(0, 1.03, 0.92))
head_obj = bpy.context.active_object
head_obj.name = 'HeadMeshTmp'

bpy.ops.mesh.primitive_cube_add(size=0.34, location=(0, 1.0, 1.3))
snout_box = bpy.context.active_object
snout_box.name = 'SnoutBoxTmp'

bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.1, location=(0, 1.03, 1.55))
nose_obj = bpy.context.active_object
nose_obj.name = 'NoseTmp'

bpy.ops.object.select_all(action='DESELECT')
head_obj.select_set(True)
nose_obj.select_set(True)
snout_box.select_set(True)
bpy.context.view_layer.objects.active = head_obj
bpy.ops.object.join()
head_obj = bpy.context.active_object
head_obj.name = 'HeadCombined'
head_obj.data.materials.append(materials['Dog_Body_Mat'])
head_obj.data.materials.append(materials['Dog_Nose_Mat'])
for poly in head_obj.data.polygons:
    if head_obj.data.vertices[poly.vertices[0]].co.z > 1.35:
        poly.material_index = 1
scene.collection.objects.link(head_obj)

head_pivot = bpy.data.objects.new('HeadPivot', None)
head_pivot.empty_display_type = 'PLAIN_AXES'
head_pivot.location = (0, 0.95, 0.68)
scene.collection.objects.link(head_pivot)
head_pivot.parent = root

head = bpy.data.objects.new('Head', head_obj.data.copy())
head.location = (0, 0.08, 0.24)
head.rotation_euler = (-0.05, 0.0, 0.0)
head.parent = head_pivot
scene.collection.objects.link(head)

bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=0.06, location=(0, 0.0, 0.0))
_eye_mesh = bpy.context.active_object.data.copy()
bpy.ops.object.delete()

def create_eye(name, offset):
    eye = bpy.data.objects.new(name, _eye_mesh.copy())
    eye.location = offset
    eye.data.materials.append(materials['Dog_Eye_Mat'])
    eye.parent = head_pivot
    scene.collection.objects.link(eye)

create_eye('Eye_L', Vector((-0.16, 0.05, 0.93)))
create_eye('Eye_R', Vector((0.16, 0.05, 0.93)))

bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.14, depth=0.5, location=(0, 0, 0))
ear_mesh = bpy.context.active_object.data.copy()
bpy.ops.object.delete()

def create_ear(name, offset, rotation):
    ear = bpy.data.objects.new(name, ear_mesh.copy())
    ear.location = offset
    ear.rotation_euler = rotation
    ear.data.materials.append(materials['Dog_Ear_Mat'])
    ear.parent = head_pivot
    scene.collection.objects.link(ear)

create_ear('Ear_L', Vector((-0.22, 0.15, 0.56)), Euler((-0.4, 0.0, 0.35)))
create_ear('Ear_R', Vector((0.22, 0.15, 0.56)), Euler((-0.4, 0.0, -0.35)))

bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.11, depth=0.7, location=(0, 0.78, -0.78))
tail_base = bpy.context.active_object
bpy.ops.transform.rotate(value=pi / 2, orient_axis='X')
bpy.ops.transform.translate(value=(0, 0, -0.35))
tail_mesh = tail_base.data.copy()
bpy.ops.object.delete()

tail_pivot = bpy.data.objects.new('TailPivot', None)
tail_pivot.empty_display_type = 'PLAIN_AXES'
tail_pivot.location = (0, 0.78, -0.78)
tail_pivot.parent = root
scene.collection.objects.link(tail_pivot)

tail = bpy.data.objects.new('Tail', tail_mesh.copy())
tail.rotation_euler = Euler((-0.35, 0.0, 0.0))
tail.parent = tail_pivot
scene.collection.objects.link(tail)
tail.data.materials.append(materials['Dog_Body_Mat'])

bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=6, radius=0.1)
leg_core_mesh = bpy.context.active_object.data.copy()
bpy.ops.object.delete()

bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.13, depth=0.12)
paw_mesh = bpy.context.active_object.data.copy()
bpy.ops.object.delete()

def create_leg(name, pivot_pos):
    pivot = bpy.data.objects.new(f"{name}_Pivot", None)
    pivot.location = pivot_pos
    pivot.empty_display_type = 'PLAIN_AXES'
    pivot.parent = root
    scene.collection.objects.link(pivot)

    leg_obj = bpy.data.objects.new(name, leg_core_mesh.copy())
    leg_obj.location = (0, -0.18, 0)
    leg_obj.data.materials.append(materials['Dog_Body_Mat'])
    scene.collection.objects.link(leg_obj)
    paw_obj = bpy.data.objects.new(f"{name}_PawTemp", paw_mesh.copy())
    paw_obj.location = (0, -0.3, 0)
    paw_obj.data.materials.append(materials['Dog_Paw_Mat'])
    scene.collection.objects.link(paw_obj)

    bpy.ops.object.select_all(action='DESELECT')
    leg_obj.select_set(True)
    paw_obj.select_set(True)
    bpy.context.view_layer.objects.active = leg_obj
    bpy.ops.object.join()

    leg_obj.parent = pivot

for name, pos in {
    'Leg_FL': Vector((0.32, 0.48, 0.42)),
    'Leg_FR': Vector((-0.32, 0.48, 0.42)),
    'Leg_BL': Vector((0.32, 0.48, -0.42)),
    'Leg_BR': Vector((-0.32, 0.48, -0.42)),
}.items():
    create_leg(name, pos)

# --- アニメーションのセットアップ ---

def ensure_animation_data(obj):
    if obj.animation_data is None:
        obj.animation_data_create()
    return obj.animation_data


def create_action(name):
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    return action


def record_rotation(action, obj_name, keyframes):
    obj = bpy.data.objects[obj_name]
    obj.rotation_mode = 'XYZ'
    anim_data = ensure_animation_data(obj)
    anim_data.action = action
    for frame, euler in keyframes:
        obj.rotation_euler = Euler(euler)
        obj.keyframe_insert(data_path='rotation_euler', frame=frame)
    anim_data.action = None

idle_action = create_action('idle')
record_rotation(idle_action, 'HeadPivot', [(0, (0.05, 0.0, 0.0)), (30, (-0.03, 0.03, 0.0)), (60, (0.05, 0.0, 0.0))])
record_rotation(idle_action, 'TailPivot', [(0, (0.0, 0.15, 0.0)), (30, (0.0, -0.15, 0.0)), (60, (0.0, 0.15, 0.0))])

walk_action = create_action('walk')
record_rotation(walk_action, 'Leg_FL_Pivot', [(0, (0.45, 0.0, 0.0)), (12, (-0.45, 0.0, 0.0)), (24, (0.45, 0.0, 0.0))])
record_rotation(walk_action, 'Leg_FR_Pivot', [(0, (-0.45, 0.0, 0.0)), (12, (0.45, 0.0, 0.0)), (24, (-0.45, 0.0, 0.0))])
record_rotation(walk_action, 'Leg_BL_Pivot', [(0, (-0.4, 0.0, 0.0)), (12, (0.4, 0.0, 0.0)), (24, (-0.4, 0.0, 0.0))])
record_rotation(walk_action, 'Leg_BR_Pivot', [(0, (0.4, 0.0, 0.0)), (12, (-0.4, 0.0, 0.0)), (24, (0.4, 0.0, 0.0))])
record_rotation(walk_action, 'HeadPivot', [(0, (0.1, 0.05, 0.0)), (12, (-0.1, -0.05, 0.0)), (24, (0.1, 0.05, 0.0))])
record_rotation(walk_action, 'TailPivot', [(0, (0.0, 0.25, 0.0)), (12, (0.0, -0.25, 0.0)), (24, (0.0, 0.25, 0.0))])

tail_action = create_action('tail_wag')
record_rotation(tail_action, 'TailPivot', [(0, (0.0, 0.5, 0.0)), (10, (0.0, -0.5, 0.0)), (20, (0.0, 0.5, 0.0))])

sit_action = create_action('sit')
record_rotation(sit_action, 'Leg_BL_Pivot', [(0, (0.0, 0.0, 0.0)), (40, (-1.1, 0.0, 0.0)), (60, (-1.1, 0.0, 0.0))])
record_rotation(sit_action, 'Leg_BR_Pivot', [(0, (0.0, 0.0, 0.0)), (40, (-1.1, 0.0, 0.0)), (60, (-1.1, 0.0, 0.0))])
record_rotation(sit_action, 'Leg_FL_Pivot', [(0, (0.0, 0.0, 0.0)), (40, (0.25, 0.0, 0.0)), (60, (0.25, 0.0, 0.0))])
record_rotation(sit_action, 'Leg_FR_Pivot', [(0, (0.0, 0.0, 0.0)), (40, (0.25, 0.0, 0.0)), (60, (0.25, 0.0, 0.0))])
record_rotation(sit_action, 'Body', [(0, (0.0, 0.0, 0.0)), (40, (-0.4, 0.0, 0.0)), (60, (-0.4, 0.0, 0.0))])
record_rotation(sit_action, 'HeadPivot', [(0, (0.0, 0.0, 0.0)), (40, (0.35, 0.1, 0.0)), (60, (0.35, 0.1, 0.0))])

# --- GLB書き出し設定 ---
export_path = bpy.path.abspath('//public/models/dog.glb')
bpy.ops.export_scene.gltf(
    filepath=export_path,
    export_format='GLB',
    export_apply=True,
    export_nla_strips=True,
    export_anim_single_armature=False,
    export_frame_range=False,
    export_selected=False,
    export_current_frame=False,
)
print(f"GLBを書き出しました: {export_path}")
