import { effect, track, trigger } from './effect.js'

const obj = {
    foo: 1,
    get bar() {
        // 这里的 this 指向的是谁？
        return this.foo
    }
}


const p = new Proxy(obj, {
    get(target, key, receiver) {
        console.log('get', target, key)
        track(target, key)
        // 注意，这里我们没有使用 Reflect.get 完成读取
        // return target[key]
        return Reflect.get(target, key, receiver)
    },
    // 拦截设置操作
    set(target, key, newVal) {
        // console.log('trigger', key, newVal)
        target[key] = newVal
        trigger(target, key)
        return newVal
    }

})

effect(() => {
    // obj 是原始数据，不是代理对象，不能触发get拦截，这样的访问不能够建立响应联系
    // console.log('---obj.foo',obj.foo)

    console.log('---p.bar', p.bar)

})

// 原始对象的更新不会触发响应
// obj.foo++
p.foo++
