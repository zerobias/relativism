# Relativism

Deep JSON normalization

```javascript

import { types, normalize, denormalize } from 'relativism'

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


const denormalized = denormalize(schema, saved) // Source object

```

Normalized object

```json
{
  "entities": [ 0 ],
  "index": {
    "something": [
      "abc",
      "def",
      "jkl",
      "mno",
      "pqr",
      "stu",
      "ghi"
    ],
    "pair": [{
        "foo": 0,
        "bar": 1
      }, {
        "foo": 2,
        "bar": 3
      }, {
        "foo": 4,
        "bar": 5,
        "field": "other"
      }],
    "schema": [{
      "pair": 0,
      "arrays": {
        "many": [ 6 ],
        "pairs": [ 1, 2 ]
      }
    }]
  }
}

```
