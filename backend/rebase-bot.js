// rebase-bot.js
require('dotenv').config();
const { ethers } = require('ethers');

// --- load env ---
const { PRIVATE_KEY, RPC_URL, ORACLE_ADDRESS, STABLE_ADDRESS } = process.env;

// --- ABIs (minimal) ---
const oracleAbi = [ "function update() external" ];
const stableAbi = [ "function rebase() external" ];

// --- main ---
(async () => {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  console.log(PRIVATE_KEY);
  const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);

  const oracle   = new ethers.Contract(ORACLE_ADDRESS,  oracleAbi,  wallet);
  const stable   = new ethers.Contract(STABLE_ADDRESS,  stableAbi,  wallet);

  try {
    console.log("🔄  Calling oracle.update() …");
    const tx1 = await oracle.update();
    await tx1.wait();
    console.log("✅  Oracle updated in tx", tx1.hash);

    console.log("📏  Calling stable.rebase() …");
    const tx2 = await stable.rebase();
    await tx2.wait();
    console.log("✅  Rebase completed in tx", tx2.hash);
  } catch (e) {
    console.error("❌  Error:", e);
  }
})();
