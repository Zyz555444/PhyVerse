import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { RootLayout } from './layouts/RootLayout'
import { Landing } from '@/pages/Landing'
import { Experiment } from '@/pages/Experiment'
import { Sandbox } from '@/pages/Sandbox'
import { Settings } from '@/pages/Settings'
import { NotFound } from '@/pages/NotFound'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Landing /> },
      {
        path: 'experiment/:category/:experimentId',
        element: <Experiment />,
      },
      { path: 'sandbox', element: <Sandbox /> },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export function Router() {
  return <RouterProvider router={router} />
}
