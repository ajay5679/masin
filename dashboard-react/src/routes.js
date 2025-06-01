import { exact } from 'prop-types'
import React from 'react'

const Document = React.lazy(() => import('./views/document/Document'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/document', exact: true, name: 'Document', element: Document },
]

export default routes
