import querystring from 'query-string';
import * as FSM from './fsm';

const getURLData = (baseURL = '', path = '', params = {}) => {
    let requestedURL = baseURL + path + ((params.length == 0) ? "" : "?" + querystring.stringify(params));
    return new Promise((resolve, reject) => {
      fetch(requestedURL, {
        method: 'GET',
        cache: 'no-cache',
        headers: {'accept': 'application/json'},
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
      }).then((response) => {
        response.json().then((data)=>{
          resolve(data);
        })
        .catch((error) => {reject(`Could not get JSON (${requestedURL})`);});
      })
      .catch((error) => {reject(`Could not get URL (${requestedURL})`);});
    });
}

export const getNFTs = (walletAddress) => {
    return new Promise((resolve, reject) => {
        getURLData(
            "https://public-api.solscan.io",
            "/account/tokens",
            { account: `${walletAddress}`,},
        ).then((data)=>{
            var stateMap = Object(FSM.ItemMap);

            data.forEach(token => {
                if(stateMap[token.tokenAddress] != null){
                    stateMap[token.tokenAddress] = true;
                }
            });

            resolve(stateMap);
        })
        .catch((error)=>{ reject(error); });
    });
}