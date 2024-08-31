import { cleanup } from './utils.js'

// 用一个全局变量存储当前激活的 effect 函数
let activeEffect
// effect 栈
const effectStack = []

export function effect(fn, options) {
    // console.log('副作用函数 注册')
    const effectFn = () => {
        // 调用 cleanup 函数完成清除工作
        cleanup(effectFn)  // 新增
        activeEffect = effectFn
        // console.log('effect activeEffect指向', fn)
        // 在调用副作用函数之前将当前副作用函数压入栈中
        effectStack.push(effectFn)
        fn()
        // 在当前副作用函数执行完毕后，将当前副作用函数弹出栈，并把 activeEffect 还原为之前的值
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
        // console.log('副作用函数 执行完毕', fn)
    }
    effectFn.options = options
    effectFn.deps = []
    effectFn()
}

const bucket = new WeakMap()
export function track(target, key) {
    // console.log(`${key} track 依赖`,)
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
