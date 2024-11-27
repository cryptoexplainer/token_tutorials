  // Check if MetaMask is installed and Ethers.js is loaded
  if (typeof window.ethereum !== 'undefined' && typeof ethers !== 'undefined') {
    console.log("MetaMask and Ethers.js are both installed!");
  } else {
    alert("MetaMask or Ethers.js is not installed. Please make sure both are available to use this DApp.");
  }

  // Variables to hold the contract and signer
  let contract;
  let signer;
  const contractAddress = "0xc1cB1B6d72A7E839764d7BFbcf333651B0A189C7";
  const contractABI = [
    "function depositCollateralAndMint() external payable",
    "function burnAndWithdrawCollateral(uint256 amount) external"
  ];
  
  // Function to connect to MetaMask
  async function connectMetaMask() {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      contract = new ethers.Contract(contractAddress, contractABI, signer);
  
      document.getElementById("status").innerText = "Status: Connected";
      console.log("Connected to MetaMask!");
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
    }
  }
  
  // Function to buy tokens
  async function buyTokens() {
    if (!contract) {
      alert("Please connect to MetaMask first.");
      return;
    }
    try {
      const bnbAmount = document.getElementById("bnbAmountBuy").value;
      if (!bnbAmount || parseFloat(bnbAmount) <= 0) {
        alert("Please enter a valid BNB amount.");
        return;
      }

      // Specify the amount of BNB to send
      const transaction = await contract.depositCollateralAndMint({
        value: ethers.parseEther(bnbAmount)
      });
      document.getElementById("status").innerText = "Transaction sent: " + transaction.hash;
      await transaction.wait(); // Wait for the transaction to be confirmed
      document.getElementById("status").innerText = "Tokens bought successfully!";
    } catch (error) {
      console.error("Error buying tokens:", error);
      document.getElementById("status").innerText = "Error: " + error.message;
    }
  }
  
  // Function to sell tokens
  async function sellTokens() {
    if (!contract) {
      alert("Please connect to MetaMask first.");
      return;
    }
    try {
      const bnbAmount = document.getElementById("bnbAmountSell").value;
      if (!bnbAmount || parseFloat(bnbAmount) <= 0) {
        alert("Please enter a valid BNB amount.");
        return;
      }

      const amount = ethers.parseEther(bnbAmount);
      const transaction = await contract.burnAndWithdrawCollateral(amount);
      document.getElementById("status").innerText = "Transaction sent: " + transaction.hash;
      await transaction.wait(); // Wait for the transaction to be confirmed
      document.getElementById("status").innerText = "Tokens sold successfully!";
    } catch (error) {
      console.error("Error selling tokens:", error);
      document.getElementById("status").innerText = "Error: " + error.message;
    }
  }