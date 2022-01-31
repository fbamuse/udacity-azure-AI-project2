// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');

const { QnAMaker } = require('botbuilder-ai');
const DentistScheduler = require('./dentistscheduler');
const IntentRecognizer = require("./intentrecognizer")

class DentaBot extends ActivityHandler {
    constructor(configuration, qnaOptions) {
        // call the parent constructor
        super();
        if (!configuration) throw new Error('[QnaMakerBot]: Missing parameter. configuration is required');

        // create a QnAMaker connector
        this.qnaMaker = new QnAMaker(configuration.QnAConfiguration, qnaOptions)
       
        // create a DentistScheduler connector
        this.dentistScheduler= new DentistScheduler(configuration.SchedulerConfiguration)
      
        // create a IntentRecognizer connector
        this.intentRecognizer = new IntentRecognizer(configuration.LuisConfiguration)


        this.onMessage(async (context, next) => {
            // send user input to QnA Maker and collect the response in a variable
            // don't forget to use the 'await' keyword
            const qnaResults = await this.qnaMaker.getAnswers(context);
          
            // send user input to IntentRecognizer and collect the response in a variable
            // don't forget 'await'
            const LuisResult = await this.intentRecognizer.executeLuisQuery(context);
            
                     
            // determine which service to respond with based on the results from LUIS //

            // if(top intent is intentA and confidence greater than 50){
            //  doSomething();
            //  await context.sendActivity();
            //  await next();
            //  return;
            // }
            // else {...}
            if (qnaResults[0]) {
                await context.sendActivity(`${qnaResults[0].answer}`);
                await next();
                return;
            }
            if (LuisResult.luisResult.prediction.topIntent === "GetAvailability" &&
                LuisResult.intents.GetAvailability.score > .6
            ) {
                
                const availability  = await this.dentistScheduler.getAvailability()
                

                if(LuisResult.entities.$instance && 
                    LuisResult.entities.$instance.time && 
                    LuisResult.entities.$instance.time[0]){
                    const time = LuisResult.entities.$instance.time[0].text;
                    const comfirm = "Thank you for your reservation.  Would you like to make an appointment for " + time +"?";
                    await context.sendActivity(comfirm);
              
                    
                }
                await context.sendActivity(availability);
                await next();
                return;
            }
            if (LuisResult.luisResult.prediction.topIntent === "ScheduleAppointment" &&
                LuisResult.intents.ScheduleAppointment.score > .6 &&
                LuisResult.entities.$instance && 
                LuisResult.entities.$instance.time && 
                LuisResult.entities.$instance.time[0]
            ) {
                const time = LuisResult.entities.$instance.time[0].text;
                const Appointment = await this.dentistScheduler.scheduleAppointment(time)
           
                const reply = "Thank you for your appointment.  " + Appointment ;
                console.log(reply)

                //await context.sendActivity(comfirm);
                await context.sendActivity(reply);
                await next();
                return;
            }


            
             // If no answers were returned from QnA Maker, reply with help.
            await context.sendActivity(`I'm not sure I can answer your question`);
            
            await next();
    });

        this.onMembersAdded(async (context, next) => {
        const membersAdded = context.activity.membersAdded;
        //write a custom greeting
        const welcomeText = 'Welcome to the Fukuhara Dentist Appointment Assistant.　We will guide you through the appointment process.You can say "Search for available information" or "I want to make an appointment" Please ask us for any consultation regarding your appointment.';
   
        for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
            if (membersAdded[cnt].id !== context.activity.recipient.id) {
                await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
            }
        }
        // by calling next() you ensure that the next BotHandler is run.
        await next();
    });
    }
}

module.exports.DentaBot = DentaBot;
