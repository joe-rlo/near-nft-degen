import 'regenerator-runtime/runtime';
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Big from 'big.js';
import { useWalletSelector } from './context/WalletSelector';
import SignIn from './components/SignIn';
import { providers, utils } from "near-api-js";
import axios from 'axios';
import Switch from '@mui/material/Switch';

const SUGGESTED_DONATION = '0';
const BOATLOAD_OF_GAS = Big(3).times(10 ** 13).toFixed();

const App = () => {
  const [account, setAccount] = useState(null);
  const [randomRecord, setRandomRecord] = useState(null);
  const { selector, accounts, accountId, setAccountId } = useWalletSelector();
  const [isOn, setIsOn] = useState(false);

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
   
    const API_ENDPOINT = 'https://byz-multi-chain-01.hasura.app/v1/graphql';

    const fetchListingsQuery = `
    query FETCH_LISTINGS {
      near {
        nft_state_list(
          limit: 10
          order_by: {list_block_datetime: desc}
          where: {listed: {_eq: true}}
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
            }
          }
        }
      }
    }
    `;
    
    
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
                contractId: randomRecord.list_contract.contract_key,
                args: { price: randomRecord.list_price_str },
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
                args: { price: randomRecord.list_price_str },
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
