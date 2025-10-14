import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { emergencyButton } from '@images'
import { EmergencyPopup } from '/src/components/emergency-sos/PopUp'

export const EmergencyReport = () => {
  const [showPopup, setShowPopup] = useState(false)
  const navigate = useNavigate()

  const handleSendNow = () => {
    setShowPopup(false)
    // TODO: Here you would send the emergency report to the backend
    // After successful report, navigate to Messages page
    navigate('/patient/messages', { state: { filterCategory: 'Emergency' } })
  }

  const handleCancel = () => {
    setShowPopup(false)
  }

  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center">
      <section className="flex items-center justify-center w-full h-full box-border">
        <div className="text-center max-w-3xl w-full text-primary">
          <h4 className="text-[1.3rem] font-bold m-0">REPORT</h4>
          <h1 className="text-5xl font-extrabold my-2">EMERGENCY</h1>
          <p className="text-sm mb-3">
            Tap the button to report your emergency and get the assistance you
            need right away.
          </p>
          <img
            src={emergencyButton}
            alt="Emergency Button"
            className="w-1/2 h-auto mb-3 cursor-pointer mx-auto"
            onClick={() => setShowPopup(true)}
          />
          <p className="text-sm text-primary max-w-[90%] mx-auto">
            This <strong>EMERGENCY</strong> feature is intended for emergency
            situations only. Please use it responsibly to ensure timely
            assistance during critical moments.
          </p>
        </div>
        {showPopup && (
          <EmergencyPopup onSendNow={handleSendNow} onCancel={handleCancel} />
        )}
      </section>
    </div>
  )
}
