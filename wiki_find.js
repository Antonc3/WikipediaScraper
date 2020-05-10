const fs = require("fs");
// process.argv.forEach((arg,i) => console.log(i,arg));
let file_num_start;
var index;
let phone_page = 1;
let phonebook = [];
let page_size = 100;
let settings = process.argv[2];
let pyramind = process.argv[3];
// let word = process.argv[4];
let words = [];
for(let i = 4; i < process.argv.length; i++){
	words[i-4] = process.argv[i];
}
// console.log(words);
// let output = process.argv[3]
let set = fs.openSync(settings);

// console.log("len: ",process.argv.length);
let pyr = fs.openSync(pyramind);

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
		// s.log((buffer.subarray(0,nl).toString('utf8')),line_num++);
		let file = fs.openSync(buffer.subarray(0,nl).toString('utf8'))
		phonebook.push(file);
		pos += nl +1;
	}
}
function read_settings(){
	let buffer = Buffer.alloc(100000);
	fs.readSync(set,buffer,0,buffer.length,0);
	let space1 = buffer.indexOf(' ');
	let nl1 = buffer.indexOf('\n');
	file_num_start = parseInt(buffer.subarray(space1, nl1).toString('utf8'));
	let bytes_read = fs.readSync(set,buffer,0,buffer.length,nl1+1);
	let space2 = buffer.indexOf(' ');
	index = fs.openSync(buffer.subarray(space2+1,bytes_read).toString('utf8'));
}
read_settings();
get_pyramind();
function find_in_file(word,file,os){
	// console.log('\n\n\n\n',word);
	let offset = parseInt(os);
	// console.log(offset)
	let last_num = 0;
	while(true){
		let tmp_off = offset;
		let buffer = Buffer.alloc(100000);
		let bytes_read = fs.readSync(file,buffer,0,buffer.length,tmp_off);
		// console.log(buffer.toString('utf8'));
		// console.log(bytes_read)
		if(bytes_read == 0) return last_num;
		let nl = buffer.indexOf("\n");
		if(nl == -1) nl = bytes_read;
		let space = buffer.indexOf(" ");
		let cur_word = buffer.subarray(0,space).toString('utf8');
		// console.log(cur_word);
		let number = buffer.subarray(space,nl).toString('utf8');
		// console.log('number',number);
		if(cur_word > word){
			// console.log("ትግርኛ 25740" > "dog");
			return last_num;
		}
		last_num = number;
		offset +=nl +1;
		// console.log('offset')
		// console.log(cur_word,offset, number);
	}
	return last_num;
}
function get_files(word,file,os){
	let offset = parseInt(os);
	while(true){
		let tmp_off = offset;
		let buffer = Buffer.alloc(100000);
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
		// console.log(cur_page);
		offset = find_in_file(word,cur_page,offset);
		cur_page = phonebook[--cur_page_num];
		// console.log("done: " + cur_page_num);
	}
	return get_files(word,cur_page,offset);
}
// console.log(phonebook);
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
	// ans.sort();
	return ans;
}
// function match_url(ids){
// 	let pos = 0;
// 	for (let line_num = 0;; line_num++){
// 		let tmp_pos = pos;
// 		let buffer = Buffer.alloc(100000);
// 		let bytes_read = fs.readSync(index,buffer,0,buffer.length,tmp_pos);
// 		if(bytes_read == 0) break;
// 		let nl = buffer.indexOf('\n');
// 		if(nl == -1) nl = bytes_read;

// 		// console.log(line_num + file_num_start);
// 		if(line_num+file_num_start == id){
// 			let space = buffer.indexOf(' ');
// 			return buffer.subarray(space,nl).toString('utf8');
// 		}
// 		pos += nl+1;
// 	}
// 	return "";
// }
function match_urls(id_list){
	let ans = [];
	let cur = 0;
	let cur_id = id_list[cur];
	let pos = 0;
	for (let line_num = 0;; line_num++){
		let tmp_pos = pos;
		let buffer = Buffer.alloc(100000);
		let bytes_read = fs.readSync(index,buffer,0,buffer.length,tmp_pos);
		if(bytes_read == 0) break;
		let nl = buffer.indexOf('\n');
		if(nl == -1) nl = bytes_read;

		// console.log(line_num + file_num_start);
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
	// console.log(ans.length + " " + id_list.length);
	return ans;
	// let ans = [];
	// for(let i = 0; i < id_list.length; i++){
	// 	ans[i] = match_url(id_list[i]);
	// 	// console.log(ans[i]);
	// }
	// return ans;
}


function find_mult_words(wordlist){
	let cur_links = find_word(wordlist[0]);
	if(cur_links == -1){
		return {status: "ERROR", msg: "Word is not in database"};
	}
	// console.log(wordlist[0],cur_links);
	for(let i = 1; i < wordlist.length; i++){
		let cur = find_word(wordlist[i]);
		// console.log(cur);
		if(cur == -1){
			return {status: "ERROR", msg: "Word is not in database"};
		}
		cur_links = intersect(cur_links,cur);
		if(cur_links.length == 0){
			return {status: "ERROR", msg: "Words are not in the same file"};
		}
	}
	// console.log(cur_links);

	return {status: "SUCCESS", links: match_urls(cur_links).sort()};
}

// }
// console.log(word);

// //console.log(find_word(word));

// let ids = find_word(word);
// let urls = [];
// for(let i =0; i < ids.length; i++){
// 	urls[i] = match_url(ids[i]);
// }
// console.log(urls);
// //console.log(ids)
// console.log("fkjfahfaksghafsdaf",find_word("apple"));
let response = find_mult_words(words)
console.log(JSON.stringify(response));
// console.log(intersect([1,2,3,4,5,6,7],[2,3,5,6,10,15]));