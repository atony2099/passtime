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
import { Line } from "react-chartjs-2"

import { Pie } from "react-chartjs-2"

function App() {
  const [days, setDays] = useState(7)
  const [workTimeData, setWorkTimeData] = useState(null)

  const [hourProgress, setHourProgress] = useState(0)
  const [monthProgress, setMonthProgress] = useState(0)
  const [yearProgress, setYearProgress] = useState(0)

  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [dailyLogs, setDailyLogs] = useState({})
  const [taskPercentageData, setTaskPercentageData] = useState(null)
  const [cumulativeTimeData, setCumulativeTimeData] = useState(null)

  const generateCumulativeTimeData = (total) => {
    const orderedData = Object.entries(total)
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
    const orderedValues = orderedData.map((d) => d.workTime)

    let cumulativeValues = []
    orderedValues.reduce((sum, value) => {
      sum += value
      cumulativeValues.push(sum)
      return sum
    }, 0)

    const hours = cumulativeValues.map((value) => (value / 3600).toFixed(2))

    return {
      labels: orderedLabels,
      datasets: [
        {
          label: "Cumulative Time",
          data: hours,
          borderColor: "#4BC0C0",
          backgroundColor: "rgba(75,192,192,0.1)",
        },
      ],
    }
  }

  const generateTaskPercentageData = (logs) => {
    const taskMap = new Map()

    for (const tasks of Object.values(logs)) {
      tasks.forEach((task) => {
        const key = task.project + " - " + task.task
        taskMap.set(key, (taskMap.get(key) || 0) + task.duration)
      })
    }

    const labels = Array.from(taskMap.keys())
    const values = Array.from(taskMap.values())
    const total = values.reduce((sum, val) => sum + val, 0)
    const percentages = values.map((value) => ((value * 100) / total).toFixed(2))

    const labelsWithTotalHours = labels.map((label, index) => {
      const hours = (values[index] / 3600).toFixed(2)
      return `${label} (${hours}h)`
    })

    return {
      labels: labelsWithTotalHours,
      datasets: [
        {
          data: percentages,
          backgroundColor: [
            // Add color for each slice of the pie chart
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
          ],
        },
      ],
    }
  }

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

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const progress = calculateProgress(now)

      setHourProgress(progress.hourProgress)
      setMonthProgress(progress.monthProgress)
      setYearProgress(progress.yearProgress)
    }, 100)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchWorkTimeData(days)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  useEffect(() => {
    fetchWorkTimeData(days, startDate, endDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      return
    }
    setDailyLogs(data.logs)
    const lineChartData = generateCumulativeTimeData(data.total)
    setCumulativeTimeData(lineChartData)
    const pieChartData = generateTaskPercentageData(data.logs)
    setTaskPercentageData(pieChartData)

    const orderedData = Object.entries(data.total)
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

  const renderTaskPercentageChart = () => {
    if (!taskPercentageData) return null
    return <Pie data={taskPercentageData} />
  }

  const renderCumulativeTimeChart = () => {
    if (!cumulativeTimeData) return null

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

    return <Line data={cumulativeTimeData} options={options} />
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

  const renderDailyLogs = () => {
    return (
      <table className="daily-logs">
        <thead>
          <tr>
            <th>Date</th>
            <th>Project</th>
            <th>Task</th>
            <th>Start Time</th>
            <th>Duration(m)</th>
            <th>Duration(h)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(dailyLogs).map(([date, logs]) =>
            logs.map((log, index) => (
              <tr key={`${date}-${index}`}>
                {index === 0 && (
                  <td rowSpan={logs.length}>
                    {date} ({logs.length} log{logs.length > 1 ? "s" : ""})
                  </td>
                )}
                <td>{log.project}</td>
                <td>{log.task}</td>
                <td>{log.start}</td>
                <td>{(log.duration / 60).toFixed(0)} m</td>
                <td>{(log.duration / 3600).toFixed(1)} h</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    )
  }

  return (
    <div className="App">
      <div className="container">
        <ToastContainer />
        {/* <h1 className="title">Time Progress</h1> */}
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
        <div className="cumulative-time-chart">{renderCumulativeTimeChart()}</div>
        {renderDailyLogs()}
        {renderTaskPercentageChart()}
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

export default App
