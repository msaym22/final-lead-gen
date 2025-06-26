import React, { useState } from 'react'

export const Select = ({ children, value, onValueChange, ...props }) => {
  return (
    <div className="relative">
      {React.Children.map(children, child => 
        React.cloneElement(child, { value, onValueChange, ...props })
      )}
    </div>
  )
}

export const SelectTrigger = ({ children, className = '', value, onValueChange, ...props }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative">
      <button
        type="button"
        className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        onClick={() => setIsOpen(!isOpen)}
        {...props}
      >
        {children}
        <svg className="h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {React.Children.map(children, child => 
        child.type === SelectContent ? React.cloneElement(child, { isOpen, setIsOpen, value, onValueChange }) : null
      )}
    </div>
  )
}

export const SelectValue = ({ placeholder, value }) => {
  return <span>{value || placeholder}</span>
}

export const SelectContent = ({ children, isOpen, setIsOpen, value, onValueChange, className = '' }) => {
  if (!isOpen) return null
  
  return (
    <div className={`absolute top-full z-50 w-full rounded-md border bg-white py-1 shadow-lg ${className}`}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { onValueChange, setIsOpen, currentValue: value })
      )}
    </div>
  )
}

export const SelectItem = ({ children, value, onValueChange, setIsOpen, currentValue, className = '' }) => {
  return (
    <div
      className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 ${currentValue === value ? 'bg-blue-50 text-blue-600' : ''} ${className}`}
      onClick={() => {
        onValueChange(value)
        setIsOpen(false)
      }}
    >
      {children}
    </div>
  )
}