import React from 'react'

export const Badge = ({ children, className = '', variant = 'default', ...props }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-900',
    outline: 'border border-gray-300 text-gray-900'
  }
  
  return (
    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  )
}