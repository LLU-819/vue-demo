import { effect, track, trigger, watch } from './effect.js'

// 原始数据
const data = { foo: 1, bar: 2 }
// 代理对象
const obj = new Proxy(data, {
  // 拦截读取操作
  get(target, key) {
    track(target, key)
    return target[key]
  },
  // 拦截设置操作
  set(target, key, newVal) {
    // console.log('trigger', key, newVal)
    target[key] = newVal
    trigger(target, key)
    return newVal
  }
})

watch(obj, () => {
  console.log('数据变化了', obj.foo)
}, {immediate: true})

// obj.foo++




