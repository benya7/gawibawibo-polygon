import { Box, Button, Text, TextInput } from 'grommet';
import React, { useState, useCallback } from 'react';
import { Options } from './Main'
import { sleepTime } from '../utils';
import { sha3_256 } from 'js-sha3';
import { appState } from '../App';
import { BigNumber } from '@ethersproject/bignumber';
import { AbiCoder } from '@ethersproject/abi';
import { keccak256 } from '@ethersproject/keccak256';
import { parseUnits } from '@ethersproject/units';

export const Play = ({
  playTarget,
  address,
  size,
  gameContract,
  filterMoveForId,
  showTransaction,
  checkStatusDeploy,
  checkResultDeploy,
  hidePlay
}) => {
  const [blends, setBlends] = useState({ b1: "", b2: "", b3: "" });

  const handleClean = () => {
    setBlends({ b1: "", b2: "", b3: "" })
  };

  const handleSubmit = useCallback(async () => {
    appState.movePlayed.message = '';
    appState.movePlayed.blendWinner = '';
    appState.movePlayed.id = '';
    try {      
      const abiCoder = new AbiCoder();
      const option = sha3_256(blends.b1 + blends.b2 + blends.b3).slice(0, 10);
      const blend = abiCoder.encode(['string', 'address'], [option, address]);
      const hash = keccak256(blend);
      hidePlay();
      let tx = await gameContract.play(BigNumber.from(playTarget.id), hash, { value: parseUnits(playTarget.prize) });
      showTransaction();
      let result = await checkStatusDeploy(tx);
      checkResultDeploy(result, 'play')

      await sleepTime(12000)
      let move = await filterMoveForId(playTarget.id)
      if (move.winner === address) {
        appState.movePlayed.message = 'Congratulations, you win this move!'
        appState.movePlayed.winner = move.winner;

      } else if (move.status === "TIED") {
        appState.movePlayed.message = 'The game was tied'
        appState.movePlayed.winner = undefined;

      } else {
        appState.movePlayed.message = 'You lost the game, try again!'
        appState.movePlayed.winner = move.winner;
      }
      appState.movePlayed.id = playTarget.id;

      appState.executionResults.loading = false;
    } catch (error) {
      console.log(error)
      console.error(error)
    }
  });

  return (
    <Box
      background='c1'
      align='center'
      height={{ min: '450px', max: '450px' }}
      pad={size === 'small' ? 'large' : 'medium'}
      gap={size === 'small' ? 'large' : 'medium'}
      border={{ color: 'c2' }}
      fill
    >
      <Text>Make a new move!</Text>
      <Text>Chooise a blend:</Text>
      <Options blends={blends} setBlends={setBlends} isLogged={true} />
      <Box direction='row' alignSelf='end' gap='medium' pad={{ right: 'large' }}>
        <Button onClick={handleClean} label="clear" />
        <Button
          onClick={handleSubmit}
          disabled={blends.b1 !== '' && blends.b2 !== '' && blends.b3 !== '' ? false : true}
          label="submit"
        />
      </Box>
      <Box direction='row' align='center' gap='xsmall'>
        <Text>prize amount</Text>
        <TextInput textAlign='end' disabled value={playTarget.prize} />
      </Box>
    </Box>
  )
};

export default Play;
