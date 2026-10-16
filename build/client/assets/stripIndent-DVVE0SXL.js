function e(e,...n){return t(typeof e==`string`?e:e.reduce((e,t,r)=>(e+=t+(n[r]??``),e),``))}function t(e){return e.split(`
`).map(e=>e.trim()).join(`
`).trimStart().replace(/[\r\n]$/,``)}export{e as t};