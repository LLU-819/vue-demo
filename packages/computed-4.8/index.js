import { effect, track, trigger, computed } from './effect.js'

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

// // 副作用函数注册的时候就会执行一次，然后触发一次track
// const effectFn = effect(() => {
//   return obj.foo + obj.bar
// }, {
//   lazy: true
// })

const sumRes = computed(() => obj.foo + obj.bar)


effect(() => {
  // 在该副作用函数中读取 sumRes.value
  console.log(sumRes.value)
})

// 修改 obj.foo 的值
// obj.foo++

/**
 * 这里执行会溢栈，因为
 * sumRes.value没有在副作用函数内执行，在get value时track，由于activeEffect是undefined，直接返回get value，重复这个行为
 */
// console.log(sumRes.value)  // 3
