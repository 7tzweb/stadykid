import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Card } from '@/components/ui/Card'

const SplashScreen = lazy(() => import('@/screens/SplashScreen').then((module) => ({ default: module.SplashScreen })))
const AuthScreen = lazy(() => import('@/screens/AuthScreen').then((module) => ({ default: module.AuthScreen })))
const ChildProfileSelectionScreen = lazy(() =>
  import('@/screens/ChildProfileSelectionScreen').then((module) => ({
    default: module.ChildProfileSelectionScreen,
  })),
)
const ChildProfileEditorScreen = lazy(() =>
  import('@/screens/ChildProfileEditorScreen').then((module) => ({
    default: module.ChildProfileEditorScreen,
  })),
)
const AvatarBuilderScreen = lazy(() =>
  import('@/screens/AvatarBuilderScreen').then((module) => ({ default: module.AvatarBuilderScreen })),
)
const PetHomeScreen = lazy(() => import('@/screens/PetHomeScreen').then((module) => ({ default: module.PetHomeScreen })))
const WorldMapScreen = lazy(() => import('@/screens/WorldMapScreen').then((module) => ({ default: module.WorldMapScreen })))
const MissionSelectionScreen = lazy(() =>
  import('@/screens/MissionSelectionScreen').then((module) => ({
    default: module.MissionSelectionScreen,
  })),
)
const GameScreen = lazy(() => import('@/screens/GameScreen').then((module) => ({ default: module.GameScreen })))
const MissionCompleteScreen = lazy(() =>
  import('@/screens/MissionCompleteScreen').then((module) => ({
    default: module.MissionCompleteScreen,
  })),
)
const ProgressScreen = lazy(() =>
  import('@/screens/ProgressScreen').then((module) => ({ default: module.ProgressScreen })),
)
const ShopScreen = lazy(() => import('@/screens/ShopScreen').then((module) => ({ default: module.ShopScreen })))
const ParentGateScreen = lazy(() =>
  import('@/screens/ParentGateScreen').then((module) => ({ default: module.ParentGateScreen })),
)
const ParentDashboardScreen = lazy(() =>
  import('@/screens/ParentDashboardScreen').then((module) => ({
    default: module.ParentDashboardScreen,
  })),
)
const SettingsScreen = lazy(() =>
  import('@/screens/SettingsScreen').then((module) => ({ default: module.SettingsScreen })),
)
const SystemStatusScreen = lazy(() =>
  import('@/screens/SystemStatusScreen').then((module) => ({ default: module.SystemStatusScreen })),
)
const NotFoundScreen = lazy(() =>
  import('@/screens/NotFoundScreen').then((module) => ({ default: module.NotFoundScreen })),
)

function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return null
}

function RouterFallback() {
  return (
    <ScreenLayout subtitle="טוען מסך..." title="טעינה" tone="sky">
      <Card className="mx-auto mt-12 max-w-xl text-center">
        <div className="mx-auto h-16 w-16 rounded-full border-4 border-[#0ea5e9] border-t-transparent pulse-soft" />
      </Card>
    </ScreenLayout>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<RouterFallback />}>
        <Routes>
          <Route element={<SplashScreen />} path="/" />
          <Route element={<AuthScreen />} path="/auth" />
          <Route element={<ChildProfileSelectionScreen />} path="/profiles" />
          <Route element={<ChildProfileEditorScreen />} path="/profiles/new" />
          <Route element={<ChildProfileEditorScreen />} path="/profiles/:childId/edit" />
          <Route element={<AvatarBuilderScreen />} path="/avatar-builder/:childId" />
          <Route element={<PetHomeScreen />} path="/home" />
          <Route element={<WorldMapScreen />} path="/worlds" />
          <Route element={<MissionSelectionScreen />} path="/worlds/:worldId/missions" />
          <Route element={<GameScreen />} path="/game/:levelId" />
          <Route element={<MissionCompleteScreen />} path="/mission-complete/:levelId" />
          <Route element={<ProgressScreen />} path="/progress" />
          <Route element={<ShopScreen />} path="/shop" />
          <Route element={<ParentGateScreen />} path="/parent-gate" />
          <Route element={<ParentDashboardScreen />} path="/parent/dashboard" />
          <Route element={<SettingsScreen />} path="/settings" />
          <Route element={<SystemStatusScreen />} path="/system/status" />
          <Route element={<NotFoundScreen />} path="*" />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
