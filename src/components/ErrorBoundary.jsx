import { Component } from 'react'

// Keeps one failing subtree (e.g. a model that won't load) from blanking the
// whole scene — it renders the fallback instead and logs the error.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error('[scene] subtree failed to render:', error)
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}
