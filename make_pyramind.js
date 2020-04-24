const fs = require("fs");

let phone_page = 1;
let phonebook = ["page0.txt"];
let page_size = 100;






function phone_book(file_name,size){
	let new_page = "page" + phone_page++ + ".txt";
	phonebook.push(new_page);
	let cur_page = phonebook[phonebook.length-1];
	fs.readFile(cur_page,(err, data) =>{
		if(err) throw err;
		let i =0;
		while(i < data.length){
			let cnt = 0;
			while(cnt < size){
				if(err.substr(i,i+1) == "\n"){
					cnt++;
					i++;
				}
				i++;
			}
			let cur_str = data.substr(i).match(/[\w]+/);
			fs.appendFile(new_page,cur_str + " " + i,(err)=>{
				if(err) throw err;
			})
		}
	})	
	for(let i = 0; i < data.length; i+=size){
		let file_word = 
	 	fs.appendFile(new_page,read_line(file_name,i),(err) =>{
	 		if(err) throw err;
	 	}
	}
}
//change num pages to levels
function phoneify(num_pages,size){
	for(let i = 0; i < num_pages; i++){
		phone_book(phonebook[i],size);
	}
}

function find_word(word){
	let cur_page_num = phone_page-1;
	let cur_page = phonebook[cur_page_num];
	let i = 0;
	while(cur_page_num >= 0){
		let b= true;
		while(b){
			let tmp = read_line(cur_page,i);
			let cur_word = tmp.match(/\w+(?=\s)/)[0];
			if(word < cur_word){
				i*=page_size;
				break;
			}
			i++;
		}
		cur_page = phonebook(--cur_page_num);
	}
	let ids = "";
	let b = true;
	let cur_line = read_line(cur_page,i)
	while(word == read_line(cur_page,i)){
		ids += read_line(cur_page,i)
	}
}
phoneify(10,page_size);