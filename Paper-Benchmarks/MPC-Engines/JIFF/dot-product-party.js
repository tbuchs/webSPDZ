console.log('Command line arguments: <server_IP> <server_port> <input_file_path> [<party count> [<computation_id> [<party id>]]] [<threshold]');

// Parse command line arguments.
function parseCommandLine() {
  // Read Command line arguments

  const server_IP = process.argv[2];
  const server_port = process.argv[3];

  if (server_IP == null) {
    console.log('Server IP needed');
    throw ('Server IP needed');
  }
  if (server_port == null) {
    console.log('Server port needed');
    throw ('Server port needed');
  }

  //const input = parseInt(process.argv[4], 10);
  arr_input_path = process.argv[4]

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

  let arg_threshold = party_count - 1;
  if (process.argv.length >= 9) {
    arg_threshold = parseInt(process.argv[8]);
  }
  console.log(`threshold: ${arg_threshold}`)

  let arg_Zp = 2315809577; // defaults to 32-bit field size
  if (process.argv.length >= 10) {
    arg_Zp = parseInt(process.argv[9]);
  }
  console.log(`Zp: ${arg_Zp}`)
  
  return {
    server_IP: server_IP,
    server_port: server_port,
    input_path: arr_input_path,
    party_count: party_count,
    party_id: party_id,
    computation_id: computation_id,
    threshold: arg_threshold,
    Zp: arg_Zp
  };
}

// The MPC computation from the Sum-Up example
/*
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
*/

// The MPC computation for the inner product of 2 arrays
async function computation(args, jiffClient) {
  let time_full_start = Date.now();

  // ===================================================================================================================
  // # Share secret input with other parties.
  let time_input_start = Date.now();

  input_plain = require("fs").readFileSync(args.input_path);
  // console.log("Got plain input: " + arr_input_plain);
  const input = JSON.parse(input_plain);
  // console.log("Got JSON input: " + arr_input + "___length: " + arr_input.length);
  //console.log("entry 0 is null? ", arr_input[0]==null, " (typeof: ", typeof(arr_input[0]), ")")
  // if (arr_input == null) {
  //   arr_input = [];
  // }

  // Each player gets a share of the respective "active player array"
  var recv_list = [];
  for (var player_id=1; player_id <= args.party_count; player_id++) {
    recv_list[player_id-1] = player_id;
  }
  //console.log("receivers list: ", recv_list)

  // Only player 1 & 2 are sharing an input
  var senders_list = [1,2];

  // Set threshold
  var threshold = args.threshold;

  // ## share_array:
  // array, lengths, threshold, receivers_list, senders_list, Zp, share_id
  // let start_sharing = Date.now();
  let shares = jiffClient.share_array(input, input.length, threshold, recv_list, senders_list);
  // let end_sharing = Date.now();
  //let shares = jiffClient.share_array(input, input.length);
  // DEBUG output to verify, that only parties from the senders_list have shared their input
  //console.log('(',args.party_id,':) My Share object: ',shares);

  let time_input_end = Date.now();
  
  // ===================================================================================================================
  // # Compute Inner Product & Open
  let time_inner_prod_start = Date.now();
  try {
    // ## Multiply all shared input arrays element-wise

    //console.log('(',args.party_id,':) My Share from Party 1: ',shares[1]);
    //for (var p=2; p <= jiffClient.party_count; p++) {
      //console.log('(',args.party_id,':) My Share from Party ',p,': ',shares[p]);

    // As only Player 1&2 provide an "active array": 
    // ...only InnerProduct of `shares[1] * shares[2]`
    var array = shares[1];
    for (var i=0; i < array.length; i++) {
      array[i] = array[i].smult(shares[2][i]);
    }
    
    // Sum up elements 
    let sum = array[0];
    for (var i=1; i < array.length; i++) {
      sum = sum.sadd(array[i]);
    }

    // Open the result -> Get the final output
    const output = await jiffClient.open(sum);
    result = output.toString()
  } catch (err) {
    console.log(err);
  }
  time_inner_prod_end = Date.now();
  time_full_end = Date.now();

  // ===================================================================================================================
  // # "Outro"

  time_full = time_full_end - time_full_start;
  time_input = time_input_end - time_input_start;
  // time_computation = end_full - start_computation;
  // time_sharing = end_sharing - start_sharing;
  time_inner_prod = time_inner_prod_end - time_inner_prod_start;

  console.log(`Output:`);
  console.log(`<b3m4>{"test":True}</b3m4>`);
  console.log(`<b3m4>{"modulus": ${jiffClient.Zp}}</b3m4>`);
  console.log(`<b3m4>{"result": ${result}}</b3m4>`);
  console.log(`Timings:`);
  console.log(`<b3m4>{"timer": {"full": ${time_full}}}</b3m4> (ms)`);
  console.log(`<b3m4>{"timer": {"input": ${time_input}}}</b3m4> (ms)`);
  // console.log(`<b3m4>{"timer": {"computation": ${time_computation}}}</b3m4> (ms)`);
  // console.log(`<b3m4>{"timer": {"sharing": ${time_sharing}}}</b3m4> (ms)`);
  console.log(`<b3m4>{"timer": {"inner_prod": ${time_inner_prod}}}</b3m4> (ms)`);


  // Disconnect safely
  jiffClient.disconnect(true, true);
}

function connect(args) {
  const { JIFFClient, JIFFClientBigNumber } = require('jiff-mpc');
  //const jiffClient = new JIFFClient('http://localhost:8080', args.computation_id, {
  const jiffClient = new JIFFClient('http://'+args.server_IP+':'+args.server_port, args.computation_id, {
    autoConnect: false,
    party_count: args.party_count,
    party_id: args.party_id,
    onConnect: computation.bind(null, args),
    crypto_provider: true,
    Zp: args.Zp 
    // Zp: 2315809577 // 32-bit 
    // Zp: 15602070592323557773 // 64-bit 
    // Zp: 209195226289509098368867143132480695659 // 128-bit
    // Zp: 179909201198258201664936577809428725721 // 128-bit
    //Zp: 277377802911579465915177789534932614073 // 128-bit 
  });
  jiffClient.apply_extension(JIFFClientBigNumber, {});
  jiffClient.connect();
}

connect(parseCommandLine());
