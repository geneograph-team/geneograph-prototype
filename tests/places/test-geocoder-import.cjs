'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname,'../../src/core/geocoder-adapter.js'),'utf8');
const city = { result_type:'city', name:'Rzeszów', lat:50.04, lon:22, country_code:'pl', country:'Poland',
    state:'Podkarpackie', place_id:'one', rank:{confidence:.93,confidence_city_level:.97}, datasource:{raw:{place:'city','name:ru':'Жешув'}}, formatted:'Rzeszów, PK, Poland' };
const fallbackCity = {class:'place',type:'town',lat:'50.04',lon:'22',display_place:'Rzeszów',
    display_name:'Rzeszów, PK, Poland',osm_type:'node',osm_id:'1',address:{country_code:'pl',country:'Poland',state:'Podkarpackie'}};
function harness(responses)
{
    const calls = [];
    let now = 0;
    const sandbox = { URL, DOMException, AbortController, AbortSignal, setTimeout, clearTimeout,
        window:{GENEOGRAPH_CONFIG:{geoapifyKey:'synthetic',locationiqKey:'synthetic'}},
        Date:{now:()=>now+=2000}, state:{language:'en'}, fetch:async url=>{
            calls.push(url.hostname);
            const response = responses.shift();
            if (!response) throw new Error('unexpected request');
            if (response.error) throw new TypeError('network failure');
            return {ok:!response.status||response.status===200,status:response.status||200,json:async()=>response.body};
        }};
    const api=vm.runInNewContext(source+'\ngeneographGeocoder;',sandbox);
    return {api,calls,sandbox};
}

async function verifyDispatchPriority()
{
    let now=0, next=0;
    const timers=new Map(), calls=[];
    const sandbox={URL,DOMException,AbortController,AbortSignal,
        window:{GENEOGRAPH_CONFIG:{geoapifyKey:'synthetic',locationiqKey:''}},
        state:{language:'en'},Date:{now:()=>now},
        setTimeout:(fn,ms)=>{const id=++next;timers.set(id,{fn,at:now+ms});return id;},
        clearTimeout:id=>timers.delete(id),
        fetch:async url=>{
            calls.push([url.searchParams.get('text'),now]);
            return {ok:true,status:200,json:async()=>({results:[city]})};
        }};
    const api=vm.runInNewContext(source+'\ngeneographGeocoder;',sandbox);
    const settle=async()=>{for(let i=0;i<24;i++)await Promise.resolve();};
    const advance=async value=>{
        now=value;
        for(const [id,timer] of [...timers])if(timer.at<=now){timers.delete(id);timer.fn();}
        await settle();
    };
    const first=api.searchImport('first');
    const second=api.searchImport('second');
    const aborted=new AbortController();
    const canceled=api.searchImport('cancelled',aborted.signal).catch(error=>error.name);
    const manual=api.search('manual',undefined,5);
    aborted.abort();
    await settle();
    assert.deepEqual(calls,[['first',0]]);
    await advance(299);
    assert.equal(calls.length,1);
    await advance(300);
    assert.deepEqual(calls,[['first',0],['manual',300]]);
    await advance(600);
    await Promise.all([first,second,manual]);
    assert.equal(await canceled,'AbortError');
    assert.deepEqual(calls,[['first',0],['manual',300],['second',600]]);
}

async function run()
{
    let h=harness([{body:{results:[city,{...city,place_id:'two',lat:52} ]}}]);
    const ambiguous=await h.api.searchImport('Rzeszow, Poland',new AbortController().signal);
    assert.equal(ambiguous.status,'results');
    assert.equal(ambiguous.candidates.length,2);
    assert.equal(ambiguous.candidates[0].countryCode,'PL');
    assert.equal(ambiguous.candidates[0].confidence,.93);
    assert.equal(ambiguous.candidates[0].cityConfidence,.97);
    assert.equal(ambiguous.candidates[0].typeReliable,true);
    assert.ok(ambiguous.candidates[0].names.includes('Жешув'));
    assert.equal(ambiguous.provider,'geoapify');
    assert.equal(ambiguous.candidates[0].regionNames[0],'Podkarpackie');
    assert.deepEqual(h.calls,['api.geoapify.com']);
    h=harness([{body:{results:[{...city,result_type:'state'}]}},{body:[fallbackCity]}]);
    const fallback=await h.api.searchImport('Rzeszow, Poland',new AbortController().signal);
    assert.equal(fallback.status,'results');
    assert.deepEqual(h.calls,['api.geoapify.com','api.locationiq.com']);
    assert.equal(fallback.candidates[0].type,'town');
    assert.equal(fallback.candidates[0].typeReliable,true);
    assert.equal(fallback.candidates[0].cityConfidence,null);
    h=harness([{status:429}]);
    assert.equal((await h.api.searchImport('Rzeszow, Poland')).status,'quota');
    assert.deepEqual(h.calls,['api.geoapify.com']);
    h=harness([{error:true},{status:404}]);
    assert.equal((await h.api.searchImport('Rzeszow, Poland')).status,'empty');
    assert.deepEqual(h.calls,['api.geoapify.com','api.locationiq.com']);
    h=harness([]);
    h.sandbox.window.GENEOGRAPH_CONFIG={};
    assert.equal((await h.api.searchImport('Rzeszow, Poland')).status,'unavailable');
    assert.equal(h.calls.length,0);
    const controller=new AbortController();controller.abort();
    await assert.rejects(()=>h.api.searchImport('Rzeszow, Poland',controller.signal),{name:'AbortError'});
    assert.equal(h.calls.length,0);
    h=harness([{body:{results:[city,{...city,place_id:'invalid',lat:null}]}}]);
    const invalid=await h.api.searchImport('Rzeszow, Poland');
    assert.equal(invalid.candidates.length,2);
    assert.equal(invalid.candidates[1].coordinates,null);
    h=harness([{body:{results:[{...city,datasource:{raw:{}}}]}}]);
    assert.equal((await h.api.searchImport('Rzeszow, Poland')).candidates[0].typeReliable,false);
    h=harness([{body:{results:Array.from({length:20},()=>({...city,result_type:'state'}))}}]);
    const truncatedNonsettlements=await h.api.searchImport('Rzeszow, Poland');
    assert.equal(truncatedNonsettlements.truncated,true);
    assert.equal(truncatedNonsettlements.candidates.length,0);
    assert.equal(h.calls.length,1);
    h=harness([{body:{results:Array.from({length:20},()=>city)}}]);
    assert.equal((await h.api.searchImport('Rzeszow, Poland')).truncated,true);
    assert.equal(h.calls.length,1);
    h=harness([{body:{results:[city]}}]);
    const manual=await h.api.search('Rzeszow',undefined,5);
    assert.equal(manual[0].name,'Rzeszów, Subcarpathian Voivodeship, Poland');
    assert.equal(manual[0].confidence,undefined);
    assert.equal(h.calls.length,1);
    await verifyDispatchPriority();
    console.log('Import geocoder request, fallback, quota, candidate and manual-search checks passed.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
