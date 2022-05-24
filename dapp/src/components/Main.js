import { Box, Button, Layer, List, RadioButtonGroup, ResponsiveContext, Notification, Text, TextInput, Card, Avatar, Spinner, Anchor } from 'grommet';
import { Close, Refresh } from 'grommet-icons'
import React, { useCallback, useContext, useState, useEffect } from 'react';
import { Play } from './Play';
import { useSnapshot } from 'valtio';
import { appState } from '../App';
import { sha3_256 } from 'js-sha3';
import { AbiCoder } from '@ethersproject/abi';
import { keccak256 } from '@ethersproject/keccak256';
import { useWallet } from '../App';
import { parseUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

const optionsValues = [
  process.env.REACT_APP_VALUES_OPTION1,
  process.env.REACT_APP_VALUES_OPTION2,
  process.env.REACT_APP_VALUES_OPTION3,
]


const PrizeAmount = ({
  isLoggedIn,
  prizeAmount,
  setPrizeAmount,
}) => {

  const handleOnChange = (e) => {
    setPrizeAmount(e.target.value);
  }

  return (
    <Box
      alignSelf='end'
      pad={{ right: 'small' }}
    >
      <TextInput
        plain='full'
        disabled={!isLoggedIn}
        textAlign='end'
        placeholder='0.00'
        type="string"
        value={prizeAmount}
        onChange={handleOnChange}
      />
    </Box>
  )
}


const Main = () => {
  const size = useContext(ResponsiveContext);
  const [blends, setBlends] = useState({ b1: "", b2: "", b3: "" });
  const [openPlay, setOpenPlay] = useState(false);
  const { executionResults, lastDeployHash, movePlayed, unplayedMoves } = useSnapshot(appState);
  const [playTarget, setPlayTarget] = useState();
  const {
    // filterUnplayedMoves, 
    checkStatusDeploy,
    checkResultDeploy,
    accounts,
    isLoggedIn,
    gameContract,
    currentChain,
    amountInputValue,
    changeAmountInputValue,
    getUnplayedMoves,
    filterMoveForId,
    getMyUnclaimedAmount,
    openTransaction,
showTransaction,
    setOpenTransaction
  } = useWallet();
  const handlePlay = (move) => {
    setPlayTarget(move)
    showPlay()
  };

  const showPlay = () => {
    setOpenPlay(true)
  };
  const hidePlay = () => {
    setOpenPlay(false)
  };

  
  const hideTransaction = () => {
    setOpenTransaction(false)
    getUnplayedMoves().then(result => appState.unplayedMoves = result)
    getMyUnclaimedAmount().then(result => appState.unclaimedAmount = result)
  };

  const handleCancel = useCallback(async (id) => {
    try {

      let tx = await gameContract.cancelMove(BigNumber.from(id));
      showTransaction();
      let result = await checkStatusDeploy(tx);
      checkResultDeploy(result, 'cancelMove')
      appState.executionResults.loading = false;
    } catch (error) {
      console.log(error)
      console.error(error)
    }
  });
  const handleClean = () => {
    setBlends({ b1: "", b2: "", b3: "" })
  };
  const handleSubmit = useCallback(async () => {
    try {
      const abiCoder = new AbiCoder();
      const option = sha3_256(blends.b1 + blends.b2 + blends.b3).slice(0, 10);
      const blend = abiCoder.encode(['string', 'address'], [option, accounts[0]]);
      const hash = keccak256(blend);
        console.log(hash);
      let tx = await gameContract.newMove(hash, { value: parseUnits(amountInputValue) });
      showTransaction();
      let result = await checkStatusDeploy(tx);
      checkResultDeploy(result, 'newMove')
      appState.executionResults.loading = false;
    } catch (error) {
      console.log(error)
      console.error(error)
    }
  });
  return (
    <Box
      gap='medium'
      align='center'
      pad='medium'
      direction={size === 'small' ? 'column' : 'row'}
    >
      <Box
        background='c1'
        align='center'
        height={{ min: '450px', max: '450px' }}
        pad={size === 'small' ? 'large' : 'medium'}
        gap={size === 'small' ? 'large' : 'medium'}
        border={{ color: 'c2' }}
        fill
      >
        <Text>make a new move!</Text>
        <Text>chooise a blend:</Text>
        <Options blends={blends} setBlends={setBlends} isLogged={isLoggedIn} />

        <Box direction='row' align='center' gap='xsmall'>
          <Text>prize amount</Text>
          <PrizeAmount
            isLoggedIn={isLoggedIn}
            prizeAmount={amountInputValue}
            setPrizeAmount={changeAmountInputValue}
          />
        </Box>
        <Box direction='row' alignSelf='end' gap='medium' pad={{ right: 'large' }}>
          <Button
            onClick={handleClean}
            label="clear"
            disabled={isLoggedIn ? false : true}
          />
          <Button
            onClick={handleSubmit}
            label="submit"
            disabled={
              isLoggedIn &&
                blends.b1 !== '' &&
                blends.b2 !== '' &&
                blends.b3 !== '' && 
                amountInputValue !== ''
                ?
                false :
                true
            }
          />
        </Box>
      </Box>
      <Box
        background='c1'
        align='center'
        height={{ min: '450px', max: '450px' }}
        pad={size === 'small' ? 'large' : 'medium'}
        gap={size === 'small' ? 'large' : 'medium'}
        border={{ color: 'c2' }}
        fill>
        <Box direction='row' gap='medium' align='center'>
          <Text>unplayed moves</Text>
          <Refresh size='small' onClick={() => {
            getUnplayedMoves().then(result => appState.unplayedMoves = result)
          }} />
        </Box>
        <Box gap='medium' direction={size === 'small' ? 'column' : 'row'} align='center'>
          <Text size='small'>id</Text>
          <Text size='small'>owner</Text>
          <Text size='small'>prize (in MATIC)</Text>
          <Text size='small'>play</Text>
        </Box>
        {unplayedMoves &&
          unplayedMoves.length > 0 && isLoggedIn ?
          (
            <List
              data={unplayedMoves}
              primaryKey='id'
              paginate={{ size: 'small' }}
              step={5}
              action={(move) => (
                <ActionButton
                  key={move.id}
                  move={move}
                  address={accounts[0]}
                  handleCancel={handleCancel}
                  handlePlay={handlePlay}
                />
              )}>
              {(item) => (
                <Box
                  key={item.id}
                  gap='small'
                  direction={size === 'small' ? 'column' : 'row'}
                  align='center'
                  justify='between'
                >
                  <Text size='small'>{item.id}</Text>
                  <Text size='small'>{`${item.owner.substring(0, 6)}...${item.owner.substring(item.owner.length - 6)}`}</Text>
                  <Text size='small'>{item.prize}</Text>

                </Box>
              )}
            </List>
          )
          :
          (
            <Card pad='small' size='small' background='c4' elevation='none' border>
              {
                isLoggedIn ?
                  (<Text size='small'>There are no moves here.</Text>)
                  :
                  (<Text size='small'>Please login to view unplayed moves.</Text>)
              }
            </Card>
          )
        }
      </Box>
      {
        openPlay && (
          <Layer
            position="center"
            margin="medium"
            responsive
            modal
            full="vertical"
            onClickOutside={hidePlay}
            onEsc={hidePlay}
          >
            <Box gap='medium' align='center' pad='medium'>
              <Close onClick={hidePlay} size='small' />
              <Play
                playTarget={playTarget}
                amount={amountInputValue}
                address={accounts[0]}
                size={size}
                gameContract={gameContract}
                filterMoveForId={filterMoveForId}
                showTransaction={showTransaction}
                checkStatusDeploy={checkStatusDeploy}
                checkResultDeploy={checkResultDeploy}
                hidePlay={hidePlay}
              />
            </Box>
          </Layer>
        )
      }
      {
        openTransaction && (
          <Layer
            position="center"
            margin="medium"
            responsive
            modal
            full="vertical"
            onClickOutside={hideTransaction}
            onEsc={hideTransaction}
          >
            <Box gap='medium' align='center' pad='small' width={{ min: 'medium' }} justify='center' flex>
              <Box align='center' gap='small' margin={{ bottom: 'medium' }}>
                <Close onClick={hideTransaction} size='small' />
                <Text weight='bold'>Transaction Result</Text>
              </Box>
              {
                executionResults.loading ?
                  <Box gap='small' align='center'>
                    <Text size='small'>Please wait... it may take a few minutes</Text>
                    <Spinner size='medium' />
                  </Box>
                  :
                  <Box gap='medium' align='center' >
                    <Box gap='small' align='center'>
                      <Text size='small'>{executionResults.statusMessage}</Text>
                      <Text size='small'>{executionResults.message}</Text>

                      <Box direction='row' gap='xsmall'>
                        <Text size='small'>Deploy hash:</Text>
                        <Anchor
                          size='small'
                          href={`${currentChain.explorerUrl}/tx/${lastDeployHash}`}
                          target='_blank'
                          label={`${lastDeployHash.substring(0, 6)}...${lastDeployHash.substring(lastDeployHash.length - 6)}`}
                        />
                      </Box>
                    </Box>
                    {
                      executionResults.method == 'play' &&
                      executionResults.status == 'success' &&

                      (
                        <Box gap='small' pad='small' align='center' border>
                          <Text weight='bold'>{movePlayed.message}</Text>
                          <Text size='small'>winner: {movePlayed.winner ? `${movePlayed.winner.substring(0, 6)}...${movePlayed.winner.substring(movePlayed.winner.length - 6)}` : 'no winner'}</Text>
                          <Text size='small'>id: {`${movePlayed.id}`}</Text>
                        </Box>
                      )
                    }
                  </Box>
              }
            </Box>
          </Layer>
        )
      }
    </Box >
  )
};

export const Options = ({ blends, setBlends, isLogged }) => {

  return <Box gap='small' border={{ color: 'c2' }} pad='small'>
    <RadioButtonGroup
      name='blend1'
      options={[
        { label: <Avatar src={'/gawibawibo-polygon/rock-icon-grey.png'} size='small' />, value: optionsValues[0] },
        { label: <Avatar src={'/gawibawibo-polygon/paper-icon-grey.png'} size='small' />, value: optionsValues[1] },
        { label: <Avatar src={'/gawibawibo-polygon/scissors-icon-grey.png'} size='small' />, value: optionsValues[2] },
      ]}
      value={blends.b1}
      onChange={(e) => setBlends({ ...blends, b1: e.target.value })}
      direction='row'
      disabled={isLogged ? false : true}
    />
    <RadioButtonGroup
      name='blend2'
      options={[
        { label: <Avatar src={'/gawibawibo-polygon/rock-icon-grey.png'} size='small' />, value: optionsValues[0] },
        { label: <Avatar src={'/gawibawibo-polygon/paper-icon-grey.png'} size='small' />, value: optionsValues[1] },
        { label: <Avatar src={'/gawibawibo-polygon/scissors-icon-grey.png'} size='small' />, value: optionsValues[2] },
      ]}
      value={blends.b2}
      onChange={(e) => setBlends({ ...blends, b2: e.target.value })}
      direction='row'
      disabled={isLogged ? false : true}
    />
    <RadioButtonGroup
      name='blend3'
      options={[
        { label: <Avatar src={'/gawibawibo-polygon/rock-icon-grey.png'} size='small' />, value: optionsValues[0] },
        { label: <Avatar src={'/gawibawibo-polygon/paper-icon-grey.png'} size='small' />, value: optionsValues[1] },
        { label: <Avatar src={'/gawibawibo-polygon/scissors-icon-grey.png'} size='small' />, value: optionsValues[2] },
      ]}
      value={blends.b3}
      onChange={(e) => setBlends({ ...blends, b3: e.target.value })}
      direction='row'
      disabled={isLogged ? false : true}
    />
  </Box>
}

const ActionButton = ({ move, address, handleCancel, handlePlay }) => {

  if (move.owner === address) {
    return <Button label='cancel' size='small' onClick={() => handleCancel(move.id)} />
  } else {
    return <Button label='play' size='small' onClick={() => handlePlay(move)} />
  }

}

export default Main;
