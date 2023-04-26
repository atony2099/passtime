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

import Log from "./components/log"
import ProgressBar from "./components/progress"

function App() {
  const [days, setDays] = useState(7)
  const [dailyDays, setDailyDays] = useState(1)

  const [workTimeData, setWorkTimeData] = useState(null)
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [dailyLogs, setDailyLogs] = useState({})
  const [taskPercentageData, setTaskPercentageData] = useState(null)
  const [cumulativeTimeData, setCumulativeTimeData] = useState(null)
  const [cumulativeDaily, setCumulativeDaily] = useState(null)

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

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        await fetchWorkTimeData(days, startDate, endDate)
        fetchDailyDay(dailyDays)
      }
      // console.log("visibility changed")
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      fetchWorkTimeData(days)
    } catch (error) {
      console.log(error, "--")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  useEffect(() => {
    fetchWorkTimeData(0, startDate, endDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate])

  useEffect(() => {
    fetchDailyDay(dailyDays)
  }, [dailyDays])

  const fetchDailyDay = async (days) => {
    if (days <= 0 || isNaN(days)) {
      return
    }
    var url = `${process.env.REACT_APP_API_URL}/api/cumulative/${days}`
    const response = await fetch(url, {})
    const { code, data } = await response.json()
    if (code !== 0) {
      toast.error("Failed to fetch work time data", data)
      return
    }

    if (!Array.isArray(data) || data.length <= 0) {
      return
    }

    const orderedLabels = data.map((d) => d.end_time)
    let hours = data.map((d) => d.total)

    let lastTotal = hours.slice(-1)[0]

    if (lastTotal >= 60 * 60) {
      hours = hours.map((value) => (value / 60 / 60).toFixed(1))
    } else {
      hours = hours.map((value) => (value / 60).toFixed(1))
    }

    const renderData = {
      labels: orderedLabels,
      datasets: [
        {
          label: "Cumulative Time",
          data: hours,
          borderColor: "red",
          backgroundColor: "rgba(75,192,192,0.1)",
        },
      ],
    }

    setCumulativeDaily(renderData)
  }

  const fetchWorkTimeData = async (days, startDate, endDate) => {
    let url = ""
    if (days === 0 && startDate && endDate) {
      const start = moment(startDate).tz("Asia/Shanghai").format("YYYY-MM-DD")
      const end = moment(endDate).tz("Asia/Shanghai").format("YYYY-MM-DD")
      url = `${process.env.REACT_APP_API_URL}/api/day/range?start=${start}&end=${end}`
    } else if (days !== 0 && !isNaN(days)) {
      url = `${process.env.REACT_APP_API_URL}/api/day/${days}`
    }
    if (!url) {
      return
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

  const handlDailyDaysChange = (e) => {
    setDailyDays(parseInt(e.target.value))
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

  const renderDailyCumu = () => {
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

    return cumulativeDaily ? <Line data={cumulativeDaily} options={options} /> : null
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
      <div className="container container-left">
        <ToastContainer />
        <ProgressBar />
        <div>
          <label htmlFor="days">Last n days:</label>
          <input type="number" id="days" value={dailyDays} onChange={handlDailyDaysChange} />
        </div>
        {renderDailyCumu()}
        <Log dailyLogs={dailyLogs} />
      </div>
      {/* <div className="space"></div> */}
      <div className="container container-right">
        <ToastContainer />
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
        {renderTaskPercentageChart()}
      </div>
    </div>
  )
}

export default App
