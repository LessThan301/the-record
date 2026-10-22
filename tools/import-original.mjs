// One-time import of the Grok Build site's content into per-topic, per-language data files.
import fs from 'fs';
const X='/workspace/the-record/extract/';
const cards=JSON.parse(fs.readFileSync(X+'cards.json')), tr=JSON.parse(fs.readFileSync(X+'tr.json')), src=JSON.parse(fs.readFileSync(X+'src.json')), ui=JSON.parse(fs.readFileSync(X+'ui.json'));
const LANGS=['en','de','fr','es','it','nl','zh','ja','ko'], TOPICS=['elon','spacex','tesla','evs','capitalism'];
for(const L of LANGS){
  fs.mkdirSync(`data/cards/${L}`,{recursive:true});
  const u=ui[L]; fs.writeFileSync(`data/ui/${L}.json`,JSON.stringify(u,null,2)+'\n');
  for(const T of TOPICS){
    const list=cards.filter(c=>c.category===T).sort((a,b)=>a.number-b.number).map(c=>{
      const t=L==='en'?{}:(tr[L][c.id]||{});
      const loc=(src[L]||{})[c.id]||[]; const seen=new Set(loc.map(s=>s.url));
      return {id:c.id, slug:c.id.replace(/^(elon|spacex|tesla|ev|cap)-/,''), number:c.number, verdict:c.verdict,
        myth:t.myth??c.myth, headline:t.headline??c.headline, kernel:(t.kernel??c.kernel)||null, body:t.body??c.body, keyFacts:t.keyFacts??c.keyFacts,
        sources:[...loc,...c.sources.filter(s=>!seen.has(s.url))].map(s=>({publisher:s.publisher,title:s.title,url:s.url}))};
    });
    fs.writeFileSync(`data/cards/${L}/${T}.json`,JSON.stringify(list,null,2)+'\n');
  }
}
console.log('ok');
