'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../src/core/geocoder-adapter.js'), 'utf8');
const geocoder = vm.runInNewContext(source + '\ngeneographGeocoder;');
const item = { result_type:'city', name:'Rzeszów', lat:50.04, lon:22.0, country_code:'pl',
    country:'Poland', state:'Podkarpackie', address_line2:'PK, Poland', formatted:'Rzeszów, PK, Poland' };
const en = geocoder.normalizeResult(item, 0, 'geoapify', 'en');
assert.equal(en.name, 'Rzeszów, Subcarpathian Voivodeship, Poland');
assert.equal(en.context, 'Subcarpathian Voivodeship, Poland');
const ru = geocoder.normalizeResult({ ...item, name:'Жешув', country:'Польша', state:'', address_line2:'PK, Польша' }, 0, 'geoapify', 'ru');
assert.equal(ru.name, 'Жешув, Подкарпатское воеводство, Польша');
const fallback = geocoder.normalizeResult({class:'place', type:'town', lat:'50.04', lon:'22',
    display_place:'Rzeszów', display_address:'PK, Poland', address:{country_code:'pl', country:'Poland', state:'Podkarpackie'}}, 0, 'locationiq', 'en');
assert.equal(fallback.name, en.name);
const other = geocoder.normalizeResult({ ...item, name:'Village', state:'Other Province', county:'County', postcode:'12345',
    address_line2:'County, OP, 12345, Poland' }, 0, 'geoapify');
assert.equal(other.context, 'County, Other Province, Poland');
const results = geocoder.normalizeResponse({results:[item, {...item, lat:50.2, address_line2:'Other County, PK, Poland'}]}, 'geoapify', 10);
assert.equal(results.length, 2);
assert.equal(geocoder.normalizeResult({...item, result_type:'state'},0,'geoapify'), null);
assert.equal(geocoder.normalizeResult({...item, lat:null},0,'geoapify'), null);
assert.equal(geocoder.normalizeResult({...item, country_code:'de', country:'Germany', state:'PK', address_line2:'PK, Germany'},0,'geoapify').context, 'PK, Germany');
console.log('Geocoder structured names and conservative identity checks passed.');
