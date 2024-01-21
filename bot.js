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
        console.error(configuration)

        // create a QnAMaker connector
        this.QnAMaker = new QnAMaker(configuration.QnAConfiguration, qnaOptions)
        
        // create a DentistScheduler connector
        this.DentistScheduler = new DentistScheduler(configuration.SchedulerConfiguration)
      
        // create a IntentRecognizer connector
        this.IntentRecognizer = new IntentRecognizer(configuration.CLUConfiguration);


        this.onMessage(async (context, next) => {
            // send user input to QnA Maker and collect the response in a variable
            // don't forget to use the 'await' keyword
            console.error('\n ******************************************** \n');
            console.error(context.activity.text);
            console.error('\n ******************************************** \n\n');

            const QnAResults = await this.QnAMaker.getAnswers(context);
            console.error('\n ******************************************** \n');
            console.error(QnAResults);
            console.error('\n ******************************************** \n\n');

            // send user input to IntentRecognizer and collect the response in a variable
            // don't forget 'await'
            const CLUResults = await this.IntentRecognizer.executeCLUQuery(context);
            console.error('\n ******************************************** \n');
                     
            // determine which service to respond with based on the results from CLU, not Luis //
            if (CLUResults.prediction.topIntent === "getAvailability" && CLUResults.prediction.intents[0].confidenceScore > .5) {
                console.log('DentistScheduler GetAvailability');
                const schedulerResults = await this.DentistScheduler.getAvailability();
                await context.sendActivity(schedulerResults);
                await next();
                return;
            }
            else if (CLUResults.prediction.topIntent === "scheduleAppointment" && CLUResults.prediction.intents[0].confidenceScore > .5) {
                console.log('DentistScheduler ScheduleAppointment');
                const appointmentDate = this.IntentRecognizer.getDateEntity(CLUResults);
                const appointmentTime = this.IntentRecognizer.getTimeEntity(CLUResults);
                const schedulerResults = await this.DentistScheduler.scheduleAppointment("Feb. 13rd 1:00 PM");
                await context.sendActivity(schedulerResults);
                await next();
                return;
            }

            // If an answer was received from QnA Maker, send the answer back to the user.
            if (QnAResults[0]) {
                await context.sendActivity(`${QnAResults[0].answer}`);
            }
            else {
                // If no answers were returned from QnA Maker, reply with help.
                await context.sendActivity(`I'm not sure I can answer your question`
                    + 'I can find charging stations or electric vehicle parking'
                    + `Or you can ask me questions about electric vehicles`);
            }

            // if(top intent is intentA and confidence greater than 50){
            //  doSomething();
            //  await context.sendActivity();
            //  await next();
            //  return;
            // }
            // else {...}
             
            await next();
    });

        this.onMembersAdded(async (context, next) => {
        const membersAdded = context.activity.membersAdded;
        //write a custom greeting
        const welcomeText = 'Welcome to EV Parking Assistant. I can help you find a charging station and parking. You can say "find a charging station" or "find parking" or ask a question about electric vehicle charging';
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
