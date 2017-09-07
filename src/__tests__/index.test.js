
import { unit, list, flatState, struct, denormalize, normalize } from '../types'

import { types } from '..'

test('unit', () => {
  const a = unit('a')
  const a1 = unit('a')
  const b = unit('b')
  console.log(a, a1, b)
  expect(a.equals(a1)).toBe(true)
  expect(a.equals(b)).toBe(false)
})

test('list', () => {
  const a = unit('a')
  const listA = list('a')
  const listA1 = list(a)
  console.log(a, listA, listA1)
  expect(listA.equals(listA1)).toBe(false)
})

describe('ListISO', () => {
  test('simple', () => {
    const a = unit('a')
    const listA = list(a)

    const example = ['a', 'b', 'c']
    const saved = normalize(listA, example)
    expect(saved.entities).toEqual([0, 1, 2])

    const loaded = denormalize(listA, saved)
    expect(loaded).toEqual(example)
  })
  test('nested units', () => {
    const a = unit('a')
    const ab = unit(a)
    const listA = list(ab)

    const example = ['a', 'b', 'c']
    const saved = normalize(listA, example)
    expect(saved.entities).toEqual([0, 1, 2])

    const loaded = denormalize(listA, saved)
    expect(loaded).toEqual(example)
  })
  test('nested lists', () => {
    const a = unit('a')
    const ab = unit(a)
    const listA = list(ab)
    const listFull = list(listA)

    const example = [['a', 'b', 'c'], ['d', 'e']]
    const saved = normalize(listFull, example)
    expect(saved.entities).toEqual([[0, 1, 2], [3, 4]])

    const loaded = denormalize(listFull, saved)
    expect(loaded).toEqual(example)

    console.log(saved)
  })
})

describe('Struct', () => {
  test('simple', () => {
    const a = unit('a')
    const s = struct('s', { a })

    const example = { a: 'abc' }

    const saved = normalize(s, example)

    const loaded = denormalize(s, saved)

    expect(loaded).toEqual(example)
  })

  test('with other fields', () => {
    const a = unit('a')
    const s = struct('s', { a, b: a })

    const example = { a: 'abc', field: 'other', b: 'def' }

    const saved = normalize(s, example)

    const loaded = denormalize(s, saved)

    expect(loaded).toEqual(example)

    console.log(saved)
  })

  test('nested', () => {
    const a = unit('a')
    const lst = list(a)
    const s = struct('s', { a, b: a })
    const sList = list(s)
    const ss = struct('ss', { s, lists: { lst, sList } })

    const example = {
      s: { a: 'abc', field: 'other', b: 'def' },
      lists: {
        lst: ['ghi'],
        sList: [{ a: 'jkl', b: 'mno' }, { a: 'pqr', b: 'stu' }],
      }
    }

    const saved = normalize(ss, example)

    const loaded = denormalize(ss, saved)

    expect(loaded).toEqual(example)
  })

  test('from example', () => {
    const something = types.unit('Something')
    const many = types.list(something)
    const pair = types.struct('Pair', {
      foo : something,
      bar: something,
    })
    const pairs = types.list(pair)
    const schema = types.struct('Schema', {
      pair,
      arrays: {
        pairs,
        many,
      }
    })

    const example = {
      pair: {
        foo : 'abc',
        bar: 'def'
      },
      arrays: {
        many: ['ghi'],
        pairs: [{
          foo : 'jkl',
          bar: 'mno'
        }, {
          foo: 'pqr',
          bar: 'stu',
          field: 'other',
        }],
      }
    }

    const normalized = normalize(schema, example)

    const denormalized = denormalize(schema, normalized)

    expect(denormalized).toEqual(example)

    console.log(normalized)
  })
})
