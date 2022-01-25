const express = require('express');
const fss = require('fs');
const meka = require('./buildMekamount.js');
const web3 =  require("@solana/web3.js");
const app = express();
const port = process.env.PORT || 5000;

function getAttempt(mek, pfp, success, error){
    return {
        date : Date().toLocaleString(),
        mek : mek,
        pfp : pfp,
        success : success,
        error : error
    };
}

function getReport(report, user){
    if(report[user] == null){
        return report;
    } else {
        return {user : report[user]};
    }
}

function getBuildCount(report, user){
    return (report[user] == null) ? 0 : report[user].builds.length;
}

function setReport(report, user, mek, pfp, success, error){
    if(report[user] == null){
        report[user] = {
            wallet : user,
            builds : [getAttempt(mek, pfp, success, error)] 
        }
    } else {
        report[user].builds.push(getAttempt(mek, pfp, success, error))
    }
}

async function connectToSolana(){
    console.log("Connecting to Solana");
    // //Solana Stuff
    // let connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'), 'confirmed');

    // let info = await connection.getSupply(new web3.PublicKey("5B1QZJYws1Nnp8Kh3FWVoeQbasr5tJeyiZZnWz8sxDZf"));
    // console.log(info);
}

function spinUpServer(){
    let creditsLeft = 0;
    let report = {};

    //Connect To Solana
    let connection = connectToSolana();

    //Spin Up Server
    app.listen(port, () => console.log(`Listening on port ${port}`));

    //Set Hook
    app.get('/sol/:sol/meka/:meka/mekaflip/:mekaflip/pfp/:pfp/pfpflip/:pfpflip/twittercrop/:twittercrop/scale/:scale', (req, res) => {
        try {
            console.log(`-- Buidling for: ${req.params.sol}...`);
            if(creditsLeft > 0){
                meka.buildMekamount(
                    req.params.sol,
                    req.params.meka,
                    req.params.mekaflip,
                    req.params.pfp,
                    req.params.pfpflip,
                    req.params.twittercrop,
                    parseFloat(req.params.scale),
                    parseInt(getBuildCount(report, req.params.sol)),
                    (filepath)=> {
                        creditsLeft--;
                        console.log(`-- SUCCESS for: ${req.params.sol}`);
                        setReport(report, req.params.sol, req.params.meka, req.params.pfp, true, "");
                        res.download(filepath);
                    },
                    (error)=>{
                        console.log(`-- FAIL for: ${req.params.sol} (${error})`);
                        setReport(report, req.params.sol, req.params.meka, req.params.pfp, false, `(${error})`);
                        res.send({ error: error });
                    }
                );
            } else {
                console.log(`-- No Credits Left for: ${req.params.sol}`);
                res.send({ noCredits: true });
            }
        } catch(error){
            console.log(`-- GLOBAL FAIL for: ${req.params.sol} (${error})`);
        }
    });

    app.get('/credits', (req, res) => {
        try {
            res.send({ credits: creditsLeft });
        } catch {
            console.log(`Trouble gettings credits (${error})`);
        }
    });

    app.get('/nuke/:soladdress', (req, res) => {
        try{
            meka.nuke(req.params.soladdress);
            res.send({ theDeed: "is done" });
            console.log(`-- CLEARED for: ${req.params.soladdress}`);
        } catch (error) {
            console.log(`Trouble nuking mek (${error})`);
        }
    });

    app.get('/credits/:credits/pass/:pass', (req, res) => {
        try{
            if(req.params.pass == "beep"){
                creditsLeft = (parseInt(req.params.credits) == null) ? 0 : parseInt(req.params.credits);
                res.send({ set: `${req.params.credits} credits` });
            } else {
                res.send({ naughty : "naughty" });
            }
        } catch (error) {
            console.log(`Trouble setting credits (${error})`);
        }
    });

    app.get('/report/:user', (req, res) => {
        try{
            res.send(getReport(report, req.params.user));
        } catch (error) {
            console.log(`Trouble getting report (${error})`);
        }
    });

}

spinUpServer();