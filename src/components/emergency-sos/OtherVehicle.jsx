import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const SpecifyVehicle = () => {
  const [vehicle, setVehicle] = useState('')
  const navigate = useNavigate()

  const handleSubmit = () => {
    if (!vehicle.trim()) return
    navigate('/emergency-chat')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="h-screen bg-background text-primary flex flex-col items-center justify-center px-8 text-center">
      <h2 className="text-[1.8rem] mb-12">
        Please{' '}
        <span className="text-highlight font-bold">specify</span> the{' '}
        <span className="text-highlight font-bold">vehicle type</span>.
      </h2>

      <div className="flex gap-3 w-full max-w-xl mx-auto">
        <input
          type="text"
          placeholder="Type here..."
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 text-base p-3 border border-gray-300 rounded-md outline-none"
        />
        <button
          className="bg-primary text-white font-bold px-6 py-3 text-base rounded-md hover:bg-green-950 transition"
          onClick={handleSubmit}
        >
          Send
        </button>
      </div>
    </div>
  )
}