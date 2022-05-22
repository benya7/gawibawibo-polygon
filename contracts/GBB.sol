//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract GBB {

    enum StatusMove {
      Unplayed,
      Played,
      Tied,
      Cancelled
    }

    struct Move {
      StatusMove status;
      bytes32 hashBlend;
      uint prize;
      address winner;
    }

    struct MovePointer{
        uint id;
        address owner;
        uint prize;
    }

    uint totalMovesCount = 0;

    mapping (uint => address) private moveOf;
    mapping (address => uint) private ownerMovesCount;
    mapping (address => uint256) private unclaimedAmounts;
    Move[] public moves;
    string[] private blendsHash;

    constructor(string[] memory _blendsHash) {
        blendsHash = _blendsHash;
    }

    function newMove(bytes32 _hashBlend) external payable {
      Move memory move = Move(StatusMove.Unplayed, _hashBlend, msg.value, address(0));
      moves.push(move);
      moveOf[moves.length - 1] = msg.sender;
      ownerMovesCount[msg.sender]++;
      totalMovesCount++;
    }

    function cancelMove(uint _moveId) external {
      require(moveOf[_moveId] == msg.sender);
      Move storage targetMove = moves[_moveId];
      require(targetMove.status == StatusMove.Unplayed);
      targetMove.status = StatusMove.Cancelled;
      uint unclaimedAmount = targetMove.prize;
      targetMove.prize = 0;
      unclaimedAmounts[msg.sender] = unclaimedAmount;
    }

    function withdraw() external {
        uint amount = unclaimedAmounts[msg.sender];
        require(amount > 0);
        unclaimedAmounts[msg.sender] = 0;
        (bool success,) = address(msg.sender).call{value: amount}("");
        require(success);
    }

    function getUnplayedMoves() external view returns (MovePointer[] memory) {
        MovePointer[] memory unplayedMoves = new MovePointer[](totalMovesCount);

        for (uint i = 0; i < totalMovesCount; i++) {
            if (moves[i].status == StatusMove.Unplayed) {
                address ownerOfMove = moveOf[i];
                unplayedMoves[i] = MovePointer(i, ownerOfMove, moves[i].prize);
            }
        }
        return unplayedMoves;
    }
    
    function getMyMoves() external view returns (Move[] memory) {
        Move[] memory myMoves = new Move[](ownerMovesCount[msg.sender]);
        uint counter = 0;
        for (uint i = 0; i < totalMovesCount; i++) {
            if (moveOf[i] == msg.sender || moves[i].winner == msg.sender) {
                Move memory move = moves[i];
                myMoves[counter] = move;
                counter++;
            }
        }
        return myMoves;
    }

    function getBlendNumber(bytes32 hash, address _player) private view returns (uint32[] memory) {
        uint32 optionId;
        uint32[] memory blendNumbers = new uint32[](3);
         for (uint i = 0; i < blendsHash.length; i++) {
           bytes32 blend = keccak256(abi.encode(blendsHash[i], _player));
            if (hash == blend) {
                optionId = uint32(i);
           }
         }

        if (optionId == 0) {
            blendNumbers[0] = 147;
            blendNumbers[1] = 147;
            blendNumbers[2] = 147;
        } else if (optionId == 1)  {
            blendNumbers[0] = 258;
            blendNumbers[1] = 147;
            blendNumbers[2] = 147;
        } else if (optionId == 2)  {
            blendNumbers[0] = 369;
            blendNumbers[1] = 147;
            blendNumbers[2] = 147;
        } else if (optionId == 3)  {
            blendNumbers[0] = 147;
            blendNumbers[1] = 258;
            blendNumbers[2] = 147;
        } else if (optionId == 4)  {
            blendNumbers[0] = 147;
            blendNumbers[1] = 369;
            blendNumbers[2] = 147;
        } else if (optionId == 5)  {
            blendNumbers[0] = 147;
            blendNumbers[1] = 147;
            blendNumbers[2] = 258;
        } else if (optionId == 6)  {
            blendNumbers[0] = 147;
            blendNumbers[1] = 147;
            blendNumbers[2] = 369;
        } else if (optionId == 7)  {
            blendNumbers[0] = 258;
            blendNumbers[1] = 258;
            blendNumbers[2] = 258;
        } else if (optionId == 8)  {
            blendNumbers[0] = 147;
            blendNumbers[1] = 258;
            blendNumbers[2] = 258;
        } else if (optionId == 9)  {
            blendNumbers[0] = 369;
            blendNumbers[1] = 258;
            blendNumbers[2] = 258;
        } else if (optionId == 10)  {
            blendNumbers[0] = 258;
            blendNumbers[1] = 147;
            blendNumbers[2] = 258;
        } else if (optionId == 11)  {
            blendNumbers[0] = 258;
            blendNumbers[1] = 369;
            blendNumbers[2] = 258;
        } else if (optionId == 12)  {
            blendNumbers[0] = 258;
            blendNumbers[1] = 258;
            blendNumbers[2] = 147;
        } else if (optionId == 13)  {
            blendNumbers[0] = 258;
            blendNumbers[1] = 258;
            blendNumbers[2] = 369;
        } else if (optionId == 14)  {
            blendNumbers[0] = 369;
            blendNumbers[1] = 369;
            blendNumbers[2] = 369;
        } else if (optionId == 15)  {
            blendNumbers[0] = 147;
            blendNumbers[1] = 369;
            blendNumbers[2] = 369;
        } else if (optionId == 16)  {
            blendNumbers[0] = 258;
            blendNumbers[1] = 369;
            blendNumbers[2] = 369;
        } else if (optionId == 17)  {
            blendNumbers[0] = 369;
            blendNumbers[1] = 147;
            blendNumbers[2] = 369;
        } else if (optionId == 18)  {
            blendNumbers[0] = 369;
            blendNumbers[1] = 258;
            blendNumbers[2] = 369;
        } else if (optionId == 19)  {
            blendNumbers[0] = 369;
            blendNumbers[1] = 369;
            blendNumbers[2] = 147;
        } else if (optionId == 20)  {
            blendNumbers[0] = 369;
            blendNumbers[1] = 369;
            blendNumbers[2] = 258;
        } else if (optionId == 21)  {
            blendNumbers[0] = 147;
            blendNumbers[1] = 258;
            blendNumbers[2] = 369;
        } else if (optionId == 22)  {
            blendNumbers[0] = 369;
            blendNumbers[1] = 258;
            blendNumbers[2] = 147;
        } else {
            revert();
        }
        return blendNumbers;
    }

    function play(uint _moveId, bytes32 adversaryHash) external payable {
        
        require(moveOf[_moveId] != address(0));
        require(moveOf[_moveId] != msg.sender);
        Move storage targetMove = moves[_moveId];
        require(targetMove.status == StatusMove.Unplayed);
        require(msg.value == targetMove.prize);

        uint32[] memory counterGame = new uint32[](2);
        uint32[] memory ownerBlendNumbers = getBlendNumber(targetMove.hashBlend, moveOf[_moveId]);
        uint32[] memory adversaryBlendNumbers = getBlendNumber(adversaryHash, msg.sender);
        
        for (uint i = 0; i < ownerBlendNumbers.length; i++) {

            if (ownerBlendNumbers[i] == 147 && adversaryBlendNumbers[i] == 369) {
                counterGame[0]++;
            } else if (ownerBlendNumbers[i] == 258 && adversaryBlendNumbers[i] == 147) {
                counterGame[0]++;
            } else if (ownerBlendNumbers[i] == 369 && adversaryBlendNumbers[i] == 258) {
                counterGame[0]++;
            } else if (ownerBlendNumbers[i] == 369 && adversaryBlendNumbers[i] == 147) {
                counterGame[1]++;
            } else if (ownerBlendNumbers[i] == 147 && adversaryBlendNumbers[i] == 258) {
                counterGame[1]++;
            } else if (ownerBlendNumbers[i] == 258 && adversaryBlendNumbers[i] == 369) {
                counterGame[1]++;
            } else {
                continue;
            }
        }

        if (counterGame[0] == counterGame[1]) {
            targetMove.status = StatusMove.Tied;
            unclaimedAmounts[msg.sender] = msg.value;
            unclaimedAmounts[moveOf[_moveId]] = targetMove.prize;
        } else if (counterGame[0] > counterGame[1]) {
            targetMove.status = StatusMove.Played;
            targetMove.winner = moveOf[_moveId];
            unclaimedAmounts[moveOf[_moveId]] = (targetMove.prize + msg.value);
        } else {
            targetMove.status = StatusMove.Played;
            targetMove.winner = msg.sender;
            unclaimedAmounts[msg.sender] = (targetMove.prize + msg.value);
        }

    }
}
