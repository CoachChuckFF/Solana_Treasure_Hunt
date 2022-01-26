const TwitterV2 = require('twitter-v2');
const Twitter = require('twitter');

require('dotenv').config();

// var twitterDM = new Twitter({
//     consumer_key: process.env.TWITTER_CONSUMER_KEY,
//     consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
//     access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
//     access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
// });

var twitterBot = new TwitterV2({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

var twitterServer = new TwitterV2({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    bearer_token: process.env.TWITTER_BEARER_TOKEN,
});


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function printData(data) {
    if(data.errors != null){
        data.errors.forEach((error)=>{
            console.log("----- ERROR -----");
            console.log(error);
            console.log("\n\n");
        });
    }

    console.log("----- DATA -----");
    console.log(data);
    console.log("\n\n");
}

function getRules(){
    return [
        {
            "value": "to:Noot_Noot_Bot", 
            "tag": "noot"
        },
    ];
}

function deleteRules(){
    twitterServer.post(
        'tweets/search/stream/rules', 
        {
            delete: {
                ids: [
                    "1486030790530064384",
                    "1486041655388127243",
                ]
            }
        }
    ).then((data)=>{
        printData(data);
    });
}

function getOwner(tweetID){
    twitterBot.get('tweets', {
        ids: tweetID,
        tweet: {
          fields: ['created_at', 'entities', 'public_metrics', 'author_id'],
        },
      }).then((data)=>{
        printData(data);
      });
}

function hideTweet(tweetID){
    // console.log(`tweets/${tweetID}/hidden`);
    twitterBot.post(`tweets/1486080151049981952/hidden`, {
        hidden: true,
    }).then((data)=>{
        printData(data);
    });
}

// 1486030790530064384
function streamFactory(){
    return new Promise((resolve, reject) => {

        twitterServer.post('tweets/search/stream/rules', {add:getRules()}).then((data)=>{
            twitterServer.get('tweets/search/stream/rules').then((data)=>{
                printData(data);
                resolve(twitterServer.stream('tweets/search/stream'));
            })
            .catch((error)=>{reject(error);})
        })
        .catch((error)=>{reject(error);})
    });
}

function dataConsumer(data){
    console.log(`----- TWEET ----\n`);
    console.log(data);
    console.log(`\n`);

    getOwner(data.id);
}

async function listenForever(streamFactory, dataConsumer) {

    try {
        for await (const { data } of (await streamFactory())) {
            dataConsumer(data);
        }   
        // The stream has been closed by Twitter. It is usually safe to reconnect.
        console.log('Stream disconnected healthily. Reconnecting.');
        sleep(3000).then(()=>{listenForever(streamFactory, dataConsumer)});
    } catch (error) {
        // An error occurred so we reconnect to the stream. Note that we should
        // probably have retry logic here to prevent reconnection after a number of
        // closely timed failures (may indicate a problem that is not downstream).
        console.warn('Stream disconnected with error. Retrying.', error);
        sleep(5000).then(()=>{listenForever(streamFactory, dataConsumer)});
    }
}
  
// listenForever(
//     streamFactory,
//     dataConsumer,
// );

// hideTweet('1486080151049981952');

// twitterDM.post('statuses/update', 
// {status: 'I Love Twitter'})
// .then(function (tweet) {
//     console.log(tweet);
// })
// .catch(function (error) {
//     throw error;
// })

twitterDM.get(
    'direct_messages/events/list', 
    {},
)
.then(function (tweet) {
    printData(tweet.events[0].message_create);
})
.catch(function (error) {
    printData(error);
});

twitterDM.post(
    'direct_messages/events/new', 
    {
        message_create: {
            target: {
                recipient_id: "1467706010492100612",
            },
            sender_id: "1485965200222265345",
            message_data: {
                text: "My First Message!"
            }
        }
        // event: {
        //     type: "message_create",
        //     message_create: {
        //         target: {
        //             recipient_id: "1467706010492100612",
        //         },
        //         sender_id: "1485965200222265345",
        //         message_data: {
        //             text: "My First Message!"
        //         }
        //     }
        // }
    }
)
.then(function (tweet) {
    printData(tweet);
})
.catch(function (error) {
    printData(error);
});

// {
//     "event": {
//         "type": "message_create", 
//         "message_create": {
//             "target": {
//                 "recipient_id": "RECIPIENT_USER_ID"
//             }, 
//             "message_data": {
//                 "text": "Hello World!"
//             }
//         }
//     }
// }