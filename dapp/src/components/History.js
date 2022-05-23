import { Box, List, Text, ResponsiveContext, Card} from 'grommet';
import React, { useContext, useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { appState, useWallet } from '../App';

export const History = () => {
  const { myHistoryMoves } = useSnapshot(appState);
  const { isLoggedIn } = useWallet();
  const size = useContext(ResponsiveContext);
  
  return <Box background='c1' align='center' pad='medium' gap='medium' border={{ color: 'c2' }} fill>
    <Text>my played moves</Text>
    <Box gap={size === 'small' ? 'small' : 'medium'} direction={ size === 'small' ? 'column' : 'row'} pad={{horizontal: 'medium'}} align='center' justify='around' fill='horizontal'>
      <Text size='small'>status</Text>
      <Text size='small'>blend</Text>
      <Text size='small'>prize (in MATIC)</Text>
      <Text size='small'>winner</Text>
    </Box>
    
    {myHistoryMoves &&
      myHistoryMoves.length > 0 && isLoggedIn ?
      (
        <List data={myHistoryMoves} primaryKey='id' paginate={{ size: 'small' }} step={size === 'small' ? 2 : 5}>
          {(item) => (
            <Box gap='small' direction={size === 'small' ? 'column' : 'row'} pad={{ horizontal: 'small' }} align='center' justify='around' fill='horizontal'>
              <Text size='small'>{item.status}</Text>
              <Text size='small'>{`${item.blendHash.substring(0, 6)}...${item.blendHash.substring(item.blendHash.length - 6)}`}</Text>
              <Text size='small'>{item.prize}</Text>
              <Text size='small'>{`${item.winner.substring(0, 6)}...${item.winner.substring(item.winner.length - 6)}`}</Text>
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
              (<Text size='small'>Please login to view your history moves.</Text>)
          }
        </Card>
      )
    }
  </Box>;
};

export default History;
