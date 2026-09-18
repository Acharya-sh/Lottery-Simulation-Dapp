import Web3 from "web3";

export const CATEGORY_PRESET_IMAGES = {
  Technology:
    "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=900&q=80",
  Gaming:
    "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80",
  Electronics:
    "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80",
  Fashion:
    "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=80",
  Crypto:
    "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?auto=format&fit=crop&w=900&q=80",
  Automotive:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80",
  Cars:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80",
  Other:
    "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=900&q=80",
};

export const CRYPTO_PRESET_IMAGES = {
  ETH: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?auto=format&fit=crop&w=900&q=80",
  BTC: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=900&q=80",
  SOL: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&w=900&q=80",
};

/**
 * Resolves an on-chain imageURI or returns a safe category preset image
 */
export const resolveLotteryImage = (imageURI, category, prizeType) => {
  if (imageURI) {
    if (imageURI.startsWith("http://") || imageURI.startsWith("https://")) {
      return imageURI;
    }
    if (imageURI.startsWith("ipfs://")) {
      const cid = imageURI.replace("ipfs://", "");
      return `https://gateway.pinata.cloud/ipfs/${cid}`;
    }
    if (imageURI === "preset:eth") return CRYPTO_PRESET_IMAGES.ETH;
    if (imageURI === "preset:btc") return CRYPTO_PRESET_IMAGES.BTC;
    if (imageURI === "preset:sol") return CRYPTO_PRESET_IMAGES.SOL;
    if (imageURI.startsWith("preset:")) {
      const key = imageURI.replace("preset:", "");
      if (CRYPTO_PRESET_IMAGES[key.toUpperCase()]) {
        return CRYPTO_PRESET_IMAGES[key.toUpperCase()];
      }
    }
  }

  // Fallback by prizeType
  if (Number(prizeType) === 1) {
    return CRYPTO_PRESET_IMAGES.ETH;
  }

  // Fallback by category
  if (category && CATEGORY_PRESET_IMAGES[category]) {
    return CATEGORY_PRESET_IMAGES[category];
  }

  return CATEGORY_PRESET_IMAGES.Technology;
};

/**
 * Fetches all lotteries from the deployed smart contract
 */
export const fetchAllLotteries = async (contract, web3) => {
  if (!contract) return [];

  try {
    const rawCount = await contract.methods.lotteryCount().call();
    const count = Number(rawCount);

    if (count === 0) return [];

    const lotteryPromises = [];

    for (let id = 1; id <= count; id++) {
      lotteryPromises.push(
        (async () => {
          try {
            const raw = await contract.methods.getLottery(id).call();
            const participantsList = await contract.methods
              .getParticipants(id)
              .call();

            const prizeTypeNum = Number(raw.prizeType ?? raw[6]);
            let prizeTypeName = "Physical Prize";
            if (prizeTypeNum === 1) prizeTypeName = "ETH Prize";
            else if (prizeTypeNum === 2) prizeTypeName = "Other Crypto";

            const rawEntryFee = (raw.entryFee ?? raw[11]).toString();
            const entryFeeEth = web3
              ? Web3.utils.fromWei(rawEntryFee, "ether")
              : (Number(rawEntryFee) / 1e18).toString();

            const participantsCount = Number(raw.participantCount ?? raw[13]);
            const maxParticipants = Number(raw.maxParticipants ?? raw[12]);
            const isOpen = Boolean(raw.isOpen ?? raw[14]);
            const winnerSelected = Boolean(raw.winnerSelected ?? raw[15]);
            const winner = (raw.winner ?? raw[16]).toString();
            const prizeClaimed = Boolean(raw.prizeClaimed ?? raw[17]);
            const cancelled = Boolean(raw.cancelled ?? raw[18]);

            let statusLabel = "Active";
            if (cancelled) statusLabel = "Cancelled";
            else if (prizeClaimed) statusLabel = "Prize Claimed";
            else if (winnerSelected) statusLabel = "Winner Drawn";
            else if (!isOpen || participantsCount >= maxParticipants)
              statusLabel = "Closed (Full)";

            const cat = (raw.category ?? raw[4] ?? "Technology").toString();
            const imgURI = (raw.imageURI ?? raw[5] ?? "").toString();

            return {
              id: Number(raw.id ?? raw[0]),
              creator: (raw.creator ?? raw[1]).toString(),
              prizeName: (raw.prizeName ?? raw[2]).toString(),
              description: (raw.prizeDescription ?? raw[3]).toString(),
              category: cat,
              imageURI: imgURI,
              image: resolveLotteryImage(imgURI, cat, prizeTypeNum),
              prizeType: prizeTypeName,
              prizeTypeNum,
              prizeCurrency: (raw.prizeCurrency ?? raw[7]).toString(),
              prizeValue: (raw.prizeValue ?? raw[8]).toString(),
              ethPrizeAmount: (raw.ethPrizeAmount ?? raw[9]).toString(),
              organizerContact: (raw.organizerContact ?? raw[10]).toString(),
              entryFee: `${entryFeeEth} ETH`,
              entryFeeEth: parseFloat(entryFeeEth) || 0,
              entryFeeWei: rawEntryFee,
              participants: participantsCount,
              maxParticipants,
              participantAddresses: Array.isArray(participantsList)
                ? participantsList.map((addr) => addr.toLowerCase())
                : [],
              rawParticipants: Array.isArray(participantsList)
                ? [...participantsList]
                : [],
              isOpen,
              winnerSelected,
              winner,
              prizeClaimed,
              cancelled,
              timeLeft: statusLabel,
            };
          } catch (itemErr) {
            console.error(`Failed to fetch lottery #${id}:`, itemErr);
            return null;
          }
        })()
      );
    }

    const results = await Promise.all(lotteryPromises);
    return results.filter(Boolean);
  } catch (err) {
    console.error("Error fetching lotteries from contract:", err);
    throw err;
  }
};

/**
 * Fetches all lotteries won by the specified account directly from the smart contract
 */
export const fetchUserWinnings = async (contract, web3, account) => {
  if (!contract || !account) return [];

  try {
    const rawWinnings = await contract.methods.getMyWinnings().call({ from: account });
    if (!Array.isArray(rawWinnings) || rawWinnings.length === 0) return [];

    const winningLotteries = [];

    for (const rawId of rawWinnings) {
      const id = Number(rawId);
      if (id === 0) continue;

      try {
        const raw = await contract.methods.getLottery(id).call();

        const prizeTypeNum = Number(raw.prizeType ?? raw[6]);
        let prizeTypeName = "Physical Prize";
        if (prizeTypeNum === 1) prizeTypeName = "ETH Prize";
        else if (prizeTypeNum === 2) prizeTypeName = "Other Crypto";

        let prizeValueDisplay = "";
        if (prizeTypeNum === 1) {
          const ethPrizeWei = (raw.ethPrizeAmount ?? raw[9]).toString();
          const ethVal = web3
            ? Web3.utils.fromWei(ethPrizeWei, "ether")
            : (Number(ethPrizeWei) / 1e18).toString();
          prizeValueDisplay = `${ethVal} ETH`;
        } else {
          const val = (raw.prizeValue ?? raw[8]).toString();
          const curr = (raw.prizeCurrency ?? raw[7] ?? "USD").toString();
          prizeValueDisplay = `${val} ${curr}`.trim();
        }

        const prizeClaimed = Boolean(raw.prizeClaimed ?? raw[17]);
        const winner = (raw.winner ?? raw[16]).toString();
        const winnerSelected = Boolean(raw.winnerSelected ?? raw[15]);
        const cancelled = Boolean(raw.cancelled ?? raw[18]);
        const cat = (raw.category ?? raw[4] ?? "Technology").toString();
        const imgURI = (raw.imageURI ?? raw[5] ?? "").toString();
        const organizerContact = (raw.organizerContact ?? raw[10] ?? "").toString();

        winningLotteries.push({
          id,
          lotteryId: `#${String(id).padStart(3, "0")}`,
          name: (raw.prizeName ?? raw[2]).toString(),
          description: (raw.prizeDescription ?? raw[3]).toString(),
          category: cat,
          imageURI: imgURI,
          image: resolveLotteryImage(imgURI, cat, prizeTypeNum),
          type: prizeTypeName,
          prizeTypeNum,
          value: prizeValueDisplay,
          organizerContact,
          status: prizeClaimed ? "CLAIMED" : "UNCLAIMED",
          prizeClaimed,
          winner,
          winnerSelected,
          cancelled,
          creator: (raw.creator ?? raw[1]).toString(),
        });
      } catch (itemErr) {
        console.error(`Error fetching winning lottery #${id}:`, itemErr);
      }
    }

    return winningLotteries;
  } catch (err) {
    console.error("Error fetching user winnings:", err);
    throw err;
  }
};

/**
/**
 * Fetches on-chain lottery activity history for the specified account
 * Returns only lotteries where the account is creator or participant.
 * Uses on-chain events and block timestamps as the source of truth (no localStorage).
 */
export const fetchUserHistory = async (contract, web3, account) => {
  if (!contract || !account) return [];

  const allLotteries = await fetchAllLotteries(contract, web3);
  const accLower = account.toLowerCase();

  // Attempt to query on-chain events for transaction hashes and block numbers
  const eventsMap = new Map();
  try {
    const [createdEvents, enteredEvents] = await Promise.all([
      contract.getPastEvents("LotteryCreated", { fromBlock: 0 }).catch(() => []),
      contract.getPastEvents("LotteryEntered", { fromBlock: 0 }).catch(() => []),
    ]);

    if (Array.isArray(createdEvents)) {
      for (const ev of createdEvents) {
        const lid = Number(ev.returnValues?.lotteryId ?? ev.returnValues?.[0]);
        if (lid) {
          const existing = eventsMap.get(lid) || {};
          existing.createTx = ev.transactionHash;
          existing.createBlock = ev.blockNumber;
          eventsMap.set(lid, existing);
        }
      }
    }

    if (Array.isArray(enteredEvents)) {
      for (const ev of enteredEvents) {
        const lid = Number(ev.returnValues?.lotteryId ?? ev.returnValues?.[0]);
        const participant = String(
          ev.returnValues?.participant ?? ev.returnValues?.[1] ?? ""
        ).toLowerCase();
        if (lid && participant === accLower) {
          const existing = eventsMap.get(lid) || {};
          existing.enterTx = ev.transactionHash;
          existing.enterBlock = ev.blockNumber;
          eventsMap.set(lid, existing);
        }
      }
    }
  } catch (eventErr) {
    console.warn("Could not query past events from RPC provider:", eventErr);
  }

  const blockTimestampCache = new Map();
  const formatAddr = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "—";

  const userHistory = [];

  for (const item of allLotteries) {
    const isCreator = item.creator && item.creator.toLowerCase() === accLower;
    const isParticipant =
      Array.isArray(item.participantAddresses) &&
      item.participantAddresses.includes(accLower);

    if (!isCreator && !isParticipant) {
      continue;
    }

    const type = isCreator ? "created" : "participated";

    let status = "ACTIVE";
    if (item.cancelled) {
      status = "CANCELLED";
    } else if (
      item.winnerSelected ||
      !item.isOpen ||
      item.participants >= item.maxParticipants
    ) {
      status = "CLOSED";
    }

    let result = "—";
    let prize = "—";
    let claimStatus = "—";

    if (!isCreator) {
      if (item.cancelled) {
        result = "CANCELLED";
      } else if (!item.winnerSelected) {
        result = "PENDING";
      } else {
        // Status is CLOSED with winner selected
        const isWinner =
          item.winner && item.winner.toLowerCase() === accLower;
        if (isWinner) {
          result = "WON";
          claimStatus = item.prizeClaimed ? "CLAIMED" : "UNCLAIMED";
          if (item.prizeTypeNum === 1) {
            const ethVal =
              web3 && item.ethPrizeAmount
                ? Web3.utils.fromWei(item.ethPrizeAmount, "ether")
                : "0";
            prize = `${ethVal} ETH`;
          } else {
            prize = item.prizeValue
              ? `${item.prizeValue} ${item.prizeCurrency || "USD"}`
              : item.prizeName;
          }
        } else {
          result = "LOST";
        }
      }
    }

    const prizeValueDisplay =
      item.prizeTypeNum === 1
        ? `${web3 && item.ethPrizeAmount ? Web3.utils.fromWei(item.ethPrizeAmount, "ether") : "0"} ETH`
        : (item.prizeValue ? `${item.prizeValue} ${item.prizeCurrency || "USD"}` : "—");

    // Extract transaction hash and block number from on-chain event logs
    const evData = eventsMap.get(item.id);
    const rawTx = isCreator ? evData?.createTx : evData?.enterTx;
    const rawBlock = isCreator ? evData?.createBlock : evData?.enterBlock;

    let formattedDate = "—";
    if (rawBlock != null && web3?.eth?.getBlock) {
      const blockKey = rawBlock.toString();
      if (blockTimestampCache.has(blockKey)) {
        formattedDate = blockTimestampCache.get(blockKey);
      } else {
        try {
          const block = await web3.eth.getBlock(rawBlock);
          if (block?.timestamp) {
            const d = new Date(Number(block.timestamp) * 1000);
            formattedDate = d.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            blockTimestampCache.set(blockKey, formattedDate);
          }
        } catch {
          // Block timestamp query failed; keep "—"
        }
      }
    }

    userHistory.push({
      ...item,
      lottery: item.prizeName || `Lottery #${item.id}`,
      type,
      status,
      result,
      prize,
      claimStatus,
      prizeValueDisplay,
      date: formattedDate,
      txHash: rawTx ? formatAddr(rawTx) : "—",
      rawTxHash: rawTx || null,
    });
  }

  userHistory.sort((a, b) => b.id - a.id);
  return userHistory;
};

/**
 * Fetches real on-chain transaction history for the specified account.
 * Reads blockchain event logs (LotteryCreated, LotteryEntered, PrizeClaimed, LotteryCancelled).
 * Reconstructs authentic transaction records with real hashes, block numbers, amounts, and dates.
 */
export const fetchUserTransactions = async (contract, web3, account) => {
  if (!contract || !account || !web3) return [];
  const accLower = account.toLowerCase();
  const contractAddress = contract.options?.address || contract._address || "";

  try {
    const allLotteries = await fetchAllLotteries(contract, web3);
    const lotteryMap = new Map();
    for (const l of allLotteries) {
      lotteryMap.set(l.id, l);
    }

    const [createdEvents, enteredEvents, claimedEvents, cancelledEvents] =
      await Promise.all([
        contract
          .getPastEvents("LotteryCreated", { fromBlock: 0 })
          .catch(() => []),
        contract
          .getPastEvents("LotteryEntered", { fromBlock: 0 })
          .catch(() => []),
        contract
          .getPastEvents("PrizeClaimed", { fromBlock: 0 })
          .catch(() => []),
        contract
          .getPastEvents("LotteryCancelled", { fromBlock: 0 })
          .catch(() => []),
      ]);

    const txList = [];
    const blockCache = new Map();

    // 1. Lottery Creations by this user
    if (Array.isArray(createdEvents)) {
      for (const ev of createdEvents) {
        const creator = String(
          ev.returnValues?.creator ?? ev.returnValues?.[1] ?? ""
        ).toLowerCase();
        if (creator === accLower) {
          const lid = Number(
            ev.returnValues?.lotteryId ?? ev.returnValues?.[0]
          );
          const l = lotteryMap.get(lid);
          const ethPrizeVal =
            l && l.prizeTypeNum === 1 && l.ethPrizeAmount
              ? Number(Web3.utils.fromWei(l.ethPrizeAmount, "ether"))
              : 0;

          txList.push({
            id: `create-${lid}-${ev.transactionHash}`,
            hash: ev.transactionHash,
            block: ev.blockNumber,
            type: "Lottery Creation",
            icon: "↑",
            description: l
              ? l.prizeName
              : ev.returnValues?.prizeName || `Lottery #${lid}`,
            amountNum: ethPrizeVal,
            amount:
              ethPrizeVal > 0 ? `-${ethPrizeVal.toFixed(4)} ETH` : "—",
            direction: "sent",
            status: "SUCCESS",
            from: creator,
            to: contractAddress,
          });
        }
      }
    }

    // 2. Lottery Entries by this user
    if (Array.isArray(enteredEvents)) {
      for (const ev of enteredEvents) {
        const participant = String(
          ev.returnValues?.participant ?? ev.returnValues?.[1] ?? ""
        ).toLowerCase();
        if (participant === accLower) {
          const lid = Number(
            ev.returnValues?.lotteryId ?? ev.returnValues?.[0]
          );
          const l = lotteryMap.get(lid);
          const feeNum = l?.entryFeeEth || 0;

          txList.push({
            id: `enter-${lid}-${ev.transactionHash}`,
            hash: ev.transactionHash,
            block: ev.blockNumber,
            type: "Lottery Entry",
            icon: "↑",
            description: l ? l.prizeName : `Lottery #${lid}`,
            amountNum: feeNum,
            amount: feeNum > 0 ? `-${feeNum} ETH` : "—",
            direction: "sent",
            status: "SUCCESS",
            from: participant,
            to: contractAddress,
          });
        }
      }
    }

    // 3. Prize Claims by this user
    if (Array.isArray(claimedEvents)) {
      for (const ev of claimedEvents) {
        const winner = String(
          ev.returnValues?.winner ?? ev.returnValues?.[1] ?? ""
        ).toLowerCase();
        if (winner === accLower) {
          const lid = Number(
            ev.returnValues?.lotteryId ?? ev.returnValues?.[0]
          );
          const l = lotteryMap.get(lid);
          const ethVal =
            l && l.prizeTypeNum === 1 && l.ethPrizeAmount
              ? Number(Web3.utils.fromWei(l.ethPrizeAmount, "ether"))
              : 0;

          txList.push({
            id: `claim-${lid}-${ev.transactionHash}`,
            hash: ev.transactionHash,
            block: ev.blockNumber,
            type: "Prize Claim",
            icon: "↓",
            description: l ? l.prizeName : `Lottery #${lid}`,
            amountNum: ethVal,
            amount:
              ethVal > 0
                ? `+${ethVal.toFixed(4)} ETH`
                : l?.prizeName
                ? `${l.prizeName} (Physical)`
                : "Claimed",
            direction: "received",
            status: "SUCCESS",
            from: contractAddress,
            to: winner,
          });
        }
      }
    }

    // 4. Lottery Cancellations / Refunds
    if (Array.isArray(cancelledEvents)) {
      for (const ev of cancelledEvents) {
        const lid = Number(
          ev.returnValues?.lotteryId ?? ev.returnValues?.[0]
        );
        const l = lotteryMap.get(lid);
        const isCreator = l?.creator?.toLowerCase() === accLower;
        const isParticipant = l?.participantAddresses?.includes(accLower);

        if (isCreator) {
          txList.push({
            id: `cancel-${lid}-${ev.transactionHash}`,
            hash: ev.transactionHash,
            block: ev.blockNumber,
            type: "Cancellation",
            icon: "✕",
            description: l
              ? `Cancelled: ${l.prizeName}`
              : `Cancelled Lottery #${lid}`,
            amountNum: 0,
            amount: "—",
            direction: "sent",
            status: "SUCCESS",
            from: l?.creator || accLower,
            to: contractAddress,
          });
        } else if (isParticipant) {
          const feeNum = l?.entryFeeEth || 0;
          txList.push({
            id: `refund-${lid}-${ev.transactionHash}`,
            hash: ev.transactionHash,
            block: ev.blockNumber,
            type: "Refund",
            icon: "↓",
            description: l
              ? `Refund: ${l.prizeName}`
              : `Refund Lottery #${lid}`,
            amountNum: feeNum,
            amount: feeNum > 0 ? `+${feeNum} ETH` : "—",
            direction: "received",
            status: "SUCCESS",
            from: contractAddress,
            to: accLower,
          });
        }
      }
    }

    // Fetch block timestamps
    for (const tx of txList) {
      if (tx.block != null && web3?.eth?.getBlock) {
        const bKey = tx.block.toString();
        if (!blockCache.has(bKey)) {
          try {
            const b = await web3.eth.getBlock(tx.block);
            if (b?.timestamp) {
              const d = new Date(Number(b.timestamp) * 1000);
              blockCache.set(bKey, {
                timestamp: Number(b.timestamp),
                date: d.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
                time: d.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                dateTime: `${d.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })} ${d.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`,
              });
            }
          } catch {
            blockCache.set(bKey, {
              timestamp: 0,
              date: "—",
              time: "—",
              dateTime: "—",
            });
          }
        }
        const bData = blockCache.get(bKey);
        tx.date = bData?.date || "—";
        tx.time = bData?.time || "—";
        tx.dateTime = bData?.dateTime || "—";
        tx.timestamp = bData?.timestamp || 0;
        tx.blockStr = tx.block.toString();
      } else {
        tx.date = "—";
        tx.time = "—";
        tx.dateTime = "—";
        tx.timestamp = 0;
        tx.blockStr = "—";
      }
    }

    // Sort newest block/timestamp first
    txList.sort((a, b) => {
      if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
      return Number(b.block ?? 0) - Number(a.block ?? 0);
    });

    return txList;
  } catch (err) {
    console.error("Error fetching user transactions:", err);
    throw err;
  }
};

/**
 * Fetches user-relevant notifications from recent on-chain events
 */
export const fetchUserNotifications = async (contract, web3, account) => {
  if (!contract || !account) return [];
  const accLower = account.toLowerCase();

  try {
    const allLotteries = await fetchAllLotteries(contract, web3);
    const notifications = [];

    for (const l of allLotteries) {
      const isCreator = l.creator && l.creator.toLowerCase() === accLower;
      const isWinner = l.winner && l.winner.toLowerCase() === accLower;
      const isParticipant =
        l.participantAddresses && l.participantAddresses.includes(accLower);

      if (isWinner) {
        notifications.push({
          id: `won-${l.id}`,
          icon: "🏆",
          title: `You Won ${l.prizeName}!`,
          message: l.prizeClaimed
            ? "You have already claimed this prize."
            : "Congratulations! Go to Claim Prizes to claim your prize.",
          time: l.prizeClaimed ? "Prize Claimed" : "Ready to Claim",
          unread: !l.prizeClaimed,
        });
      } else if (isCreator && l.winnerSelected) {
        notifications.push({
          id: `winner-drawn-${l.id}`,
          icon: "★",
          title: `Winner Drawn: ${l.prizeName}`,
          message: `Winner selected (${l.winner.slice(0, 6)}...${l.winner.slice(-4)}).`,
          time: "Concluded",
          unread: false,
        });
      } else if (
        isCreator &&
        (l.participants >= l.maxParticipants || !l.isOpen) &&
        !l.winnerSelected &&
        !l.cancelled
      ) {
        notifications.push({
          id: `full-${l.id}`,
          icon: "⚡",
          title: `${l.prizeName} is Full!`,
          message: "All participant slots are filled. Ready to draw winner.",
          time: "Ready to Draw Winner",
          unread: true,
        });
      } else if (isParticipant && l.cancelled) {
        notifications.push({
          id: `cancelled-${l.id}`,
          icon: "✕",
          title: `${l.prizeName} was Cancelled`,
          message: `Entry fee (${l.entryFeeEth} ETH) has been refunded.`,
          time: "Refunded",
          unread: false,
        });
      }
    }

    return notifications;
  } catch (err) {
    console.warn("Error fetching notifications:", err);
    return [];
  }
};
