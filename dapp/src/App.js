import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';
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
import { GGBAbi } from './constants';


export const appState = proxy({
  env: '',
  themeMode: 'light',
  explorerUrl: '',
  isLogged: false,
  activePublicKey: '',
  accountHash: '',
  unplayedMoves: [],
  currentAccountMoves: [],
  contractHash: '',
  movesSeedUref: '',
  nodeUrl: '',
  lastDeployHash: '',
  executionResults: { status: '', message: '', method: '', loading: true },
  movePlayed: { id: '', winner: '', blendWinner: '', message: '' },
});


//export const CasperContext = createContext(undefined);
const WalletProviderContext = createContext(undefined);


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
    const env = localStorage.getItem('env') || 'testnet'
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
      setAccounts(accounts.map((a) => a.toLowerCase()));
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





  // const getMoves = useCallback(async () => {
  //   try {
  //     let stateRootHash = await clientRpc.getStateRootHash();
  //     let moves = await clientRpc.getDictionaryItemByURef(stateRootHash, 'moves', movesSeedUref)
  //     let movesParsed = [];
  //     moves.CLValue.value().map(result => {
  //       let item = result[1].value();
  //       let adversaryAccountHash = () => {
  //         if (!item[1].value()[0].value().unwrapOr(undefined)) {
  //           return undefined
  //         } else {
  //           return item[1].value()[0].value().unwrapOr(undefined).value()
  //         }
  //       }
  //       let adversaryBlendHash = () => {
  //         if (!item[1].value()[1].value().unwrapOr(undefined)) {
  //           return undefined
  //         } else {
  //           return item[1].value()[1].value().unwrapOr(undefined).value()
  //         }
  //       }
  //       let moveWinner = () => {
  //         if (!item[2].value()[1].value().unwrapOr(undefined)) {
  //           return undefined
  //         } else {
  //           return item[2].value()[1].value().unwrapOr(undefined).value()
  //         }
  //       }

  //       movesParsed.push(
  //         {
  //           id: item[0].value()[0].value().toString(),
  //           ownerAccountHash: item[0].value()[1].value(),
  //           ownerBlendHash: item[0].value()[2].value(),
  //           adversaryAccountHash: adversaryAccountHash(),
  //           adversaryBlendHash: adversaryBlendHash(),
  //           status: item[2].value()[0].value(),
  //           winner: moveWinner(),
  //         }
  //       )
  //     })
  //     return movesParsed

  //   } catch (error) {
  //     console.log(error)
  //   }
  // });

  // const checkStatusDeploy = async (hash) => {
  //   appState.executionResults.loading = true;

  //   appState.lastDeployHash = hash;
  //   let statusDeployHash = await clientRpc.getDeployInfo(hash);
  //   let pending = true;

  //   while (pending) {
  //     await sleepTime(10000)
  //     if (!statusDeployHash.execution_results.length > 0) {

  //       statusDeployHash = await clientRpc.getDeployInfo(hash);
  //       console.log(statusDeployHash.execution_results)
  //     } else {
  //       pending = false
  //     }

  //   }
  //   return statusDeployHash.execution_results[0].result;
  // }
  // const checkResultDeploy = (result, method) => {
  //   appState.executionResults.status = ''
  //   appState.executionResults.statusMessage = ''
  //   appState.executionResults.message = ''
  //   appState.executionResults.method = method

  //   if (result.Success) {
  //     appState.executionResults.status = 'success'
  //     appState.executionResults.statusMessage = 'Transaction success!'
  //     appState.executionResults.message = `Call to ${method} was executed`
  //   } else {
  //     appState.executionResults.status = 'error'
  //     appState.executionResults.statusMessage = 'Transaction failure!'
  //     appState.executionResults.message = `Error message: ${result.Failure.error_message}`
  //   }
  // }


  // const filterCurrentAccountMoves = useCallback(async () => {
  //   let moves = await getMoves();
  //   appState.currentAccountMoves = moves.filter(move => move.status !== 'unplayed' && move.ownerAccountHash == accountHash || move.adversaryAccountHash == accountHash);
  // }, [getMoves]);

  // const filterUnplayedMoves = useCallback(async () => {
  //   let moves = await getMoves();
  //   appState.unplayedMoves = moves.filter(move => move.status == 'unplayed')
  // }, [getMoves]);

  // const filterMoveForId = async (id) => {
  //   let moves = await getMoves();
  //   return moves.find(move => move.id == id)
  // };


  const tokenContract = useMemo(() => {
    if (!signer) return;
    return new Contract(
      process.env.REACT_APP_CONTRACT_HASH_MAINNET,
      GGBAbi,
      signer
    );
  }, [signer]);


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
                      <Image src='/gawibawibo-casper/loading.png' />
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
                      switchChain
                    }}>
                      <Nav />
                      {/* {
                        !casperSignerInstalled &&
                        <Card
                          align='center'
                          margin={{ horizontal: 'xlarge' }}
                          pad={{ horizontal: 'small', top: 'small', bottom: 'medium' }}
                          size='small'
                          background='c4'
                          elevation='none'
                          border
                        >
                          <Text size='small'>Casper Signer browser extension is not installed, please install here and refresh the page.</Text>
                          <Anchor
                            size='small'
                            href='https://chrome.google.com/webstore/detail/casper-signer/djhndpllfiibmcdbnmaaahkhchcoijce'
                            target='_blank'
                            label={'Casper Signer Extension'}
                          />
                        </Card>
                      } */}
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
