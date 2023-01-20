import 'regenerator-runtime/runtime';
import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import Big from 'big.js';
import { useWalletSelector } from './context/WalletSelector';
import SignIn from './components/SignIn';
import { providers, utils } from "near-api-js";
import axios from 'axios';
import Switch from '@mui/material/Switch';
import { render } from 'react-dom';


const App = () => {
  const [account, setAccount] = useState(null);
  const [randomRecord, setRandomRecord] = useState(null);
  const { selector, accounts, accountId, setAccountId } = useWalletSelector();
  const [isOn, setIsOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);



  const getAccount = useCallback(async () => {
    if (!accountId) {
      return null;
    }

    const { nodeUrl } = selector.network;
    const provider = new providers.JsonRpcProvider({ url: nodeUrl });

    return provider
      .query({
        request_type: "view_account",
        finality: "final",
        account_id: accountId,
      })
      .then((data) => ({
        ...data,
        account_id: accountId,
      }));
  }, [accountId, selector.network]);


  useEffect(() => {
    if (!accountId) {
      return setAccount(null);
    }

    getAccount().then((nextAccount) => {
      setAccount(nextAccount);
      const queryParams = new URLSearchParams(window.location.search);
      const txHashes = queryParams.get("transactionHashes");
      if(!txHashes){
        //do nothing
      }else{
        const provider = new providers.JsonRpcProvider(
          "https://rpc.mainnet.near.org"
        );
        
        const TX_HASH = txHashes;
        // account ID associated with the transaction
        const ACCOUNT_ID = accountId;
        
        getState(TX_HASH, ACCOUNT_ID);
        setIsLoading(true);
        {isLoading ? ReactDOM.render (<img src="https://shard.dog/img/sharddog_loading.gif" width="325px"/>, document.getElementById('rewards')) : null }
        console.log("fired!");
        async function getState(txHash, accountId) {
          const result = await provider.txStatus(txHash, accountId);
                if(result.transaction.signer_id == accountId){
                  if(result.transaction.actions[0].FunctionCall.method_name == 'buy'){
                    console.log("got amount: ", result.transaction.actions[0].FunctionCall.deposit);
                    //get reward - send txHash and amount
                    let degenMode;
                    if (isOn === false){
                      degenMode = 1;
                    }else{
                      degenMode = 1.5
                    }
                      var data = JSON.stringify({
                        "purchaseAmount": result.transaction.actions[0].FunctionCall.deposit,
                        "degenMode":  degenMode,
                        "txHash": txHash
                      });
                    
                      var config = {
                        method: 'post',
                        url: 'https://api.shard.dog/rewardDrop',
                        headers: { 
                          'Content-Type': 'application/json'
                        },
                        data : data
                      };
                    
                      axios(config)
                      .then(function (response) {
                        //if 200 vs 201
                        setIsLoading(true);
                        console.log(response);
                        if(response.data.statusCode == 201){
                        console.log(JSON.stringify(response.data));
                          var dataLink = JSON.stringify({
                            "originalURL": response.data.body,
                            "domain": "treat.shard.dog"
                          });
                          
                          var configLink = {
                            method: 'post',
                            url: 'https://api.short.io/links/public',
                            headers: { 
                              'Authorization': 'pk_K3Y3TYEjOhmdDjXq', 
                              'Content-Type': 'application/json'
                            },
                            data : dataLink
                          };
                          
                          axios(configLink)
                          .then(function (response) {
                            setIsLoading(false);
                            console.log(response.data.secureShortURL);
                            //output the button for reward
                            ReactDOM.render (
                              <div>
                                <h2>Reward!!!!!</h2>
                                <h3>{response.data.secureShortURL}</h3>
                                <p>You've earned some Neko but you'll need to claim it to see how much. <br/>If you don't want to claim, you can share this one time link with someone else.</p>
                                <a href={response.data.secureShortURL}><button>Claim</button></a>
                              </div>,
                             document.getElementById('rewards')
                            )
                          })
                          .catch(function (error) {
                            console.log(error);
                          });
                        }else{
                          //error on claim, output message
                          setIsLoading(false);
                          console.log(response.data.body);
                          ReactDOM.render(
                            <div>
                              <h1>Oops No Reward</h1>
                              <h2>{response.data.body}</h2>
                            </div>,
                             document.getElementById('rewards')
                          )
                        }
                      })
                      .catch(function (error) {
                        setIsLoading(false);
                        console.log(error);
                      });
                    
                    
                  }
                }
              
          console.log("Result: ", JSON.stringify(result));
        }
      }
    });
  }, [accountId, getAccount]);

  const signIn = () => {
    selector.show();
  };

  const signOut = () => {
    selector.signOut().catch((err) => {
      console.log("Failed to sign out");
      console.error(err);
    });
  };

  const handleSwitchProvider = () => {
    selector.show();
  };

  const handleSwitchAccount = () => {
    const currentIndex = accounts.findIndex((x) => x.accountId === accountId);
    const nextIndex = currentIndex < accounts.length - 1 ? currentIndex + 1 : 0;

    const nextAccountId = accounts[nextIndex].accountId;

    setAccountId(nextAccountId);
    alert("Switched account to " + nextAccountId);
  };
  
  // Load the data from a JSON file and select a random record
  async function loadAndSelectRandomRecord() {
    ReactDOM.render(
      <></>,
       document.getElementById('rewards')
    )
   
    const API_ENDPOINT = 'https://byz-multi-chain-01.hasura.app/v1/graphql';

    const fetchListingsQuery = `
    query FETCH_LISTINGS {
      near {
        nft_state_list(
          limit: 100
          order_by: {list_block_datetime: desc}
          where: {listed: {_eq: true},list_price_str: {_lte: "10000000000"}}
        ) {
          id
          list_price
          listed
          list_price_str
          list_seller
          list_block_datetime
          list_contract {
            name
            contract_key
            base_marketplace_uri
            token_uri
            nft_metas {
              image
            }
          }
          nft_state {
            nft_meta {
              id
              token_id
              token_id_numeric
              name
              image
              ranking
              rarity
              collection {
                id
                title
                slug
                description
              }
              smart_contract_id
              smart_contract {
                contract_key
                contract_key_wrapper
                name
                id
              }
            }
          }
        }
      }
    }
    `;
    
    setIsLoading(true);
    const res = await axios.post(API_ENDPOINT, {
      query: fetchListingsQuery
    },{
      headers: {
        'Content-Type': 'application/json',
        'x-api-key' : 'faaA4Jc.358b884afd7ba87d7385c26b22609756',
        'Hasura-Client-Name' : 'Ready Layer One' 
      }
    });
    
   
    const { data } = res;

    setRandomRecord(selectRandomRecord(data.data.near.nft_state_list));
  }

  function selectRandomRecord(listings) {
    setIsLoading(false);
    return listings[Math.floor(Math.random() * listings.length)];
  }

  return (
    <main>
      <header>
        <h1>NEAR NFT Degen</h1>
      </header>
      { account
        ? (
          <>
            <div>
              {accounts.length > 1 && (
                <button onClick={handleSwitchAccount}>Switch Account</button>
              )}
            </div>
            <div>
              <label>
                <Switch
                  color='secondary'
                  onChange={() => setIsOn(!isOn)}
                  inputProps={{ 'aria-label': 'controlled' }}
                />
                Extra Degen Mode (Hidden image and obscured info)
              </label>
          </div>
           <button onClick={loadAndSelectRandomRecord}>Load and Select Random Record</button>
            {randomRecord && isOn && <DegenListing randomRecord={randomRecord} />}
            {randomRecord && !isOn && <Listing randomRecord={randomRecord} />}
            <br/>
            {isLoading ? <img src="https://shard.dog/img/sharddog_loading.gif" width="325px"/> : null }
          </>
        )
        : <SignIn/>
      }
         { account
          ? <button onClick={signOut}>Log out</button>
          : <button onClick={signIn}>Log in</button>
        }
      { !!account }
    </main>
  
  );
}


function Listing({ randomRecord }) {
  console.log(randomRecord);
  const buy = (e) => {
    e.preventDefault();

    selector.signAndSendTransactions({
      transactions: [
        {
          receiverId: randomRecord.list_contract.contract_key,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "buy",
                contractId: randomRecord.nft_state.nft_meta.smart_contract.contract_key,
                args: { 
                  price: randomRecord.list_price_str,  
                  nft_contract_id: randomRecord.nft_state.nft_meta.smart_contract.contract_key, 
                  token_id:  randomRecord.nft_state.nft_meta.token_id
                },
                gas: "150000000000000",
                deposit: randomRecord.list_price_str, // same as price
              },
            },
          ],
        },
      ],
    }).then(() => {
      //log for the reward
    }).catch((err) => {
      console.error(err);
      fieldset.disabled = false;
    });
  }

  return (
    <div className="listing">
      {randomRecord.nft_state.nft_meta.name ? (
        <div>
          <img src={randomRecord.nft_state.nft_meta.image} width='300'/>
          <p>Name: {randomRecord.nft_state.nft_meta.name}</p>
          <p>Title: {randomRecord.nft_state.nft_meta.collection.title}</p>
          <p>Description: {randomRecord.nft_state.nft_meta.collection.description}</p>
          <p>List price: {randomRecord.list_price_str/1000000000000000000000000}N</p>
          <button onClick={buy}>Buy</button>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );

  
};



function DegenListing({ randomRecord }) {
  console.log(randomRecord);
  const buy = (e) => {
    e.preventDefault();

    selector.signAndSendTransactions({
      transactions: [
        {
          receiverId: randomRecord.list_contract.contract_key,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "buy",
                contractId: randomRecord.list_contract.contract_key,
                args: {  
                  price: randomRecord.list_price_str,  
                  nft_contract_id: randomRecord.nft_state.nft_meta.smart_contract.contract_key, 
                  token_id:  randomRecord.nft_state.nft_meta.token_id 
                },
                gas: "150000000000000",
                deposit: randomRecord.list_price_str, // same as price
              },
            },
          ],
        },
      ],
    }).then(() => {
      //log for the reward      
    }).catch((err) => {
      console.error(err);
      fieldset.disabled = false;
    });
  }

  const replacer = (str, i, rep) => {
    if (!str) return;                      // Do nothing if no string passed
    const arr = [...str];                  // Convert String to Array
    const len = arr.length
    i = Math.min(Math.abs(i), len);        // Fix to Positive and not > len 
    while (i) {
      const r = ~~(Math.random() * len);
      if (Array.isArray(arr[r])) continue; // Skip if is array (not a character)
      arr[r] = [rep];                      // Insert an Array with the rep char
      --i;
    }
    return arr.flat().join("");
  };  
  let hiddenName = replacer(randomRecord.nft_state.nft_meta.name, 8, "#");
  return (
    <div className="listing">
      {randomRecord.nft_state.nft_meta.name ? (
        <div>
          <img src='http://readylayerone.s3.amazonaws.com/bb9.png' width='300'/>
          <p>Name: {hiddenName} </p>
          <p>List price: {randomRecord.list_price_str/1000000000000000000000000}N</p>
          <button onClick={buy}>Buy</button>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );

  
};


export default App;
