export function cleanup(effectFn) {
    // 遍历 effectFn.deps 数组
    for (let i = 0; i < effectFn.deps.length; i++) {
      // deps 是依赖集合
      const deps = effectFn.deps[i]
      // 将 effectFn 从依赖集合中移除
      deps.delete(effectFn)
    }
    // 最后需要重置 effectFn.deps 数组
    effectFn.deps.length = 0
  }
  