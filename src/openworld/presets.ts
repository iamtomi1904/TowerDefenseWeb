export type PropKind =
  | 'oak_tree'
  | 'pine_tree'
  | 'boulder'
  | 'bush'
  | 'hedge_block'
  | 'stump'
  | 'fallen_log'
  | 'mushroom'
  | 'blue_slime'
  | 'ruin_pillar'
  | 'flower_patch';

export interface TerrainPalette {
  deepWater: string;
  shallowSand: string;
  grassLow: string;
  grassHigh: string;
  cliffRock: string;
  peakSnow: string;
  waterSurface: string;
}

export interface AtmospherePreset {
  skyTop: string;
  skyBottom: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
}

export interface TerrainPreset {
  size: number;
  segments: number;
  tileSize: number;
  stepHeight: number;
  noiseScale: number;
  octaves: number;
  maxHeight: number;
  ridgeWeight: number;
  terraceSteps: number;
  waterLevel: number;
  spawnFlatRadius: number;
  spawnHeight: number;
  islandFalloff: number;
  hasRiver?: boolean;
  palette: TerrainPalette;
}

export interface PropRule {
  kind: PropKind;
  density: number;
  minHeight: number;
  maxHeight: number;
  maxSlope: number;
  minSpacing: number;
  scaleRange: [number, number];
  colliderRadius: number;
  foliageColor?: string;
  trunkColor?: string;
  stoneColor?: string;
}

export interface CharacterPreset {
  id: string;
  name: string;
  walkSpeed: number;
  sprintSpeed: number;
  jumpVelocity: number;
  gravity: number;
  turnSpeed: number;
  colliderRadius: number;
  maxClimbSlope: number;
  colors: {
    skin: string;
    hair: string;
    tunic: string;
    cloak: string;
    pants: string;
    boots: string;
    accent: string;
  };
}

export interface WorldPreset {
  id: string;
  name: string;
  subtitle: string;
  defaultSeed: number;
  terrain: TerrainPreset;
  atmosphere: AtmospherePreset;
  props: PropRule[];
  character: CharacterPreset;
}

export const DEFAULT_CHARACTER_PRESET: CharacterPreset = {
  id: 'iso-explorer',
  name: 'Lữ Khách ISO-CORE',
  walkSpeed: 7.5,
  sprintSpeed: 12.5,
  jumpVelocity: 10.5,
  gravity: 26.0,
  turnSpeed: 14.0,
  colliderRadius: 0.42,
  maxClimbSlope: 0.68,
  colors: {
    skin: '#9e8f7b',
    hair: '#1e2028',
    tunic: '#23252e',
    cloak: '#191a21',
    pants: '#1a1b22',
    boots: '#121318',
    accent: '#ff9e2c'
  }
};


export const WORLD_PRESETS: Record<string, WorldPreset> = {
  'meadow-isle': {
    id: 'meadow-isle',
    name: 'Thảo Nguyên ISO-CORE',
    subtitle: 'Đồng cỏ lưới xanh tươi, sông xẻ rãnh, trụ pha lê cam & rừng thông',
    defaultSeed: 2026,
    terrain: {
      size: 128,
      segments: 64,
      tileSize: 2.0,
      stepHeight: 0.85,
      noiseScale: 0.022,
      octaves: 3,
      maxHeight: 4.5,
      ridgeWeight: 0.15,
      terraceSteps: 0,
      waterLevel: -0.25,
      spawnFlatRadius: 14,
      spawnHeight: 0.0,
      islandFalloff: 0.0,
      hasRiver: true,
      palette: {
        deepWater: '#1c78a8',
        shallowSand: '#5e4736',
        grassLow: '#66c447',
        grassHigh: '#54b03b',
        cliffRock: '#7a5a43',
        peakSnow: '#8f969e',
        waterSurface: '#2baee0'
      }
    },
    atmosphere: {
      skyTop: '#5aa6e0',
      skyBottom: '#bce6fa',
      fogColor: '#bfe6f5',
      fogNear: 120,
      fogFar: 260,
      sunColor: '#fff8e8',
      sunIntensity: 1.95,
      sunPosition: [42, 68, 32],
      hemiSky: '#d4f1ff',
      hemiGround: '#3d6930',
      hemiIntensity: 1.05
    },
    props: [
      {
        kind: 'pine_tree',
        density: 0.032,
        minHeight: -0.1,
        maxHeight: 6.0,
        maxSlope: 0.3,
        minSpacing: 3.1,
        scaleRange: [0.9, 1.35],
        colliderRadius: 0.52,
        foliageColor: '#3f9137',
        trunkColor: '#694127'
      },
      {
        kind: 'oak_tree',
        density: 0.016,
        minHeight: -0.1,
        maxHeight: 5.5,
        maxSlope: 0.3,
        minSpacing: 3.6,
        scaleRange: [0.9, 1.25],
        colliderRadius: 0.58,
        foliageColor: '#5cb83f',
        trunkColor: '#694127'
      },
      {
        kind: 'hedge_block',
        density: 0.01,
        minHeight: -0.1,
        maxHeight: 4.5,
        maxSlope: 0.2,
        minSpacing: 2.2,
        scaleRange: [0.95, 1.05],
        colliderRadius: 0.75,
        foliageColor: '#52ab3a'
      },
      {
        kind: 'stump',
        density: 0.012,
        minHeight: -0.1,
        maxHeight: 5.0,
        maxSlope: 0.25,
        minSpacing: 2.8,
        scaleRange: [0.85, 1.15],
        colliderRadius: 0.4,
        trunkColor: '#6b4329'
      },
      {
        kind: 'fallen_log',
        density: 0.006,
        minHeight: -0.1,
        maxHeight: 4.5,
        maxSlope: 0.2,
        minSpacing: 5.5,
        scaleRange: [0.9, 1.15],
        colliderRadius: 0.65,
        trunkColor: '#633e26'
      },
      {
        kind: 'boulder',
        density: 0.014,
        minHeight: -0.1,
        maxHeight: 6.5,
        maxSlope: 0.45,
        minSpacing: 2.8,
        scaleRange: [0.65, 1.25],
        colliderRadius: 0.7,
        stoneColor: '#8d949e'
      },
      {
        kind: 'mushroom',
        density: 0.018,
        minHeight: -0.1,
        maxHeight: 5.0,
        maxSlope: 0.3,
        minSpacing: 2.0,
        scaleRange: [0.85, 1.2],
        colliderRadius: 0
      },
      {
        kind: 'blue_slime',
        density: 0.004,
        minHeight: -0.1,
        maxHeight: 4.0,
        maxSlope: 0.25,
        minSpacing: 6.0,
        scaleRange: [0.9, 1.15],
        colliderRadius: 0.45
      }
    ],
    character: DEFAULT_CHARACTER_PRESET
  },

  'highland-ruins': {
    id: 'highland-ruins',
    name: 'Cao Nguyên Cổ Thạch',
    subtitle: 'Địa hình bậc thang, rừng thông sương sớm và tàn tích đá',
    defaultSeed: 4096,
    terrain: {
      size: 128,
      segments: 64,
      tileSize: 2.0,
      stepHeight: 0.9,
      noiseScale: 0.028,
      octaves: 4,
      maxHeight: 11,
      ridgeWeight: 0.5,
      terraceSteps: 0,
      waterLevel: -0.8,
      spawnFlatRadius: 10,
      spawnHeight: 0.9,
      islandFalloff: 0.65,
      palette: {
        deepWater: '#2b4b59',
        shallowSand: '#a99e7e',
        grassLow: '#7d8f49',
        grassHigh: '#9f8748',
        cliffRock: '#656870',
        peakSnow: '#e5edf2',
        waterSurface: '#458394'
      }
    },
    atmosphere: {
      skyTop: '#566d8c',
      skyBottom: '#d8d2c5',
      fogColor: '#c9c8c0',
      fogNear: 90,
      fogFar: 220,
      sunColor: '#ffe4b5',
      sunIntensity: 1.9,
      sunPosition: [-50, 58, 40],
      hemiSky: '#cfdbe8',
      hemiGround: '#595547',
      hemiIntensity: 0.95
    },
    props: [
      {
        kind: 'pine_tree',
        density: 0.024,
        minHeight: 0.2,
        maxHeight: 9,
        maxSlope: 0.35,
        minSpacing: 3.2,
        scaleRange: [0.9, 1.4],
        colliderRadius: 0.52,
        foliageColor: '#3a5f49',
        trunkColor: '#4e392d'
      },
      {
        kind: 'ruin_pillar',
        density: 0.006,
        minHeight: 0.2,
        maxHeight: 8.0,
        maxSlope: 0.25,
        minSpacing: 8.0,
        scaleRange: [0.9, 1.3],
        colliderRadius: 0.75,
        stoneColor: '#8d8f96'
      },
      {
        kind: 'boulder',
        density: 0.02,
        minHeight: -0.3,
        maxHeight: 11,
        maxSlope: 0.6,
        minSpacing: 2.5,
        scaleRange: [0.75, 1.5],
        colliderRadius: 0.8,
        stoneColor: '#6d7078'
      }
    ],
    character: DEFAULT_CHARACTER_PRESET
  },

  'crimson-dunes': {
    id: 'crimson-dunes',
    name: 'Hoang Mạc Hoàng Hôn',
    subtitle: 'Cồn cát đỏ, ốc đảo xanh và khối đá sa thạch',
    defaultSeed: 7777,
    terrain: {
      size: 128,
      segments: 64,
      tileSize: 2.0,
      stepHeight: 0.75,
      noiseScale: 0.023,
      octaves: 3,
      maxHeight: 8,
      ridgeWeight: 0.35,
      terraceSteps: 0,
      waterLevel: -0.6,
      spawnFlatRadius: 10,
      spawnHeight: 0.75,
      islandFalloff: 0.55,
      palette: {
        deepWater: '#1e5b63',
        shallowSand: '#e3bd7d',
        grassLow: '#d99e62',
        grassHigh: '#c77a4a',
        cliffRock: '#914d38',
        peakSnow: '#b56c4e',
        waterSurface: '#2f9ba0'
      }
    },
    atmosphere: {
      skyTop: '#6b4978',
      skyBottom: '#f7b98b',
      fogColor: '#ebc19b',
      fogNear: 95,
      fogFar: 230,
      sunColor: '#ffd1a1',
      sunIntensity: 2.1,
      sunPosition: [60, 42, -35],
      hemiSky: '#ffd9b3',
      hemiGround: '#7a4b38',
      hemiIntensity: 0.95
    },
    props: [
      {
        kind: 'boulder',
        density: 0.018,
        minHeight: -0.2,
        maxHeight: 9,
        maxSlope: 0.6,
        minSpacing: 2.8,
        scaleRange: [0.75, 1.6],
        colliderRadius: 0.85,
        stoneColor: '#99533c'
      },
      {
        kind: 'ruin_pillar',
        density: 0.004,
        minHeight: 0.1,
        maxHeight: 6.5,
        maxSlope: 0.25,
        minSpacing: 9.0,
        scaleRange: [0.9, 1.25],
        colliderRadius: 0.75,
        stoneColor: '#c9a679'
      },
      {
        kind: 'oak_tree',
        density: 0.008,
        minHeight: -0.6,
        maxHeight: 0.8,
        maxSlope: 0.35,
        minSpacing: 4.2,
        scaleRange: [0.85, 1.2],
        colliderRadius: 0.58,
        foliageColor: '#5c9449',
        trunkColor: '#755038'
      }
    ],
    character: DEFAULT_CHARACTER_PRESET
  }
};

// A dedicated reference composition keeps existing saved presets intact.
const referenceBase = WORLD_PRESETS['meadow-isle'];
WORLD_PRESETS['video-grove'] = {
  ...referenceBase,
  id: 'video-grove', name: 'Rừng tham chiếu video',
  subtitle: 'Rừng thông xanh, nền cỏ hình thoi và pha lê giữa khoảng trống',
  terrain: {...referenceBase.terrain, maxHeight: 1.6, ridgeWeight: 0.05,
    spawnFlatRadius: 22, hasRiver: false,
    palette: {...referenceBase.terrain.palette, grassLow: '#80ca51', grassHigh: '#70bd47'}},
  props: referenceBase.props.map(rule => ({...rule,
    density: rule.kind === 'pine_tree' ? 0.075 : rule.kind === 'oak_tree' ? 0.035 : rule.density,
    minSpacing: rule.kind === 'pine_tree' ? 2.6 : rule.kind === 'oak_tree' ? 2.8 : rule.minSpacing,
    scaleRange: rule.kind === 'pine_tree' || rule.kind === 'oak_tree' ? [0.85, 1.15] : rule.scaleRange
  }))
};
