const CONTRACT_ADDRESS = "0x279D5C686e9Aab14cfB3AdbBCd1F679951fe3DD4";

const ABI = [
  "function createProposal(string,string[],uint256) public",
  "function vote(uint256,uint8) public",
  "function getProposal(uint256) view returns (string,string[],uint256[],uint256)",
  "function totalProposals() view returns (uint256)",
  "function hasVoted(uint256,address) view returns (bool)",

  "function createIdea(string) public",
  "function upvoteIdea(uint256) public",
  "function getIdea(uint256) view returns (string,uint256,uint256)",
  "function totalIdeas() view returns (uint256)",
  "function hasUpvoted(uint256,address) view returns (bool)"
];

let provider, signer, contract;

async function connectWallet() {
  if (!window.ethereum) return alert("Install MetaMask!");
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  const addr = await signer.getAddress();
  document.getElementById("wallet-address").innerText = `Connected: ${addr.slice(0,6)}…${addr.slice(-4)}`;
  loadProposals();
  loadIdeas();
}

/* Proposal Logic */
async function createProposal() {
  const desc = document.getElementById("desc").value.trim();
  const rawOpts = document.getElementById("options").value.trim();
  const duration = parseInt(document.getElementById("duration").value);
  if (!desc || !rawOpts || duration <= 0) return alert("Fill all fields");
  const opts = rawOpts.split(",").map(o => o.trim()).filter(Boolean);
  if (opts.length < 2 || opts.length > 5) return alert("Use 2–5 options");
  const tx = await contract.createProposal(desc, opts, duration);
  await tx.wait();
  alert("Proposal created");
  loadProposals();
}

async function vote(id, index) {
  const tx = await contract.vote(id, index);
  await tx.wait();
  alert("Vote submitted");
  loadProposals();
}

async function loadProposals() {
  const el = document.getElementById("proposals");
  el.innerHTML = "";
  const total = Number((await contract.totalProposals()).toString());
  const addr = await signer.getAddress();
  for (let i = total - 1; i >= 0; i--) {
    const [desc, opts, votes, deadline] = await contract.getProposal(i);
    const hasVoted = await contract.hasVoted(i, addr);
    const active = Date.now() / 1000 < Number(deadline.toString());
    let html = `<div class='proposal'><div class='proposal-title'>${desc}</div>`;
    html += `<div>Ends: ${new Date(Number(deadline.toString())*1000).toLocaleString()}</div>`;
    opts.forEach((opt, j) => {
      const count = votes[j].toString();
      const disabled = (!active || hasVoted) ? "disabled class='disabled-button'" : "";
      html += `<div><button ${disabled} onclick='vote(${i},${j})'>${opt}</button> ${count}</div>`;
    });
    html += `</div>`;
    el.innerHTML += html;
  }
}

/* Idea Logic */
async function submitIdea() {
  const desc = document.getElementById("idea-desc").value.trim();
  if (!desc || duration <= 0) return alert("Fill all fields");
  const tx = await contract.createIdea(desc);
  await tx.wait();
  alert("Idea submitted");
  loadIdeas();
}

async function upvoteIdea(id) {
  const tx = await contract.upvoteIdea(id);
  await tx.wait();
  alert("Idea upvoted");
  loadIdeas();
}

async function loadIdeas() {
  const el = document.getElementById("ideas");
  el.innerHTML = "";
  const total = Number((await contract.totalProposals()).toString());
  const addr = await signer.getAddress();
  for (let i = total - 1; i >= 0; i--) {
    const [desc, upvotes, deadline] = await contract.getIdea(i);
    const has = await contract.hasUpvoted(i, addr);
    const disabled = (has) ? "disabled class='disabled-button'" : "";
    el.innerHTML += `
      <div class='idea'>
        <div class='idea-title'>${desc}</div>
        <div><button ${disabled} onclick='upvoteIdea(${i})'>Upvote</button> ${upvotes.toString()}</div>
      </div>`;
  }
}