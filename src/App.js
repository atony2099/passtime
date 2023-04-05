import React, { useState, useEffect } from "react"
import { Bar } from "react-chartjs-2"
import "./App.css"
import { LinearScale, CategoryScale, BarElement } from "chart.js"
import Chart from "chart.js/auto"

import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import moment from "moment-timezone"

function App() {
  const [days, setDays] = useState(7)
  const [workTimeData, setWorkTimeData] = useState(null)

  const [hourProgress, setHourProgress] = useState(0)
  const [dayProgress, setDayProgress] = useState(0)
  const [yearProgress, setYearProgress] = useState(0)

  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const yearProgress = dayOfYear(now) / daysInYear(now.getFullYear())
      const dayProgress = (now.getDate() - 1 + now.getHours() / 24 + now.getMinutes() / 1440 + now.getSeconds() / 86400) / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const hourProgress = (now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600) / 24
      setHourProgress(hourProgress)
      setDayProgress(dayProgress)
      setYearProgress(yearProgress)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchWorkTimeData(days)
  }, [days])

  useEffect(() => {
    fetchWorkTimeData(days, startDate, endDate)
  }, [days, startDate, endDate])

  const fetchWorkTimeData = async (days, startDate, endDate) => {
    let url = `${process.env.REACT_APP_API_URL}/api/day/${days}`

    if (startDate && endDate) {
      const start = moment(startDate).tz("Asia/Shanghai").format("YYYY-MM-DD")
      const end = moment(endDate).tz("Asia/Shanghai").format("YYYY-MM-DD")

      url = `${process.env.REACT_APP_API_URL}/api/day/range?start=${start}&end=${end}`
    }

    const response = await fetch(url, {})

    const { code, data } = await response.json()

    if (code !== 0) {
      toast.error("Failed to fetch work time data", data)
    }

    const orderedData = Object.entries(data)
      .map(([date, workTime]) => {
        const d = new Date(date)
        const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()]
        return {
          date: `${date} (${weekday})`,
          workTime,
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    const orderedLabels = orderedData.map((d) => d.date)
    let orderedValues = orderedData.map((d) => d.workTime)
    let avgValue = orderedValues.reduce((sum, val) => sum + val, 0) / orderedValues.length
    avgValue = (avgValue / 3600).toFixed(1)
    orderedValues = orderedData.map((d) => (d.workTime / 3600).toFixed(1))
    setWorkTimeData({
      labels: [...orderedLabels, "Avg"],
      datasets: [
        {
          label: "Work Time",
          data: [...orderedValues, avgValue],
          datalabels: {
            display: true,
            color: "#333",
          },
        },
      ],
    })
  }

  const handleDaysChange = (e) => {
    setDays(parseInt(e.target.value))
  }

  const renderWorkTimeChart = () => {
    if (!workTimeData) return null

    const options = {
      scales: {
        y: {
          type: "linear",
          ticks: {
            beginAtZero: true,
          },
        },
        x: {
          type: "category",
        },
      },
    }

    Chart.register(LinearScale, CategoryScale, BarElement)

    return <Bar data={workTimeData} options={options} />
  }

  return (
    <div className="App">
      <div className="container">
        <ToastContainer />
        {/* <h1 className="title">Time Progress</h1> */}
        <div className="progress-bars">
          <div className="progress-bar hour-progress">
            <div className="label">HOUR</div>
            <div className="bar">
              <div className="filled" style={{ width: hourProgress * 100 + "%" }} />
            </div>
            <div className="details">
              <div className="value">{(hourProgress * 24).toFixed(2)}h</div>
              <div className="percentage">{(hourProgress * 100).toFixed(2)}%</div>
            </div>
          </div>
          <div className="progress-bar day-progress">
            <div className="label">DAY</div>
            <div className="bar">
              <div className="filled" style={{ width: dayProgress * 100 + "%" }} />
            </div>
            <div className="details">
              <div className="value">{(dayProgress * 24).toFixed(2)}h</div>
              <div className="percentage">{(dayProgress * 100).toFixed(2)}%</div>
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

        <div>
          <label htmlFor="days">Last n days:</label>
          <input type="number" id="days" value={days} onChange={handleDaysChange} />
        </div>
        <div className="date-select-container">
          <div className="date-select-item">
            <label htmlFor="startDate">Start:</label>
            <DatePicker id="startDate" selected={startDate} onChange={(date) => setStartDate(date)} />
          </div>

          <div className="date-select-item">
            <label htmlFor="endDate">End:</label>
            <DatePicker id="endDate" selected={endDate} onChange={(date) => setEndDate(date)} />
          </div>
        </div>

        {renderWorkTimeChart()}
      </div>
    </div>
  )
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date - start
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

function daysInYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365
}

export default App
