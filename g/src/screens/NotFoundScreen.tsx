import { useNavigate } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function NotFoundScreen() {
  const navigate = useNavigate()

  return (
    <ScreenLayout subtitle="הנתיב הזה לא קיים במפת האפליקציה." title="404" tone="sand">
      <Card className="mx-auto mt-12 max-w-xl space-y-4 text-center">
        <p className="font-display text-4xl text-slate-900">העמוד לא נמצא</p>
        <p className="text-slate-600">אפשר לחזור למסך הפתיחה או למפת העולם.</p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => navigate('/')}>למסך פתיחה</Button>
          <Button onClick={() => navigate('/worlds')} variant="secondary">
            למפת העולם
          </Button>
        </div>
      </Card>
    </ScreenLayout>
  )
}
