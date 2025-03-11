console.log('Command line arguments: <server_IP> <server_port> <input> [<party count> [<computation_id> [<party id>]]]]');

var server_IP = process.argv[2]; 
var server_port = process.argv[3];

// Parse command line arguments.
function parseCommandLine() {
  // Read Command line arguments
  const input = parseInt(process.argv[4], 10);

  let party_count = process.argv[5];
  if (party_count == null) {
    party_count = 2;
  } else {
    party_count = parseInt(party_count);
  }

  let computation_id = process.argv[6];
  if (computation_id == null) {
    computation_id = 'test';
  }

  let party_id = process.argv[7];
  if (party_id != null) {
    party_id = parseInt(party_id, 10);
  }
  
  return {
    input: input,
    party_count: party_count,
    party_id: party_id,
    computation_id: computation_id
  };
}

// The MPC computation
async function computation(args, jiffClient) {
  // Share our secret input with the other parties.
  let shares = jiffClient.share(args.input);
  
  // Sum all secret inputs.
  let sum = shares[1];
  for (let i = 2; i <= jiffClient.party_count; i++) {
    sum = sum.sadd(shares[i]);
  }

  // get the final output(s)
  const output = await jiffClient.open(sum);
  console.log('Output: ', output.toString());

  // disconnect safetly.
  jiffClient.disconnect(true, true);
}

function connect(args) {
  const { JIFFClient, JIFFClientBigNumber } = require('jiff-mpc');
  //const jiffClient = new JIFFClient('http://localhost:8080', args.computation_id, {
  const jiffClient = new JIFFClient('http://'+server_IP+':'+server_port, args.computation_id, {
    autoConnect: false,
    party_count: args.party_count,
    party_id: args.party_id,
    onConnect: computation.bind(null, args),
    crypto_provider: true
  });
  jiffClient.apply_extension(JIFFClientBigNumber, {});
  jiffClient.connect();
}

connect(parseCommandLine());
