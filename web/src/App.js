import React, { useEffect, useState } from 'react';
// import Mekamount, { runScript } from './createMekamount.js';
import querystring from 'query-string';
import twitterLogo from './assets/twitter-logo.svg';
import mekaHolder from './assets/meka.png';
import pfpHolder from './assets/pfp.png';
import download from 'downloadjs';
import './App.css';

// Constants
const REAL_SERVER = '/server';
const TEST_SERVER = '';
const TEST_JSON = '"proxy": "http://localhost:5000"';
const TWITTER_HANDLE = 'CoachChuckFF';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const SERVER_PATH = REAL_SERVER;

const App = () => {
  // State
  const [creditsLeft, setCreditsLeft] = useState(0);
  const [walletAddress, setWalletAddress] = useState(null);
  const [mekAddress, setMekAddress] = useState(null);
  const [pfpAddress, setPfpAddress] = useState(null);
  const [pfpScale, setPfpScale] = useState(0.15);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isPfpFlipped, setIsPfpFlipped] = useState(false);
  const [isMekFlipped, setIsMekFlipped] = useState(false);
  const [isTwitterCropped, setIsTwitterCropped] = useState(true);
  const [buildCount, setBuildCount] = useState(3);
  const [isGettingNFTS, setIsGettingNFTs] = useState(false);
  const [nftList, setNftList] = useState([]);

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

  const grabAllNFTs = () => {
    if(!isGettingNFTS){
      setIsGettingNFTs(true);
      getURLData(
        "https://public-api.solscan.io",
        "/account/tokens",
        { account: `${walletAddress}`,},
      ).then((data) => {

        //Grab NFT Tokens
        let promises = [];
        data.forEach(token => {
          if(token.tokenAmount != null && token.tokenAmount.amount == 1 && token.tokenAmount.decimals == 0){
            promises.push(
              getURLData(
                "https://public-api.solscan.io",
                `/account/${token.tokenAddress}`,
              )
            );
          }
        });

        // Get Metadata on all
        Promise.all(promises)
        .then((nfts)=>{
          
          //Grab only the useful stuff
          let nftMetadata = [];
          nfts.forEach(nft=> {
            try{
              if(nft.metadata == null){throw new Error('No metadata');}
              if(nft.metadata.data.name == null){throw new Error('No name!');}
              if(nft.metadata.data.collection == null && nft.tokenInfo.symbol == null){throw new Error(nft.metadata.data.name + " Bad collection");}
              if(nft.metadata.data.image == null){throw new Error(nft.metadata.data.name + " Bad image");}
              if(nft.account == null){throw new Error(nft.metadata.data.name + " Bad account");}

              //Fuck Collections
              let collection = null;
              if(nft.metadata.data.collection != null){
                if(typeof nft.metadata.data.collection === 'string'){
                  collection = nft.metadata.data.collection;
                } else {
                  collection = nft.metadata.data.collection.name;
                }
              }
              if(collection == null) collection = nft.tokenInfo.symbol;
              if(collection == null) throw new Error(nft.metadata.data.name + " Bad collection... Again");

              nftMetadata.push(
                {
                  name : nft.metadata.data.name, 
                  collection : collection,
                  url : nft.metadata.data.image,
                  address : nft.account,
                }
              );
            } catch (error){
              console.log(error);
            }
          });

          //Sort
          nftMetadata.sort((a, b)=>{
            return a.collection.localeCompare(b.collection);
          });

          //Update
          setNftList(nftMetadata);
          setIsGettingNFTs(false);
        })
        .catch((error) => {
          alert('Could not grab ALL NFTs');
          console.log(error);
          setIsGettingNFTs(false);
        })

      })
      .catch((error) => {
        alert('Could not grab NFTs');
        console.log(error);
        setIsGettingNFTs(false);
      })
    } else {
      console.log("Crawling...")
    }
  }

  const getCreditsLeft = async () => {
    try {
      const response = await fetch(`${SERVER_PATH}/credits`);
      const data = await response.json();
      setCreditsLeft(data.credits);
    } catch {
      console.log("Could not grab credits");
    }
  }

  const nukeIMG = async () => {
    try {
      const response = await fetch(`${SERVER_PATH}/nuke/${walletAddress}`);
      const data = await response.json();
      console.log(data);
    } catch {
      console.log("Could not nuke img");
    }
  }

  const isChosenMek = (nft) => {isChosenImg(nft, mekAddress)}
  const isChosenPFP = (nft) => {isChosenImg(nft, pfpAddress)}
  const isChosenImg = (nft, slot) => {
    if(slot == null) return false;
    if(nft == null) return false;
    return nft.address == slot.address;
  }

  const getMekaName = () => {
    let mek = (mekAddress == null) ? null : mekAddress.name;
    let pfp = (pfpAddress == null) ? null : pfpAddress.name;

    let name = (mek == null) ? ' ' : 'Meka-';
    name += (pfp == null) ? ' ' : pfp.split(' ')[0];
    return name;
  }

  const downloadNewMek = async () => {
    if(creditsLeft <= 0){
      alert('No more community credits! Tweet @Coach Chuck to request more');
    } else if(buildCount <= 0){
      alert('No more builds! (But... you could refresh...)');
    } else if(mekAddress == null || pfpAddress == null){
      alert('Need to pick both a Mekamount and PFP');
    } else if(!isBuilding){
      setIsBuilding(true);
      try {
        const response = await fetch(`${SERVER_PATH}/sol/${walletAddress}/meka/${mekAddress.address}/mekaflip/${isMekFlipped}/pfp/${pfpAddress.address}/pfpflip/${isPfpFlipped}/twittercrop/${isTwitterCropped}/scale/${pfpScale}`);
        const blob = await response.blob();

        if(blob.size < 500){
          const data = await response.json();
          if(data.error != null){
            alert(data.error);
          } else {
            alert('Error merging NFTs');
          }
        } else {
          download(blob, getMekaName() + ".png");
          setBuildCount(buildCount - 1);
          getCreditsLeft();
          nukeIMG();
        }

      } catch (error) {
        alert('Error merging NFTs');
      }

      setIsBuilding(false);
    } else {
      alert('Building...');
    }
  };


  const selectNFT = (nft) => {

    if(nft.name.includes("Mekamounts")){
      setMekAddress(nft);
    } else {
      setPfpAddress(nft);
    }
    
  }

  const mekSort = (nft) => {return nft.name.includes("Mekamounts");}
  const pfpSort = (nft) => {return !nft.name.includes("Mekamounts");}
  const getPFPList = (sortFunction) => {return nftList.filter(sortFunction);}

  const renderNFTContainer = () => (
    <div>
      <a href='https://www.magiceden.io/marketplace/mekamounts'><p className="sub-text">{getPFPList(mekSort).length > 0 ? "Choose your Mekamount..." : "You have no Mekamounts... "}</p></a>
      <div className="gif-grid">
        {getPFPList(mekSort).map((nft) => (
          <div className={"gif-item"} key={nft.url} onClick={() => {selectNFT(nft)}}>
            <div className='overlay'>
              <img src={nft.url} alt={nft.url}/>
              <div className={(mekAddress == null) ? 'selection-overlay' : ((mekAddress.address != nft.address) ? 'selection-overlay' : 'selected')}></div>
            </div>
            <p className="sub-text">{nft.name}</p>
            <div className='mini-spacing'></div>
          </div>
        ))}
      </div>
      <a href='https://www.magiceden.io/marketplace/pesky_penguins'><p className="sub-text">{getPFPList(pfpSort).length > 0 ? "Choose your PFP..." : "You have no PFPs..."}</p></a>
      <div className="gif-grid">
        {getPFPList(pfpSort).map((nft) => (
          <div className={"gif-item"} key={nft.url} onClick={() => {selectNFT(nft)}}>
            <div className='overlay'>
              <img src={nft.url} alt={nft.url}/>
              <div className={(pfpAddress == null) ? 'selection-overlay' : ((pfpAddress.address != nft.address) ? 'selection-overlay' : 'selected')}></div>
            </div>
            <p className="sub-text">{nft.name}</p>
            <div className='mini-spacing'></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLoadingContainer = () => (
    <p className="sub-text">Loading NFTs...</p>
  );

  const renderTwitterCropSwitch = () => (
    <div class="toggle-switch">
      <p>Crop for Twitter [{`${isTwitterCropped}`}]</p>
      <label class="switch">
        <input 
          type="checkbox" 
          checked={isTwitterCropped}
          onChange={()=>setIsTwitterCropped(!isTwitterCropped)}
        />
        <span class="slider round"></span>
      </label>
    </div>
  );

  const renderConnectedContainer = () => (
    <div className="connected-container">
        <div className="selected-grid">
        {<div className="selected-item" key={"meka"}>
          <div className='flip-container' onClick={() => {setIsMekFlipped(!isMekFlipped);}}>
            <div class={isMekFlipped ? 'is-flipped' : 'can-flip'}>
              <img src={mekAddress == null ? mekaHolder : mekAddress.url} alt={mekaHolder} />
              <p className="sub-text">{mekAddress == null ? "" : "Mekamount"}</p>
            </div>
          </div>
        </div>}
        {<div className="selected-item" key={"pfp"}>
        <div className='flip-container' onClick={() => {setIsPfpFlipped(!isPfpFlipped);}}>
            <div class={isPfpFlipped ? 'is-flipped' : 'can-flip'}>
              <img src={pfpAddress == null ? pfpHolder : pfpAddress.url} alt={pfpHolder} />
              <p className="sub-text">{pfpAddress == null ? "" : "PFP"}</p>
            </div>
          </div>
        </div>}
      </div>
      <div className='mini-spacing'></div>
      <p className="sub-text file-name">{(mekAddress == null || pfpAddress == null) ? getMekaName() : getMekaName()}</p>
      {renderTwitterCropSwitch()}
      <button type="submit" className="cta-button submit-gif-button" onClick={downloadNewMek} disabled={isBuilding}>
        {(isBuilding ? `Building...` : `Build [${buildCount}]`)}
      </button>
      <div className='spacing'></div>
      <p className="sub-text">Hello {walletAddress}</p>
      {(isGettingNFTS) ? renderLoadingContainer() : renderNFTContainer()}
      <div className='spacing'></div>
    </div>
  );

  // Actions
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );

          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
  
    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };


  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  // UseEffects
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
      await getCreditsLeft();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  
  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching NFTs...');
      
      // Call Solana program here.
      grabAllNFTs();
  
      // Set state
      // setGifList(TEST_GIFS);
    }
  }, [walletAddress]);

  return (
    <div className="App">
			{/* This was solely added for some styling fanciness */}
			<div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🦾 Mekamount PFP Portal 🦾</p>
          <p className="header">[CR Left: {creditsLeft}]</p>
          <p className="sub-text">
            N F T ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {/* We just need to add the inverse here! */}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className='spacing'></div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`Crafted By @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;