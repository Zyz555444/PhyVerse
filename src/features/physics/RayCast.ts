import RAPIER from '@dimforge/rapier3d'
import type { World, Ray } from '@dimforge/rapier3d'

export interface RayCastResult {
  hit: boolean
  point: [number, number, number] | null
  normal: [number, number, number] | null
  distance: number
  colliderHandle: number | null
}

export function castRay(
  world: World,
  origin: [number, number, number],
  direction: [number, number, number],
  maxToi: number = 100,
  solid: boolean = true,
  filterFlags?: RAPIER.QueryFilterFlags,
  filterGroups?: number
): RayCastResult {
  const ray: Ray = new RAPIER.Ray(
    { x: origin[0], y: origin[1], z: origin[2] },
    { x: direction[0], y: direction[1], z: direction[2] }
  )

  const hit = world.castRay(ray, maxToi, solid, filterFlags, filterGroups)

  if (!hit) {
    return {
      hit: false,
      point: null,
      normal: null,
      distance: 0,
      colliderHandle: null,
    }
  }

  const point = ray.pointAt(hit.timeOfImpact)

  return {
    hit: true,
    point: [point.x, point.y, point.z],
    normal: null,
    distance: hit.timeOfImpact,
    colliderHandle: hit.collider?.handle ?? null,
  }
}

export function castRayAndGetNormal(
  world: World,
  origin: [number, number, number],
  direction: [number, number, number],
  maxToi: number = 100
): RayCastResult {
  const ray: Ray = new RAPIER.Ray(
    { x: origin[0], y: origin[1], z: origin[2] },
    { x: direction[0], y: direction[1], z: direction[2] }
  )

  const hit = world.castRayAndGetNormal(ray, maxToi, true)

  if (!hit) {
    return {
      hit: false,
      point: null,
      normal: null,
      distance: 0,
      colliderHandle: null,
    }
  }

  const point = ray.pointAt(hit.timeOfImpact)
  const normal = hit.normal

  return {
    hit: true,
    point: [point.x, point.y, point.z],
    normal: [normal.x, normal.y, normal.z],
    distance: hit.timeOfImpact,
    colliderHandle: hit.collider?.handle ?? null,
  }
}

export interface RayCastMultipleResult {
  count: number
  hits: Array<{
    point: [number, number, number]
    normal: [number, number, number]
    distance: number
    colliderHandle: number
  }>
}

export function castRayMultiple(
  world: World,
  origin: [number, number, number],
  direction: [number, number, number],
  maxToi: number = 100
): RayCastMultipleResult {
  const ray: Ray = new RAPIER.Ray(
    { x: origin[0], y: origin[1], z: origin[2] },
    { x: direction[0], y: direction[1], z: direction[2] }
  )

  const hits = world.castRayAndGetNormal(ray, maxToi, true)

  if (!hits) {
    return { count: 0, hits: [] }
  }

  const point = ray.pointAt(hits.timeOfImpact)
  const normal = hits.normal

  return {
    count: 1,
    hits: [
      {
        point: [point.x, point.y, point.z],
        normal: [normal.x, normal.y, normal.z],
        distance: hits.timeOfImpact,
        colliderHandle: hits.collider?.handle ?? -1,
      },
    ],
  }
}

export function reflectVector(
  incident: [number, number, number],
  normal: [number, number, number]
): [number, number, number] {
  const dot = incident[0] * normal[0] + incident[1] * normal[1] + incident[2] * normal[2]
  return [
    incident[0] - 2 * dot * normal[0],
    incident[1] - 2 * dot * normal[1],
    incident[2] - 2 * dot * normal[2],
  ]
}

export function refractVector(
  incident: [number, number, number],
  normal: [number, number, number],
  eta: number
): [number, number, number] | null {
  const cosI = -(incident[0] * normal[0] + incident[1] * normal[1] + incident[2] * normal[2])
  const sinT2 = eta * eta * (1 - cosI * cosI)
  if (sinT2 > 1) {
    return null
  }
  const cosT = Math.sqrt(1 - sinT2)
  return [
    eta * incident[0] + (eta * cosI - cosT) * normal[0],
    eta * incident[1] + (eta * cosI - cosT) * normal[1],
    eta * incident[2] + (eta * cosI - cosT) * normal[2],
  ]
}
