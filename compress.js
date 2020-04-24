const fs = require("fs");

process.argv.forEach((arg,i) => console.log(arg, i));
const to_compress = process.argv[2];
const dst = process.argv[3];
const pyramind = process.argv[4];

const compress = fs.openSync(to_compress);
const fd_dst = fs.openSync(dst,'w');
const pyr = fs.openSync(pyramind,'w');

//use after sort;
let pos = 0;
let cur_word = "";
let prev_docid = 0;	

for(line_number = 0;; line_number++){
	let buffer = Buffer.alloc(100000);
	let tmp_pos = pos;
	let bytes_read = fs.readSync(compress, buffer,0,buffer.length,tmp_pos);
	if(bytes_read == 0) break;
	let nl = buffer.indexOf('\n');
	if(nl == -1) nl = bytes_read;
	let space = buffer.indexOf(" ");
	let word = buffer.subarray(0,space).toString('utf8');
	let num = buffer.subarray(space+1,nl).toString('utf8');
	//if(space+1 == nl) console.log("true");

	// let num = parseInt(buffer.subarray(buffer.indexOf(" "),nl).toString('utf8'));
	// console.log(word,cur_word);
	if(word == cur_word){
		// console.log(cur_ind.get(num)==1);
		if(prev_docid != num){
			fs.writeSync(fd_dst, " " + num);
		}
	}
	else{
		cur_word = word;
		let write;
		if(line_number != 0){
			write = '\n'+word+ " "+num;
		}
		else{
			write = word + " " + num;
		}
		fs.writeSync(fd_dst, write);
	}
	// /console.log(pos,nl,cur_word,word);
	//print_arr(cur_ind)
	prev_docid = num;
	pos += nl+1;

}
fs.appendFile(pyramind,dst, (err) => {
	if(err) throw err;
});
