const fs = require("fs");

let file_num_start;
let index;
var ind;


let phone_page = 1;
let phonebook = [];
let page_size = 100;

let settings = process.argv[2];
let set = fs.openSync(settings);

let pyramind;
let pyr;

var op_max;

let words = [];

for(let i = 3; i < process.argv.length; i++){
	words[i-3] = process.argv[i];
}

function read_settings(){
	let buffer = Buffer.alloc(100000);
	let bytes_read = fs.readSync(set,buffer,0,buffer.length,0);
	let space1 = buffer.indexOf(' ');
	let nl1 = buffer.indexOf('\n');
	file_num_start = parseInt(buffer.subarray(space1, nl1).toString('utf8'));

	let space2 = nl1+buffer.subarray(nl1,bytes_read).indexOf(' ');
	let nl2 = nl1+buffer.subarray(nl1+1,bytes_read).indexOf('\n')+1;
	index = buffer.subarray(space2+1,nl2).toString('utf8');
	ind = fs.openSync(index);

	let space3 = nl2+buffer.subarray(nl2,bytes_read).indexOf(' ');
	let nl3 = nl2+buffer.subarray(nl2+1,bytes_read).indexOf('\n')+1;
	op_max = parseInt(buffer.subarray(space3+1,nl3).toString('utf8'));

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
	pyr = fs.openSync(pyramind);

	let space7 = nl6 + buffer.subarray(nl6,bytes_read).indexOf(' ');
	let nl7 = nl6 + buffer.subarray(nl6+1,bytes_read).indexOf('\n')+1;
	//line_skip = parseInt(buffer.subarray(space7+1,nl7).toString('utf8'));

	let space8 = nl7 + buffer.subarray(nl7,bytes_read).indexOf(' ');
	// resume = buffer.subarray(space7+1,nl7).toString('utf8')=='true';
}
function get_pyramind(){
	let line_num = 0;
	let pos = 0;
	while(true){
		let tmp_pos = pos;
		let buffer = Buffer.alloc(10000);
		let bytes_read = fs.readSync(pyr,buffer,0,buffer.length,tmp_pos);
		if(bytes_read == 0) break;
		let nl = buffer.indexOf('\n');
		if(nl == -1) nl = bytes_read;
		let file = fs.openSync(buffer.subarray(0,nl).toString('utf8'))
		phonebook.push(file);
		pos += nl +1;
	}
}

function find_in_file(word,file,os){
	let offset = parseInt(os);
	let last_num = 0;
	while(true){
		let tmp_off = offset;
		let buffer = Buffer.alloc(100000);
		let bytes_read = fs.readSync(file,buffer,0,buffer.length,tmp_off);
		if(bytes_read == 0) return last_num;
		let nl = buffer.indexOf("\n");
		if(nl == -1) nl = bytes_read;
		let space = buffer.indexOf(" ");
		let cur_word = buffer.subarray(0,space).toString('utf8');
		let number = buffer.subarray(space,nl).toString('utf8');
		if(cur_word > word){
			return last_num;
		}
		last_num = number;
		offset +=nl +1;
	}
	return last_num;
}
function get_files(word,file,os){
	let offset = parseInt(os);
	while(true){
		let tmp_off = offset;
		let buffer = Buffer.alloc(1000);
		let bytes_read = fs.readSync(file,buffer,0,buffer.length,tmp_off);
		if(bytes_read == 0) return -1;
		let nl = buffer.indexOf("\n");
		if(nl == -1) nl = bytes_read;
		let space = buffer.indexOf(" ");
		let cur_word = buffer.subarray(0,space).toString('utf8');
		let numbers = buffer.subarray(space+1,nl).toString('utf8');
		if(cur_word == word){
			return numbers.split(" ");
		}
		offset +=nl+1;
	}
	return -1;
}
function find_word(word){
	let cur_page_num = phonebook.length-1;
	let cur_page = phonebook[cur_page_num];
	let offset = 0;
	while(cur_page_num >=1){
		offset = find_in_file(word,cur_page,offset);
		cur_page = phonebook[--cur_page_num];
	}
	return get_files(word,cur_page,offset);
}
function intersect(arr1, arr2){
	var ans = [];
	let arr1i = 0;
	let arr2i = 0;
	while(arr1i < arr1.length && arr2i < arr2.length){
		if(arr1[arr1i] < arr2[arr2i]){
			arr1i++;
		}
		else if(arr1[arr1i] > arr2[arr2i]){
			arr2i++;
		}
		else{
			ans.push(arr1[arr1i]);
			arr1i++;
			arr2i++;
		}
	}
	return ans;
}

function match_urls(id_list){
	let ans = [];
	let cur = 0;
	let cur_id = id_list[cur];
	let pos = 0;
	for (let line_num = 0;; line_num++){
		let tmp_pos = pos;
		let buffer = Buffer.alloc(100000);
		let bytes_read = fs.readSync(ind,buffer,0,buffer.length,tmp_pos);
		if(bytes_read == 0) break;
		let nl = buffer.indexOf('\n');
		if(nl == -1) nl = bytes_read;

		if(line_num+file_num_start == cur_id){
			let space = buffer.indexOf(' ');
			ans[cur]= buffer.subarray(space,nl).toString('utf8');
			cur++;
			cur_id = id_list[cur];
		}
		if(cur >= id_list.length){
			break;
		}
		pos += nl+1;
	}
	return ans;

}


function find_mult_words(wordlist){
	let cur_links = find_word(wordlist[0]);
	if(cur_links == -1){
		return {status: "ERROR", msg: "Word is not in database"};
	}
	for(let i = 1; i < wordlist.length; i++){
		let cur = find_word(wordlist[i]);
		if(cur == -1){
			return {status: "ERROR", msg: "Word is not in database"};
		}
		cur_links = intersect(cur_links,cur);
		if(cur_links.length == 0){
			return {status: "ERROR", msg: "Words are not in the same file"};
		}
	}
	return {status: "SUCCESS", links: match_urls(cur_links).sort()};
}

read_settings();
get_pyramind();
let max_line_len = op_max * file_num_start.length+100;

let response = find_mult_words(words)
console.log(JSON.stringify(response));
