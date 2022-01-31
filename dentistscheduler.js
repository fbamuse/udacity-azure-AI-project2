class DentistScheduler {
    constructor(configuration) {
        this.getAvailability = async () => {
            const response = await fetch(configuration.SchedulerEndpoint + "availability")
            const times = await response.json()
            let responseText = `Current time slots available: `
            times.map(time => {
                responseText += `
${time}`
            })
            return responseText
        }

        this.scheduleAppointment = async (time) => {

            const response  = await fetch(configuration.SchedulerEndpoint + "availability")
            const times     = await response.json()
            if (times.includes(time.toLowerCase().replace(/\s+/g, ""))){
                const response = await fetch(configuration.SchedulerEndpoint + "schedule", { method: "post", body: { time: time } })
                let responseText = `Thank you for your appointment.   Your appointment is set for ${time}.`
                return responseText
            }
            else {
                let responseText = `We are very sorry, but we cannot make reservations from ${time}.\n  Current time slots available: `
                times.map(time => {
                    responseText += `
    ${time}`
                })
                responseText += `\n Please confirm again. Thank you.`
                return responseText
            }
                            
           
        }
    }
}

module.exports = DentistScheduler