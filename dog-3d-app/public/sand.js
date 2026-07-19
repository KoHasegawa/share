import * as THREE from 'three';

// 砂浜フィールド:
// - 高さ = ベース起伏(静的ノイズ) + 攪乱(犬が歩いた跡などの動的スタンプ)
// - シェーディングは高さから毎回計算する法線マップが担い、ジオメトリ変位は
//   シルエット用(頂点法線は真上のままにして二重陰影を避ける)
// - 足跡は肉球の形を残さず、「踏まれて崩れた窪み+押し出された縁+蹴り出しの砂」
//   として表現する(乾いた砂の挙動)

const FIELD_SIZE = 22; // 動的サンドフィールドの一辺(m)
const TEX_SIZE = 1024; // 高さ・法線・アルベドのテクセル解像度
const SEGMENTS = 200; // ジオメトリ分割数
const TEXEL = FIELD_SIZE / TEX_SIZE; // ≒2.1cm/texel
const EDGE_FADE = 2.5; // フィールド外周のフェード幅(m)

const MAX_DIG = -0.045; // 攪乱で掘れる深さの下限(踏み固め飽和)
const MAX_PILE = 0.03; // 攪乱で盛れる高さの上限

function hash3(ix, iz, seed) {
  let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(seed, 962287);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

function valueNoise(x, z, seed) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const sx = smooth(fx);
  const sz = smooth(fz);
  const a = hash3(ix, iz, seed);
  const b = hash3(ix + 1, iz, seed);
  const c = hash3(ix, iz + 1, seed);
  const d = hash3(ix + 1, iz + 1, seed);
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
}

function fbm(x, z, octaves, seed) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let total = 0;
  for (let o = 0; o < octaves; o += 1) {
    sum += valueNoise(x * freq, z * freq, seed + o * 131) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2.05;
  }
  return sum / total; // 0..1
}

export class SandField {
  constructor(scene) {
    this.scene = scene;
    this.base = new Float32Array(TEX_SIZE * TEX_SIZE);
    this.disturb = new Float32Array(TEX_SIZE * TEX_SIZE);
    this.normalData = new Uint8Array(TEX_SIZE * TEX_SIZE * 4);

    this.buildBaseHeight();

    this.normalTexture = new THREE.DataTexture(
      this.normalData,
      TEX_SIZE,
      TEX_SIZE,
      THREE.RGBAFormat
    );
    // 動的更新するためミップマップは生成せず、線形補間でテクセルの角を消す
    this.normalTexture.magFilter = THREE.LinearFilter;
    this.normalTexture.minFilter = THREE.LinearFilter;
    this.normalTexture.generateMipmaps = false;
    this.normalTexture.anisotropy = 4;
    this.normalTexture.needsUpdate = true;

    this.albedoTexture = this.buildAlbedoTexture();

    this.material = new THREE.MeshStandardMaterial({
      map: this.albedoTexture,
      normalMap: this.normalTexture,
      normalScale: new THREE.Vector2(2.2, 2.2),
      roughness: 0.96,
      metalness: 0,
    });

    this.geometry = new THREE.PlaneGeometry(FIELD_SIZE, FIELD_SIZE, SEGMENTS, SEGMENTS);
    this.geometry.rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);

    this.refreshNormals(0, 0, TEX_SIZE - 1, TEX_SIZE - 1);
    this.refreshGeometry();
  }

  // ---- 高さ ------------------------------------------------------------

  baseHeightAt(x, z) {
    // うねり + 中スケールの凸凹 + 細かな粒の崩れ。写真のような
    // 「均されていない乾いた珊瑚砂」の起伏を狙う。
    const large = (fbm(x * 0.16, z * 0.16, 3, 11) - 0.5) * 0.16;
    const mid = (fbm(x * 0.55, z * 0.55, 3, 23) - 0.5) * 0.07;
    const small = (fbm(x * 1.9, z * 1.9, 3, 37) - 0.5) * 0.03;
    const fine = (fbm(x * 6.5, z * 6.5, 2, 51) - 0.5) * 0.011;
    return large + mid + small + fine;
  }

  edgeFade(x, z) {
    const half = FIELD_SIZE / 2;
    const dx = half - Math.abs(x);
    const dz = half - Math.abs(z);
    const d = Math.min(dx, dz);
    if (d >= EDGE_FADE) return 1;
    if (d <= 0) return 0;
    return smooth(d / EDGE_FADE);
  }

  buildBaseHeight() {
    for (let j = 0; j < TEX_SIZE; j += 1) {
      const z = -FIELD_SIZE / 2 + j * TEXEL;
      for (let i = 0; i < TEX_SIZE; i += 1) {
        const x = -FIELD_SIZE / 2 + i * TEXEL;
        this.base[j * TEX_SIZE + i] = this.baseHeightAt(x, z) * this.edgeFade(x, z);
      }
    }
  }

  heightIndex(i, j) {
    const ci = Math.min(TEX_SIZE - 1, Math.max(0, i));
    const cj = Math.min(TEX_SIZE - 1, Math.max(0, j));
    return cj * TEX_SIZE + ci;
  }

  heightAt(i, j) {
    const idx = this.heightIndex(i, j);
    return this.base[idx] + this.disturb[idx];
  }

  // ---- テクスチャ生成 ---------------------------------------------------

  buildAlbedoTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = TEX_SIZE;
    canvas.height = TEX_SIZE;
    const ctx = canvas.getContext('2d');
    const image = ctx.createImageData(TEX_SIZE, TEX_SIZE);
    const data = image.data;

    // ベース: 明るいクリーム色の珊瑚砂。低周波の色ムラ + 粒状ノイズ。
    for (let j = 0; j < TEX_SIZE; j += 1) {
      for (let i = 0; i < TEX_SIZE; i += 1) {
        const patch = fbm(i * 0.012, j * 0.012, 3, 71) - 0.5; // 大きな色ムラ
        const clump = fbm(i * 0.07, j * 0.07, 2, 83) - 0.5; // 中スケール
        const grain = hash3(i, j, 97) - 0.5; // 粒
        let r = 229 + patch * 26 + clump * 12 + grain * 22;
        let g = 216 + patch * 24 + clump * 11 + grain * 21;
        let b = 186 + patch * 20 + clump * 10 + grain * 19;
        const idx = (j * TEX_SIZE + i) * 4;
        data[idx] = Math.max(0, Math.min(255, r));
        data[idx + 1] = Math.max(0, Math.min(255, g));
        data[idx + 2] = Math.max(0, Math.min(255, b));
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);

    // 暗い粒(有機物・小石): 実寸1〜3cm程度の細かい点に抑える
    for (let n = 0; n < 3200; n += 1) {
      const x = Math.random() * TEX_SIZE;
      const y = Math.random() * TEX_SIZE;
      const s = 0.4 + Math.random() * 0.55;
      const a = 0.18 + Math.random() * 0.35;
      ctx.fillStyle = `rgba(${70 + Math.random() * 50 | 0}, ${60 + Math.random() * 40 | 0}, ${50 + Math.random() * 30 | 0}, ${a})`;
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    }

    // 貝殻・珊瑚のかけら(明るい粒、まれに大きめ)
    for (let n = 0; n < 2200; n += 1) {
      const x = Math.random() * TEX_SIZE;
      const y = Math.random() * TEX_SIZE;
      const s = Math.random() < 0.06 ? 1.2 + Math.random() * 0.6 : 0.4 + Math.random() * 0.6;
      const warm = (Math.random() * 10) | 0;
      ctx.fillStyle = `rgba(${Math.min(255, 244 + warm)}, ${Math.min(255, 238 + warm)}, ${224 + warm}, ${0.35 + Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }

  // ---- 法線マップ --------------------------------------------------------

  refreshNormals(i0, j0, i1, j1) {
    const s = 1; // 勾配→法線の強調係数
    for (let j = j0; j <= j1; j += 1) {
      for (let i = i0; i <= i1; i += 1) {
        const dzdx = (this.heightAt(i + 1, j) - this.heightAt(i - 1, j)) / (2 * TEXEL);
        const dzdz = (this.heightAt(i, j + 1) - this.heightAt(i, j - 1)) / (2 * TEXEL);
        // タンジェント空間: U=+x, V=-z(平面回転後)。
        let nx = -dzdx * s;
        let ny = dzdz * s;
        let nz = 1;
        const inv = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx *= inv;
        ny *= inv;
        nz *= inv;
        // 高さ配列の j は +z 方向、テクスチャ行は v=0(=z=+F/2) 起点なので反転
        const row = TEX_SIZE - 1 - j;
        const idx = (row * TEX_SIZE + i) * 4;
        this.normalData[idx] = (nx * 0.5 + 0.5) * 255;
        this.normalData[idx + 1] = (ny * 0.5 + 0.5) * 255;
        this.normalData[idx + 2] = (nz * 0.5 + 0.5) * 255;
        this.normalData[idx + 3] = 255;
      }
    }
    this.normalTexture.needsUpdate = true;
  }

  // ---- ジオメトリ変位 ----------------------------------------------------

  vertexHeight(x, z) {
    // テクセル格子をバイリニア補間
    const fi = (x + FIELD_SIZE / 2) / TEXEL;
    const fj = (z + FIELD_SIZE / 2) / TEXEL;
    const i = Math.floor(fi);
    const j = Math.floor(fj);
    const tx = fi - i;
    const tz = fj - j;
    const a = this.heightAt(i, j);
    const b = this.heightAt(i + 1, j);
    const c = this.heightAt(i, j + 1);
    const d = this.heightAt(i + 1, j + 1);
    return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz;
  }

  /** 世界座標(x,z)の砂表面の高さ(起伏+攪乱)。外部から接地に使う。 */
  surfaceHeightAt(x, z) {
    const half = FIELD_SIZE / 2;
    if (Math.abs(x) >= half || Math.abs(z) >= half) return 0;
    return this.vertexHeight(x, z);
  }

  refreshGeometry(minX = -Infinity, minZ = -Infinity, maxX = Infinity, maxZ = Infinity) {
    const position = this.geometry.attributes.position;
    const arr = position.array;
    const step = FIELD_SIZE / SEGMENTS;
    const half = FIELD_SIZE / 2;
    // 頂点は規則格子(行=z方向, 列=x方向)なので、更新範囲の添字だけ走査する
    const c0 = Math.max(0, Math.floor((minX + half) / step));
    const c1 = Math.min(SEGMENTS, Math.ceil((maxX + half) / step));
    const r0 = Math.max(0, Math.floor((minZ + half) / step));
    const r1 = Math.min(SEGMENTS, Math.ceil((maxZ + half) / step));
    for (let r = r0; r <= r1; r += 1) {
      const z = -half + r * step;
      for (let c = c0; c <= c1; c += 1) {
        const x = -half + c * step;
        arr[(r * (SEGMENTS + 1) + c) * 3 + 1] = this.vertexHeight(x, z);
      }
    }
    position.needsUpdate = true;
  }

  // ---- 攪乱(足跡・蹴り跡) ----------------------------------------------

  /**
   * 1歩ぶんの砂の乱れをスタンプする。
   * くっきりした肉球の形は付けない: 崩れた窪み + 後方に押し出された縁 +
   * 蹴り出しで飛んだ砂の小さな盛り上がり。
   * @param {number} x 世界座標X
   * @param {number} z 世界座標Z
   * @param {object} opts { dirX, dirZ: 進行方向単位ベクトル, strength, kick }
   */
  disturbAt(x, z, opts = {}) {
    const { dirX = 0, dirZ = 1, strength = 1, kick = 0.6 } = opts;
    const fade = this.edgeFade(x, z);
    if (fade <= 0) return;

    const seed = (Math.random() * 1e9) | 0;
    const radius = (0.085 + Math.random() * 0.03) * (0.8 + strength * 0.25);
    const depth = 0.022 * strength * fade;
    // 輪郭を歪ませるローブ(真円にしない)
    const p1 = Math.random() * Math.PI * 2;
    const p2 = Math.random() * Math.PI * 2;
    const a1 = 0.18 + Math.random() * 0.14;
    const a2 = 0.12 + Math.random() * 0.12;
    const backAngle = Math.atan2(-dirX, -dirZ);

    const reach = radius * 2.4;
    const i0 = Math.max(1, Math.floor((x - reach + FIELD_SIZE / 2) / TEXEL));
    const i1 = Math.min(TEX_SIZE - 2, Math.ceil((x + reach + FIELD_SIZE / 2) / TEXEL));
    const j0 = Math.max(1, Math.floor((z - reach + FIELD_SIZE / 2) / TEXEL));
    const j1 = Math.min(TEX_SIZE - 2, Math.ceil((z + reach + FIELD_SIZE / 2) / TEXEL));

    for (let j = j0; j <= j1; j += 1) {
      const pz = -FIELD_SIZE / 2 + j * TEXEL;
      for (let i = i0; i <= i1; i += 1) {
        const px = -FIELD_SIZE / 2 + i * TEXEL;
        const dx = px - x;
        const dz = pz - z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > reach) continue;
        const theta = Math.atan2(dx, dz);
        // 歪んだ輪郭半径
        const rEff = radius * (1 + a1 * Math.sin(2 * theta + p1) + a2 * Math.sin(3 * theta + p2));
        // 粒の崩れ(境界をさらに乱す)
        const crumble = 0.75 + 0.5 * valueNoise(i * 0.55, j * 0.55, seed);
        let delta = 0;
        if (dist < rEff) {
          // 崩れた窪み: 中心が最も深く、縁に向かってなだらか
          const t = dist / rEff;
          delta -= depth * (1 - smooth(t)) * crumble;
        } else if (dist < rEff * 1.9) {
          // 押し出された縁: 後方(進行方向の逆)ほど高く盛る
          const band = (dist - rEff) / (rEff * 0.9);
          const profile = Math.sin(Math.min(band, 1) * Math.PI);
          let angDiff = theta - backAngle;
          angDiff = Math.atan2(Math.sin(angDiff), Math.cos(angDiff));
          const dirBias = 0.45 + 0.7 * Math.max(0, Math.cos(angDiff));
          delta += depth * 0.62 * profile * dirBias * crumble;
        }
        if (delta !== 0) {
          this.addDisturb(i, j, delta);
        }
      }
    }

    // 蹴り出しの砂: 足の後方に浅い盛り(飛び散った砂だまり)
    const scatterCount = 3 + ((Math.random() * 4) | 0);
    for (let n = 0; n < scatterCount; n += 1) {
      const ang = backAngle + (Math.random() - 0.5) * 1.5;
      const d = radius * (1.3 + Math.random() * 1.6 * (0.5 + kick));
      const sx = x + Math.sin(ang) * d;
      const sz = z + Math.cos(ang) * d;
      const sr = radius * (0.18 + Math.random() * 0.3);
      const sh = depth * (0.2 + Math.random() * 0.3);
      this.stampBlob(sx, sz, sr, sh);
    }

    const margin = reach + radius * 3.5;
    this.commitRegion(x - margin, z - margin, x + margin, z + margin);
  }

  stampBlob(x, z, radius, height) {
    const i0 = Math.max(1, Math.floor((x - radius + FIELD_SIZE / 2) / TEXEL));
    const i1 = Math.min(TEX_SIZE - 2, Math.ceil((x + radius + FIELD_SIZE / 2) / TEXEL));
    const j0 = Math.max(1, Math.floor((z - radius + FIELD_SIZE / 2) / TEXEL));
    const j1 = Math.min(TEX_SIZE - 2, Math.ceil((z + radius + FIELD_SIZE / 2) / TEXEL));
    for (let j = j0; j <= j1; j += 1) {
      const pz = -FIELD_SIZE / 2 + j * TEXEL;
      for (let i = i0; i <= i1; i += 1) {
        const px = -FIELD_SIZE / 2 + i * TEXEL;
        const dx = px - x;
        const dz = pz - z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist >= radius) continue;
        this.addDisturb(i, j, height * (1 - smooth(dist / radius)));
      }
    }
  }

  addDisturb(i, j, delta) {
    const idx = j * TEX_SIZE + i;
    const next = this.disturb[idx] + delta;
    this.disturb[idx] = Math.min(MAX_PILE, Math.max(MAX_DIG, next));
  }

  commitRegion(minX, minZ, maxX, maxZ) {
    const i0 = Math.max(1, Math.floor((minX + FIELD_SIZE / 2) / TEXEL) - 1);
    const i1 = Math.min(TEX_SIZE - 2, Math.ceil((maxX + FIELD_SIZE / 2) / TEXEL) + 1);
    const j0 = Math.max(1, Math.floor((minZ + FIELD_SIZE / 2) / TEXEL) - 1);
    const j1 = Math.min(TEX_SIZE - 2, Math.ceil((maxZ + FIELD_SIZE / 2) / TEXEL) + 1);
    if (i1 < i0 || j1 < j0) return;
    this.refreshNormals(i0, j0, i1, j1);
    this.refreshGeometry(minX - TEXEL, minZ - TEXEL, maxX + TEXEL, maxZ + TEXEL);
  }
}

export const SAND_FIELD_SIZE = FIELD_SIZE;
