import * as THREE from 'three'
import { toMap, WATER_LEVEL, WATER_RECT, ZONES, zoneWeights } from './map'

/** Towards the morning sun: low in the east-south-east, like the previz hero shot. */
export const SUN_DIR = new THREE.Vector3(0.78, 0.42, 0.46).normalize()

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * p;
  gl_Position.z = gl_Position.w;
}`

const SKY_FRAG = /* glsl */ `
