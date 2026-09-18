// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Lottery {

    // ==============================
    // PRIZE TYPES
    // ==============================

    enum PrizeType {
        PHYSICAL,
        ETH,
        OTHER_CRYPTO
    }


    // ==============================
    // LOTTERY STRUCTURE
    // ==============================

    struct LotteryData {

        uint256 id;

        address payable creator;

        string prizeName;
        string prizeDescription;

        PrizeType prizeType;

        // Example: ETH, BTC, USDT
        string prizeCurrency;

        // Display value of the prize.
        // For ETH prize this is the actual ETH amount in wei.
        // For physical/other prizes this is the ETH-equivalent
        // value used for the academic simulation.
        uint256 prizeValue;

        // Actual ETH locked inside the contract.
        // Used only when prizeType == ETH.
        uint256 ethPrizeAmount;

        string organizerContact;

        uint256 entryFee;
        uint256 maxParticipants;

        address[] participants;

        bool isOpen;
        bool winnerSelected;
        address winner;

        bool prizeClaimed;
        bool cancelled;

        // Entry fees collected from participants.
        uint256 entryFeesCollected;
    }


    // ==============================
    // STATE VARIABLES
    // ==============================

    uint256 public lotteryCount;

    mapping(uint256 => LotteryData) public lotteries;


    // ==============================
    // EVENTS
    // ==============================

    event LotteryCreated(
        uint256 lotteryId,
        address creator,
        string prizeName,
        uint256 entryFee
    );

    event LotteryEntered(
        uint256 lotteryId,
        address participant
    );

    event LotteryClosed(
        uint256 lotteryId
    );

    event WinnerSelected(
        uint256 lotteryId,
        address winner
    );

    event PrizeClaimed(
        uint256 lotteryId,
        address winner
    );

    event LotteryCancelled(
        uint256 lotteryId
    );


    // ==============================
    // CREATE LOTTERY
    // ==============================

    function createLottery(
        string memory _prizeName,
        string memory _prizeDescription,
        PrizeType _prizeType,
        string memory _prizeCurrency,
        uint256 _prizeValue,
        uint256 _ethPrizeAmount,
        string memory _organizerContact,
        uint256 _entryFee,
        uint256 _maxParticipants
    )
        public
        payable
    {

        require(
            _maxParticipants > 0,
            "Max participants must be greater than 0"
        );

        require(
            _entryFee > 0,
            "Entry fee must be greater than 0"
        );


        // ==============================
        // ETH PRIZE CHECK
        // ==============================

        if (_prizeType == PrizeType.ETH) {

            require(
                _ethPrizeAmount > 0,
                "ETH prize must be greater than 0"
            );

            require(
                msg.value == _ethPrizeAmount,
                "Send the ETH prize amount"
            );

        } else {

            // Physical and other crypto prizes
            // do not require ETH to be deposited.
            require(
                msg.value == 0,
                "Do not send ETH for this prize type"
            );

            require(
                _prizeValue > 0,
                "Prize value must be greater than 0"
            );
        }


        // ==============================
        // CREATE LOTTERY
        // ==============================

        lotteryCount++;

        LotteryData storage newLottery =
            lotteries[lotteryCount];

        newLottery.id = lotteryCount;

        newLottery.creator = payable(msg.sender);

        newLottery.prizeName = _prizeName;
        newLottery.prizeDescription = _prizeDescription;

        newLottery.prizeType = _prizeType;
        newLottery.prizeCurrency = _prizeCurrency;

        newLottery.prizeValue = _prizeValue;
        newLottery.ethPrizeAmount = _ethPrizeAmount;

        newLottery.organizerContact =
            _organizerContact;

        newLottery.entryFee = _entryFee;
        newLottery.maxParticipants =
            _maxParticipants;

        newLottery.isOpen = true;
        newLottery.winnerSelected = false;

        newLottery.winner = address(0);

        newLottery.prizeClaimed = false;
        newLottery.cancelled = false;

        newLottery.entryFeesCollected = 0;


        emit LotteryCreated(
            lotteryCount,
            msg.sender,
            _prizeName,
            _entryFee
        );
    }


    // ==============================
    // ENTER LOTTERY
    // ==============================

    function enterLottery(
        uint256 _lotteryId
    )
        public
        payable
    {

        LotteryData storage lottery =
            lotteries[_lotteryId];


        require(
            lottery.id != 0,
            "Lottery does not exist"
        );

        require(
            lottery.isOpen,
            "Lottery is closed"
        );

        require(
            msg.sender != lottery.creator,
            "Creator cannot enter own lottery"
        );

        require(
            msg.value == lottery.entryFee,
            "Incorrect entry fee"
        );

        require(
            lottery.participants.length <
            lottery.maxParticipants,
            "Lottery is full"
        );


        // ==============================
        // PREVENT DUPLICATE ENTRY
        // ==============================

        for (
            uint256 i = 0;
            i < lottery.participants.length;
            i++
        ) {

            require(
                lottery.participants[i] != msg.sender,
                "Already entered"
            );
        }


        // ==============================
        // ADD PARTICIPANT
        // ==============================

        lottery.participants.push(msg.sender);

        lottery.entryFeesCollected += msg.value;


        emit LotteryEntered(
            _lotteryId,
            msg.sender
        );


        // ==============================
        // AUTOMATICALLY CLOSE WHEN FULL
        // ==============================

        if (
            lottery.participants.length ==
            lottery.maxParticipants
        ) {

            lottery.isOpen = false;


            // Release collected entry fees
            // to the creator.

            uint256 amount =
                lottery.entryFeesCollected;

            lottery.entryFeesCollected = 0;


            (bool success, ) =
                lottery.creator.call{
                    value: amount
                }("");

            require(
                success,
                "Failed to send entry fees"
            );


            emit LotteryClosed(
                _lotteryId
            );
        }
    }


    // ==============================
    // PICK WINNER MANUALLY
    // ==============================

    function pickWinnerManually(
        uint256 _lotteryId,
        address _winner
    )
        public
    {

        LotteryData storage lottery =
            lotteries[_lotteryId];


        require(
            lottery.id != 0,
            "Lottery does not exist"
        );

        require(
            msg.sender == lottery.creator,
            "Only creator can pick winner"
        );

        require(
            !lottery.isOpen,
            "Lottery is still open"
        );

        require(
            !lottery.cancelled,
            "Lottery was cancelled"
        );

        require(
            lottery.participants.length > 0,
            "No participants"
        );

        require(
            !lottery.winnerSelected,
            "Winner already selected"
        );

        require(
            _winner != address(0),
            "Invalid winner"
        );


        // Check that selected address
        // is actually a participant.

        bool isParticipant = false;

        for (
            uint256 i = 0;
            i < lottery.participants.length;
            i++
        ) {

            if (
                lottery.participants[i] ==
                _winner
            ) {

                isParticipant = true;
                break;
            }
        }


        require(
            isParticipant,
            "Address is not a participant"
        );


        lottery.winner = _winner;
        lottery.winnerSelected = true;


        emit WinnerSelected(
            _lotteryId,
            _winner
        );
    }


    // ==============================
    // PICK WINNER RANDOMLY
    // ==============================

    function pickWinnerRandom(
        uint256 _lotteryId
    )
        public
    {

        LotteryData storage lottery =
            lotteries[_lotteryId];


        require(
            lottery.id != 0,
            "Lottery does not exist"
        );

        require(
            msg.sender == lottery.creator,
            "Only creator can pick winner"
        );

        require(
            !lottery.isOpen,
            "Lottery is still open"
        );

        require(
            !lottery.cancelled,
            "Lottery was cancelled"
        );

        require(
            lottery.participants.length > 0,
            "No participants"
        );

        require(
            !lottery.winnerSelected,
            "Winner already selected"
        );


        // Pseudo-random selection.
        // Suitable for academic demonstration only.
        // Not secure enough for real-money lotteries.

        uint256 randomIndex =
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.prevrandao,
                        lottery.participants.length
                    )
                )
            )
            %
            lottery.participants.length;


        address selectedWinner =
            lottery.participants[randomIndex];


        lottery.winner =
            selectedWinner;

        lottery.winnerSelected =
            true;


        emit WinnerSelected(
            _lotteryId,
            selectedWinner
        );
    }


    // ==============================
    // CLAIM PRIZE
    // ==============================

    function claimPrize(
        uint256 _lotteryId
    )
        public
    {

        LotteryData storage lottery =
            lotteries[_lotteryId];


        require(
            lottery.id != 0,
            "Lottery does not exist"
        );

        require(
            lottery.winnerSelected,
            "Winner not selected"
        );

        require(
            lottery.winner == msg.sender,
            "Only winner can claim"
        );

        require(
            !lottery.prizeClaimed,
            "Prize already claimed"
        );

        require(
            !lottery.cancelled,
            "Lottery was cancelled"
        );


        // Mark as claimed first.

        lottery.prizeClaimed = true;


        // ==============================
        // ETH PRIZE
        // ==============================

        if (
            lottery.prizeType ==
            PrizeType.ETH
        ) {

            uint256 amount =
                lottery.ethPrizeAmount;


            lottery.ethPrizeAmount = 0;


            (bool success, ) =
                payable(msg.sender).call{
                    value: amount
                }("");


            require(
                success,
                "ETH prize transfer failed"
            );
        }


        // ==============================
        // PHYSICAL / OTHER CRYPTO
        // ==============================

        // For physical prizes, the blockchain
        // records the claim.
        //
        // The actual physical item is handed
        // over outside the blockchain.
        //
        // Other cryptocurrencies are currently
        // display-only in this academic project.


        emit PrizeClaimed(
            _lotteryId,
            msg.sender
        );
    }


    // ==============================
    // CANCEL LOTTERY
    // ==============================

    function cancelLottery(
        uint256 _lotteryId
    )
        public
    {

        LotteryData storage lottery =
            lotteries[_lotteryId];


        require(
            lottery.id != 0,
            "Lottery does not exist"
        );

        require(
            msg.sender == lottery.creator,
            "Only creator can cancel"
        );

        require(
            lottery.isOpen,
            "Lottery is already closed"
        );

        require(
            !lottery.cancelled,
            "Lottery already cancelled"
        );


        lottery.isOpen = false;
        lottery.cancelled = true;


        // ==============================
        // REFUND PARTICIPANTS
        // ==============================

        uint256 refundAmount =
            lottery.entryFee;


        for (
            uint256 i = 0;
            i < lottery.participants.length;
            i++
        ) {

            (bool success, ) =
                payable(
                    lottery.participants[i]
                ).call{
                    value: refundAmount
                }("");

            require(
                success,
                "Refund failed"
            );
        }


        lottery.entryFeesCollected = 0;


        // ==============================
        // RETURN ETH PRIZE TO CREATOR
        // ==============================

        if (
            lottery.prizeType ==
            PrizeType.ETH &&
            lottery.ethPrizeAmount > 0
        ) {

            uint256 prizeAmount =
                lottery.ethPrizeAmount;

            lottery.ethPrizeAmount = 0;


            (bool success, ) =
                lottery.creator.call{
                    value: prizeAmount
                }("");

            require(
                success,
                "Prize refund failed"
            );
        }


        emit LotteryCancelled(
            _lotteryId
        );
    }


    // ==============================
    // GET PARTICIPANTS
    // ==============================

    function getParticipants(
        uint256 _lotteryId
    )
        public
        view
        returns (
            address[] memory
        )
    {

        return lotteries[_lotteryId]
            .participants;
    }


    // ==============================
    // GET LOTTERY DETAILS
    // ==============================

    function getLottery(
        uint256 _lotteryId
    )
        public
        view
        returns (
            uint256 id,
            address creator,
            string memory prizeName,
            string memory prizeDescription,
            PrizeType prizeType,
            string memory prizeCurrency,
            uint256 prizeValue,
            uint256 ethPrizeAmount,
            string memory organizerContact,
            uint256 entryFee,
            uint256 maxParticipants,
            uint256 participantCount,
            bool isOpen,
            bool winnerSelected,
            address winner,
            bool prizeClaimed,
            bool cancelled,
            uint256 entryFeesCollected
        )
    {

        LotteryData storage lottery =
            lotteries[_lotteryId];


        return (

            lottery.id,

            lottery.creator,

            lottery.prizeName,

            lottery.prizeDescription,

            lottery.prizeType,

            lottery.prizeCurrency,

            lottery.prizeValue,

            lottery.ethPrizeAmount,

            lottery.organizerContact,

            lottery.entryFee,

            lottery.maxParticipants,

            lottery.participants.length,

            lottery.isOpen,

            lottery.winnerSelected,

            lottery.winner,

            lottery.prizeClaimed,

            lottery.cancelled,

            lottery.entryFeesCollected
        );
    }


    // ==============================
    // GET MY WINNINGS
    // ==============================

    function getMyWinnings()
        public
        view
        returns (
            uint256[] memory
        )
    {

        uint256 winningCount = 0;


        // Count winnings.

        for (
            uint256 i = 1;
            i <= lotteryCount;
            i++
        ) {

            if (
                lotteries[i].winner ==
                msg.sender
            ) {

                winningCount++;
            }
        }


        uint256[] memory winnings =
            new uint256[](winningCount);


        uint256 index = 0;


        // Store winning lottery IDs.

        for (
            uint256 i = 1;
            i <= lotteryCount;
            i++
        ) {

            if (
                lotteries[i].winner ==
                msg.sender
            ) {

                winnings[index] = i;

                index++;
            }
        }


        return winnings;
    }
}