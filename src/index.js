import React from 'react';
import ReactDOM from 'react-dom';
import App from './App'
import {WalletSelectorContextProvider} from './context/WalletSelector'

ReactDOM.render(
  <WalletSelectorContextProvider>
    <App/>
  </WalletSelectorContextProvider>,
  document.getElementById('root')
);