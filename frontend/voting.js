// app.js
let provider, signer, contract;
let userAddress = "";
let isOwner = false;

const CONTRACT_ADDRESS = "0xC0E56A37220BfB65369aEb01Aab1FCc10CCe5e5B"; // Replace with your deployed contract address

const ABI = [
  "function createProposal(string,string[],uint256) external",
  "function vote(uint256,uint8) external",
  "function getProposal(uint256) view returns (string,string[],uint256[],uint256,bool)",
  "function totalProposals() view returns (uint256)",
  "function hasVoted(uint256,address) view returns (bool)",
  "function createIdea(string) external",
  "function upvoteIdea(uint256) external",
  "function getIdea(uint256) view returns (string,uint256,bool)",
  "function totalIdeas() view returns (uint256)",
  "function hasUpvoted(uint256,address) view returns (bool)",
  "function removeProposal(uint256) external",
  "function removeIdea(uint256) external",
  "function isOwner(address) view returns (bool)"
];

async function connectWallet() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    // isOwner = await contract.isOwner(userAddress);
    ioOwner = false;

    const truncated = userAddress.slice(0, 6) + "..." + userAddress.slice(-4);
    const walletAddressEl = document.getElementById("wallet-address");
    walletAddressEl.innerText = truncated;
    walletAddressEl.title = userAddress;

    const connectBtn = document.querySelector("button[onclick='connectWallet()']");
    connectBtn.disabled = true;
    connectBtn.classList.add("disabled-button");
    connectBtn.innerText = "Connected";

    await loadProposals();
    await loadIdeas();
  } else {
    alert("Please install MetaMask!");
  }
}

async function createProposal() {
  const desc = document.getElementById("desc").value;
  const optionsRaw = document.getElementById("options").value;
  const duration = parseInt(document.getElementById("duration").value);
  const options = optionsRaw.split(",").map(opt => opt.trim()).filter(opt => opt);

  if (options.length < 2 || options.length > 5) {
    alert("Enter between 2 to 5 options.");
    return;
  }

  await contract.createProposal(desc, options, duration);
  loadProposals();
}

async function submitIdea() {
  const desc = document.getElementById("idea-desc").value;
  await contract.createIdea(desc);
  loadIdeas();
}

async function loadProposals() {
  const container = document.getElementById("proposals");
  container.innerHTML = "";
  const total = await contract.totalProposals();

  for (let i = total - 1; i >= 0; i--) {
    const [desc, options, votes, deadline, deleted] = await contract.getProposal(i);
    if (deleted) continue;

    const hasVoted = await contract.hasVoted(i, userAddress);
    const div = document.createElement("div");
    div.className = "proposal";

    const title = document.createElement("div");
    title.className = "proposal-title";
    title.textContent = desc;

    if (isOwner) {
      const del = document.createElement("button");
      del.innerText = "❌";
      del.className = "delete-btn";
      del.addEventListener("click", async () => {
        await contract.removeProposal(i);
        loadProposals();
      });
      title.appendChild(del);
    }

    div.appendChild(title);

    const now = Date.now() / 1000;
    const votingEnded = now > deadline;

    options.forEach((opt, idx) => {
      const optionWrapper = document.createElement("div");
      optionWrapper.style.marginBottom = "6px";

      const optBtn = document.createElement("button");
      optBtn.textContent = `${opt}: ${votes[idx]}`;
      optBtn.style.width = "100%";
      optBtn.style.textAlign = "left";

      if (hasVoted || votingEnded) {
        optBtn.disabled = true;
        optBtn.classList.add("disabled-button");
      } else {
        optBtn.addEventListener("click", async () => {
          await contract.vote(i, idx);
          loadProposals();
        });
      }

      optionWrapper.appendChild(optBtn);
      div.appendChild(optionWrapper);
    });

    const end = document.createElement("div");
    end.innerHTML = `<small>${votingEnded ? "Voting ended" : "Ends: " + new Date(deadline * 1000).toLocaleString()}</small>`;
    div.appendChild(end);

    container.appendChild(div);
  }
}

async function loadIdeas() {
  const container = document.getElementById("ideas");
  container.innerHTML = "";
  const total = await contract.totalIdeas();

  for (let i = total - 1; i >= 0; i--) {
    const [desc, upvotes, deleted] = await contract.getIdea(i);
    if (deleted) continue;

    const hasUpvoted = await contract.hasUpvoted(i, userAddress);
    const div = document.createElement("div");
    div.className = "idea";

    const title = document.createElement("div");
    title.className = "proposal-title";
    
    const descSpan = document.createElement("span");
    descSpan.textContent = desc;
    title.appendChild(descSpan);
    
    if (isOwner) {
      const del = document.createElement("button");
      del.innerText = "❌";
      del.className = "delete-btn";
      del.addEventListener("click", async () => {
        await contract.removeIdea(i);
        loadProposals();
      });
      title.appendChild(del);
    }

    div.appendChild(title);

    const voteLine = document.createElement("div");
    voteLine.innerText = `Upvotes: ${upvotes}`;
    div.appendChild(voteLine);

    if (!hasUpvoted) {
      const upvoteBtn = document.createElement("button");
      upvoteBtn.innerText = "Upvote";
      upvoteBtn.addEventListener("click", async () => {
        await contract.upvoteIdea(i);
        loadIdeas();
      });
      div.appendChild(upvoteBtn);
    }

    container.appendChild(div);
  }
}