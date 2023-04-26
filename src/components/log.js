import "./log.css"

const Log = ({ dailyLogs }) => {
  const formatTime = (durationInSeconds) => {
    const hours = Math.floor(durationInSeconds / 3600)
    const minutes = Math.floor((durationInSeconds % 3600) / 60)
    const seconds = durationInSeconds % 60

    let timeString = ""

    timeString += hours.toString().padStart(2, "0") + ":"
    timeString += minutes.toString().padStart(2, "0") + ":"
    timeString += seconds.toString().padStart(2, "0")

    if (minutes >= 25) {
      timeString += " 🍅"
    }

    return timeString
  }
  const renderDailyLogs = () => {
    let currentDate = null
    let rowColor = null
    return (
      <table className="daily-logs">
        <thead>
          <tr>
            <th>Date</th>
            <th>Project</th>
            <th>Task</th>
            <th>Start Time</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(dailyLogs)
            .reverse()
            .flatMap(([date, logs]) => {
              if (date !== currentDate) {
                rowColor = rowColor === "lightgray" ? "white" : "lightgray"
              }
              currentDate = date
              return [
                ...logs.map((log, index) => (
                  <tr key={`${date}-${index}`} style={{ backgroundColor: rowColor }}>
                    {index === 0 && <td rowSpan={logs.length}>{date}</td>}
                    <td>{log.project}</td>
                    <td>{log.task}</td>
                    <td>{log.start}</td>
                    <td>{formatTime(log.duration)}</td>
                  </tr>
                )),
              ]
            })}
        </tbody>
      </table>
    )
  }

  return <div className="container">{renderDailyLogs()}</div>
}

export default Log

// export default Log
