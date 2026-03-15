import { GameProvider } from '@/store/GameContext'
import { AppRouter } from '@/router/AppRouter'

function App() {
  return (
    <GameProvider>
      <AppRouter />
    </GameProvider>
  )
}

export default App
