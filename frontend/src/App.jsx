import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Menu from './pages/Menu.jsx'
import Reservations from './pages/Reservations.jsx'
import About from './pages/About.jsx'
import NotFound from './pages/NotFound.jsx'

// The gallery is image-heavy, so it is split into its own bundle.
const Gallery = lazy(() => import('./pages/Gallery.jsx'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="menu" element={<Menu />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="about" element={<About />} />
        <Route
          path="gallery"
          element={
            <Suspense fallback={<div className="container section" aria-busy="true" />}>
              <Gallery />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
