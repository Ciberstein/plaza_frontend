// A one-file bridge between the axios layer and the toast component.
//
// It imports nothing on purpose: axios needs to raise a message, the toasts
// live in the React tree, and having either import the other creates a cycle
// that only shows up at runtime as an undefined module.
const listeners = new Set()

export const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const notify = (message, tone = 'info') => {
  const toast = { id: crypto.randomUUID(), message, tone }
  listeners.forEach(fn => fn(toast))
  return toast
}
