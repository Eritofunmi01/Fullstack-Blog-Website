import React from 'react'

function Container({ children, className}) {
  return (
    <div className={`max-w-9xl w-full  ${className}`}>
        {children}
    </div>
  )
}

export default Container