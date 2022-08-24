const functions = require("firebase-functions");
const {
    WebhookClient
} = require('dialogflow-fulfillment');
const {
    Payload
} = require("dialogflow-fulfillment");
const {
    Card,
    Suggestion,
    Image
} = require('dialogflow-fulfillment');
const {
    initializeApp,
    applicationDefault,
    cert
} = require('firebase-admin/app');
const {
    getFirestore,
    Timestamp,
    FieldValue
} = require('firebase-admin/firestore');
const moment = require('moment');
//const { Payload } = require("dialogflow-fulfillment");

initializeApp();
const db = getFirestore();
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
const usersRef = db.collection('Users');
exports.chatBotFulfillment = functions.https.onRequest((request, response) => {
    console.log('<<<<<<<<<<<<<<<<<<<< chatBotFulfillment >>>>>>>>>>>>>>>>>>>>>');
    const agent = new WebhookClient({
        request,
        response
    });
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    console.log('Agent Parameters: ' + JSON.stringify(agent.parameters));
    console.log('Output Contexts: ' + JSON.stringify(request.body.queryResult.outputContexts));
    let userId = request.body.session.slice(-17);
    let userNum = userId.slice(0, -5);
    async function welcome(agent) {

        const userRef = db.collection('Users').doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) {
            console.log('No such document!');
            await usersRef.doc(userId).set({
                phone: userNum,
                name: '',
                registered: false,
                customer: true,
                serviceProvider: false,
                joinedParsed: moment().format("dddd, MMMM Do YYYY, h:mm:ss a"),
                joined: Timestamp.fromDate(new Date()),
                servicesSearched: [],
                reviewsMade: [],
                favourites: [],
                locations: []
            });

            agent.add('👋 Welcome to *Digital Code Classifieds*, your personal Artificial Intelligence Assistant to help you find *Service Providers* in your area! Before we get started, what is your first name?')
            const payload = {
                video: 'https://firebasestorage.googleapis.com/v0/b/small-talk-5315f.appspot.com/o/dc%20video.mp4?alt=media&token=817a990a-1536-478a-ad17-023a3c01fa2c'
            };

            agent.add(
                new Payload(agent.UNSPECIFIED, payload, {
                    rawPayload: true,
                    sendAsMessage: true
                })
            );
            //   agent.add(
            //     new Image('https://firebasestorage.googleapis.com/v0/b/whatsapp-chatbot-290018.appspot.com/o/logo.png?alt=media&token=5bd4a2c5-296f-49a3-91f0-69d44f3180f8')
            //   )

        } else {
            let name1 = doc.data().name
            console.log('Document data:', doc.data());

            agent.add(`*Menu*
            Welcome back ${name1} 
            _You can ask me a service you are looking for.... for example:_
                                
             *I'm looking for a plumber* 
                                
                                
            🗣️  _To register your service, type_ *Register*
                                `)
        }

    }
    async function name(agent) {
        const userRef = db.collection('Users').doc(userId);
        const doc = await userRef.get();
        const name = agent.parameters.person.name;

        const res = await userRef.update({
            name: name
        });
        agent.add(`Thanks ${name}. _You can ask me a service you are looking for.... for example:_
                                
        *I'm looking for a plumber* 
                           
                           
       🗣️  _To register your service, type_ *Register*`)
        // Save the parameter in the parameters context
        agent.context.set({
            name: 'personName',
            lifespan: 100,
            parameters: {
                'name': name
            }
        });
    }
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('No-Details0000', name)
    agent.handleRequest(intentMap);

});