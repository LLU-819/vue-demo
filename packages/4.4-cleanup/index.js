import { effect, track, trigger } from './effect.js'
// 原始数据
const data = { ok: true, text: 'hello world' }
// 代理对象
const obj = new Proxy(data, {
    // 拦截读取操作
    get(target, key) {
        track(target, key)
        return target[key]
    },
    // 拦截设置操作
    set(target, key, newVal) {
        target[key] = newVal
        trigger(target, key)
        return newVal
    }
})

effect(function effectFn() {
    const a = obj.ok ? obj.text : 'not'
    console.log('a', a)
})

obj.ok = false