// https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cognitivelanguage/ai-language-conversations/samples/v1-beta/javascript/analyzeConversationApp.js
// https://knowledge.udacity.com/questions/988296


const { ConversationAnalysisClient } = require("@azure/ai-language-conversations");
const { AzureKeyCredential } = require("@azure/core-auth");

class IntentRecognizer {
    constructor(config) {
        const CLUIsConfigured = config && config.CLUEndpoint && config.CLUKey && config.CLUProjectName && config.CLUDeploymentName;

        if (CLUIsConfigured) {
          this.recognizer = new ConversationAnalysisClient(config.CLUEndpoint, new AzureKeyCredential(config.CLUKey),{apiVersion: '2022-10-01-preview'});
          this.CLUProjectName = config.CLUProjectName;
          this.CLUDeploymentName = config.CLUDeploymentName;
          console.error('\n ******************************************** \n');
          console.error(this.recognizer);
          console.error(new AzureKeyCredential(config.CLUKey));
          console.error('\n ******************************************** \n');
        }
    }

    get isConfigured() {
        return (this.recognizer !== undefined);
    }

    /**
     * Returns an object with preformatted CLU results for the bot's dialogs to consume.
     * @param {TurnContext} context
     */
    async executeCLUQuery(context) {

      const body = {
          kind: "Conversation",
          analysisInput: {
            conversationItem: {
              id: "1",
              participantId: "1",
              text: context.activity.text,
              modality: "text",
              language: "en-us",
            },
          },
          parameters: {
            projectName: this.CLUProjectName,
            deploymentName: this.CLUDeploymentName,
            verbose: true,
            stringIndexType: "TextElement_V8",
          },
        };

      return await this.recognizer.analyzeConversation(body);
    }

    getDateEntity(result) {
        const entities = result.predictions.entities;
        console.log("entities: ", entities);
        return undefined;
    }
    
    getTimeEntity(result) {
        const entities = result.predictions.entities;
        console.log("entities: ", entities);
        return undefined;
    }
    
}

module.exports = IntentRecognizer