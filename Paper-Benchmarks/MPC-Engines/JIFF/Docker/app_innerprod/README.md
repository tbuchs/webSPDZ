# JIFF Standlone Application Example

This application demonstrates how to include JIFF in a project with browser
and nodejs based clients.


### File Structure

`server.js`: The JIFF server code, it also serves index.html at `http://localhost:8080`.
`party.js`: A nodejs-based client that shares a secret and produces a secure sum
of the secrets of all participants.
`index.html`: The browser based client, similar to party.js but with an HTML UI.
`client.js`: The Javascript code accompanying `index.html` for handling the UI
events and performing the computation.
`client.bundle.js`: The client JS bundle resulting from browserifying `client.js`
with its dependencies, including the JIFFClient and extensions.

### Running The Application

First, install all dependencies using `npm install`.

In a terminal, run the server `node server.js`.

After the serve runs and you see a log message indicating its listening, you can
run nodejs parties by using `node party.js <input number> [optional parameters]`.

You can also run browser-based parties by going to `http://localhost:8080` and
first connecting to the server and then sharing the secret input.

When the number of connected parties reaches the expected total party count (by
default 2), the computation starts summing up all the secrets and produces the
output.

You can change the party count by specifying different command line parameters
to `party.js` or in the browser client webpage.
