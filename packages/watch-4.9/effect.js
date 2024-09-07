import { cleanup } from './utils.js'

// 用一个全局变量存储当前激活的 effect 函数
let activeEffect
// effect 栈
const effectStack = []

export function effect(fn, options = {}) {
    // console.log('副作用函数 注册')
    const effectFn = () => {
        // 调用 cleanup 函数完成清除工作
        cleanup(effectFn)  // 新增
        activeEffect = effectFn
        // console.log('effect activeEffect指向', fn)
        // 在调用副作用函数之前将当前副作用函数压入栈中
        effectStack.push(effectFn)
        // 将 fn 的执行结果存储到 res 中
        const res = fn()
        // 在当前副作用函数执行完毕后，将当前副作用函数弹出栈，并把 activeEffect 还原为之前的值
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
        console.log('副作用函数 执行完毕', fn)
        // 将 res 作为 effectFn 的返回值
        return res
    }
    effectFn.options = options
    effectFn.deps = []
    // 只有非 lazy 的时候，才执行
    if (!options.lazy) {
        // 执行副作用函数
        effectFn()
    }
    // 将副作用函数作为返回值返回
    return effectFn
}

const bucket = new WeakMap()
export function track(target, key) {
    // console.log(`${key} track 依赖`)
    // 没有 activeEffect，直接 return
    if (!activeEffect) return target[key]
    // 根据 target 从“桶”中取得 depsMap，它也是一个 Map 类型：key --> effects
    let depsMap = bucket.get(target)
    // 如果不存在 depsMap，那么新建一个 Map 并与 target 关联
    if (!depsMap) {
        bucket.set(target, (depsMap = new Map()))
    }
    // 再根据 key 从 depsMap 中取得 deps，它是一个 Set 类型，
    // 里面存储着所有与当前 key 相关联的副作用函数：effects
    let deps = depsMap.get(key)
    // 如果 deps 不存在，同样新建一个 Set 并与 key 关联
    if (!deps) {
        depsMap.set(key, (deps = new Set()))
    }
    // 最后将当前激活的副作用函数添加到“桶”里
    // console.log('依赖收集add', activeEffect)
    deps.add(activeEffect)
    activeEffect.deps.push(deps)
}

export function trigger(target, key) {
    // 根据 target 从桶中取得 depsMap，它是 key --> effects
    const depsMap = bucket.get(target)
    if (!depsMap) return
    // 根据 key 取得所有副作用函数 effects
    const effects = depsMap.get(key)
    // console.log(`${key} 读取依赖执行`)
    // 执行副作用函数
    const effectsToRun = new Set()
    effects && effects.forEach(effectFn => {
        // 如果 trigger 触发执行的副作用函数与当前正在执行的副作用函数相同，则不触发执行
        if (effectFn !== activeEffect) {
            effectsToRun.add(effectFn)
        }
    })
    effectsToRun.forEach(effectFn => {
        // 如果一个副作用函数存在调度器，则调用该调度器，并将副作用函数作为参数传递
        if (effectFn.options.scheduler) {
            effectFn.options.scheduler(effectFn)
        } else {
            // 否则直接执行副作用函数（之前的默认行为）
            effectFn()
        }
    })
}

export function computed(getter) {
    let value
    let dirty = true

    const effectFn = effect(getter, {
        lazy: true,
        scheduler() {
            console.log('scheduler', { dirty })
            if (!dirty) {
                dirty = true
                // 当计算属性依赖的响应式数据变化时，手动调用 trigger 函数触发响应
                trigger(computedObj, 'value')
            }
        }
    })

    const computedObj = {
        get value() {
            console.log('get value', { dirty })
            if (dirty) {
                value = effectFn()
                dirty = false
            }
            // 当读取 value 时，手动调用 track 函数进行追踪
            track(computedObj, 'value')
            return value
        }
    }

    return computedObj
}

export function watch(source, cb) {
    let getter
    if (typeof source === 'function') {
        getter = source
    } else {
        getter = () => traverse(source)
    }
    // 定义旧值与新值
    let oldValue, newValue
    // 使用 effect 注册副作用函数时，开启 lazy 选项，并把返回值存储到 effectFn 中以便后续手动调用
    const effectFn = effect(
        () => getter(),
        {
            lazy: true,
            scheduler() {
                // 在 scheduler 中重新执行副作用函数，得到的是新值
                newValue = effectFn()
                // 将旧值和新值作为回调函数的参数
                cb(newValue, oldValue)
                // 更新旧值，不然下一次会得到错误的旧值
                oldValue = newValue
            }
        }
    )
    // 手动调用副作用函数，拿到的值就是旧值
    oldValue = effectFn()
}

function traverse(value, seen = new Set()) {
    // 如果要读取的数据是原始值，或者已经被读取过了，那么什么都不做
    if (typeof value !== 'object' || value === null || seen.has(value)) return
    // 将数据添加到 seen 中，代表遍历地读取过了，避免循环引用引起的死循环
    seen.add(value)
    // 暂时不考虑数组等其他结构
    // 假设 value 就是一个对象，使用 for...in 读取对象的每一个值，并递归地调用 traverse 进行处理
    for (const k in value) {
        traverse(value[k], seen)
    }

    return value
}
