const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

// OAuth 1.0a (User context)
const bot = new TwitterApi({
    appKey: process.env.TWITTER_CONSUMER_KEY,
    appSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN_KEY,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});
const server = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

function spinUpTwitterServer(){
    return new Promise((resolve, reject) => {
        bot.appLogin().then(()=>{
            server.v2.updateStreamRules({
                add: [
                  { value: "to:Noot_Noot_Bot", tag: 'noot' },
                ],
            }).then(()=>{
                resolve(server.v2.searchStream());
            })
            .catch((error)=>{reject(error);})
        })
        .catch((error)=>{reject(error);})
    });
}


function dataConsumer(data, checkAnswer){
    return new Promise((resolve, reject) => {
        if(data.id != null){
            bot.v2.singleTweet(
                data.id, 
                {'tweet.fields': ['author_id'],}
            ).then((tweet)=>{
                if(tweet.data.author_id != null){
                    if(checkAnswer(tweet.data.text)){
                        bot.v2.like(process.env.TWITTER_BOT_ID, data.id).then(()=>{
                            bot.v1.sendDm({
                                recipient_id: tweet.data.author_id,
                                text: 'You responded!',
                                // attachment: { type: 'media', media: { id: imgMediaId } },
                            }).then((response)=>{
                                resolve(true);
                            })
                            .catch((error)=>{reject(error);})
    
                        })
                        .catch((error)=>{reject(error);})
                    } else {
                        resolve(false);
                    }
                }
            })
            .catch((error)=>{reject(error);})
        }
    });
}

async function nootBootLoop(streamFactory, dataConsumer, checkAnswer) {

    try {
        for await (const { data } of (await streamFactory())) {
            dataConsumer(data, checkAnswer)
                .then((gotKey)=>{if(gotKey){console.log("Got Key!");} else {console.log("Wrong Answer");}})
                .catch((error)=>{console.log(`ERROR ${error}`)})
        }
        // The stream has been closed by Twitter. It is usually safe to reconnect.
        console.log('Stream disconnected healthily. Reconnecting.');
        sleep(3000).then(()=>{nootBootLoop(streamFactory, dataConsumer, checkAnswer)});
    } catch (error) {
        // An error occurred so we reconnect to the stream. Note that we should
        // probably have retry logic here to prevent reconnection after a number of
        // closely timed failures (may indicate a problem that is not downstream).
        console.warn('Stream disconnected with error. Retrying.', error);
        sleep(5000).then(()=>{nootBootLoop(streamFactory, dataConsumer, checkAnswer)});
    }
}

function startnootBootLoop(checkAnswer){
    console.log("Spinning Up Noot");
    nootBootLoop(
        spinUpTwitterServer,
        dataConsumer,
        checkAnswer,
    );
}

module.exports = { startnootBootLoop };
