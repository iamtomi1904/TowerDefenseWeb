import * as THREE from 'three';

export const SPRITE_LIGHT_LAYER = 1;
const focusUniform = {value: new THREE.Vector4(-10000, -10000, 1, 1)};
const focusDepthUniform = {value: -10000};
const focusCenter = new THREE.Vector3(), focusEdge = new THREE.Vector3(), focusUp = new THREE.Vector3(), focusRight = new THREE.Vector3();
const focusRotation = new THREE.Quaternion();
const timeUniform = {value: 0};
export function updateSpriteMotion(time: number): void {timeUniform.value = time;}

/** Pixel dither only in the small part of a foreground card covering the explorer. */
export function updateSpriteFocus(camera: THREE.Camera, feet: THREE.Vector3, bufferSize: THREE.Vector2): void {
  camera.updateMatrixWorld();
  camera.getWorldQuaternion(focusRotation);
  focusUp.set(0, 1, 0).applyQuaternion(focusRotation);
  focusRight.set(1, 0, 0).applyQuaternion(focusRotation);
  focusCenter.copy(feet).addScaledVector(focusUp, 1.15).project(camera);
  focusEdge.copy(feet).addScaledVector(focusUp, 1.15).addScaledVector(focusRight, 1.05).project(camera);
  const rx = Math.max(8, Math.abs(focusEdge.x - focusCenter.x) * bufferSize.x / 2);
  focusEdge.copy(feet).addScaledVector(focusUp, 2.55).project(camera);
  const ry = Math.max(12, Math.abs(focusEdge.y - focusCenter.y) * bufferSize.y / 2);
  focusUniform.value.set((focusCenter.x * 0.5 + 0.5) * bufferSize.x, (focusCenter.y * 0.5 + 0.5) * bufferSize.y, rx, ry);
  focusDepthUniform.value = -focusEdge.copy(feet).applyMatrix4(camera.matrixWorldInverse).z - 0.1;
}

/** Painted face directions, in sprite tangent space (x right, y up, z towards viewer). */
export function paintSpriteNormals(grid: readonly string[]): {width: number; height: number; data: Uint8Array} {
  const width = Math.max(...grid.map(row => row.length));
  const height = grid.length;
  const data = new Uint8Array(width * height * 4);
  const normal = new THREE.Vector3();
  const stoneFaces: Record<string, [number, number, number]> = {
    C: [-0.45, 0.65, 0.65], c: [-0.6, 0.25, 0.8],
    S: [0.2, 0.3, 0.95], s: [0.65, -0.1, 0.75]
  };
  for (let y = 0; y < height; y++) {
    const row = grid[y];
    const occupied = [...row].map((ch, x) => ch !== '.' && ch !== '#' ? x : -1).filter(x => x >= 0);
    const left = occupied[0] ?? 0;
    const right = occupied.at(-1) ?? width - 1;
    for (let x = 0; x < width; x++) {
      const ch = row[x] ?? '.';
      const stone = stoneFaces[ch];
      if (stone) normal.set(...stone).normalize();
      else if (ch === '.' || ch === '#') normal.set(0, 0, 1);
      else {
        // Quantized rounded canopy/hood; cylindrical bark/stems get no vertical tilt.
        const nx = THREE.MathUtils.clamp((x - (left + right) / 2) / Math.max(1, (right - left + 1) / 2), -0.85, 0.85);
        const ny = 'bBwWm'.includes(ch) ? 0 : THREE.MathUtils.clamp(0.65 - y / height, -0.4, 0.65);
        const qx = Math.round(nx * 3) / 4;
        const qy = Math.round(ny * 4) / 4;
        normal.set(qx, qy, Math.sqrt(Math.max(0.1, 1 - qx * qx - qy * qy))).normalize();
      }
      const i = (y * width + x) * 4;
      data[i] = Math.round((normal.x * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round((normal.y * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round((normal.z * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  }
  return {width, height, data};
}

export function createSpriteNormalTexture(grid: readonly string[]): THREE.DataTexture {
  const {data, width, height} = paintSpriteNormals(grid);
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.flipY = true; // Rows share the CanvasTexture albedo's top-left origin.
  texture.colorSpace = THREE.NoColorSpace; // Normal vectors are linear data, not sRGB colors.
  texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

export function createLitSpriteMaterial(map: THREE.Texture, normalMap: THREE.Texture, motion = 0): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    map, normalMap, normalScale: new THREE.Vector2(1, 1), alphaTest: 0.5,
    side: THREE.DoubleSide, roughness: 1, metalness: 0
  });
  material.userData.spriteNormalMap = normalMap;
  material.onBeforeCompile = shader => {
    shader.uniforms.spriteFocus = focusUniform;
    shader.uniforms.spriteFocusDepth = focusDepthUniform;
    shader.uniforms.spriteTime = timeUniform;
    shader.uniforms.spriteMotion = {value: motion};
    shader.vertexShader = 'uniform float spriteTime;\nuniform float spriteMotion;\nvarying float vSpriteAnchorDepth;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      float spritePhase = 0.0;
      #ifdef USE_INSTANCING
        spritePhase = instanceMatrix[3].x * 0.73 + instanceMatrix[3].z * 0.37;
      #endif
      if (spriteMotion > 1.5) {
        float bounce = sin(spriteTime * 4.2 + spritePhase);
        transformed.y = position.y * (0.92 - bounce * 0.08) + max(bounce, 0.0) * 0.16;
        transformed.x *= 1.0 + bounce * 0.06;
      } else if (spriteMotion > 0.5) {
        transformed.x += sin(spriteTime * 1.7 + spritePhase) * 0.018 * position.y * position.y;
      }
    `);
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
      #include <project_vertex>
      vec4 spriteAnchor = vec4(0.0, 0.0, 0.0, 1.0);
      #ifdef USE_INSTANCING
        spriteAnchor = instanceMatrix * spriteAnchor;
      #endif
      vSpriteAnchorDepth = -(modelViewMatrix * spriteAnchor).z;
    `);
    shader.fragmentShader = 'uniform vec4 spriteFocus;\nuniform float spriteFocusDepth;\nvarying float vSpriteAnchorDepth;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <alphatest_fragment>', `
      #include <alphatest_fragment>
      vec2 focusDelta = (gl_FragCoord.xy - spriteFocus.xy) / spriteFocus.zw;
      if (vSpriteAnchorDepth < spriteFocusDepth && dot(focusDelta, focusDelta) < 1.0) {
        if (mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 3.0) < 2.0) discard;
      }
    `);
  };
  material.customProgramCacheKey = () => 'pixel-sprite-focus-motion-v2';
  return material;
}

export function applySpriteNormalMapping(root: THREE.Object3D, enabled: boolean): void {
  root.traverse(obj => {
    if (!(obj instanceof THREE.Mesh)) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial) || !material.userData.spriteNormalMap) continue;
      const desired = enabled ? material.userData.spriteNormalMap : null;
      if (material.normalMap !== desired) {
        material.normalMap = desired;
        material.needsUpdate = true;
      }
    }
  });
}

export function createSpriteShadowMaterial(map: THREE.Texture): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    map, color: '#000000', transparent: true, opacity: 0.26, alphaTest: 0.05,
    depthWrite: false, side: THREE.DoubleSide, polygonOffset: true,
    polygonOffsetFactor: -1, polygonOffsetUnits: -1, forceSinglePass: true
  });
}

/** Project the sprite's silhouette along the incoming light onto its horizontal ground plane. */
export function projectSpriteShadow(source: THREE.Matrix4, toLight: THREE.Vector3, output: THREE.Matrix4, groundY?: number): THREE.Matrix4 {
  const s = source.elements;
  if (s[0] === 0 && s[1] === 0 && s[2] === 0) return output.makeScale(0, 0, 0);
  const lightY = Math.max(0.25, toLight.y);
  const lx = THREE.MathUtils.clamp(toLight.x / lightY, -3, 3);
  const lz = THREE.MathUtils.clamp(toLight.z / lightY, -3, 3);
  return output.set(
    s[0] - lx * s[1], s[4] - lx * s[5], 0, s[12],
    0, 0, 1, (groundY ?? s[13]) + 0.045,
    s[2] - lz * s[1], s[6] - lz * s[5], 0, s[14],
    0, 0, 0, 1
  );
}
