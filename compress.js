const fs = require("fs");

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

let str = "";
let str_len = 0;



for(line_number = 0;; line_number++){
	let buffer = Buffer.alloc(20000);
	let tmp_pos = pos;
	let bytes_read = fs.readSync(compress, buffer,0,buffer.length,tmp_pos);
	if(bytes_read == 0) break;
	let nl = buffer.indexOf('\n');
	if(nl == -1) nl = bytes_read;
	let space = buffer.indexOf(" ");
	let word = buffer.subarray(0,space).toString('utf8');
	let num = buffer.subarray(space+1,nl).toString('utf8');
	if(word == cur_word){
		if(prev_docid != num){
			if(str_len + num.length > Math.pow(2,52)-1){
				fs.writeSync(fd_dst,str);
				str = 0;
				str_len = 0;
			}
			str += " " + num;
			str_len += num.length;
			// fs.writeSync(fd_dst, " " + num);
		}
	}
	else{
		cur_word = word;
		let write;
		if(line_number > 0){
			write = '\n'+word+ " "+num;
		}
		else{
			write = word + " " + num;
		}
		if(str_len + write.length > Math.pow(2,52)-1){
			fs.writeSync(fd_dst,str);
			str = 0;
			str_len = 0;
		}
		str += write;
		str_len += write.length;
	}

	prev_docid = num;
	pos += nl+1;

}
fs.writeSync(fd_dst, str);

fs.appendFile(pyramind,dst, (err) => {
	if(err) throw err;
});
