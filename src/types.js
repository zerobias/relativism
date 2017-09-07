//@flow

import { equals, lensPath, toPairs, fromPairs, append, over } from 'ramda'

type TypeISO<T, K, V, Tag = string> = {
  save(tag: Tag, obj: V, storage: Flatten): K,
  load(tag: Tag, key: K, storage: Flatten): V,
}

type UTag = string | Unit | List | Struct
type Model = { [key: string]: Unit | List | Struct | Model }
type StructObject = { [key: string]: number | number[] | mixed }

class TypeBase {
  type: string
  tag: UTag
  constructor(tag: UTag) {
    this.tag = tag
  }
  toString() {
    return this.inspect()
  }
  inspect() {
    return `${this.type}(${this.tag.toString()})`
  }
  equals(tag: UTag) {
    if (typeof tag === 'string') return equals(this.tag, tag)
    return equals(this.tag, tag.tag)
  }
}

export class Unit extends TypeBase { }

export class List extends TypeBase { }

export class Struct extends TypeBase {
  lenses: Array<{ type: UTag, lens: * }>
  constructor(tag: string, model: Model) {
    super(tag)
    this.lenses = modelToLens(model)
  }
}

Object.defineProperty(Unit.prototype, 'type', {
  value: 'Unit',
  enumerable: true,
})

Object.defineProperty(List.prototype, 'type', {
  value: 'List',
  enumerable: true,
})

Object.defineProperty(Struct.prototype, 'type', {
  value: 'Struct',
  enumerable: true,
})


const joinPath = (path: string[]) => (lenses: Array<{ type: UTag, lens: * }>, [key, value]: [string, Unit | List | Struct | Model]) => {
  const newPath = append(key, path)
  if (value instanceof TypeBase) {
    const result = {
      type: value,
      lens: lensPath(newPath)
    }
    return append(result, lenses)
  }
  const pairs = toPairs(value)
  return pairs.reduce(joinPath(newPath), lenses)
}

function modelToLens(model: Model) {
  const pairs = toPairs(model)
  return pairs.reduce(joinPath([]), [])
}

//$off
export const UnitISO: TypeISO<Unit, number, mixed, Unit> = {
  save(schema: Unit, obj: mixed, storage: Flatten) {
    return ISO.save(schema.tag, obj, storage)
  },
  load(schema: Unit, index: number, storage: Flatten) {
    return ISO.load(schema.tag, index, storage)
  }
}

export const ListISO: TypeISO<List, number[], mixed[], List> = {
  save(schema: List, obj: mixed[], storage: Flatten): number[] {
    const indexes: number[] = []
    for (const unit of obj)
      //$off
      indexes.push(ISO.save(schema.tag, unit, storage))
    return indexes
  },
  load(schema: List, indexes: number[], storage: Flatten): mixed[] {
    const result: mixed[] = []
    for (const index of indexes)
      result.push(ISO.load(schema.tag, index, storage))
    return result
  }
}

//$off
export const StructISO: TypeISO<Struct, StructObject, { [key: string]: any }, Struct> = {
  save(tag: Struct, obj, storage) {
    const result = tag.lenses.reduce(
      (obj, { type, lens }) => over(lens, x => ISO.save(type, x, storage), obj),
      obj
    )
    return ISO.save(tag.tag, result, storage)
  },
  load(schema: Struct, index, storage) {
    const struct = ISO.load(schema.tag, index, storage)
    const result = schema.lenses.reduce(
      (obj, { type, lens }) => over(lens, x => ISO.load(type, x, storage), obj),
      struct
    )
    return result
  },
}

const ISO = {
  save(type: UTag, data, storage: Flatten) {
    if (type instanceof Unit)
      return UnitISO.save(type, data, storage)
    if (type instanceof List && Array.isArray(data))
      return ListISO.save(type, data, storage)
    if (
      type instanceof Struct
      && data != null
    )
      return StructISO.save(type, data, storage)
    return storage.indexOf(type, data)
  },
  load(type: UTag, data, storage: Flatten) {
    if (type instanceof Unit)
      return UnitISO.load(type, data, storage)
    if (type instanceof List && Array.isArray(data))
      return ListISO.load(type, data, storage)
    if (type instanceof Struct)
      return StructISO.load(type, data, storage)
    //$off
    return storage.atIndex(type, data)
  },
}

export function normalize(type: UTag, data: *) {
  const storage = flatState()
  const entities = ISO.save(type, data, storage)
  const index = fromPairs([...storage.data.entries()])
  return {
    entities,
    index,
  }
}

export function denormalize(type: UTag, { entities, index }: *) {
  const storage = flatState()
  storage.data = new Map(toPairs(index))
  return ISO.load(type, entities, storage)
}

export class Flatten {
  data: Map<string, mixed[]> = new Map
  get(tag: UTag): mixed[] {
    const plainTag = getTag(tag)
    const list = this.data.get(plainTag)
    if (!list) {
      const newList: mixed[] = []
      this.data.set(plainTag, newList)
      return newList
    }
    return list
  }
  push(unit: UTag, data: mixed) {
    return this.get(unit).push(data) - 1
  }
  indexOf(unit: UTag, data: mixed): number {
    const list = this.get(unit)
    const index = list.indexOf(data)
    if (index === -1) return list.push(data) - 1
    else return index
  }
  atIndex(tag: UTag, index: number): mixed {
    return this.get(tag)[index]
  }
}


export function unit(tag: UTag): Unit {
  return new Unit(tag)
}

export function list(tag: UTag): List {
  return new List(tag)
}

export function struct(tag: string, model: Model): Struct {
  return new Struct(tag, model)
}

export function flatState() {
  return new Flatten
}


function getTag(tag: UTag): string {
  if (typeof tag === 'string') return tag
  return getTag(tag.tag)
}
