import 'dotenv/config'
import {Telegraf} from 'telegraf'
import {message} from 'telegraf/filters'
import srtParser2 from 'srt-parser-2'
import {readFile, readdir} from 'fs/promises'
import { Picker } from 'rand-picker'
const bot = new Telegraf(process.env.BOT_TOKEN)
const srtparse = new srtParser2();
let srtmat;
let srtmatflattened;
let picker;


async function init_srtmat(){
    let res = await readdir('srts');
    srtmat = await Promise.all(res.map(async a=>
	srtparse.fromSrt(await readFile('srts/'+a, "utf8")).map(b=>({
	    ep: a.split(".").slice(0,2).join(" "),
	    ...b
	})).map(c=>({
	    type: "article",
	    id: c.ep+c.id,
	    title: c.text,
	    description: c.ep+": "+c.startTime+" -> "+c.endTime,
	    input_message_content: {message_text: c.text}
	}))
    ));
    srtmatflattened = srtmat.flat();
    picker = new Picker(srtmatflattened);
}

async function main(){
    await init_srtmat();
    bot.on('inline_query', async (ctx) =>{
	let result;
	if (ctx.inlineQuery.query.length === 0){
	    result = picker.pick(40)
	} else {
	    result = srtmatflattened.filter(r => r.title.includes(ctx.inlineQuery.query));
	    result.splice(50);
	}
	return await ctx.answerInlineQuery(result);
    })
    bot.launch()
}
main()

