import React, { useContext, useEffect, useState, createContext } from "react";
import NearWalletSelector, { AccountInfo } from "@near-wallet-selector/core";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";

const WalletSelectorContext =
    createContext(null);

export function WalletSelectorContextProvider({ children }) {
    const [selector, setSelector] = useState(null);
    const [accountId, setAccountId] = useState(null);
    const [accounts, setAccounts] = useState([]);

    const syncAccountState = (
        currentAccountId,
        newAccounts
    ) => {
        if (!newAccounts.length) {
        localStorage.removeItem("accountId");
        setAccountId(null);
        setAccounts([]);

        return;
    }

        const validAccountId =
            currentAccountId &&
            newAccounts.some((x) => x.accountId === currentAccountId);
        const newAccountId = validAccountId
            ? currentAccountId
            : newAccounts[0].accountId;

        localStorage.setItem("accountId", newAccountId);
        setAccountId(newAccountId);
        setAccounts(newAccounts);
    };

    useEffect(() => {
        NearWalletSelector.init({
            network: "mainnet",
            contractId: "market.tradeport.near",
            wallets: [
                setupNearWallet()
            ],
        })
        .then((instance) => {
            return instance.getAccounts().then(async (newAccounts) => {
                syncAccountState(localStorage.getItem("accountId"), newAccounts);

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore-next-line
                window.selector = instance;
                setSelector(instance);
            });
        })
        .catch((err) => {
            console.error(err);
            alert("Failed to initialise wallet selector");
        });
    }, []);

    useEffect(() => {
        if (!selector) {
            return;
        }
        const subscription = selector.on("accountsChanged", (e) => {
            syncAccountState(accountId, e.accounts);
        });

        return () => subscription.remove();
    }, [selector, accountId]);

    if (!selector) {
        return null;
    }

    return (
        <WalletSelectorContext.Provider
            value={{
                selector,
                accounts,
                accountId,
                setAccountId,
            }}
        >
            {children}
        </WalletSelectorContext.Provider>
    );
};

export function useWalletSelector() {
    const context = useContext(WalletSelectorContext);

    if (!context) {
        throw new Error(
        "useWalletSelector must be used within a WalletSelectorContextProvider"
        );
    }
    return context;
}