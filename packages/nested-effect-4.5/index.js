import { effect, track, trigger } from './effect.js'
// 原始数据
const data = { foo: true, bar: true }
// 代理对象
const obj = new Proxy(data, {
    // 拦截读取操作
    get(target, key) {
        track(target, key)
        return target[key]
    },
    // 拦截设置操作
    set(target, key, newVal) {
        console.log('trigger', key, newVal)
        target[key] = newVal
        trigger(target, key)
        return newVal
    }
})

// 全局变量
let temp1, temp2

// effectFn1 嵌套了 effectFn2
effect(function effectFn1() {
    console.log('effectFn1 执行')

    effect(function effectFn2() {
        console.log('effectFn2 执行')
        // 在 effectFn2 中读取 obj.bar 属性
        temp2 = obj.bar
    })

    // 在 effectFn1 中读取 obj.foo 属性
    temp1 = obj.foo

})

console.log('修改foo')
obj.foo = '123'