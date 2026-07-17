export function navigateTo(path, options = {}) {
  const historyState = options.state || {}

  if (options.replace) {
    window.history.replaceState(historyState, '', path)
  } else {
    window.history.pushState(historyState, '', path)
  }

  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function getCurrentPathWithSearch() {
  return `${window.location.pathname}${window.location.search || ''}`
}
