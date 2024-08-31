import { effect, track, trigger } from './effect.js'

// 原始数据
const data = { foo: 1 }
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

// 定义一个任务队列
const jobQueue = new Set()
// 使用 Promise.resolve() 创建一个 promise 实例，我们用它将一个任务添加到微任务队列
const p = Promise.resolve()

// 一个标志代表是否正在刷新队列
let isFlushing = false
function flushJob() {
  console.log('flushJob执行', { isFlushing })
  // 如果队列正在刷新，则什么都不做
  if (isFlushing) return
  // 设置为 true，代表正在刷新
  isFlushing = true
  // 在微任务队列中刷新 jobQueue 队列
  p.then(() => {
    console.log('微任务执行', `jobQueue.size: ${jobQueue.size}`)
    // console.log(obj.foo)
    jobQueue.forEach(job => job())
  }).finally(() => {
    console.log('微任务结束')
    // 结束后重置 isFlushing
    isFlushing = false
  })
}

// 副作用函数注册的时候就会执行一次，然后触发一次track
effect(() => {
  console.log(obj.foo)
}, {
  scheduler(fn) {
    console.log('scheduler执行')
    // 每次调度时，将副作用函数添加到 jobQueue 队列中
    jobQueue.add(fn)
    // 调用 flushJob 刷新队列
    flushJob()
  }
})

// 书中的例子
obj.foo++
obj.foo++

/**
 * 但还有很多其他有意思的例子
 *  */
// E.g. 仅读取两次
// obj.foo
// obj.foo

// E.g. 将第二次赋值放在宏任务里
// obj.foo++
// setTimeout(()=>{
//   obj.foo++
// })

// E.g. 将第二次赋值放在微任务里
// obj.foo
// const p2 = Promise.resolve()
// p2.then(() => {
//   obj.foo++
// })
