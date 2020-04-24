const express = require('express')
const app = express()
const port = 3000
const {spawn} = require('child_process')

app.use(express.static('static'))

app.get('/q', (req, res) => {
	// const search = spawnSync('./search.sh', req.query.split());
	console.log(req.query.q);
	const search = spawn('echo', req.query.q.split(" "));

	let result = '';

	search.stdout.on('data', (data) => {
	  result += data;
	  console.log(`stdout: ${data}`);
	});

	search.on('close', (code) => {
		res.send(result);
	  // console.log(`child process close all stdio with code ${code}`);
	});

});
app.get('/:x', (req, res) => res.send(`Hello World ${JSON.stringify(req.params)}`))

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))