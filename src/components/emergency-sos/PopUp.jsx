import { useEffect, useState } from 'react'

export const EmergencyPopup = ({ onCancel, onSendNow }) => {
  const [countdown, setCountdown] = useState(15)

  useEffect(() => {
    if (countdown === 0) {
      onSendNow()
      return
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, onSendNow])

  return (
    <div className="fixed inset-0 bg-background bg-opacity-10 flex flex-col justify-center items-center text-center z-[999] px-6">
      <p className="text-lg mb-6 text-primary max-w-2xl">
        You have triggered the <strong className='text-highlight'>EMERGENCY</strong> button. If this was a
        mistake, you can cancel within the next{' '}
        <span className="text-highlight font-bold">{countdown} seconds</span>.
        Otherwise, the alert will be sent automatically.
      </p>
      <div className="flex flex-row justify-center gap-8">
        <button
          className="bg-highlight text-white font-bold px-6 py-2 rounded-md hover:bg-[#8d8605] transition"
          onClick={onSendNow}
        >
          Send NOW
        </button>
        <button
          className="bg-green-900 text-white font-bold px-6 py-2 rounded-md hover:bg-green-950 transition"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
