/* eslint-disable prettier/prettier */
import { useEffect, useRef, useState } from 'react'
import { CToast, CToastBody, CToastHeader, CToaster } from '@coreui/react'

const MasinToast = ({ toastView, closeToast }) => {
  const [toast, addToast] = useState(0)
  const toaster = useRef()
  const shortMasinToast = (
    <CToast>
      <CToastHeader closeButton={closeToast}>
        <svg
          className="rounded me-2"
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          focusable="false"
          role="img"
        >
          <rect width="100%" height="100%" fill="#007aff"></rect>
        </svg>
        <strong className="me-auto">Masin</strong>
        <small>10 seconds ago</small>
      </CToastHeader>
      <CToastBody>Document has been uploaded</CToastBody>
    </CToast>
  )

  useEffect(() => {
    const checkDocUploaded = setInterval(async () => {
      if (toastView) {
        addToast(shortMasinToast)
      }
    }, 1500)

    return () => clearInterval(checkDocUploaded);
  }, [toastView])

  return (
    <>
      <CToaster ref={toaster} push={toast} placement="top-end" />
    </>
  )
}

export default MasinToast
