//use after sort;


const fs = require("fs");

const to_compress = process.argv[2];
const dst = process.argv[3];
const settings = process.argv[4];

const compress = fs.openSync(to_compress);
const fd_dst = fs.openSync(dst,'w');
const set = fs.openSync(settings);


let pyramind;
let pyr;

function read_settings(){
	let buffer = Buffer.alloc(100000);
	let bytes_read = fs.readSync(set,buffer,0,buffer.length,0);
	let space1 = buffer.indexOf(' ');
	let nl1 = buffer.indexOf('\n');
	// file_num_start = parseInt(buffer.subarray(space1, nl1).toString('utf8'));
	// file_num_cnt = file_num_start;

	let space2 = nl1+buffer.subarray(nl1,bytes_read).indexOf(' ');
	let nl2 = nl1+buffer.subarray(nl1+1,bytes_read).indexOf('\n')+1;
	// index = buffer.subarray(space2+1,nl2).toString('utf8');

	let space3 = nl2+buffer.subarray(nl2,bytes_read).indexOf(' ');
	let nl3 = nl2+buffer.subarray(nl2+1,bytes_read).indexOf('\n')+1;
	// op_max = parseInt(buffer.subarray(space3+1,nl3).toString('utf8'));

	let space4 = nl3+buffer.subarray(nl3,bytes_read).indexOf(' ');
	let nl4 = nl3 + buffer.subarray(nl3+1,bytes_read).indexOf('\n')+1;
	// stk = buffer.subarray(space4+1,nl4).toString('utf8');
	// stack_fd = fs.openSync(stk);

	let space5 = nl4+buffer.subarray(nl4,bytes_read).indexOf(' ');
	let nl5 = nl4 + buffer.subarray(nl4+1,bytes_read).indexOf('\n')+1;
	// process_max = parseInt(buffer.subarray(space5+1,nl5).toString('utf8'));

	let space6 = nl5+buffer.subarray(nl5,bytes_read).indexOf(' ');
	let nl6 = nl5 + buffer.subarray(nl5+1,bytes_read).indexOf('\n')+1;
	pyramind = buffer.subarray(space6+1,nl6).toString('utf8');
	// pyr = fs.openSync(pyramind);

	let space7 = nl6 + buffer.subarray(nl6,bytes_read).indexOf(' ');
	let nl7 = nl6 + buffer.subarray(nl6+1,bytes_read).indexOf('\n')+1;
	//line_skip = parseInt(buffer.subarray(space7+1,nl7).toString('utf8'));

	let space8 = nl7 + buffer.subarray(nl7,bytes_read).indexOf(' ');
	// resume = buffer.subarray(space7+1,nl7).toString('utf8')=='true';
}
read_settings();


let pos = 0;
let cur_word = "";
let prev_docid = 0;	

let str = "";
let str_len = 0;

let str_max_len = Math.pow(2,52)-1
for(line_number = 0;; line_number++){
	let buffer = Buffer.alloc(1000);
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
			if(str_len + num.length > str_max_len){
				fs.writeSync(fd_dst,str);
				str = 0;
				str_len = 0;
			}
			str += " " + num;
			str_len += num.length;
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
		if(str_len + write.length > str_max_len){
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
