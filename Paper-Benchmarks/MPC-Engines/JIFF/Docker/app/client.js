const { JIFFClient, JIFFClientBigNumber } = require('jiff-mpc');
let jiffClient = null;

function connect() {
  const computation_id = $('#computation_id').val();
  const party_count = parseInt($('#party_count').val());
  console.log(computation_id, party_count);

  jiffClient = new JIFFClient('http://localhost:8080', computation_id, {
    autoConnect: false,
    party_count: party_count,
    crypto_provider: true,
    onError: function (_, error) {
      $('#output').append("<p class='error'>"+error+'</p>');
    },
    onConnect: function () {
      $('#button').attr('disabled', false);
      $('#output').append('<p>All parties Connected!</p>');
    }
  });
  jiffClient.apply_extension(JIFFClientBigNumber, {});
  jiffClient.connect();
}

async function submit() {
  const input = parseInt($('#number').val());
  if (isNaN(input)) {
    $('#output').append("<p class='error'>Input a valid number!</p>");
    return;
  } else if (100 < input || input < 0 || input !== Math.floor(input)) {
    $('#output').append("<p class='error'>Input a WHOLE number between 0 and 100!</p>");
    return;
  }

  // Start computation
  $('#button').attr('disabled', true);
  $('#output').append('<p>Starting...</p>');

  // Share our secret input with the other parties.
  let shares = jiffClient.share(input);
  
  // Sum all secret inputs.
  let sum = shares[1];
  for (let i = 2; i <= jiffClient.party_count; i++) {
    sum = sum.sadd(shares[i]);
  }

  // get the final output(s)
  const output = await jiffClient.open(sum);
  
  // display final output
  $('#output').append('<p>Result is: ' + output.toString() + '</p>');
  $('#button').attr('disabled', false);
}

module.exports = {
  connect: connect,
  submit: submit
};
