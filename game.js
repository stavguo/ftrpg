(function () {
  'use strict';

  var global = window;

  // src/Constants.js
  var TYPES_ENUM = {
    i8: "i8",
    ui8: "ui8",
    ui8c: "ui8c",
    i16: "i16",
    ui16: "ui16",
    i32: "i32",
    ui32: "ui32",
    f32: "f32",
    f64: "f64",
    eid: "eid"
  };
  var TYPES_NAMES = {
    i8: "Int8",
    ui8: "Uint8",
    ui8c: "Uint8Clamped",
    i16: "Int16",
    ui16: "Uint16",
    i32: "Int32",
    ui32: "Uint32",
    eid: "Uint32",
    f32: "Float32",
    f64: "Float64"
  };
  var TYPES = {
    i8: Int8Array,
    ui8: Uint8Array,
    ui8c: Uint8ClampedArray,
    i16: Int16Array,
    ui16: Uint16Array,
    i32: Int32Array,
    ui32: Uint32Array,
    f32: Float32Array,
    f64: Float64Array,
    eid: Uint32Array
  };
  var UNSIGNED_MAX = {
    uint8: 2 ** 8,
    uint16: 2 ** 16,
    uint32: 2 ** 32
  };

  // src/Storage.js
  var roundToMultiple = (mul) => (x) => Math.ceil(x / mul) * mul;
  var roundToMultiple4 = roundToMultiple(4);
  var $storeRef = Symbol("storeRef");
  var $storeSize = Symbol("storeSize");
  var $storeMaps = Symbol("storeMaps");
  var $storeFlattened = Symbol("storeFlattened");
  var $storeBase = Symbol("storeBase");
  var $storeType = Symbol("storeType");
  var $storeArrayElementCounts = Symbol("storeArrayElementCounts");
  var $storeSubarrays = Symbol("storeSubarrays");
  var $subarrayCursors = Symbol("subarrayCursors");
  var $subarray = Symbol("subarray");
  var $parentArray = Symbol("parentArray");
  var $tagStore = Symbol("tagStore");
  var $indexType = Symbol("indexType");
  var $indexBytes = Symbol("indexBytes");
  var $isEidType = Symbol("isEidType");
  var stores = {};
  var resize = (ta, size) => {
    const newBuffer = new ArrayBuffer(size * ta.BYTES_PER_ELEMENT);
    const newTa = new ta.constructor(newBuffer);
    newTa.set(ta, 0);
    return newTa;
  };
  var createShadow = (store, key) => {
    if (!ArrayBuffer.isView(store)) {
      const shadowStore = store[$parentArray].slice(0);
      store[key] = store.map((_, eid) => {
        const { length } = store[eid];
        const start = length * eid;
        const end = start + length;
        return shadowStore.subarray(start, end);
      });
    } else {
      store[key] = store.slice(0);
    }
  };
  var resizeSubarray = (metadata, store, storeSize) => {
    const cursors = metadata[$subarrayCursors];
    let type = store[$storeType];
    const length = store[0].length;
    const indexType = length <= UNSIGNED_MAX.uint8 ? TYPES_ENUM.ui8 : length <= UNSIGNED_MAX.uint16 ? TYPES_ENUM.ui16 : TYPES_ENUM.ui32;
    if (cursors[type] === 0) {
      const arrayElementCount = metadata[$storeArrayElementCounts][type];
      const array = new TYPES[type](roundToMultiple4(arrayElementCount * storeSize));
      array.set(metadata[$storeSubarrays][type]);
      metadata[$storeSubarrays][type] = array;
      array[$indexType] = TYPES_NAMES[indexType];
      array[$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT;
    }
    const start = cursors[type];
    const end = start + storeSize * length;
    cursors[type] = end;
    store[$parentArray] = metadata[$storeSubarrays][type].subarray(start, end);
    for (let eid = 0; eid < storeSize; eid++) {
      const start2 = length * eid;
      const end2 = start2 + length;
      store[eid] = store[$parentArray].subarray(start2, end2);
      store[eid][$indexType] = TYPES_NAMES[indexType];
      store[eid][$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT;
      store[eid][$subarray] = true;
    }
  };
  var resizeRecursive = (metadata, store, size) => {
    Object.keys(store).forEach((key) => {
      const ta = store[key];
      if (Array.isArray(ta)) {
        resizeSubarray(metadata, ta, size);
        store[$storeFlattened].push(ta);
      } else if (ArrayBuffer.isView(ta)) {
        store[key] = resize(ta, size);
        store[$storeFlattened].push(store[key]);
      } else if (typeof ta === "object") {
        resizeRecursive(metadata, store[key], size);
      }
    });
  };
  var resizeStore = (store, size) => {
    if (store[$tagStore])
      return;
    store[$storeSize] = size;
    store[$storeFlattened].length = 0;
    Object.keys(store[$subarrayCursors]).forEach((k) => {
      store[$subarrayCursors][k] = 0;
    });
    resizeRecursive(store, store, size);
  };
  var resetStoreFor = (store, eid) => {
    if (store[$storeFlattened]) {
      store[$storeFlattened].forEach((ta) => {
        if (ArrayBuffer.isView(ta))
          ta[eid] = 0;
        else
          ta[eid].fill(0);
      });
    }
  };
  var createTypeStore = (type, length) => {
    const totalBytes = length * TYPES[type].BYTES_PER_ELEMENT;
    const buffer = new ArrayBuffer(totalBytes);
    const store = new TYPES[type](buffer);
    store[$isEidType] = type === TYPES_ENUM.eid;
    return store;
  };
  var createArrayStore = (metadata, type, length) => {
    const storeSize = metadata[$storeSize];
    const store = Array(storeSize).fill(0);
    store[$storeType] = type;
    store[$isEidType] = type === TYPES_ENUM.eid;
    const cursors = metadata[$subarrayCursors];
    const indexType = length <= UNSIGNED_MAX.uint8 ? TYPES_ENUM.ui8 : length <= UNSIGNED_MAX.uint16 ? TYPES_ENUM.ui16 : TYPES_ENUM.ui32;
    if (!length)
      throw new Error("bitECS - Must define component array length");
    if (!TYPES[type])
      throw new Error(`bitECS - Invalid component array property type ${type}`);
    if (!metadata[$storeSubarrays][type]) {
      const arrayElementCount = metadata[$storeArrayElementCounts][type];
      const array = new TYPES[type](roundToMultiple4(arrayElementCount * storeSize));
      array[$indexType] = TYPES_NAMES[indexType];
      array[$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT;
      metadata[$storeSubarrays][type] = array;
    }
    const start = cursors[type];
    const end = start + storeSize * length;
    cursors[type] = end;
    store[$parentArray] = metadata[$storeSubarrays][type].subarray(start, end);
    for (let eid = 0; eid < storeSize; eid++) {
      const start2 = length * eid;
      const end2 = start2 + length;
      store[eid] = store[$parentArray].subarray(start2, end2);
      store[eid][$indexType] = TYPES_NAMES[indexType];
      store[eid][$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT;
      store[eid][$subarray] = true;
    }
    return store;
  };
  var isArrayType = (x) => Array.isArray(x) && typeof x[0] === "string" && typeof x[1] === "number";
  var createStore = (schema, size) => {
    const $store = Symbol("store");
    if (!schema || !Object.keys(schema).length) {
      stores[$store] = {
        [$storeSize]: size,
        [$tagStore]: true,
        [$storeBase]: () => stores[$store]
      };
      return stores[$store];
    }
    schema = JSON.parse(JSON.stringify(schema));
    const arrayElementCounts = {};
    const collectArrayElementCounts = (s) => {
      const keys = Object.keys(s);
      for (const k of keys) {
        if (isArrayType(s[k])) {
          if (!arrayElementCounts[s[k][0]])
            arrayElementCounts[s[k][0]] = 0;
          arrayElementCounts[s[k][0]] += s[k][1];
        } else if (s[k] instanceof Object) {
          collectArrayElementCounts(s[k]);
        }
      }
    };
    collectArrayElementCounts(schema);
    const metadata = {
      [$storeSize]: size,
      [$storeMaps]: {},
      [$storeSubarrays]: {},
      [$storeRef]: $store,
      [$subarrayCursors]: Object.keys(TYPES).reduce((a, type) => ({ ...a, [type]: 0 }), {}),
      [$storeFlattened]: [],
      [$storeArrayElementCounts]: arrayElementCounts
    };
    if (schema instanceof Object && Object.keys(schema).length) {
      const recursiveTransform = (a, k) => {
        if (typeof a[k] === "string") {
          a[k] = createTypeStore(a[k], size);
          a[k][$storeBase] = () => stores[$store];
          metadata[$storeFlattened].push(a[k]);
        } else if (isArrayType(a[k])) {
          const [type, length] = a[k];
          a[k] = createArrayStore(metadata, type, length);
          a[k][$storeBase] = () => stores[$store];
          metadata[$storeFlattened].push(a[k]);
        } else if (a[k] instanceof Object) {
          a[k] = Object.keys(a[k]).reduce(recursiveTransform, a[k]);
        }
        return a;
      };
      stores[$store] = Object.assign(Object.keys(schema).reduce(recursiveTransform, schema), metadata);
      stores[$store][$storeBase] = () => stores[$store];
      return stores[$store];
    }
  };

  // src/Util.js
  var SparseSet = () => {
    const dense = [];
    const sparse = [];
    dense.sort = function(comparator) {
      const result = Array.prototype.sort.call(this, comparator);
      for (let i = 0; i < dense.length; i++) {
        sparse[dense[i]] = i;
      }
      return result;
    };
    const has = (val) => dense[sparse[val]] === val;
    const add = (val) => {
      if (has(val))
        return;
      sparse[val] = dense.push(val) - 1;
    };
    const remove = (val) => {
      if (!has(val))
        return;
      const index = sparse[val];
      const swapped = dense.pop();
      if (swapped !== val) {
        dense[index] = swapped;
        sparse[swapped] = index;
      }
    };
    return {
      add,
      remove,
      has,
      sparse,
      dense
    };
  };

  // src/Entity.js
  var $entityMasks = Symbol("entityMasks");
  var $entityComponents = Symbol("entityComponents");
  var $entitySparseSet = Symbol("entitySparseSet");
  var $entityArray = Symbol("entityArray");
  var defaultSize = 1e5;
  var globalEntityCursor = 0;
  var globalSize = defaultSize;
  var resizeThreshold = () => globalSize - globalSize / 5;
  var getGlobalSize = () => globalSize;
  var removed = [];
  var resetGlobals = () => {
    globalSize = defaultSize;
    globalEntityCursor = 0;
    removed.length = 0;
  };
  var setDefaultSize = (newSize) => {
    const oldSize = globalSize;
    defaultSize = newSize;
    resetGlobals();
    globalSize = newSize;
    resizeWorlds(newSize);
    resizeComponents(newSize);
    console.info(`\u{1F47E} bitECS - resizing all data stores from ${oldSize} to ${newSize}`);
  };
  var getEntityCursor = () => globalEntityCursor;
  var eidToWorld = /* @__PURE__ */ new Map();
  var addEntity = (world) => {
    if (globalEntityCursor >= resizeThreshold()) {
      const size = globalSize;
      const amount = Math.ceil(size / 2 / 4) * 4;
      setDefaultSize(size + amount);
    }
    const eid = removed.length > Math.round(defaultSize * 0.01) ? removed.shift() : globalEntityCursor++;
    world[$entitySparseSet].add(eid);
    eidToWorld.set(eid, world);
    world[$notQueries].forEach((q) => {
      const match = queryCheckEntity(world, q, eid);
      if (match)
        queryAddEntity(q, eid);
    });
    world[$entityComponents].set(eid, /* @__PURE__ */ new Set());
    return eid;
  };
  var removeEntity = (world, eid) => {
    if (!world[$entitySparseSet].has(eid))
      return;
    world[$queries].forEach((q) => {
      queryRemoveEntity(world, q, eid);
    });
    removed.push(eid);
    world[$entitySparseSet].remove(eid);
    world[$entityComponents].delete(eid);
    world[$localEntities].delete(world[$localEntityLookup].get(eid));
    world[$localEntityLookup].delete(eid);
    for (let i = 0; i < world[$entityMasks].length; i++)
      world[$entityMasks][i][eid] = 0;
  };

  // src/Query.js
  function Not(c) {
    return () => [c, "not"];
  }
  var $queries = Symbol("queries");
  var $notQueries = Symbol("notQueries");
  var $queryAny = Symbol("queryAny");
  var $queryAll = Symbol("queryAll");
  var $queryNone = Symbol("queryNone");
  var $queryMap = Symbol("queryMap");
  var $dirtyQueries = Symbol("$dirtyQueries");
  var $queryComponents = Symbol("queryComponents");
  var enterQuery = (query) => (world) => {
    if (!world[$queryMap].has(query))
      registerQuery(world, query);
    const q = world[$queryMap].get(query);
    const entered = q.entered.dense.slice();
    q.entered = SparseSet();
    return entered;
  };
  var registerQuery = (world, query) => {
    const components2 = [];
    const notComponents = [];
    const changedComponents = [];
    query[$queryComponents].forEach((c) => {
      if (typeof c === "function") {
        const [comp, mod] = c();
        if (!world[$componentMap].has(comp))
          registerComponent(world, comp);
        if (mod === "not") {
          notComponents.push(comp);
        }
        if (mod === "changed") {
          changedComponents.push(comp);
          components2.push(comp);
        }
      } else {
        if (!world[$componentMap].has(c))
          registerComponent(world, c);
        components2.push(c);
      }
    });
    const mapComponents = (c) => world[$componentMap].get(c);
    const allComponents = components2.concat(notComponents).map(mapComponents);
    const sparseSet = SparseSet();
    const archetypes = [];
    const changed = [];
    const toRemove = SparseSet();
    const entered = SparseSet();
    const exited = SparseSet();
    const generations = allComponents.map((c) => c.generationId).reduce((a, v) => {
      if (a.includes(v))
        return a;
      a.push(v);
      return a;
    }, []);
    const reduceBitflags = (a, c) => {
      if (!a[c.generationId])
        a[c.generationId] = 0;
      a[c.generationId] |= c.bitflag;
      return a;
    };
    const masks = components2.map(mapComponents).reduce(reduceBitflags, {});
    const notMasks = notComponents.map(mapComponents).reduce(reduceBitflags, {});
    const hasMasks = allComponents.reduce(reduceBitflags, {});
    const flatProps = components2.filter((c) => !c[$tagStore]).map((c) => Object.getOwnPropertySymbols(c).includes($storeFlattened) ? c[$storeFlattened] : [c]).reduce((a, v) => a.concat(v), []);
    const shadows = [];
    const q = Object.assign(sparseSet, {
      archetypes,
      changed,
      components: components2,
      notComponents,
      changedComponents,
      allComponents,
      masks,
      notMasks,
      hasMasks,
      generations,
      flatProps,
      toRemove,
      entered,
      exited,
      shadows
    });
    world[$queryMap].set(query, q);
    world[$queries].add(q);
    allComponents.forEach((c) => {
      c.queries.add(q);
    });
    if (notComponents.length)
      world[$notQueries].add(q);
    for (let eid = 0; eid < getEntityCursor(); eid++) {
      if (!world[$entitySparseSet].has(eid))
        continue;
      const match = queryCheckEntity(world, q, eid);
      if (match)
        queryAddEntity(q, eid);
    }
  };
  var generateShadow = (q, pid) => {
    const $ = Symbol();
    const prop = q.flatProps[pid];
    createShadow(prop, $);
    q.shadows[pid] = prop[$];
    return prop[$];
  };
  var diff = (q, clearDiff) => {
    if (clearDiff)
      q.changed = [];
    const { flatProps, shadows } = q;
    for (let i = 0; i < q.dense.length; i++) {
      const eid = q.dense[i];
      let dirty = false;
      for (let pid = 0; pid < flatProps.length; pid++) {
        const prop = flatProps[pid];
        const shadow = shadows[pid] || generateShadow(q, pid);
        if (ArrayBuffer.isView(prop[eid])) {
          for (let i2 = 0; i2 < prop[eid].length; i2++) {
            if (prop[eid][i2] !== shadow[eid][i2]) {
              dirty = true;
              break;
            }
          }
          shadow[eid].set(prop[eid]);
        } else {
          if (prop[eid] !== shadow[eid]) {
            dirty = true;
            shadow[eid] = prop[eid];
          }
        }
      }
      if (dirty)
        q.changed.push(eid);
    }
    return q.changed;
  };
  var defineQuery = (...args) => {
    let components2;
    let any, all, none;
    if (Array.isArray(args[0])) {
      components2 = args[0];
    }
    if (components2 === void 0 || components2[$componentMap] !== void 0) {
      return (world) => world ? world[$entityArray] : components2[$entityArray];
    }
    const query = function(world, clearDiff = true) {
      if (!world[$queryMap].has(query))
        registerQuery(world, query);
      const q = world[$queryMap].get(query);
      commitRemovals(world);
      if (q.changedComponents.length)
        return diff(q, clearDiff);
      return q.dense;
    };
    query[$queryComponents] = components2;
    query[$queryAny] = any;
    query[$queryAll] = all;
    query[$queryNone] = none;
    return query;
  };
  var queryCheckEntity = (world, q, eid) => {
    const { masks, notMasks, generations } = q;
    for (let i = 0; i < generations.length; i++) {
      const generationId = generations[i];
      const qMask = masks[generationId];
      const qNotMask = notMasks[generationId];
      const eMask = world[$entityMasks][generationId][eid];
      if (qNotMask && (eMask & qNotMask) !== 0) {
        return false;
      }
      if (qMask && (eMask & qMask) !== qMask) {
        return false;
      }
    }
    return true;
  };
  var queryAddEntity = (q, eid) => {
    q.toRemove.remove(eid);
    q.entered.add(eid);
    q.add(eid);
  };
  var queryCommitRemovals = (q) => {
    for (let i = q.toRemove.dense.length - 1; i >= 0; i--) {
      const eid = q.toRemove.dense[i];
      q.toRemove.remove(eid);
      q.remove(eid);
    }
  };
  var commitRemovals = (world) => {
    if (!world[$dirtyQueries].size)
      return;
    world[$dirtyQueries].forEach(queryCommitRemovals);
    world[$dirtyQueries].clear();
  };
  var queryRemoveEntity = (world, q, eid) => {
    if (!q.has(eid) || q.toRemove.has(eid))
      return;
    q.toRemove.add(eid);
    world[$dirtyQueries].add(q);
    q.exited.add(eid);
  };

  // src/Component.js
  var $componentMap = Symbol("componentMap");
  var components = [];
  var resizeComponents = (size) => {
    components.forEach((component) => resizeStore(component, size));
  };
  var defineComponent = (schema, size) => {
    const component = createStore(schema, size || getGlobalSize());
    if (schema && Object.keys(schema).length)
      components.push(component);
    return component;
  };
  var incrementBitflag = (world) => {
    world[$bitflag] *= 2;
    if (world[$bitflag] >= 2 ** 31) {
      world[$bitflag] = 1;
      world[$entityMasks].push(new Uint32Array(world[$size]));
    }
  };
  var registerComponent = (world, component) => {
    if (!component)
      throw new Error(`bitECS - Cannot register null or undefined component`);
    const queries = /* @__PURE__ */ new Set();
    const notQueries = /* @__PURE__ */ new Set();
    const changedQueries = /* @__PURE__ */ new Set();
    world[$queries].forEach((q) => {
      if (q.allComponents.includes(component)) {
        queries.add(q);
      }
    });
    world[$componentMap].set(component, {
      generationId: world[$entityMasks].length - 1,
      bitflag: world[$bitflag],
      store: component,
      queries,
      notQueries,
      changedQueries
    });
    if (component[$storeSize] < getGlobalSize()) {
      resizeStore(component, getGlobalSize());
    }
    incrementBitflag(world);
  };
  var hasComponent = (world, component, eid) => {
    const registeredComponent = world[$componentMap].get(component);
    if (!registeredComponent)
      return false;
    const { generationId, bitflag } = registeredComponent;
    const mask = world[$entityMasks][generationId][eid];
    return (mask & bitflag) === bitflag;
  };
  var addComponent = (world, component, eid, reset = false) => {
    if (eid === void 0)
      throw new Error("bitECS - entity is undefined.");
    if (!world[$entitySparseSet].has(eid))
      throw new Error("bitECS - entity does not exist in the world.");
    if (!world[$componentMap].has(component))
      registerComponent(world, component);
    if (hasComponent(world, component, eid))
      return;
    const c = world[$componentMap].get(component);
    const { generationId, bitflag, queries, notQueries } = c;
    world[$entityMasks][generationId][eid] |= bitflag;
    queries.forEach((q) => {
      if (q.toRemove.has(eid))
        q.toRemove.remove(eid);
      const match = queryCheckEntity(world, q, eid);
      if (match)
        queryAddEntity(q, eid);
      if (!match)
        queryRemoveEntity(world, q, eid);
    });
    world[$entityComponents].get(eid).add(component);
    if (reset)
      resetStoreFor(component, eid);
  };
  var removeComponent = (world, component, eid, reset = true) => {
    if (eid === void 0)
      throw new Error("bitECS - entity is undefined.");
    if (!world[$entitySparseSet].has(eid))
      throw new Error("bitECS - entity does not exist in the world.");
    if (!hasComponent(world, component, eid))
      return;
    const c = world[$componentMap].get(component);
    const { generationId, bitflag, queries } = c;
    world[$entityMasks][generationId][eid] &= ~bitflag;
    queries.forEach((q) => {
      if (q.toRemove.has(eid))
        q.toRemove.remove(eid);
      const match = queryCheckEntity(world, q, eid);
      if (match)
        queryAddEntity(q, eid);
      if (!match)
        queryRemoveEntity(world, q, eid);
    });
    world[$entityComponents].get(eid).delete(component);
    if (reset)
      resetStoreFor(component, eid);
  };

  // src/World.js
  var $size = Symbol("size");
  var $resizeThreshold = Symbol("resizeThreshold");
  var $bitflag = Symbol("bitflag");
  var $archetypes = Symbol("archetypes");
  var $localEntities = Symbol("localEntities");
  var $localEntityLookup = Symbol("localEntityLookp");
  var worlds = [];
  var resizeWorlds = (size) => {
    worlds.forEach((world) => {
      world[$size] = size;
      for (let i = 0; i < world[$entityMasks].length; i++) {
        const masks = world[$entityMasks][i];
        world[$entityMasks][i] = resize(masks, size);
      }
      world[$resizeThreshold] = world[$size] - world[$size] / 5;
    });
  };
  var createWorld = (...args) => {
    const world = typeof args[0] === "object" ? args[0] : {};
    const size = typeof args[0] === "number" ? args[0] : typeof args[1] === "number" ? args[1] : getGlobalSize();
    resetWorld(world, size);
    worlds.push(world);
    return world;
  };
  var resetWorld = (world, size = getGlobalSize()) => {
    world[$size] = size;
    if (world[$entityArray])
      world[$entityArray].forEach((eid) => removeEntity(world, eid));
    world[$entityMasks] = [new Uint32Array(size)];
    world[$entityComponents] = /* @__PURE__ */ new Map();
    world[$archetypes] = [];
    world[$entitySparseSet] = SparseSet();
    world[$entityArray] = world[$entitySparseSet].dense;
    world[$bitflag] = 1;
    world[$componentMap] = /* @__PURE__ */ new Map();
    world[$queryMap] = /* @__PURE__ */ new Map();
    world[$queries] = /* @__PURE__ */ new Set();
    world[$notQueries] = /* @__PURE__ */ new Set();
    world[$dirtyQueries] = /* @__PURE__ */ new Set();
    world[$localEntities] = /* @__PURE__ */ new Map();
    world[$localEntityLookup] = /* @__PURE__ */ new Map();
    return world;
  };

  // src/index.js
  var pipe = (...fns) => (input) => {
    let tmp = input;
    for (let i = 0; i < fns.length; i++) {
      const fn = fns[i];
      tmp = fn(tmp);
    }
    return tmp;
  };
  var Types = TYPES_ENUM;

  /**
   * This code is an implementation of Alea algorithm; (C) 2010 Johannes Baagøe.
   * Alea is licensed according to the http://en.wikipedia.org/wiki/MIT_License.
   */
  const FRAC = 2.3283064365386963e-10; /* 2^-32 */
  class RNG {
      constructor() {
          this._seed = 0;
          this._s0 = 0;
          this._s1 = 0;
          this._s2 = 0;
          this._c = 0;
      }
      getSeed() { return this._seed; }
      /**
       * Seed the number generator
       */
      setSeed(seed) {
          seed = (seed < 1 ? 1 / seed : seed);
          this._seed = seed;
          this._s0 = (seed >>> 0) * FRAC;
          seed = (seed * 69069 + 1) >>> 0;
          this._s1 = seed * FRAC;
          seed = (seed * 69069 + 1) >>> 0;
          this._s2 = seed * FRAC;
          this._c = 1;
          return this;
      }
      /**
       * @returns Pseudorandom value [0,1), uniformly distributed
       */
      getUniform() {
          let t = 2091639 * this._s0 + this._c * FRAC;
          this._s0 = this._s1;
          this._s1 = this._s2;
          this._c = t | 0;
          this._s2 = t - this._c;
          return this._s2;
      }
      /**
       * @param lowerBound The lower end of the range to return a value from, inclusive
       * @param upperBound The upper end of the range to return a value from, inclusive
       * @returns Pseudorandom value [lowerBound, upperBound], using ROT.RNG.getUniform() to distribute the value
       */
      getUniformInt(lowerBound, upperBound) {
          let max = Math.max(lowerBound, upperBound);
          let min = Math.min(lowerBound, upperBound);
          return Math.floor(this.getUniform() * (max - min + 1)) + min;
      }
      /**
       * @param mean Mean value
       * @param stddev Standard deviation. ~95% of the absolute values will be lower than 2*stddev.
       * @returns A normally distributed pseudorandom value
       */
      getNormal(mean = 0, stddev = 1) {
          let u, v, r;
          do {
              u = 2 * this.getUniform() - 1;
              v = 2 * this.getUniform() - 1;
              r = u * u + v * v;
          } while (r > 1 || r == 0);
          let gauss = u * Math.sqrt(-2 * Math.log(r) / r);
          return mean + gauss * stddev;
      }
      /**
       * @returns Pseudorandom value [1,100] inclusive, uniformly distributed
       */
      getPercentage() {
          return 1 + Math.floor(this.getUniform() * 100);
      }
      /**
       * @returns Randomly picked item, null when length=0
       */
      getItem(array) {
          if (!array.length) {
              return null;
          }
          return array[Math.floor(this.getUniform() * array.length)];
      }
      /**
       * @returns New array with randomized items
       */
      shuffle(array) {
          let result = [];
          let clone = array.slice();
          while (clone.length) {
              let index = clone.indexOf(this.getItem(clone));
              result.push(clone.splice(index, 1)[0]);
          }
          return result;
      }
      /**
       * @param data key=whatever, value=weight (relative probability)
       * @returns whatever
       */
      getWeightedValue(data) {
          let total = 0;
          for (let id in data) {
              total += data[id];
          }
          let random = this.getUniform() * total;
          let id, part = 0;
          for (id in data) {
              part += data[id];
              if (random < part) {
                  return id;
              }
          }
          // If by some floating-point annoyance we have
          // random >= total, just return the last id.
          return id;
      }
      /**
       * Get RNG state. Useful for storing the state and re-setting it via setState.
       * @returns Internal state
       */
      getState() { return [this._s0, this._s1, this._s2, this._c]; }
      /**
       * Set a previously retrieved state.
       */
      setState(state) {
          this._s0 = state[0];
          this._s1 = state[1];
          this._s2 = state[2];
          this._c = state[3];
          return this;
      }
      /**
       * Returns a cloned RNG
       */
      clone() {
          let clone = new RNG();
          return clone.setState(this.getState());
      }
  }
  var RNG$1 = new RNG().setSeed(Date.now());

  /**
   * @class Abstract display backend module
   * @private
   */
  class Backend {
      getContainer() { return null; }
      setOptions(options) { this._options = options; }
  }

  class Canvas extends Backend {
      constructor() {
          super();
          this._ctx = document.createElement("canvas").getContext("2d");
      }
      schedule(cb) { requestAnimationFrame(cb); }
      getContainer() { return this._ctx.canvas; }
      setOptions(opts) {
          super.setOptions(opts);
          const style = (opts.fontStyle ? `${opts.fontStyle} ` : ``);
          const font = `${style} ${opts.fontSize}px ${opts.fontFamily}`;
          this._ctx.font = font;
          this._updateSize();
          this._ctx.font = font;
          this._ctx.textAlign = "center";
          this._ctx.textBaseline = "middle";
      }
      clear() {
          this._ctx.fillStyle = this._options.bg;
          this._ctx.fillRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height);
      }
      eventToPosition(x, y) {
          let canvas = this._ctx.canvas;
          let rect = canvas.getBoundingClientRect();
          x -= rect.left;
          y -= rect.top;
          x *= canvas.width / rect.width;
          y *= canvas.height / rect.height;
          if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
              return [-1, -1];
          }
          return this._normalizedEventToPosition(x, y);
      }
  }

  /**
   * Always positive modulus
   * @param x Operand
   * @param n Modulus
   * @returns x modulo n
   */
  function mod(x, n) {
      return (x % n + n) % n;
  }

  /**
   * @class Hexagonal backend
   * @private
   */
  class Hex extends Canvas {
      constructor() {
          super();
          this._spacingX = 0;
          this._spacingY = 0;
          this._hexSize = 0;
      }
      draw(data, clearBefore) {
          let [x, y, ch, fg, bg] = data;
          let px = [
              (x + 1) * this._spacingX,
              y * this._spacingY + this._hexSize
          ];
          if (this._options.transpose) {
              px.reverse();
          }
          if (clearBefore) {
              this._ctx.fillStyle = bg;
              this._fill(px[0], px[1]);
          }
          if (!ch) {
              return;
          }
          this._ctx.fillStyle = fg;
          let chars = [].concat(ch);
          for (let i = 0; i < chars.length; i++) {
              this._ctx.fillText(chars[i], px[0], Math.ceil(px[1]));
          }
      }
      computeSize(availWidth, availHeight) {
          if (this._options.transpose) {
              availWidth += availHeight;
              availHeight = availWidth - availHeight;
              availWidth -= availHeight;
          }
          let width = Math.floor(availWidth / this._spacingX) - 1;
          let height = Math.floor((availHeight - 2 * this._hexSize) / this._spacingY + 1);
          return [width, height];
      }
      computeFontSize(availWidth, availHeight) {
          if (this._options.transpose) {
              availWidth += availHeight;
              availHeight = availWidth - availHeight;
              availWidth -= availHeight;
          }
          let hexSizeWidth = 2 * availWidth / ((this._options.width + 1) * Math.sqrt(3)) - 1;
          let hexSizeHeight = availHeight / (2 + 1.5 * (this._options.height - 1));
          let hexSize = Math.min(hexSizeWidth, hexSizeHeight);
          // compute char ratio
          let oldFont = this._ctx.font;
          this._ctx.font = "100px " + this._options.fontFamily;
          let width = Math.ceil(this._ctx.measureText("W").width);
          this._ctx.font = oldFont;
          let ratio = width / 100;
          hexSize = Math.floor(hexSize) + 1; // closest larger hexSize
          // FIXME char size computation does not respect transposed hexes
          let fontSize = 2 * hexSize / (this._options.spacing * (1 + ratio / Math.sqrt(3)));
          // closest smaller fontSize
          return Math.ceil(fontSize) - 1;
      }
      _normalizedEventToPosition(x, y) {
          let nodeSize;
          if (this._options.transpose) {
              x += y;
              y = x - y;
              x -= y;
              nodeSize = this._ctx.canvas.width;
          }
          else {
              nodeSize = this._ctx.canvas.height;
          }
          let size = nodeSize / this._options.height;
          y = Math.floor(y / size);
          if (mod(y, 2)) { /* odd row */
              x -= this._spacingX;
              x = 1 + 2 * Math.floor(x / (2 * this._spacingX));
          }
          else {
              x = 2 * Math.floor(x / (2 * this._spacingX));
          }
          return [x, y];
      }
      /**
       * Arguments are pixel values. If "transposed" mode is enabled, then these two are already swapped.
       */
      _fill(cx, cy) {
          let a = this._hexSize;
          let b = this._options.border;
          const ctx = this._ctx;
          ctx.beginPath();
          if (this._options.transpose) {
              ctx.moveTo(cx - a + b, cy);
              ctx.lineTo(cx - a / 2 + b, cy + this._spacingX - b);
              ctx.lineTo(cx + a / 2 - b, cy + this._spacingX - b);
              ctx.lineTo(cx + a - b, cy);
              ctx.lineTo(cx + a / 2 - b, cy - this._spacingX + b);
              ctx.lineTo(cx - a / 2 + b, cy - this._spacingX + b);
              ctx.lineTo(cx - a + b, cy);
          }
          else {
              ctx.moveTo(cx, cy - a + b);
              ctx.lineTo(cx + this._spacingX - b, cy - a / 2 + b);
              ctx.lineTo(cx + this._spacingX - b, cy + a / 2 - b);
              ctx.lineTo(cx, cy + a - b);
              ctx.lineTo(cx - this._spacingX + b, cy + a / 2 - b);
              ctx.lineTo(cx - this._spacingX + b, cy - a / 2 + b);
              ctx.lineTo(cx, cy - a + b);
          }
          ctx.fill();
      }
      _updateSize() {
          const opts = this._options;
          const charWidth = Math.ceil(this._ctx.measureText("W").width);
          this._hexSize = Math.floor(opts.spacing * (opts.fontSize + charWidth / Math.sqrt(3)) / 2);
          this._spacingX = this._hexSize * Math.sqrt(3) / 2;
          this._spacingY = this._hexSize * 1.5;
          let xprop;
          let yprop;
          if (opts.transpose) {
              xprop = "height";
              yprop = "width";
          }
          else {
              xprop = "width";
              yprop = "height";
          }
          this._ctx.canvas[xprop] = Math.ceil((opts.width + 1) * this._spacingX);
          this._ctx.canvas[yprop] = Math.ceil((opts.height - 1) * this._spacingY + 2 * this._hexSize);
      }
  }

  /**
   * @class Rectangular backend
   * @private
   */
  let Rect = /** @class */ (() => {
      class Rect extends Canvas {
          constructor() {
              super();
              this._spacingX = 0;
              this._spacingY = 0;
              this._canvasCache = {};
          }
          setOptions(options) {
              super.setOptions(options);
              this._canvasCache = {};
          }
          draw(data, clearBefore) {
              if (Rect.cache) {
                  this._drawWithCache(data);
              }
              else {
                  this._drawNoCache(data, clearBefore);
              }
          }
          _drawWithCache(data) {
              let [x, y, ch, fg, bg] = data;
              let hash = "" + ch + fg + bg;
              let canvas;
              if (hash in this._canvasCache) {
                  canvas = this._canvasCache[hash];
              }
              else {
                  let b = this._options.border;
                  canvas = document.createElement("canvas");
                  let ctx = canvas.getContext("2d");
                  canvas.width = this._spacingX;
                  canvas.height = this._spacingY;
                  ctx.fillStyle = bg;
                  ctx.fillRect(b, b, canvas.width - b, canvas.height - b);
                  if (ch) {
                      ctx.fillStyle = fg;
                      ctx.font = this._ctx.font;
                      ctx.textAlign = "center";
                      ctx.textBaseline = "middle";
                      let chars = [].concat(ch);
                      for (let i = 0; i < chars.length; i++) {
                          ctx.fillText(chars[i], this._spacingX / 2, Math.ceil(this._spacingY / 2));
                      }
                  }
                  this._canvasCache[hash] = canvas;
              }
              this._ctx.drawImage(canvas, x * this._spacingX, y * this._spacingY);
          }
          _drawNoCache(data, clearBefore) {
              let [x, y, ch, fg, bg] = data;
              if (clearBefore) {
                  let b = this._options.border;
                  this._ctx.fillStyle = bg;
                  this._ctx.fillRect(x * this._spacingX + b, y * this._spacingY + b, this._spacingX - b, this._spacingY - b);
              }
              if (!ch) {
                  return;
              }
              this._ctx.fillStyle = fg;
              let chars = [].concat(ch);
              for (let i = 0; i < chars.length; i++) {
                  this._ctx.fillText(chars[i], (x + 0.5) * this._spacingX, Math.ceil((y + 0.5) * this._spacingY));
              }
          }
          computeSize(availWidth, availHeight) {
              let width = Math.floor(availWidth / this._spacingX);
              let height = Math.floor(availHeight / this._spacingY);
              return [width, height];
          }
          computeFontSize(availWidth, availHeight) {
              let boxWidth = Math.floor(availWidth / this._options.width);
              let boxHeight = Math.floor(availHeight / this._options.height);
              /* compute char ratio */
              let oldFont = this._ctx.font;
              this._ctx.font = "100px " + this._options.fontFamily;
              let width = Math.ceil(this._ctx.measureText("W").width);
              this._ctx.font = oldFont;
              let ratio = width / 100;
              let widthFraction = ratio * boxHeight / boxWidth;
              if (widthFraction > 1) { /* too wide with current aspect ratio */
                  boxHeight = Math.floor(boxHeight / widthFraction);
              }
              return Math.floor(boxHeight / this._options.spacing);
          }
          _normalizedEventToPosition(x, y) {
              return [Math.floor(x / this._spacingX), Math.floor(y / this._spacingY)];
          }
          _updateSize() {
              const opts = this._options;
              const charWidth = Math.ceil(this._ctx.measureText("W").width);
              this._spacingX = Math.ceil(opts.spacing * charWidth);
              this._spacingY = Math.ceil(opts.spacing * opts.fontSize);
              if (opts.forceSquareRatio) {
                  this._spacingX = this._spacingY = Math.max(this._spacingX, this._spacingY);
              }
              this._ctx.canvas.width = opts.width * this._spacingX;
              this._ctx.canvas.height = opts.height * this._spacingY;
          }
      }
      Rect.cache = false;
      return Rect;
  })();

  /**
   * @class Tile backend
   * @private
   */
  class Tile extends Canvas {
      constructor() {
          super();
          this._colorCanvas = document.createElement("canvas");
      }
      draw(data, clearBefore) {
          let [x, y, ch, fg, bg] = data;
          let tileWidth = this._options.tileWidth;
          let tileHeight = this._options.tileHeight;
          if (clearBefore) {
              if (this._options.tileColorize) {
                  this._ctx.clearRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
              }
              else {
                  this._ctx.fillStyle = bg;
                  this._ctx.fillRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
              }
          }
          if (!ch) {
              return;
          }
          let chars = [].concat(ch);
          let fgs = [].concat(fg);
          let bgs = [].concat(bg);
          for (let i = 0; i < chars.length; i++) {
              let tile = this._options.tileMap[chars[i]];
              if (!tile) {
                  throw new Error(`Char "${chars[i]}" not found in tileMap`);
              }
              if (this._options.tileColorize) { // apply colorization
                  let canvas = this._colorCanvas;
                  let context = canvas.getContext("2d");
                  context.globalCompositeOperation = "source-over";
                  context.clearRect(0, 0, tileWidth, tileHeight);
                  let fg = fgs[i];
                  let bg = bgs[i];
                  context.drawImage(this._options.tileSet, tile[0], tile[1], tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
                  if (fg != "transparent") {
                      context.fillStyle = fg;
                      context.globalCompositeOperation = "source-atop";
                      context.fillRect(0, 0, tileWidth, tileHeight);
                  }
                  if (bg != "transparent") {
                      context.fillStyle = bg;
                      context.globalCompositeOperation = "destination-over";
                      context.fillRect(0, 0, tileWidth, tileHeight);
                  }
                  this._ctx.drawImage(canvas, x * tileWidth, y * tileHeight, tileWidth, tileHeight);
              }
              else { // no colorizing, easy
                  this._ctx.drawImage(this._options.tileSet, tile[0], tile[1], tileWidth, tileHeight, x * tileWidth, y * tileHeight, tileWidth, tileHeight);
              }
          }
      }
      computeSize(availWidth, availHeight) {
          let width = Math.floor(availWidth / this._options.tileWidth);
          let height = Math.floor(availHeight / this._options.tileHeight);
          return [width, height];
      }
      computeFontSize() {
          throw new Error("Tile backend does not understand font size");
      }
      _normalizedEventToPosition(x, y) {
          return [Math.floor(x / this._options.tileWidth), Math.floor(y / this._options.tileHeight)];
      }
      _updateSize() {
          const opts = this._options;
          this._ctx.canvas.width = opts.width * opts.tileWidth;
          this._ctx.canvas.height = opts.height * opts.tileHeight;
          this._colorCanvas.width = opts.tileWidth;
          this._colorCanvas.height = opts.tileHeight;
      }
  }

  function fromString(str) {
      let cached, r;
      if (str in CACHE) {
          cached = CACHE[str];
      }
      else {
          if (str.charAt(0) == "#") { // hex rgb
              let matched = str.match(/[0-9a-f]/gi) || [];
              let values = matched.map((x) => parseInt(x, 16));
              if (values.length == 3) {
                  cached = values.map((x) => x * 17);
              }
              else {
                  for (let i = 0; i < 3; i++) {
                      values[i + 1] += 16 * values[i];
                      values.splice(i, 1);
                  }
                  cached = values;
              }
          }
          else if ((r = str.match(/rgb\(([0-9, ]+)\)/i))) { // decimal rgb
              cached = r[1].split(/\s*,\s*/).map((x) => parseInt(x));
          }
          else { // html name
              cached = [0, 0, 0];
          }
          CACHE[str] = cached;
      }
      return cached.slice();
  }
  const CACHE = {
      "black": [0, 0, 0],
      "navy": [0, 0, 128],
      "darkblue": [0, 0, 139],
      "mediumblue": [0, 0, 205],
      "blue": [0, 0, 255],
      "darkgreen": [0, 100, 0],
      "green": [0, 128, 0],
      "teal": [0, 128, 128],
      "darkcyan": [0, 139, 139],
      "deepskyblue": [0, 191, 255],
      "darkturquoise": [0, 206, 209],
      "mediumspringgreen": [0, 250, 154],
      "lime": [0, 255, 0],
      "springgreen": [0, 255, 127],
      "aqua": [0, 255, 255],
      "cyan": [0, 255, 255],
      "midnightblue": [25, 25, 112],
      "dodgerblue": [30, 144, 255],
      "forestgreen": [34, 139, 34],
      "seagreen": [46, 139, 87],
      "darkslategray": [47, 79, 79],
      "darkslategrey": [47, 79, 79],
      "limegreen": [50, 205, 50],
      "mediumseagreen": [60, 179, 113],
      "turquoise": [64, 224, 208],
      "royalblue": [65, 105, 225],
      "steelblue": [70, 130, 180],
      "darkslateblue": [72, 61, 139],
      "mediumturquoise": [72, 209, 204],
      "indigo": [75, 0, 130],
      "darkolivegreen": [85, 107, 47],
      "cadetblue": [95, 158, 160],
      "cornflowerblue": [100, 149, 237],
      "mediumaquamarine": [102, 205, 170],
      "dimgray": [105, 105, 105],
      "dimgrey": [105, 105, 105],
      "slateblue": [106, 90, 205],
      "olivedrab": [107, 142, 35],
      "slategray": [112, 128, 144],
      "slategrey": [112, 128, 144],
      "lightslategray": [119, 136, 153],
      "lightslategrey": [119, 136, 153],
      "mediumslateblue": [123, 104, 238],
      "lawngreen": [124, 252, 0],
      "chartreuse": [127, 255, 0],
      "aquamarine": [127, 255, 212],
      "maroon": [128, 0, 0],
      "purple": [128, 0, 128],
      "olive": [128, 128, 0],
      "gray": [128, 128, 128],
      "grey": [128, 128, 128],
      "skyblue": [135, 206, 235],
      "lightskyblue": [135, 206, 250],
      "blueviolet": [138, 43, 226],
      "darkred": [139, 0, 0],
      "darkmagenta": [139, 0, 139],
      "saddlebrown": [139, 69, 19],
      "darkseagreen": [143, 188, 143],
      "lightgreen": [144, 238, 144],
      "mediumpurple": [147, 112, 216],
      "darkviolet": [148, 0, 211],
      "palegreen": [152, 251, 152],
      "darkorchid": [153, 50, 204],
      "yellowgreen": [154, 205, 50],
      "sienna": [160, 82, 45],
      "brown": [165, 42, 42],
      "darkgray": [169, 169, 169],
      "darkgrey": [169, 169, 169],
      "lightblue": [173, 216, 230],
      "greenyellow": [173, 255, 47],
      "paleturquoise": [175, 238, 238],
      "lightsteelblue": [176, 196, 222],
      "powderblue": [176, 224, 230],
      "firebrick": [178, 34, 34],
      "darkgoldenrod": [184, 134, 11],
      "mediumorchid": [186, 85, 211],
      "rosybrown": [188, 143, 143],
      "darkkhaki": [189, 183, 107],
      "silver": [192, 192, 192],
      "mediumvioletred": [199, 21, 133],
      "indianred": [205, 92, 92],
      "peru": [205, 133, 63],
      "chocolate": [210, 105, 30],
      "tan": [210, 180, 140],
      "lightgray": [211, 211, 211],
      "lightgrey": [211, 211, 211],
      "palevioletred": [216, 112, 147],
      "thistle": [216, 191, 216],
      "orchid": [218, 112, 214],
      "goldenrod": [218, 165, 32],
      "crimson": [220, 20, 60],
      "gainsboro": [220, 220, 220],
      "plum": [221, 160, 221],
      "burlywood": [222, 184, 135],
      "lightcyan": [224, 255, 255],
      "lavender": [230, 230, 250],
      "darksalmon": [233, 150, 122],
      "violet": [238, 130, 238],
      "palegoldenrod": [238, 232, 170],
      "lightcoral": [240, 128, 128],
      "khaki": [240, 230, 140],
      "aliceblue": [240, 248, 255],
      "honeydew": [240, 255, 240],
      "azure": [240, 255, 255],
      "sandybrown": [244, 164, 96],
      "wheat": [245, 222, 179],
      "beige": [245, 245, 220],
      "whitesmoke": [245, 245, 245],
      "mintcream": [245, 255, 250],
      "ghostwhite": [248, 248, 255],
      "salmon": [250, 128, 114],
      "antiquewhite": [250, 235, 215],
      "linen": [250, 240, 230],
      "lightgoldenrodyellow": [250, 250, 210],
      "oldlace": [253, 245, 230],
      "red": [255, 0, 0],
      "fuchsia": [255, 0, 255],
      "magenta": [255, 0, 255],
      "deeppink": [255, 20, 147],
      "orangered": [255, 69, 0],
      "tomato": [255, 99, 71],
      "hotpink": [255, 105, 180],
      "coral": [255, 127, 80],
      "darkorange": [255, 140, 0],
      "lightsalmon": [255, 160, 122],
      "orange": [255, 165, 0],
      "lightpink": [255, 182, 193],
      "pink": [255, 192, 203],
      "gold": [255, 215, 0],
      "peachpuff": [255, 218, 185],
      "navajowhite": [255, 222, 173],
      "moccasin": [255, 228, 181],
      "bisque": [255, 228, 196],
      "mistyrose": [255, 228, 225],
      "blanchedalmond": [255, 235, 205],
      "papayawhip": [255, 239, 213],
      "lavenderblush": [255, 240, 245],
      "seashell": [255, 245, 238],
      "cornsilk": [255, 248, 220],
      "lemonchiffon": [255, 250, 205],
      "floralwhite": [255, 250, 240],
      "snow": [255, 250, 250],
      "yellow": [255, 255, 0],
      "lightyellow": [255, 255, 224],
      "ivory": [255, 255, 240],
      "white": [255, 255, 255]
  };

  /**
   * @class Tile backend
   * @private
   */
  class TileGL extends Backend {
      constructor() {
          super();
          this._uniforms = {};
          try {
              this._gl = this._initWebGL();
          }
          catch (e) {
              alert(e.message);
          }
      }
      static isSupported() {
          return !!document.createElement("canvas").getContext("webgl2", { preserveDrawingBuffer: true });
      }
      schedule(cb) { requestAnimationFrame(cb); }
      getContainer() { return this._gl.canvas; }
      setOptions(opts) {
          super.setOptions(opts);
          this._updateSize();
          let tileSet = this._options.tileSet;
          if (tileSet && "complete" in tileSet && !tileSet.complete) {
              tileSet.addEventListener("load", () => this._updateTexture(tileSet));
          }
          else {
              this._updateTexture(tileSet);
          }
      }
      draw(data, clearBefore) {
          const gl = this._gl;
          const opts = this._options;
          let [x, y, ch, fg, bg] = data;
          let scissorY = gl.canvas.height - (y + 1) * opts.tileHeight;
          gl.scissor(x * opts.tileWidth, scissorY, opts.tileWidth, opts.tileHeight);
          if (clearBefore) {
              if (opts.tileColorize) {
                  gl.clearColor(0, 0, 0, 0);
              }
              else {
                  gl.clearColor(...parseColor(bg));
              }
              gl.clear(gl.COLOR_BUFFER_BIT);
          }
          if (!ch) {
              return;
          }
          let chars = [].concat(ch);
          let bgs = [].concat(bg);
          let fgs = [].concat(fg);
          gl.uniform2fv(this._uniforms["targetPosRel"], [x, y]);
          for (let i = 0; i < chars.length; i++) {
              let tile = this._options.tileMap[chars[i]];
              if (!tile) {
                  throw new Error(`Char "${chars[i]}" not found in tileMap`);
              }
              gl.uniform1f(this._uniforms["colorize"], opts.tileColorize ? 1 : 0);
              gl.uniform2fv(this._uniforms["tilesetPosAbs"], tile);
              if (opts.tileColorize) {
                  gl.uniform4fv(this._uniforms["tint"], parseColor(fgs[i]));
                  gl.uniform4fv(this._uniforms["bg"], parseColor(bgs[i]));
              }
              gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          }
          /*
          
          
                  for (let i=0;i<chars.length;i++) {
          
                      if (this._options.tileColorize) { // apply colorization
                          let canvas = this._colorCanvas;
                          let context = canvas.getContext("2d") as CanvasRenderingContext2D;
                          context.globalCompositeOperation = "source-over";
                          context.clearRect(0, 0, tileWidth, tileHeight);
          
                          let fg = fgs[i];
                          let bg = bgs[i];
          
                          context.drawImage(
                              this._options.tileSet!,
                              tile[0], tile[1], tileWidth, tileHeight,
                              0, 0, tileWidth, tileHeight
                          );
          
                          if (fg != "transparent") {
                              context.fillStyle = fg;
                              context.globalCompositeOperation = "source-atop";
                              context.fillRect(0, 0, tileWidth, tileHeight);
                          }
          
                          if (bg != "transparent") {
                              context.fillStyle = bg;
                              context.globalCompositeOperation = "destination-over";
                              context.fillRect(0, 0, tileWidth, tileHeight);
                          }
          
                          this._ctx.drawImage(canvas, x*tileWidth, y*tileHeight, tileWidth, tileHeight);
                      } else { // no colorizing, easy
                          this._ctx.drawImage(
                              this._options.tileSet!,
                              tile[0], tile[1], tileWidth, tileHeight,
                              x*tileWidth, y*tileHeight, tileWidth, tileHeight
                          );
                      }
                  }
          
          */
      }
      clear() {
          const gl = this._gl;
          gl.clearColor(...parseColor(this._options.bg));
          gl.scissor(0, 0, gl.canvas.width, gl.canvas.height);
          gl.clear(gl.COLOR_BUFFER_BIT);
      }
      computeSize(availWidth, availHeight) {
          let width = Math.floor(availWidth / this._options.tileWidth);
          let height = Math.floor(availHeight / this._options.tileHeight);
          return [width, height];
      }
      computeFontSize() {
          throw new Error("Tile backend does not understand font size");
      }
      eventToPosition(x, y) {
          let canvas = this._gl.canvas;
          let rect = canvas.getBoundingClientRect();
          x -= rect.left;
          y -= rect.top;
          x *= canvas.width / rect.width;
          y *= canvas.height / rect.height;
          if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
              return [-1, -1];
          }
          return this._normalizedEventToPosition(x, y);
      }
      _initWebGL() {
          let gl = document.createElement("canvas").getContext("webgl2", { preserveDrawingBuffer: true });
          window.gl = gl;
          let program = createProgram(gl, VS, FS);
          gl.useProgram(program);
          createQuad(gl);
          UNIFORMS.forEach(name => this._uniforms[name] = gl.getUniformLocation(program, name));
          this._program = program;
          gl.enable(gl.BLEND);
          gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
          gl.enable(gl.SCISSOR_TEST);
          return gl;
      }
      _normalizedEventToPosition(x, y) {
          return [Math.floor(x / this._options.tileWidth), Math.floor(y / this._options.tileHeight)];
      }
      _updateSize() {
          const gl = this._gl;
          const opts = this._options;
          const canvasSize = [opts.width * opts.tileWidth, opts.height * opts.tileHeight];
          gl.canvas.width = canvasSize[0];
          gl.canvas.height = canvasSize[1];
          gl.viewport(0, 0, canvasSize[0], canvasSize[1]);
          gl.uniform2fv(this._uniforms["tileSize"], [opts.tileWidth, opts.tileHeight]);
          gl.uniform2fv(this._uniforms["targetSize"], canvasSize);
      }
      _updateTexture(tileSet) {
          createTexture(this._gl, tileSet);
      }
  }
  const UNIFORMS = ["targetPosRel", "tilesetPosAbs", "tileSize", "targetSize", "colorize", "bg", "tint"];
  const VS = `
#version 300 es

in vec2 tilePosRel;
out vec2 tilesetPosPx;

uniform vec2 tilesetPosAbs;
uniform vec2 tileSize;
uniform vec2 targetSize;
uniform vec2 targetPosRel;

void main() {
	vec2 targetPosPx = (targetPosRel + tilePosRel) * tileSize;
	vec2 targetPosNdc = ((targetPosPx / targetSize)-0.5)*2.0;
	targetPosNdc.y *= -1.0;

	gl_Position = vec4(targetPosNdc, 0.0, 1.0);
	tilesetPosPx = tilesetPosAbs + tilePosRel * tileSize;
}`.trim();
  const FS = `
#version 300 es
precision highp float;

in vec2 tilesetPosPx;
out vec4 fragColor;
uniform sampler2D image;
uniform bool colorize;
uniform vec4 bg;
uniform vec4 tint;

void main() {
	fragColor = vec4(0, 0, 0, 1);

	vec4 texel = texelFetch(image, ivec2(tilesetPosPx), 0);

	if (colorize) {
		texel.rgb = tint.a * tint.rgb + (1.0-tint.a) * texel.rgb;
		fragColor.rgb = texel.a*texel.rgb + (1.0-texel.a)*bg.rgb;
		fragColor.a = texel.a + (1.0-texel.a)*bg.a;
	} else {
		fragColor = texel;
	}
}`.trim();
  function createProgram(gl, vss, fss) {
      const vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, vss);
      gl.compileShader(vs);
      if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
          throw new Error(gl.getShaderInfoLog(vs) || "");
      }
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, fss);
      gl.compileShader(fs);
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
          throw new Error(gl.getShaderInfoLog(fs) || "");
      }
      const p = gl.createProgram();
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
          throw new Error(gl.getProgramInfoLog(p) || "");
      }
      return p;
  }
  function createQuad(gl) {
      const pos = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }
  function createTexture(gl, data) {
      let t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
      return t;
  }
  let colorCache = {};
  function parseColor(color) {
      if (!(color in colorCache)) {
          let parsed;
          if (color == "transparent") {
              parsed = [0, 0, 0, 0];
          }
          else if (color.indexOf("rgba") > -1) {
              parsed = (color.match(/[\d.]+/g) || []).map(Number);
              for (let i = 0; i < 3; i++) {
                  parsed[i] = parsed[i] / 255;
              }
          }
          else {
              parsed = fromString(color).map($ => $ / 255);
              parsed.push(1);
          }
          colorCache[color] = parsed;
      }
      return colorCache[color];
  }

  function clearToAnsi(bg) {
      return `\x1b[0;48;5;${termcolor(bg)}m\x1b[2J`;
  }
  function colorToAnsi(fg, bg) {
      return `\x1b[0;38;5;${termcolor(fg)};48;5;${termcolor(bg)}m`;
  }
  function positionToAnsi(x, y) {
      return `\x1b[${y + 1};${x + 1}H`;
  }
  function termcolor(color) {
      const SRC_COLORS = 256.0;
      const DST_COLORS = 6.0;
      const COLOR_RATIO = DST_COLORS / SRC_COLORS;
      let rgb = fromString(color);
      let r = Math.floor(rgb[0] * COLOR_RATIO);
      let g = Math.floor(rgb[1] * COLOR_RATIO);
      let b = Math.floor(rgb[2] * COLOR_RATIO);
      return r * 36 + g * 6 + b * 1 + 16;
  }
  class Term extends Backend {
      constructor() {
          super();
          this._offset = [0, 0];
          this._cursor = [-1, -1];
          this._lastColor = "";
      }
      schedule(cb) { setTimeout(cb, 1000 / 60); }
      setOptions(options) {
          super.setOptions(options);
          let size = [options.width, options.height];
          let avail = this.computeSize();
          this._offset = avail.map((val, index) => Math.floor((val - size[index]) / 2));
      }
      clear() {
          process.stdout.write(clearToAnsi(this._options.bg));
      }
      draw(data, clearBefore) {
          // determine where to draw what with what colors
          let [x, y, ch, fg, bg] = data;
          // determine if we need to move the terminal cursor
          let dx = this._offset[0] + x;
          let dy = this._offset[1] + y;
          let size = this.computeSize();
          if (dx < 0 || dx >= size[0]) {
              return;
          }
          if (dy < 0 || dy >= size[1]) {
              return;
          }
          if (dx !== this._cursor[0] || dy !== this._cursor[1]) {
              process.stdout.write(positionToAnsi(dx, dy));
              this._cursor[0] = dx;
              this._cursor[1] = dy;
          }
          // terminals automatically clear, but if we're clearing when we're
          // not otherwise provided with a character, just use a space instead
          if (clearBefore) {
              if (!ch) {
                  ch = " ";
              }
          }
          // if we're not clearing and not provided with a character, do nothing
          if (!ch) {
              return;
          }
          // determine if we need to change colors
          let newColor = colorToAnsi(fg, bg);
          if (newColor !== this._lastColor) {
              process.stdout.write(newColor);
              this._lastColor = newColor;
          }
          if (ch != '\t') {
              // write the provided symbol to the display
              let chars = [].concat(ch);
              process.stdout.write(chars[0]);
          }
          // update our position, given that we wrote a character
          this._cursor[0]++;
          if (this._cursor[0] >= size[0]) {
              this._cursor[0] = 0;
              this._cursor[1]++;
          }
      }
      computeFontSize() { throw new Error("Terminal backend has no notion of font size"); }
      eventToPosition(x, y) { return [x, y]; }
      computeSize() { return [process.stdout.columns, process.stdout.rows]; }
  }

  /**
   * @namespace
   * Contains text tokenization and breaking routines
   */
  const RE_COLORS = /%([bc]){([^}]*)}/g;
  // token types
  const TYPE_TEXT = 0;
  const TYPE_NEWLINE = 1;
  const TYPE_FG = 2;
  const TYPE_BG = 3;
  /**
   * Convert string to a series of a formatting commands
   */
  function tokenize(str, maxWidth) {
      let result = [];
      /* first tokenization pass - split texts and color formatting commands */
      let offset = 0;
      str.replace(RE_COLORS, function (match, type, name, index) {
          /* string before */
          let part = str.substring(offset, index);
          if (part.length) {
              result.push({
                  type: TYPE_TEXT,
                  value: part
              });
          }
          /* color command */
          result.push({
              type: (type == "c" ? TYPE_FG : TYPE_BG),
              value: name.trim()
          });
          offset = index + match.length;
          return "";
      });
      /* last remaining part */
      let part = str.substring(offset);
      if (part.length) {
          result.push({
              type: TYPE_TEXT,
              value: part
          });
      }
      return breakLines(result, maxWidth);
  }
  /* insert line breaks into first-pass tokenized data */
  function breakLines(tokens, maxWidth) {
      if (!maxWidth) {
          maxWidth = Infinity;
      }
      let i = 0;
      let lineLength = 0;
      let lastTokenWithSpace = -1;
      while (i < tokens.length) { /* take all text tokens, remove space, apply linebreaks */
          let token = tokens[i];
          if (token.type == TYPE_NEWLINE) { /* reset */
              lineLength = 0;
              lastTokenWithSpace = -1;
          }
          if (token.type != TYPE_TEXT) { /* skip non-text tokens */
              i++;
              continue;
          }
          /* remove spaces at the beginning of line */
          while (lineLength == 0 && token.value.charAt(0) == " ") {
              token.value = token.value.substring(1);
          }
          /* forced newline? insert two new tokens after this one */
          let index = token.value.indexOf("\n");
          if (index != -1) {
              token.value = breakInsideToken(tokens, i, index, true);
              /* if there are spaces at the end, we must remove them (we do not want the line too long) */
              let arr = token.value.split("");
              while (arr.length && arr[arr.length - 1] == " ") {
                  arr.pop();
              }
              token.value = arr.join("");
          }
          /* token degenerated? */
          if (!token.value.length) {
              tokens.splice(i, 1);
              continue;
          }
          if (lineLength + token.value.length > maxWidth) { /* line too long, find a suitable breaking spot */
              /* is it possible to break within this token? */
              let index = -1;
              while (1) {
                  let nextIndex = token.value.indexOf(" ", index + 1);
                  if (nextIndex == -1) {
                      break;
                  }
                  if (lineLength + nextIndex > maxWidth) {
                      break;
                  }
                  index = nextIndex;
              }
              if (index != -1) { /* break at space within this one */
                  token.value = breakInsideToken(tokens, i, index, true);
              }
              else if (lastTokenWithSpace != -1) { /* is there a previous token where a break can occur? */
                  let token = tokens[lastTokenWithSpace];
                  let breakIndex = token.value.lastIndexOf(" ");
                  token.value = breakInsideToken(tokens, lastTokenWithSpace, breakIndex, true);
                  i = lastTokenWithSpace;
              }
              else { /* force break in this token */
                  token.value = breakInsideToken(tokens, i, maxWidth - lineLength, false);
              }
          }
          else { /* line not long, continue */
              lineLength += token.value.length;
              if (token.value.indexOf(" ") != -1) {
                  lastTokenWithSpace = i;
              }
          }
          i++; /* advance to next token */
      }
      tokens.push({ type: TYPE_NEWLINE }); /* insert fake newline to fix the last text line */
      /* remove trailing space from text tokens before newlines */
      let lastTextToken = null;
      for (let i = 0; i < tokens.length; i++) {
          let token = tokens[i];
          switch (token.type) {
              case TYPE_TEXT:
                  lastTextToken = token;
                  break;
              case TYPE_NEWLINE:
                  if (lastTextToken) { /* remove trailing space */
                      let arr = lastTextToken.value.split("");
                      while (arr.length && arr[arr.length - 1] == " ") {
                          arr.pop();
                      }
                      lastTextToken.value = arr.join("");
                  }
                  lastTextToken = null;
                  break;
          }
      }
      tokens.pop(); /* remove fake token */
      return tokens;
  }
  /**
   * Create new tokens and insert them into the stream
   * @param {object[]} tokens
   * @param {int} tokenIndex Token being processed
   * @param {int} breakIndex Index within current token's value
   * @param {bool} removeBreakChar Do we want to remove the breaking character?
   * @returns {string} remaining unbroken token value
   */
  function breakInsideToken(tokens, tokenIndex, breakIndex, removeBreakChar) {
      let newBreakToken = {
          type: TYPE_NEWLINE
      };
      let newTextToken = {
          type: TYPE_TEXT,
          value: tokens[tokenIndex].value.substring(breakIndex + (removeBreakChar ? 1 : 0))
      };
      tokens.splice(tokenIndex + 1, 0, newBreakToken, newTextToken);
      return tokens[tokenIndex].value.substring(0, breakIndex);
  }

  /** Default with for display and map generators */
  let DEFAULT_WIDTH = 80;
  /** Default height for display and map generators */
  let DEFAULT_HEIGHT = 25;
  const KEYS = {
      /** Cancel key. */
      VK_CANCEL: 3,
      /** Help key. */
      VK_HELP: 6,
      /** Backspace key. */
      VK_BACK_SPACE: 8,
      /** Tab key. */
      VK_TAB: 9,
      /** 5 key on Numpad when NumLock is unlocked. Or on Mac, clear key which is positioned at NumLock key. */
      VK_CLEAR: 12,
      /** Return/enter key on the main keyboard. */
      VK_RETURN: 13,
      /** Reserved, but not used. */
      VK_ENTER: 14,
      /** Shift key. */
      VK_SHIFT: 16,
      /** Control key. */
      VK_CONTROL: 17,
      /** Alt (Option on Mac) key. */
      VK_ALT: 18,
      /** Pause key. */
      VK_PAUSE: 19,
      /** Caps lock. */
      VK_CAPS_LOCK: 20,
      /** Escape key. */
      VK_ESCAPE: 27,
      /** Space bar. */
      VK_SPACE: 32,
      /** Page Up key. */
      VK_PAGE_UP: 33,
      /** Page Down key. */
      VK_PAGE_DOWN: 34,
      /** End key. */
      VK_END: 35,
      /** Home key. */
      VK_HOME: 36,
      /** Left arrow. */
      VK_LEFT: 37,
      /** Up arrow. */
      VK_UP: 38,
      /** Right arrow. */
      VK_RIGHT: 39,
      /** Down arrow. */
      VK_DOWN: 40,
      /** Print Screen key. */
      VK_PRINTSCREEN: 44,
      /** Ins(ert) key. */
      VK_INSERT: 45,
      /** Del(ete) key. */
      VK_DELETE: 46,
      /***/
      VK_0: 48,
      /***/
      VK_1: 49,
      /***/
      VK_2: 50,
      /***/
      VK_3: 51,
      /***/
      VK_4: 52,
      /***/
      VK_5: 53,
      /***/
      VK_6: 54,
      /***/
      VK_7: 55,
      /***/
      VK_8: 56,
      /***/
      VK_9: 57,
      /** Colon (:) key. Requires Gecko 15.0 */
      VK_COLON: 58,
      /** Semicolon (;) key. */
      VK_SEMICOLON: 59,
      /** Less-than (<) key. Requires Gecko 15.0 */
      VK_LESS_THAN: 60,
      /** Equals (=) key. */
      VK_EQUALS: 61,
      /** Greater-than (>) key. Requires Gecko 15.0 */
      VK_GREATER_THAN: 62,
      /** Question mark (?) key. Requires Gecko 15.0 */
      VK_QUESTION_MARK: 63,
      /** Atmark (@) key. Requires Gecko 15.0 */
      VK_AT: 64,
      /***/
      VK_A: 65,
      /***/
      VK_B: 66,
      /***/
      VK_C: 67,
      /***/
      VK_D: 68,
      /***/
      VK_E: 69,
      /***/
      VK_F: 70,
      /***/
      VK_G: 71,
      /***/
      VK_H: 72,
      /***/
      VK_I: 73,
      /***/
      VK_J: 74,
      /***/
      VK_K: 75,
      /***/
      VK_L: 76,
      /***/
      VK_M: 77,
      /***/
      VK_N: 78,
      /***/
      VK_O: 79,
      /***/
      VK_P: 80,
      /***/
      VK_Q: 81,
      /***/
      VK_R: 82,
      /***/
      VK_S: 83,
      /***/
      VK_T: 84,
      /***/
      VK_U: 85,
      /***/
      VK_V: 86,
      /***/
      VK_W: 87,
      /***/
      VK_X: 88,
      /***/
      VK_Y: 89,
      /***/
      VK_Z: 90,
      /***/
      VK_CONTEXT_MENU: 93,
      /** 0 on the numeric keypad. */
      VK_NUMPAD0: 96,
      /** 1 on the numeric keypad. */
      VK_NUMPAD1: 97,
      /** 2 on the numeric keypad. */
      VK_NUMPAD2: 98,
      /** 3 on the numeric keypad. */
      VK_NUMPAD3: 99,
      /** 4 on the numeric keypad. */
      VK_NUMPAD4: 100,
      /** 5 on the numeric keypad. */
      VK_NUMPAD5: 101,
      /** 6 on the numeric keypad. */
      VK_NUMPAD6: 102,
      /** 7 on the numeric keypad. */
      VK_NUMPAD7: 103,
      /** 8 on the numeric keypad. */
      VK_NUMPAD8: 104,
      /** 9 on the numeric keypad. */
      VK_NUMPAD9: 105,
      /** * on the numeric keypad. */
      VK_MULTIPLY: 106,
      /** + on the numeric keypad. */
      VK_ADD: 107,
      /***/
      VK_SEPARATOR: 108,
      /** - on the numeric keypad. */
      VK_SUBTRACT: 109,
      /** Decimal point on the numeric keypad. */
      VK_DECIMAL: 110,
      /** / on the numeric keypad. */
      VK_DIVIDE: 111,
      /** F1 key. */
      VK_F1: 112,
      /** F2 key. */
      VK_F2: 113,
      /** F3 key. */
      VK_F3: 114,
      /** F4 key. */
      VK_F4: 115,
      /** F5 key. */
      VK_F5: 116,
      /** F6 key. */
      VK_F6: 117,
      /** F7 key. */
      VK_F7: 118,
      /** F8 key. */
      VK_F8: 119,
      /** F9 key. */
      VK_F9: 120,
      /** F10 key. */
      VK_F10: 121,
      /** F11 key. */
      VK_F11: 122,
      /** F12 key. */
      VK_F12: 123,
      /** F13 key. */
      VK_F13: 124,
      /** F14 key. */
      VK_F14: 125,
      /** F15 key. */
      VK_F15: 126,
      /** F16 key. */
      VK_F16: 127,
      /** F17 key. */
      VK_F17: 128,
      /** F18 key. */
      VK_F18: 129,
      /** F19 key. */
      VK_F19: 130,
      /** F20 key. */
      VK_F20: 131,
      /** F21 key. */
      VK_F21: 132,
      /** F22 key. */
      VK_F22: 133,
      /** F23 key. */
      VK_F23: 134,
      /** F24 key. */
      VK_F24: 135,
      /** Num Lock key. */
      VK_NUM_LOCK: 144,
      /** Scroll Lock key. */
      VK_SCROLL_LOCK: 145,
      /** Circumflex (^) key. Requires Gecko 15.0 */
      VK_CIRCUMFLEX: 160,
      /** Exclamation (!) key. Requires Gecko 15.0 */
      VK_EXCLAMATION: 161,
      /** Double quote () key. Requires Gecko 15.0 */
      VK_DOUBLE_QUOTE: 162,
      /** Hash (#) key. Requires Gecko 15.0 */
      VK_HASH: 163,
      /** Dollar sign ($) key. Requires Gecko 15.0 */
      VK_DOLLAR: 164,
      /** Percent (%) key. Requires Gecko 15.0 */
      VK_PERCENT: 165,
      /** Ampersand (&) key. Requires Gecko 15.0 */
      VK_AMPERSAND: 166,
      /** Underscore (_) key. Requires Gecko 15.0 */
      VK_UNDERSCORE: 167,
      /** Open parenthesis (() key. Requires Gecko 15.0 */
      VK_OPEN_PAREN: 168,
      /** Close parenthesis ()) key. Requires Gecko 15.0 */
      VK_CLOSE_PAREN: 169,
      /* Asterisk (*) key. Requires Gecko 15.0 */
      VK_ASTERISK: 170,
      /** Plus (+) key. Requires Gecko 15.0 */
      VK_PLUS: 171,
      /** Pipe (|) key. Requires Gecko 15.0 */
      VK_PIPE: 172,
      /** Hyphen-US/docs/Minus (-) key. Requires Gecko 15.0 */
      VK_HYPHEN_MINUS: 173,
      /** Open curly bracket ({) key. Requires Gecko 15.0 */
      VK_OPEN_CURLY_BRACKET: 174,
      /** Close curly bracket (}) key. Requires Gecko 15.0 */
      VK_CLOSE_CURLY_BRACKET: 175,
      /** Tilde (~) key. Requires Gecko 15.0 */
      VK_TILDE: 176,
      /** Comma (,) key. */
      VK_COMMA: 188,
      /** Period (.) key. */
      VK_PERIOD: 190,
      /** Slash (/) key. */
      VK_SLASH: 191,
      /** Back tick (`) key. */
      VK_BACK_QUOTE: 192,
      /** Open square bracket ([) key. */
      VK_OPEN_BRACKET: 219,
      /** Back slash (\) key. */
      VK_BACK_SLASH: 220,
      /** Close square bracket (]) key. */
      VK_CLOSE_BRACKET: 221,
      /** Quote (''') key. */
      VK_QUOTE: 222,
      /** Meta key on Linux, Command key on Mac. */
      VK_META: 224,
      /** AltGr key on Linux. Requires Gecko 15.0 */
      VK_ALTGR: 225,
      /** Windows logo key on Windows. Or Super or Hyper key on Linux. Requires Gecko 15.0 */
      VK_WIN: 91,
      /** Linux support for this keycode was added in Gecko 4.0. */
      VK_KANA: 21,
      /** Linux support for this keycode was added in Gecko 4.0. */
      VK_HANGUL: 21,
      /** 英数 key on Japanese Mac keyboard. Requires Gecko 15.0 */
      VK_EISU: 22,
      /** Linux support for this keycode was added in Gecko 4.0. */
      VK_JUNJA: 23,
      /** Linux support for this keycode was added in Gecko 4.0. */
      VK_FINAL: 24,
      /** Linux support for this keycode was added in Gecko 4.0. */
      VK_HANJA: 25,
      /** Linux support for this keycode was added in Gecko 4.0. */
      VK_KANJI: 25,
      /** Linux support for this keycode was added in Gecko 4.0. */
      VK_CONVERT: 28,
      /** Linux support for this keycode was added in Gecko 4.0. */
      VK_NONCONVERT: 29,
      /** Linux support for this keycode was added in Gecko 4.0. */
      VK_ACCEPT: 30,
      /** Linux support for this keycode was added in Gecko 4.0. */
      VK_MODECHANGE: 31,
      /** Linux support for this keycode was added in Gecko 4.0. */
      VK_SELECT: 41,
      /** Linux support for this keycode was added in Gecko 4.0. */
      VK_PRINT: 42,
      /** Linux support for this keycode was added in Gecko 4.0. */
      VK_EXECUTE: 43,
      /** Linux support for this keycode was added in Gecko 4.0.	 */
      VK_SLEEP: 95
  };

  const BACKENDS = {
      "hex": Hex,
      "rect": Rect,
      "tile": Tile,
      "tile-gl": TileGL,
      "term": Term
  };
  const DEFAULT_OPTIONS = {
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      transpose: false,
      layout: "rect",
      fontSize: 15,
      spacing: 1,
      border: 0,
      forceSquareRatio: false,
      fontFamily: "monospace",
      fontStyle: "",
      fg: "#ccc",
      bg: "#000",
      tileWidth: 32,
      tileHeight: 32,
      tileMap: {},
      tileSet: null,
      tileColorize: false
  };
  /**
   * @class Visual map display
   */
  let Display = /** @class */ (() => {
      class Display {
          constructor(options = {}) {
              this._data = {};
              this._dirty = false; // false = nothing, true = all, object = dirty cells
              this._options = {};
              options = Object.assign({}, DEFAULT_OPTIONS, options);
              this.setOptions(options);
              this.DEBUG = this.DEBUG.bind(this);
              this._tick = this._tick.bind(this);
              this._backend.schedule(this._tick);
          }
          /**
           * Debug helper, ideal as a map generator callback. Always bound to this.
           * @param {int} x
           * @param {int} y
           * @param {int} what
           */
          DEBUG(x, y, what) {
              let colors = [this._options.bg, this._options.fg];
              this.draw(x, y, null, null, colors[what % colors.length]);
          }
          /**
           * Clear the whole display (cover it with background color)
           */
          clear() {
              this._data = {};
              this._dirty = true;
          }
          /**
           * @see ROT.Display
           */
          setOptions(options) {
              Object.assign(this._options, options);
              if (options.width || options.height || options.fontSize || options.fontFamily || options.spacing || options.layout) {
                  if (options.layout) {
                      let ctor = BACKENDS[options.layout];
                      this._backend = new ctor();
                  }
                  this._backend.setOptions(this._options);
                  this._dirty = true;
              }
              return this;
          }
          /**
           * Returns currently set options
           */
          getOptions() { return this._options; }
          /**
           * Returns the DOM node of this display
           */
          getContainer() { return this._backend.getContainer(); }
          /**
           * Compute the maximum width/height to fit into a set of given constraints
           * @param {int} availWidth Maximum allowed pixel width
           * @param {int} availHeight Maximum allowed pixel height
           * @returns {int[2]} cellWidth,cellHeight
           */
          computeSize(availWidth, availHeight) {
              return this._backend.computeSize(availWidth, availHeight);
          }
          /**
           * Compute the maximum font size to fit into a set of given constraints
           * @param {int} availWidth Maximum allowed pixel width
           * @param {int} availHeight Maximum allowed pixel height
           * @returns {int} fontSize
           */
          computeFontSize(availWidth, availHeight) {
              return this._backend.computeFontSize(availWidth, availHeight);
          }
          computeTileSize(availWidth, availHeight) {
              let width = Math.floor(availWidth / this._options.width);
              let height = Math.floor(availHeight / this._options.height);
              return [width, height];
          }
          /**
           * Convert a DOM event (mouse or touch) to map coordinates. Uses first touch for multi-touch.
           * @param {Event} e event
           * @returns {int[2]} -1 for values outside of the canvas
           */
          eventToPosition(e) {
              let x, y;
              if ("touches" in e) {
                  x = e.touches[0].clientX;
                  y = e.touches[0].clientY;
              }
              else {
                  x = e.clientX;
                  y = e.clientY;
              }
              return this._backend.eventToPosition(x, y);
          }
          /**
           * @param {int} x
           * @param {int} y
           * @param {string || string[]} ch One or more chars (will be overlapping themselves)
           * @param {string} [fg] foreground color
           * @param {string} [bg] background color
           */
          draw(x, y, ch, fg, bg) {
              if (!fg) {
                  fg = this._options.fg;
              }
              if (!bg) {
                  bg = this._options.bg;
              }
              let key = `${x},${y}`;
              this._data[key] = [x, y, ch, fg, bg];
              if (this._dirty === true) {
                  return;
              } // will already redraw everything 
              if (!this._dirty) {
                  this._dirty = {};
              } // first!
              this._dirty[key] = true;
          }
          /**
           * @param {int} x
           * @param {int} y
           * @param {string || string[]} ch One or more chars (will be overlapping themselves)
           * @param {string || null} [fg] foreground color
           * @param {string || null} [bg] background color
           */
          drawOver(x, y, ch, fg, bg) {
              const key = `${x},${y}`;
              const existing = this._data[key];
              if (existing) {
                  existing[2] = ch || existing[2];
                  existing[3] = fg || existing[3];
                  existing[4] = bg || existing[4];
              }
              else {
                  this.draw(x, y, ch, fg, bg);
              }
          }
          /**
           * Draws a text at given position. Optionally wraps at a maximum length. Currently does not work with hex layout.
           * @param {int} x
           * @param {int} y
           * @param {string} text May contain color/background format specifiers, %c{name}/%b{name}, both optional. %c{}/%b{} resets to default.
           * @param {int} [maxWidth] wrap at what width?
           * @returns {int} lines drawn
           */
          drawText(x, y, text, maxWidth) {
              let fg = null;
              let bg = null;
              let cx = x;
              let cy = y;
              let lines = 1;
              if (!maxWidth) {
                  maxWidth = this._options.width - x;
              }
              let tokens = tokenize(text, maxWidth);
              while (tokens.length) { // interpret tokenized opcode stream
                  let token = tokens.shift();
                  switch (token.type) {
                      case TYPE_TEXT:
                          let isSpace = false, isPrevSpace = false, isFullWidth = false, isPrevFullWidth = false;
                          for (let i = 0; i < token.value.length; i++) {
                              let cc = token.value.charCodeAt(i);
                              let c = token.value.charAt(i);
                              if (this._options.layout === "term") {
                                  let cch = cc >> 8;
                                  let isCJK = cch === 0x11 || (cch >= 0x2e && cch <= 0x9f) || (cch >= 0xac && cch <= 0xd7) || (cc >= 0xA960 && cc <= 0xA97F);
                                  if (isCJK) {
                                      this.draw(cx + 0, cy, c, fg, bg);
                                      this.draw(cx + 1, cy, "\t", fg, bg);
                                      cx += 2;
                                      continue;
                                  }
                              }
                              // Assign to `true` when the current char is full-width.
                              isFullWidth = (cc > 0xff00 && cc < 0xff61) || (cc > 0xffdc && cc < 0xffe8) || cc > 0xffee;
                              // Current char is space, whatever full-width or half-width both are OK.
                              isSpace = (c.charCodeAt(0) == 0x20 || c.charCodeAt(0) == 0x3000);
                              // The previous char is full-width and
                              // current char is nether half-width nor a space.
                              if (isPrevFullWidth && !isFullWidth && !isSpace) {
                                  cx++;
                              } // add an extra position
                              // The current char is full-width and
                              // the previous char is not a space.
                              if (isFullWidth && !isPrevSpace) {
                                  cx++;
                              } // add an extra position
                              this.draw(cx++, cy, c, fg, bg);
                              isPrevSpace = isSpace;
                              isPrevFullWidth = isFullWidth;
                          }
                          break;
                      case TYPE_FG:
                          fg = token.value || null;
                          break;
                      case TYPE_BG:
                          bg = token.value || null;
                          break;
                      case TYPE_NEWLINE:
                          cx = x;
                          cy++;
                          lines++;
                          break;
                  }
              }
              return lines;
          }
          /**
           * Timer tick: update dirty parts
           */
          _tick() {
              this._backend.schedule(this._tick);
              if (!this._dirty) {
                  return;
              }
              if (this._dirty === true) { // draw all
                  this._backend.clear();
                  for (let id in this._data) {
                      this._draw(id, false);
                  } // redraw cached data 
              }
              else { // draw only dirty 
                  for (let key in this._dirty) {
                      this._draw(key, true);
                  }
              }
              this._dirty = false;
          }
          /**
           * @param {string} key What to draw
           * @param {bool} clearBefore Is it necessary to clean before?
           */
          _draw(key, clearBefore) {
              let data = this._data[key];
              if (data[4] != this._options.bg) {
                  clearBefore = true;
              }
              this._backend.draw(data, clearBefore);
          }
      }
      Display.Rect = Rect;
      Display.Hex = Hex;
      Display.Tile = Tile;
      Display.TileGL = TileGL;
      Display.Term = Term;
      return Display;
  })();

  /**
   * Base noise generator
   */
  class Noise$1 {
  }

  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  /**
   * A simple 2d implementation of simplex noise by Ondrej Zara
   *
   * Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
   * Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
   * With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
   * Better rank ordering method by Stefan Gustavson in 2012.
   */
  class Simplex extends Noise$1 {
      /**
       * @param gradients Random gradients
       */
      constructor(gradients = 256) {
          super();
          this._gradients = [
              [0, -1],
              [1, -1],
              [1, 0],
              [1, 1],
              [0, 1],
              [-1, 1],
              [-1, 0],
              [-1, -1]
          ];
          let permutations = [];
          for (let i = 0; i < gradients; i++) {
              permutations.push(i);
          }
          permutations = RNG$1.shuffle(permutations);
          this._perms = [];
          this._indexes = [];
          for (let i = 0; i < 2 * gradients; i++) {
              this._perms.push(permutations[i % gradients]);
              this._indexes.push(this._perms[i] % this._gradients.length);
          }
      }
      get(xin, yin) {
          let perms = this._perms;
          let indexes = this._indexes;
          let count = perms.length / 2;
          let n0 = 0, n1 = 0, n2 = 0, gi; // Noise contributions from the three corners
          // Skew the input space to determine which simplex cell we're in
          let s = (xin + yin) * F2; // Hairy factor for 2D
          let i = Math.floor(xin + s);
          let j = Math.floor(yin + s);
          let t = (i + j) * G2;
          let X0 = i - t; // Unskew the cell origin back to (x,y) space
          let Y0 = j - t;
          let x0 = xin - X0; // The x,y distances from the cell origin
          let y0 = yin - Y0;
          // For the 2D case, the simplex shape is an equilateral triangle.
          // Determine which simplex we are in.
          let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
          if (x0 > y0) {
              i1 = 1;
              j1 = 0;
          }
          else { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
              i1 = 0;
              j1 = 1;
          } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
          // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
          // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
          // c = (3-sqrt(3))/6
          let x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
          let y1 = y0 - j1 + G2;
          let x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
          let y2 = y0 - 1 + 2 * G2;
          // Work out the hashed gradient indices of the three simplex corners
          let ii = mod(i, count);
          let jj = mod(j, count);
          // Calculate the contribution from the three corners
          let t0 = 0.5 - x0 * x0 - y0 * y0;
          if (t0 >= 0) {
              t0 *= t0;
              gi = indexes[ii + perms[jj]];
              let grad = this._gradients[gi];
              n0 = t0 * t0 * (grad[0] * x0 + grad[1] * y0);
          }
          let t1 = 0.5 - x1 * x1 - y1 * y1;
          if (t1 >= 0) {
              t1 *= t1;
              gi = indexes[ii + i1 + perms[jj + j1]];
              let grad = this._gradients[gi];
              n1 = t1 * t1 * (grad[0] * x1 + grad[1] * y1);
          }
          let t2 = 0.5 - x2 * x2 - y2 * y2;
          if (t2 >= 0) {
              t2 *= t2;
              gi = indexes[ii + 1 + perms[jj + 1]];
              let grad = this._gradients[gi];
              n2 = t2 * t2 * (grad[0] * x2 + grad[1] * y2);
          }
          // Add contributions from each corner to get the final noise value.
          // The result is scaled to return values in the interval [-1,1].
          return 70 * (n0 + n1 + n2);
      }
  }

  var RotNoise = { Simplex };

  const DISPLAY_WIDTH = 30;
  const DISPLAY_HEIGHT = 20;
  const DISPLAY_FONT_SIZE = 15;
  const SCREEN_WIDTH = 60;
  const SCREEN_HEIGHT = 40;
  const WORLD_WIDTH = 120;
  const WORLD_HEIGHT = 80;
  const WATER_LIMIT = -0.5;
  const PLAIN_LIMIT = 0.5;
  const FOREST_LIMIT = 0.8;
  const THICKET_LIMIT = 1;

  const DISPLAY = new Display({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      fontSize: DISPLAY_FONT_SIZE,
      forceSquareRatio: true
  });

  const Camera = defineComponent();

  const Position = defineComponent({
      x: Types.ui16,
      y: Types.ui16
  });

  const makeCamera = (world) => {
      const eid = addEntity(world);
      addComponent(world, Camera, eid);
      addComponent(world, Position, eid);
      Position.x[eid] = Math.floor((WORLD_WIDTH / 2) - (DISPLAY_WIDTH / 2));
      Position.y[eid] = Math.floor((WORLD_HEIGHT / 2) - (DISPLAY_HEIGHT / 2));
  };

  const GameManager = defineComponent({
      selectX: Types.i16,
      selectY: Types.i16
  });

  const makeGameManager = (world) => {
      const gameManager = addEntity(world);
      addComponent(world, GameManager, gameManager);
      GameManager.selectX[gameManager] = -1;
      GameManager.selectY[gameManager] = -1;
      return gameManager;
  };

  const Noise = defineComponent({
      val: Types.f32
  });

  var DrawEnum;
  (function (DrawEnum) {
      DrawEnum[DrawEnum["Water"] = 0] = "Water";
      DrawEnum[DrawEnum["Plain"] = 1] = "Plain";
      DrawEnum[DrawEnum["Forest"] = 2] = "Forest";
      DrawEnum[DrawEnum["Thicket"] = 3] = "Thicket";
  })(DrawEnum || (DrawEnum = {}));
  const Draw = defineComponent({
      tile: Types.ui8
  });

  const makeMap = (world) => {
      const noise2D = new RotNoise.Simplex();
      for (let y = 0; y < WORLD_HEIGHT; y++) {
          for (let x = 0; x < WORLD_WIDTH; x++) {
              const eid = addEntity(world);
              addComponent(world, Position, eid);
              Position.x[eid] = x;
              Position.y[eid] = y;
              const noise = noise2D.get(x / 20, y / 20);
              addComponent(world, Noise, eid);
              Noise.val[eid] = noise;
              addComponent(world, Draw, eid);
              if (noise < WATER_LIMIT)
                  Draw.tile[eid] = DrawEnum.Water;
              else if (noise < PLAIN_LIMIT)
                  Draw.tile[eid] = DrawEnum.Plain;
              else if (noise < FOREST_LIMIT)
                  Draw.tile[eid] = DrawEnum.Forest;
              else if (noise < THICKET_LIMIT)
                  Draw.tile[eid] = DrawEnum.Thicket;
          }
      }
  };

  const makeMouseListener = (gmId) => {
      window.addEventListener('mouseup', (e) => {
          GameManager.selectX[gmId] = DISPLAY.eventToPosition(e)[0];
          GameManager.selectY[gmId] = DISPLAY.eventToPosition(e)[1];
      });
  };

  const cameraQuery = defineQuery([Camera]);

  const gameManagerQuery = defineQuery([GameManager]);
  const gameManagerEnterQuery = enterQuery(gameManagerQuery);

  const keyMap = {};
  keyMap[KEYS.VK_W] = 0;
  keyMap[KEYS.VK_S] = 1;
  keyMap[KEYS.VK_D] = 2;
  keyMap[KEYS.VK_A] = 3;
  const inputSystem = (world) => {
      const entities = gameManagerEnterQuery(world);
      for (let i = 0; i < entities.length; i++) {
          window.addEventListener('keydown', function (e) {
              const code = e.keyCode;
              if (code in keyMap) {
                  const camId = cameraQuery(world)[0];
                  if (keyMap[code] === 0 && Position.y[camId] > 0) {
                      Position.y[camId] = Position.y[camId] - 1;
                  }
                  if (keyMap[code] === 1 && Position.y[camId] < WORLD_HEIGHT - DISPLAY_HEIGHT) {
                      Position.y[camId] = Position.y[camId] + 1;
                  }
                  if (keyMap[code] === 2 && Position.x[camId] < WORLD_WIDTH - DISPLAY_WIDTH) {
                      Position.x[camId] = Position.x[camId] + 1;
                  }
                  if (keyMap[code] === 3 && Position.x[camId] > 0) {
                      Position.x[camId] = Position.x[camId] - 1;
                  }
              }
          });
      }
      return world;
  };

  const movementSystem = (world) => {
      return world;
  };

  // -------------------------------
  // TYPES / INTERFACES
  // -------------------------------
  // -------------------------------
  // CONSTANTS
  // -------------------------------
  const DEFAULT_THRESHOLD = Math.sqrt(1.05 * 0.05) - 0.05;
  const RE_HEX = /^(?:[0-9a-f]{3}){1,2}$/i;
  const DEFAULT_BW = {
      black: '#000000',
      white: '#ffffff',
      threshold: DEFAULT_THRESHOLD
  };
  // -------------------------------
  // HELPER METHODS
  // -------------------------------
  function padz(str, len = 2) {
      return (new Array(len).join('0') + str).slice(-len);
  }
  function hexToRgbArray(hex) {
      if (hex.slice(0, 1) === '#')
          hex = hex.slice(1);
      if (!RE_HEX.test(hex))
          throw new Error(`Invalid HEX color: "${hex}"`);
      // normalize / convert 3-chars hex to 6-chars.
      if (hex.length === 3) {
          hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16) // b
      ];
  }
  function toRGB(c) {
      return { r: c[0], g: c[1], b: c[2] };
  }
  function toRgbArray(c) {
      if (!c)
          throw new Error('Invalid color value');
      if (Array.isArray(c))
          return c;
      return typeof c === 'string' ? hexToRgbArray(c) : [c.r, c.g, c.b];
  }
  // http://stackoverflow.com/a/3943023/112731
  function getLuminance(c) {
      let i, x;
      const a = []; // so we don't mutate
      for (i = 0; i < c.length; i++) {
          x = c[i] / 255;
          a[i] = x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
      }
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  function invertToBW(color, bw, asArr) {
      const options = (bw === true)
          ? DEFAULT_BW
          : Object.assign({}, DEFAULT_BW, bw);
      return getLuminance(color) > options.threshold
          ? (asArr ? hexToRgbArray(options.black) : options.black)
          : (asArr ? hexToRgbArray(options.white) : options.white);
  }
  // -------------------------------
  // PUBLIC MEMBERS
  // -------------------------------
  /**
   *  Generates inverted (opposite) version of the given color.
   *  @param {Color} color - Color to be inverted.
   *  @param {BlackWhite|boolean} [bw=false] - Whether to amplify the inversion to
   *  black or white. Provide an object to customize black/white colors.
   *  @returns {HexColor} - Hexadecimal representation of the inverted color.
   */
  function invert(color, bw = false) {
      color = toRgbArray(color);
      if (bw)
          return invertToBW(color, bw);
      return '#' + color.map(c => padz((255 - c).toString(16))).join('');
  }
  /**
   *  Utility methods to generate inverted version of a color.
   *  @namespace
   */
  (function (invert) {
      /**
       *  Generates inverted (opposite) version of the given color, as a RGB object.
       *  @alias invert.asRgbObject
       *  @param {Color} color - Color to be inverted.
       *  @param {BlackWhite|boolean} [bw] - Whether to amplify the inversion to
       *  black or white. Provide an object to customize black/white colors.
       *  @returns {RGB} - RGB object representation of the inverted color.
       */
      function asRGB(color, bw) {
          color = toRgbArray(color);
          const list = bw
              ? invertToBW(color, bw, true)
              : color.map(c => 255 - c);
          return toRGB(list);
      }
      invert.asRGB = asRGB;
      /**
       *  Generates inverted (opposite) version of the given color, as a RGB array.
       *  @param {Color} color - Color to be inverted.
       *  @param {BlackWhite|boolean} [bw] - Whether to amplify the inversion to
       *  black or white. Provide an object to customize black/white colors.
       *  @returns {RGB} - RGB array representation of the inverted color.
       */
      function asRgbArray(color, bw) {
          color = toRgbArray(color);
          return bw
              ? invertToBW(color, bw, true)
              : color.map(c => 255 - c);
      }
      invert.asRgbArray = asRgbArray;
      /**
       *  Default luminance threshold used for amplifying inversion to black and
       *  white.
       *  @type {number}
       */
      invert.defaultThreshold = DEFAULT_THRESHOLD;
      /**
       *  Alias of `.asRGB()`
       */
      invert.asRgbObject = asRGB;
  })(invert || (invert = {}));
  // -------------------------------
  // EXPORT
  // -------------------------------
  var invert$1 = invert;

  const Selected = defineComponent();

  const selectedQuery = defineQuery([Selected]);

  const Visible = defineComponent();

  const visibleQuery = defineQuery([Visible]);

  const renderSystem = (world) => {
      const visibleEntities = visibleQuery(world);
      const camEntities = cameraQuery(world);
      const camX = Position.x[camEntities[0]];
      const camY = Position.y[camEntities[0]];
      const offsetX = Math.floor(SCREEN_WIDTH / 2) - Math.floor(DISPLAY_WIDTH / 2);
      const offsetY = Math.floor(SCREEN_HEIGHT / 2) - Math.floor(DISPLAY_HEIGHT / 2);
      for (let i = 0; i < visibleEntities.length; i++) {
          const entity = visibleEntities[i];
          const entityX = Position.x[entity];
          const entityY = Position.y[entity];
          const char = '';
          const foreground = '';
          let background = '';
          const drawType = Draw.tile[entity];
          if (drawType === DrawEnum.Water)
              background = '#5b6ee1';
          else if (drawType === DrawEnum.Plain)
              background = '#99e550';
          else if (drawType === DrawEnum.Forest)
              background = '#37946e';
          else if (drawType === DrawEnum.Thicket)
              background = '#1a6a49';
          if (selectedQuery(world).includes(entity))
              background = invert$1(background);
          DISPLAY.draw(entityX - camX + offsetX, entityY - camY + offsetY, char, foreground, background);
      }
      return world;
  };

  const selectSystem = (world) => {
      const gmId = gameManagerQuery(world)[0];
      const selectX = GameManager.selectX[gmId];
      const selectY = GameManager.selectY[gmId];
      if (selectX === -1 && selectY === -1)
          return world;
      const camEntities = cameraQuery(world);
      for (let i = 0; i < camEntities.length; i++) {
          const camId = camEntities[0];
          const camX = Position.x[camId];
          const camY = Position.y[camId];
          const visibleEntities = visibleQuery(world);
          for (let j = 0; j < visibleEntities.length; j++) {
              const vId = visibleEntities[j];
              const entityX = Position.x[vId];
              const entityY = Position.y[vId];
              const offsetX = Math.floor(SCREEN_WIDTH / 2) - Math.floor(DISPLAY_WIDTH / 2);
              const offsetY = Math.floor(SCREEN_HEIGHT / 2) - Math.floor(DISPLAY_HEIGHT / 2);
              if (selectX === (entityX - camX + offsetX) && selectY === (entityY - camY + offsetY)) {
                  console.log('select is visible');
                  const selectedEntities = selectedQuery(world);
                  for (let k = 0; k < selectedEntities.length; k++) {
                      const selectedId = selectedEntities[k];
                      removeComponent(world, Selected, selectedId);
                  }
                  addComponent(world, Selected, vId);
                  GameManager.selectX[gameManagerQuery(world)[0]] = -1;
                  GameManager.selectY[gameManagerQuery(world)[0]] = -1;
              }
          }
      }
      return world;
  };

  const uiSystem = (world) => {
      const camEntities = cameraQuery(world);
      for (let i = 0; i < camEntities.length; i++) {
          DISPLAY.drawText(0, SCREEN_HEIGHT - 2, 'Hello World.', SCREEN_WIDTH);
          DISPLAY.drawText(0, SCREEN_HEIGHT - 1, 'WASD to move. Left click to select tile.', SCREEN_WIDTH);
          const offsetX = Math.floor(SCREEN_WIDTH / 2) - Math.floor(DISPLAY_WIDTH / 2);
          const offsetY = Math.floor(SCREEN_HEIGHT / 2) - Math.floor(DISPLAY_HEIGHT / 2);
          DISPLAY.drawText(offsetX, offsetY - 1, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcd', DISPLAY_WIDTH);
          for (let j = 0; j < DISPLAY_HEIGHT; j++) {
              DISPLAY.draw(offsetX - 1, offsetY + j, `${j + 1}`, '', '');
          }
      }
      return world;
  };

  const invisibleQuery = defineQuery([Position, Not(Visible)]);

  const visibleSystem = (world) => {
      const visibleEntities = visibleQuery(world);
      const invisibleEntities = invisibleQuery(world);
      const camEntities = cameraQuery(world);
      if (camEntities.length === 0)
          console.log('Error: Camera DNE.');
      const camId = camEntities[0];
      const camX = Position.x[camId];
      const camY = Position.y[camId];
      for (let i = 0; i < visibleEntities.length; i++) {
          const entity = visibleEntities[i];
          const entityX = Position.x[entity];
          const entityY = Position.y[entity];
          if ((entityX < camX || entityX >= camX + DISPLAY_WIDTH) ||
              (entityY < camY || entityY >= camY + DISPLAY_HEIGHT)) {
              removeComponent(world, Visible, entity);
          }
      }
      for (let i = 0; i < invisibleEntities.length; i++) {
          const entity = invisibleEntities[i];
          const entityX = Position.x[entity];
          const entityY = Position.y[entity];
          if ((entityX >= camX && entityX < camX + DISPLAY_WIDTH) &&
              (entityY >= camY && entityY < camY + DISPLAY_HEIGHT)) {
              addComponent(world, Visible, entity);
          }
      }
      return world;
  };

  document.body.appendChild(DISPLAY.getContainer());
  const pipeline = pipe(inputSystem, movementSystem, visibleSystem, selectSystem, uiSystem, renderSystem);
  const world = createWorld();
  const gm = makeGameManager(world);
  makeCamera(world);
  makeMap(world);
  makeMouseListener(gm);
  setInterval(() => {
      pipeline(world);
  }, 16);

})();
