import React, { useState, useEffect } from "react"
import "./progress.css"

const ProgressBar = () => {
  const [hourProgress, setHourProgress] = useState(0)
  const [monthProgress, setMonthProgress] = useState(0)
  const [yearProgress, setYearProgress] = useState(0)

  useEffect(() => {
    const calculateProgress = (now) => {
      const hourProgress = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / (24 * 3600)

      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const monthProgress = ((now.getDate() - 1) * 24 * 3600 + now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / (daysInMonth * 24 * 3600)

      const daysInYear = now.getFullYear() % 4 === 0 && (now.getFullYear() % 100 !== 0 || now.getFullYear() % 400 === 0) ? 366 : 365
      const yearProgress = (dayOfYear(now) * 24 * 3600 + now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / (daysInYear * 24 * 3600)

      return {
        hourProgress,
        monthProgress,
        yearProgress,
      }
    }
    const interval = setInterval(() => {
      const now = new Date()
      const progress = calculateProgress(now)

      setHourProgress(progress.hourProgress)
      setMonthProgress(progress.monthProgress)
      setYearProgress(progress.yearProgress)
    }, 100)

    return () => {
      clearInterval(interval)
    }
  }, [])

  function dayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0)
    const diff = date - start
    const oneDay = 1000 * 60 * 60 * 24
    return Math.floor(diff / oneDay)
  }

  return (
    <div className="progress-bars">
      <div className="progress-bar hour-progress">
        <div className="label">Day</div>
        <div className="bar">
          <div className="filled" style={{ width: hourProgress * 100 + "%" }} />
        </div>
        <div className="details">
          <div className="value">{(hourProgress * 24).toFixed(1)}h</div>
          <div className="percentage">{(hourProgress * 100).toFixed(4)}%</div>
        </div>
      </div>
      <div className="progress-bar day-progress">
        <div className="label">Month</div>
        <div className="bar">
          <div className="filled" style={{ width: monthProgress * 100 + "%" }} />
        </div>
        <div className="details">
          <div className="value">{new Date().getDate()}day</div>
          <div className="percentage">{(monthProgress * 100).toFixed(2)}%</div>
        </div>
      </div>
      <div className="progress-bar year-progress">
        <div className="label">YEAR</div>
        <div className="bar">
          <div className="filled" style={{ width: yearProgress * 100 + "%" }} />
        </div>
        <div className="details">
          <div className="value">{(yearProgress * 365).toFixed(2)} days</div>
          <div className="percentage">{(yearProgress * 100).toFixed(2)}%</div>
        </div>
      </div>
    </div>
  )
}

export default ProgressBar
