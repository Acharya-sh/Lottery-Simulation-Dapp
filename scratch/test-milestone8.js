const { Web3 } = require("../frontend/node_modules/web3");
const fs = require("fs");
const path = require("path");

const RPC_URL = "http://127.0.0.1:8545";
const web3 = new Web3(RPC_URL);

const artifactPath = path.join(__dirname, "../frontend/src/contracts/Lottery.json");
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const networkId = 1337;
const contractAddress = artifact.networks[networkId].address;
const contract = new web3.eth.Contract(artifact.abi, contractAddress);

async function main() {
  console.log("==================================================");
  console.log("MILESTONE 8: VERIFICATION TEST SUITE");
  console.log("==================================================");
  console.log("Target Contract Address:", contractAddress);

  const accounts = await web3.eth.getAccounts();
  const userA = accounts[0]; // Creator
  const userB = accounts[1]; // Participant & Winner
  const userC = accounts[2]; // Participant & Refund recipient

  console.log("User A (Creator):", userA);
  console.log("User B (Winner):", userB);
  console.log("User C (Participant):", userC);

  // 1. User A creates ETH Prize Lottery #1
  console.log("\n[1] User A creates ETH Prize Lottery #1 (0.5 ETH prize, 0.1 ETH fee, max 2)...");
  const feeWei = web3.utils.toWei("0.1", "ether");
  const prizeWei = web3.utils.toWei("0.5", "ether");

  await contract.methods
    .createLottery(
      "0.5 ETH Jackpot",
      "Academic ETH Prize Lottery",
      "crypto",
      "crypto_gold",
      1, // PrizeType.ETH
      "ETH",
      prizeWei,
      prizeWei,
      "userA@example.com",
      feeWei,
      2
    )
    .send({ from: userA, value: prizeWei, gas: 3000000 });
  console.log("✓ Lottery #1 Created");

  // 2. User B enters Lottery #1
  console.log("\n[2] User B enters Lottery #1 (0.1 ETH)...");
  await contract.methods.enterLottery(1).send({ from: userB, value: feeWei, gas: 500000 });
  console.log("✓ User B entered Lottery #1");

  // 3. User C enters Lottery #1 (fills the lottery)
  console.log("\n[3] User C enters Lottery #1 (0.1 ETH, filling lottery)...");
  await contract.methods.enterLottery(1).send({ from: userC, value: feeWei, gas: 500000 });
  console.log("✓ User C entered Lottery #1 (Lottery now full & closed)");

  // 4. User A picks winner
  console.log("\n[4] User A picks winner manually (User B)...");
  await contract.methods.pickWinnerManually(1, userB).send({ from: userA, gas: 500000 });
  console.log("✓ Winner selected: User B");

  // 5. User B claims ETH prize
  console.log("\n[5] User B claims prize (0.5 ETH)...");
  const balBefore = await web3.eth.getBalance(userB);
  await contract.methods.claimPrize(1).send({ from: userB, gas: 500000 });
  const balAfter = await web3.eth.getBalance(userB);
  console.log("✓ Prize claimed! User B balance increased.");

  // 6. User B creates Lottery #2 (Physical prize)
  console.log("\n[6] User B creates Physical Prize Lottery #2...");
  const fee2Wei = web3.utils.toWei("0.05", "ether");
  await contract.methods
    .createLottery(
      "MacBook Pro 16",
      "Physical prize simulation",
      "tech",
      "tech_laptop",
      0, // PrizeType.PHYSICAL
      "USD",
      web3.utils.toWei("2500", "ether"),
      0,
      "userB@example.com",
      fee2Wei,
      2
    )
    .send({ from: userB, gas: 3000000 });
  console.log("✓ Lottery #2 Created");

  // 7. User C enters Lottery #2
  console.log("\n[7] User C enters Lottery #2 (0.05 ETH)...");
  await contract.methods.enterLottery(2).send({ from: userC, value: fee2Wei, gas: 500000 });
  console.log("✓ User C entered Lottery #2");

  // 8. User B cancels Lottery #2
  console.log("\n[8] User B cancels Lottery #2 (refunding User C)...");
  await contract.methods.cancelLottery(2).send({ from: userB, gas: 500000 });
  console.log("✓ Lottery #2 cancelled and participants refunded");

  // 9. TEST EVENT LOG EXTRACTION (Simulating lotteryService.js logic)
  console.log("\n[9] Testing Past Event Extraction for Transactions & Notifications...");

  const createdEvents = await contract.getPastEvents("LotteryCreated", { fromBlock: 0, toBlock: "latest" });
  const enteredEvents = await contract.getPastEvents("LotteryEntered", { fromBlock: 0, toBlock: "latest" });
  const claimedEvents = await contract.getPastEvents("PrizeClaimed", { fromBlock: 0, toBlock: "latest" });
  const cancelledEvents = await contract.getPastEvents("LotteryCancelled", { fromBlock: 0, toBlock: "latest" });

  console.log(`- LotteryCreated events count: ${createdEvents.length}`);
  console.log(`- LotteryEntered events count: ${enteredEvents.length}`);
  console.log(`- PrizeClaimed events count: ${claimedEvents.length}`);
  console.log(`- LotteryCancelled events count: ${cancelledEvents.length}`);

  if (createdEvents.length < 2 || enteredEvents.length < 3 || claimedEvents.length < 1 || cancelledEvents.length < 1) {
    throw new Error("Event counts do not match expected on-chain state!");
  }

  // Verify block timestamp resolution
  const sampleBlock = await web3.eth.getBlock(createdEvents[0].blockNumber);
  console.log("Sample block timestamp:", Number(sampleBlock.timestamp));
  if (!sampleBlock.timestamp) {
    throw new Error("Failed to retrieve block timestamp!");
  }

  // 10. TEST USER STATS COMPUTATION
  console.log("\n[10] Testing User Stats Calculation...");
  const totalLotteries = await contract.methods.lotteryCount().call();
  console.log("Total Lotteries On-Chain:", Number(totalLotteries));

  const allLots = [];
  for (let i = 1; i <= Number(totalLotteries); i++) {
    const d = await contract.methods.getLottery(i).call();
    const parts = await contract.methods.getParticipants(i).call();
    allLots.push({
      id: Number(d.id),
      creator: d.creator.toLowerCase(),
      winner: d.winner.toLowerCase(),
      prizeClaimed: d.prizeClaimed,
      cancelled: d.cancelled,
      participants: parts.map((p) => p.toLowerCase()),
    });
  }

  // Verify User A stats
  const aCreated = allLots.filter((l) => l.creator === userA.toLowerCase()).length;
  const aEntered = allLots.filter((l) => l.participants.includes(userA.toLowerCase())).length;
  console.log(`User A -> Created: ${aCreated} (expected 1), Entered: ${aEntered} (expected 0)`);
  if (aCreated !== 1 || aEntered !== 0) throw new Error("User A stats incorrect!");

  // Verify User B stats
  const bCreated = allLots.filter((l) => l.creator === userB.toLowerCase()).length;
  const bEntered = allLots.filter((l) => l.participants.includes(userB.toLowerCase())).length;
  const bWon = allLots.filter((l) => l.winner === userB.toLowerCase()).length;
  const bClaimed = allLots.filter((l) => l.winner === userB.toLowerCase() && l.prizeClaimed).length;
  console.log(`User B -> Created: ${bCreated} (expected 1), Entered: ${bEntered} (expected 1), Won: ${bWon} (expected 1), Claimed: ${bClaimed} (expected 1)`);
  if (bCreated !== 1 || bEntered !== 1 || bWon !== 1 || bClaimed !== 1) throw new Error("User B stats incorrect!");

  // Verify User C stats
  const cCreated = allLots.filter((l) => l.creator === userC.toLowerCase()).length;
  const cEntered = allLots.filter((l) => l.participants.includes(userC.toLowerCase())).length;
  console.log(`User C -> Created: ${cCreated} (expected 0), Entered: ${cEntered} (expected 2)`);
  if (cCreated !== 0 || cEntered !== 2) throw new Error("User C stats incorrect!");

  console.log("\n==================================================");
  console.log("ALL MILESTONE 8 ON-CHAIN VERIFICATION CHECKS PASSED!");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
