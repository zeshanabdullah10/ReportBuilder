import React from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Custom render function that includes providers
export function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options })
}

// Re-export everything from testing library
export * from '@testing-library/react'
export { customRender as render }
