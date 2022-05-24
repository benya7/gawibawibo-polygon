import React, { useEffect, useState, useCallback, createContext, useContext, useMemo } from 'react';
import { Grommet, ResponsiveContext, Spinner, Image, Box, Card, Anchor, Text } from 'grommet';
import { Close } from 'grommet-icons';
import { theme } from './layout/theme';
import { useSnapshot } from 'valtio';
import Nav from './components/Nav';
import Container from './components/Container';
import Main from './components/Main';
import FooterApp from './components/FooterApp';
import { proxy } from 'valtio';
import { sleepTime } from './utils'
import Web3Modal from "web3modal";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import { hexValue } from "@ethersproject/bytes";
import getConfig from './config';
import { Contract } from '@ethersproject/contracts';
import GBBAbi from './abi/GBB.json';
import { formatEther, formatUnits } from '@ethersproject/units';
import { AddressZero } from '@ethersproject/constants';
import { BigNumber } from '@ethersproject/bignumber';
export const appState = proxy({
  env: '',
  themeMode: 'light',
  // explorerUrl: '',
  // isLogged: false,
  // activePublicKey: '',
  // accountHash: '',
  unclaimedAmount: "0.0",
  unplayedMoves: [],
  myHistoryMoves: [],
  contractHash: '',
  // movesSeedUref: '',
  // nodeUrl: '',
  lastDeployHash: '',
  executionResults: { status: '', message: '', method: '', loading: true },
  movePlayed: { id: '', winner: '', message: '' },
});


//export const CasperContext = createContext(undefined);
const WalletProviderContext = createContext(undefined);


const status = ["UNPLAYED", "PLAYED", "TIED", "CANCELLED"];

function App() {
  const [loading, setLoading] = useState(true);

  const { themeMode, isLogged } = useSnapshot(appState);
  const [accounts, setAccounts] = useState();
  const [currentChain, setCurrentChain] = useState();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [rawEthereumProvider, setRawEthereumProvider] = useState();
  const [signer, setSigner] = useState();
  const [walletProvider, setWalletProvider] = useState();
  const [web3Modal, setWeb3Modal] = useState();
  const [openTransaction, setOpenTransaction] = useState(false);

  const [amountInputValue, setAmountInputValue] = useState("");


  const chainsSupported = [
    {
      name: "Polygon",
      image: 'https://app.1inch.io/assets/images/network-logos/polygon.svg',
      subText: "Polygon Mainnet",
      chainId: 137,
      rpcUrl: "https://polygon-rpc.com/",
      currency: "MATIC",
      nativeToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      nativeDecimal: 18,
      explorerUrl: "https://polygonscan.com/",
    },
    {
      name: "Mumbai",
      image: 'https://app.1inch.io/assets/images/network-logos/polygon.svg',
      subText: "Polygon Testnet",
      chainId: 80001,
      rpcUrl: process.env.REACT_APP_CONTRACT_ALCHEMY_KEY,
      currency: "MATIC",
      nativeToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      nativeDecimal: 18,
      nativeFaucetURL: "https://faucet.matic.network/",
      explorerUrl: "https://mumbai.polygonscan.com",
    }
  ]


  useEffect(() => {
    appState.themeMode = localStorage.getItem('theme') || 'light'
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (
      rawEthereumProvider &&
      walletProvider &&
      currentChain &&
      accounts &&
      accounts[0] &&
      accounts[0].length > 0
    ) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [rawEthereumProvider, walletProvider, currentChain, accounts]);

  useEffect(() => {
    if (!walletProvider) return;
    setSigner(walletProvider.getSigner());
  }, [walletProvider]);

  useEffect(() => {
    setWeb3Modal(
      new Web3Modal({
        // network: "mumbai", // optional
        cacheProvider: true, // optional
      })
    );
  }, []);

  // because provider does not fire events initially, we need to fetch initial values for current chain from walletProvider
  // subsequent changes to these values however do fire events, and we can just use those event handlers
  useEffect(() => {
    if (!walletProvider) {
      setCurrentChain(chainsSupported[1])
      return
    }
    (async () => {
      let { chainId } = await walletProvider.getNetwork();
      chainsSupported.map(chain => {
        if (chain.chainId === chainId) {
          setCurrentChain(chain)
        }
      })
      let accounts = await walletProvider.listAccounts();
      setAccounts(accounts.map((a) => a));
    })();
  }, [walletProvider]);

  const reinit = (changedProvider) => {
    setWalletProvider(new Web3Provider(changedProvider));
  };

  // setup event handlers for web3 provider given by web3-modal
  // this is the provider injected by metamask/fortis/etc
  useEffect(() => {
    if (!rawEthereumProvider) return;

    function handleAccountsChanged(accounts) {
      console.log("accountsChanged!");
      setAccounts(accounts.map((a) => a.toLowerCase()));
      reinit(rawEthereumProvider);
    }

    // Wallet documentation recommends reloading page on chain change.
    // Ref: https://docs.metamask.io/guide/ethereum-provider.html#events
    function handleChainChanged(chainId) {
      console.log("chainChanged!");
      if (typeof chainId === "string") {
        let chainIdParsed = Number.parseInt(chainId)
        chainsSupported.map(chain => {
          if (chain.chainId === chainIdParsed) {
            setCurrentChain(chain)
          }
        })
      } else {
        chainsSupported.map(chain => {
          if (chain.chainId === chainId) {
            setCurrentChain(chain)
          }
        })
      }
      reinit(rawEthereumProvider);
    }

    function handleConnect(info) {
      console.log("connect!");
      chainsSupported.map(chain => {
        if (chain.chainId === info.chainId) {
          setCurrentChain(chain)
        }
      })
      reinit(rawEthereumProvider);
    }

    function handleDisconnect(error) {
      console.log("disconnect");
      console.error(error);
    }

    // Subscribe to accounts change
    rawEthereumProvider.on("accountsChanged", handleAccountsChanged);

    // Subscribe to network change
    rawEthereumProvider.on("chainChanged", handleChainChanged);

    // Subscribe to provider connection
    rawEthereumProvider.on("connect", handleConnect);

    // Subscribe to provider disconnection
    rawEthereumProvider.on("disconnect", handleDisconnect);

    // Remove event listeners on unmount!
    return () => {
      rawEthereumProvider.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
      rawEthereumProvider.removeListener("networkChanged", handleChainChanged);
      rawEthereumProvider.removeListener("connect", handleConnect);
      rawEthereumProvider.removeListener("disconnect", handleDisconnect);
    };
  }, [rawEthereumProvider]);

  const connect = useCallback(async () => {
    if (!web3Modal) {
      console.error("Web3Modal not initialized.");
      return;
    }
    let provider = await web3Modal.connect();
    setRawEthereumProvider(provider);
    setWalletProvider(new Web3Provider(provider));
  }, [web3Modal]);

  const disconnect = useCallback(async () => {
    if (!web3Modal) {
      console.error("Web3Modal not initialized.");
      return;
    }
    web3Modal.clearCachedProvider();
    setRawEthereumProvider(undefined);
    setWalletProvider(undefined);
  }, [web3Modal]);

  const switchChain = useCallback(
    async (targetChain) => {
      if (!rawEthereumProvider) return;
      const chainIdHex = hexValue(targetChain.chainId);
      try {
        await rawEthereumProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }]
        })
      } catch (error) {
        try {
          if (error.code === 4902) {
            await rawEthereumProvider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: chainIdHex,
                blockExplorerUrls: [targetChain.explorerUrl],
                chainName: targetChain.name,
                iconUrls: [targetChain.image],
                nativeCurrency: {
                  name: targetChain.name,
                  symbol: targetChain.currency,
                  decimals: targetChain.nativeDecimal,
                },
                rpcUrls: [targetChain.rpcUrl],
              }],
            })
          } else {
            console.log(error)
          }
        } catch (error) {
          console.log(error)
        }
      }
    }, [rawEthereumProvider])

  const showTransaction = () => {
    setOpenTransaction(true)
  };
  const changeAmountInputValue = (amount) => {
    const regExp = /^((\d+)?(\.\d{0,4})?)$/;
    let status = regExp.test(amount);

    if (status) {
      setAmountInputValue(amount);
    }
  };

  const gameContract = useMemo(() => {
    if (!signer) return;
    const config = getConfig(currentChain.name)
    return new Contract(
      config.contractHash,
      GBBAbi.abi,
      signer
    );
  }, [signer, currentChain]);

  const getUnplayedMoves = useCallback(async () => {
    if (!gameContract) return;
    try {
      let result = await gameContract.getUnplayedMoves();
      let movesParsed = []

      result.map(item => {
        if (item[1] !== AddressZero) {
          movesParsed.push({ id: item[0].toString(), owner: item[1], prize: formatEther(item[2]) })
        }
      })

      return movesParsed

    } catch (error) {
      console.log(error)
    }
  }, [gameContract]);


  const filterMoveForId = useCallback(
    async (id) => {
      let result = await gameContract.moves(BigNumber.from(id));
      let move = { status: status[result[0]], blendHash: result[1], prize: formatEther(result[2]), adversary: result[3], winner: result[4]}
      return move
    }, [gameContract]);

  const getMyUnclaimedAmount = useCallback(
    async () => {
      if (!gameContract || !accounts) return;
      let result = await gameContract.getMyUnclaimedAmount();
      console.log("unclaimed amount =>", result)

      return formatEther(result)
    }, [gameContract, accounts]);

  const getMyHistoryMoves = useCallback(async () => {
    if (!gameContract) return;
    try {
      let result = await gameContract.getMyMoves();
      let movesParsed = []
      result.map(item => {
        console.log(item[1])
        if (item[1] !== "0x0000000000000000000000000000000000000000000000000000000000000000" && item[0] !== 0) {
          movesParsed.push({ status: status[item[0]], blendHash: item[1], prize: formatEther(item[2]), adversary: item[3], winner: item[4] })
        }
      })

      return movesParsed

    } catch (error) {
      console.log(error)
    }
  }, [gameContract, accounts]);

  useEffect(() => {
    getMyHistoryMoves().then(result => appState.myHistoryMoves = result)
  }, [getMyHistoryMoves, currentChain])
  useEffect(() => {
    getUnplayedMoves().then(result => appState.unplayedMoves = result)
  }, [getUnplayedMoves, currentChain])
  useEffect(() => {
    getMyUnclaimedAmount().then(result => appState.unclaimedAmount = result)
  }, [getMyUnclaimedAmount, currentChain])

  const checkStatusDeploy = async (tx) => {
    appState.executionResults.loading = true;

    if (tx.hash) {
      appState.lastDeployHash = tx.hash;
      await tx.wait(1);
      return tx;
    } else {
      return false
    }
  }
  const checkResultDeploy = (result, method) => {
    appState.executionResults.status = ''
    appState.executionResults.statusMessage = ''
    appState.executionResults.message = ''
    
    appState.executionResults.method = method
    if (result) {
      appState.executionResults.status = 'success'
      appState.executionResults.statusMessage = 'Transaction success!'
      appState.executionResults.message = `Call to ${method} was executed`
    } else {
      appState.executionResults.status = 'error'
      appState.executionResults.statusMessage = 'Transaction failure!'
    }
  }
  return (
    <Grommet theme={theme} themeMode={themeMode} background='c1' full>
      <ResponsiveContext.Consumer>
        {size => (
          <Container size={size !== 'large' ? 'small' : 'large'}>
            {
              loading ?
                (
                  <Box align='center' pad={{ top: 'xlarge' }} margin={{ top: 'xlarge' }}>
                    <Spinner animation={{ type: 'rotateRight', duration: 4000 }} size='xlarge'>
                      <Image src='/gawibawibo-polygon/loading.png' />
                    </Spinner>
                  </Box>
                )
                :
                (
                  <>
                    <WalletProviderContext.Provider value={{
                      accounts,
                      connect,
                      chainsSupported,
                      currentChain,
                      disconnect,
                      isLoggedIn,
                      rawEthereumProvider,
                      signer,
                      walletProvider,
                      web3Modal,
                      switchChain,
                      gameContract,
                      amountInputValue,
                      changeAmountInputValue,
                      checkStatusDeploy,
                      checkResultDeploy,
                      getUnplayedMoves,
                      getMyHistoryMoves,
                      getMyUnclaimedAmount,
                      filterMoveForId,
                      openTransaction,
                      showTransaction,
                      setOpenTransaction
                    }}>
                      <Nav />
                      <Main />
                    </WalletProviderContext.Provider>
                    <FooterApp />
                  </>
                )
            }
          </Container>
        )}
      </ResponsiveContext.Consumer>
    </Grommet>
  );
}
export const useWallet = () => useContext(WalletProviderContext);
export default App;
