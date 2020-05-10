const express = require('express')
const app = express()
const port = 3000
const {spawn} = require('child_process')
const {exec}  = require('child_process')

app.use(express.static('static'))

app.get('/q', (req, res) => {
	req.query.q = req.query.q.toLowerCase();
	const search = spawn("./search.sh",req.query.q.split(" "));
	console.log(req.query.q);

	let result = '';
	search.stdout.on('data', (data) => {
		console.log(`${data}`);
		result += data;

	});
	search.on('close', (code) => {
		let html = `<h1>Result of Search for "${req.query.q}"</h1><br><form action="q">search: <input name="q" /><input type="submit" /></form>`;
		result = JSON.parse(result);
		if(result.status == 'ERROR'){
			html+=result.msg;
		}
		else{
			html += result.links.map(item => `<a href="${item}" target="_blank">${item}</a>`).join('<br/>');
		}
		res.send(html);
	});
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))