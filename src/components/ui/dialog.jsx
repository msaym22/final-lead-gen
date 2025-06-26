import React, { useState, useEffect } from 'react'

export const Dialog = ({ children, open, onOpenChange }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])
  
  return (
    <>
      {React.Children.map(children, child => 
        React.cloneElement(child, { open, onOpenChange })
      )}
    </>
  )
}

export const DialogTrigger = ({ children, open, onOpenChange, asChild, ...props }) => {
  if (asChild) {
    return React.cloneElement(children, {
      onClick: () => onOpenChange(true),
      ...props
    })
  }
  
  return (
    <button onClick={() => onOpenChange(true)} {...props}>
      {children}
    </button>
  )
}

export const DialogContent = ({ children, open, onOpenChange, className = '', ...props }) => {
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={() => onOpenChange(false)}
      />
      <div className={`relative bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-auto ${className}`} {...props}>
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={() => onOpenChange(false)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}

export const DialogHeader = ({ children, className = '', ...props }) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left mb-4 ${className}`} {...props}>
    {children}
  </div>
)

export const DialogTitle = ({ children, className = '', ...props }) => (
  <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h2>
)

export const DialogDescription = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-gray-600 ${className}`} {...props}>
    {children}
  </p>
)