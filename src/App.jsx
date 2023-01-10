import 'regenerator-runtime/runtime';
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Big from 'big.js';
import { useWalletSelector } from './context/WalletSelector';
import SignIn from './components/SignIn';
import { providers, utils } from "near-api-js";
import axios from 'axios';

const SUGGESTED_DONATION = '0';
const BOATLOAD_OF_GAS = Big(3).times(10 ** 13).toFixed();

const App = () => {
  const [account, setAccount] = useState(null);
  const [randomRecord, setRandomRecord] = useState(null);
  const { selector, accounts, accountId, setAccountId } = useWalletSelector();


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
   
    const API_ENDPOINT = 'https://byz-full-preview.hasura.app/v1/graphql';

    const fetchListingsQuery = `
      query FETCH_LISTINGS($where: nft_state_list_bool_exp!, $order_by: [nft_state_list_order_by!], $offset: Int = 0, $limit: Int) {
        listings: nft_state_list(
          where: $where
          order_by: $order_by
          offset: $offset
          limit: $limit
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
            nft_meta {
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
              }
            }
          }
        }
      }
    `;
    
    const variables = {
        "where": {
          "listed": {
            "_eq": true
          },
          "nft_state": {
            "nft_meta": {
              "smart_contract": {
                "chain": {
                  "coin": {
                    "_in": [
                      "NEAR"
                    ]
                  }
                }
              }
            }
          }
        },
        "order_by": {
          "list_block_datetime": "desc",
          "id": "asc"
        },
        "offset": 0,
        "limit": 5
    };
    
    const res = await axios.post(API_ENDPOINT, {
      query: fetchListingsQuery,
      variables: variables,
    },{
      headers: {
        'Content-Type': 'application/json',
        'x-api-key' : 'oGaXHxb.996b18d1799866dc790c377da172da43',
        'Hasura-Client-Name' : 'byzantion.xyz.demo' 
      }
    });
    
   
    const { data } = res;

    setRandomRecord(selectRandomRecord(data.data.listings));
  }

  function selectRandomRecord(listings) {
    return listings[Math.floor(Math.random() * listings.length)];
  }

 
  return (
    <main>
      <header>
        <h1>NEAR NFT Degen</h1>
        { account
          ? <button onClick={signOut}>Log out</button>
          : <button onClick={signIn}>Log in</button>
        }
      </header>
      { account
        ? (
          <>
            <div>
              <button onClick={handleSwitchProvider}>Switch Provider</button>
              {accounts.length > 1 && (
                <button onClick={handleSwitchAccount}>Switch Account</button>
              )}
            </div>
           <button onClick={loadAndSelectRandomRecord}>Load and Select Random Record</button>
      {randomRecord && <Listing randomRecord={randomRecord} />}
          </>
        )
        : <SignIn/>
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
          <p>List price: {randomRecord.list_price_str/1000000000000000000000000}</p>
          <button onClick={buy}>Buy</button>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );

  
};

export default App;
