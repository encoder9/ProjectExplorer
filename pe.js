class PE {
	static currentChart = 'networkGraph';
	
	static init() {
		PE.renderLeftPanel();
		PE.displayTypescriptContent();
		// qs('.mainContainer', mainContainer => { initCharts(mainContainer); });
	}
	
	//#region Main Functions
	
	static renderLeftPanel() {
		qs('.panelLeft', panelLeft => {
			const html = [];
			
			for (const key of Object.keys(mainData)) {
				html.push(PE.renderTreeView(key));
			}
			
			panelLeft.innerHTML = html.join('\n');
			
			e('click', PE.tvClickHandler, qsa('.tvItemToggle'));
		});
	}
	
	static displayTypescriptContent() {
		
	}
	
	//#endregion
	
	//#region TreeView Functions
	
	static renderTreeView(key, parentKey = '') {
		return PE.render(ht('tvItem'), {
			label: key,
			key: parentKey == '' ? key : `${parentKey}___${key}`,
			content: 'Loading...'
		});
	}
	
	static tvClickHandler(event) {
		closest(event.target, '.tvItem', tvItem => {
			qs('.tvItemContent', tvItem, tvItemContent => {
				tvItemContent.classList.toggle('hidden');
				
				if (tvItemContent.dataset.rendered == 'false') {
					const html = [];
					const kids = PE.ParseString_AccessProperty(mainData, tvItem.dataset.key.split('___'));
					
					if (kids == null) {
						html.push(`<div class="tvLeaf">NULL</div>`);
					} else if (Array.isArray(kids)) {
						if (kids.length == 0) {
							html.push(`<div class="tvLeaf">No children</div>`);
						} else {
							for (const kid of kids) {
								html.push(`<div class="tvLeaf">${kid}</div>`);
							}
						}
					} else {
						const kidKeys = Object.keys(kids);
						
						if (kidKeys.length == 0) {
							html.push(`<div class="tvLeaf">No children</div>`);
						} else {
							for (const key of kidKeys) {
								html.push(PE.renderTreeView(key, tvItem.dataset.key));
							}
						}
					}
					
					tvItemContent.innerHTML = html.join('\n');
					tvItemContent.dataset.rendered = 'true';
					e('click', PE.tvClickHandler, qsa('.tvItemToggle'));
				}
			});
			
			qs('i.fa-solid', tvItem, icon => {
				if (icon.classList.contains('fa-caret-right')) { icon.classList.replace('fa-caret-right', 'fa-caret-down'); }
				else if (icon.classList.contains('fa-caret-down')) { icon.classList.replace('fa-caret-down', 'fa-caret-right'); }
			});
		});
	}
	
	//#endregion
	
	//#region Graphing Functions
	
	static initCharts(container) {
		if (currentChart === 'dependencyWheel') { PE.renderDependencyWheel(container); }
		else if (currentChart === 'networkGraph') { PE.renderNetworkGraph(container); }
	}
	
	static renderDependencyWheel(container) {
		Highcharts.chart(container, {
			title: {
				text: 'Dependency Wheel'
			},
			accessibility: {
				point: {
					valueDescriptionFormat: '{index}. From {point.from} to {point.to}: {point.weight}.'
				}
			},
			series: [{
				keys: ['from', 'to', 'weight'],
				data: PE.getTSDepWheelData(),
				type: 'dependencywheel',
				name: 'Typescript dependencies',
				dataLabels: {
					color: '#333',
					style: {
						textOutline: 'none'
					},
					textPath: {
						enabled: true
					},
					distance: 10
				},
				size: '95%'
			}]
		});
	}
	
	static renderNetworkGraph(container) {
		const dirDist50 = '#E8544E', dirDist10 = '#FFD265', dirDistLess10 = '#2AA775';
		
		Highcharts.chart(container, {
			chart: { type: 'networkgraph' },
			tooltip: {
				formatter: function () {
					if (this.color == dirDist50) { return `<b>${this.key}: more than 50</b> references`; }
					else if (this.color == dirDist10) { return `<b>${this.key}: more than 10</b> references`; }
					else if (this.color == dirDistLess10) { return `<b>${this.key}: less than 10</b> references`; }
				}
			},
			plotOptions: {
				networkgraph: {
					keys: ['from', 'to'],
					layoutAlgorithm: {
						enableSimulation: true,
						integration: 'verlet',
						linkLength: 200
					}
				}
			},
			series: [{
				marker: { radius: 13 },
				dataLabels: {
					enabled: true,
					linkFormat: '',
					allowOverlap: true,
					style: { textOutline: false }
				},
				data: [
					['Seoul ICN', 'Daegu'],
					['Seoul ICN', 'Busan'],
					['Busan', 'Seoul GMP'],
					['Busan', 'Yangyang'],

					['Daegu', 'Seoul GMP'],
					['Daegu', 'Jeju'],

					['Seoul GMP', 'Gwangju'],
					['Seoul GMP', 'Yeosu'],
					['Seoul GMP', 'Sacheon'],
					['Seoul GMP', 'Ulsan'],
					['Seoul GMP', 'Pohang'],

					['Jeju', 'Gwangju'],
					['Jeju', 'Gunsan'],
					['Jeju', 'Wonju'],
					['Jeju', 'Yangyang'],
					['Jeju', 'Daegu'],
					['Jeju', 'Yeosu'],
					['Jeju', 'Sacheon'],
					['Jeju', 'Ulsan'],
					['Jeju', 'Busan'],
					['Jeju', 'Cheongju']
				],
				nodes: [
					{
						id: 'Seoul ICN',
						marker: {
							radius: 30
						},
						color: dirDist50
					},
					{
						id: 'Daegu',
						marker: {
							radius: 10
						},
						color: dirDistLess10
					},
					{
						id: 'Busan',
						marker: {
							radius: 30
						},
						color: dirDist50
					},
					{
						id: 'Seoul GMP',
						marker: {
							radius: 20
						},
						color: dirDist10
					},
					{
						id: 'Jeju',
						marker: {
							radius: 30
						},
						color: dirDist50
					},
					{
						id: 'Gwangju',
						marker: {
							radius: 10
						},
						color: dirDistLess10
					},
					{
						id: 'Yeosu',
						marker: {
							radius: 10
						},
						color: dirDistLess10
					},
					{
						id: 'Sacheon',
						marker: {
							radius: 10
						},
						color: dirDistLess10
					},
					{
						id: 'Ulsan',
						marker: {
							radius: 10
						},
						color: dirDistLess10
					},
					{
						id: 'Pohang',
						marker: {
							radius: 20
						},
						color: dirDist10
					},
					{
						id: 'Gunsan',
						marker: {
							radius: 10
						},
						color: dirDistLess10
					},
					{
						id: 'Wonju',
						marker: {
							radius: 10
						},
						color: dirDistLess10
					},
					{
						id: 'Yangyang',
						marker: {
							radius: 10
						},
						color: dirDistLess10
					},
					{
						id: 'Cheongju',
						marker: {
							radius: 20
						},
						color: dirDist10
					}
				]
			}]
		});
	}
	
	//#endregion
	
	//#region Typescript Data Functions
	
	static getTSRelationships() {
		const tsData = PE.getKeysFromCommonBase(mainData.ts);
		const refs = {};
		
		for (const [key, value] of Object.entries(tsData)) {
			const parts = key.split('/');
			
			if (parts.length > 0) {
				parts.shift();
				if (refs[parts[0]] == null) { refs[parts[0]] = {}; }
				
				for (const childKey of Object.keys(tsData[key])) {
					if (refs[childKey] == null) { refs[childKey] = {}; }
					
					if (refs[childKey][parts[0]] == null) { refs[childKey][parts[0]] = 0; }
					refs[childKey][parts[0]]++;
					
					if (refs[parts[0]][childKey] == null) { refs[parts[0]][childKey] = 0; }
					refs[parts[0]][childKey]++;
				}
			}
		}
		
		return refs;
	}
	
	static getTSDepWheelData() {
		const refs = PE.getTSRelationships();
		
		const wheelData = [];
		
		// for (const key of Object.keys(refs)) {
		// 	for (const childKey of Object.keys(refs[key])) {
		// 		wheelData.push([key, childKey, refs[key][childKey]]);
		// 	}
		// }
		
		return wheelData;
		
		// return [
		// 	['Brazil', 'Portugal', 5],
		// 	['Brazil', 'France', 1],
		// 	['Brazil', 'France2', 1],
		// 	['Brazil', 'France3', 1],
		// 	['Brazil', 'France4', 1],
		// 	['Brazil', 'France5', 1],
		// ];
	}
	
	//#endregion
	
	//#region Common Functions
	
	static getKeysFromCommonBase(obj) {
		const newObj = {};
		
		for (const key of Object.keys(obj)) {
			basePaths.forEach(basePath => {
				if (key.startsWith(basePath)) {
					newObj[key.replace(basePath, '')] = obj[key];
				}
			});
		}
		
		return newObj;
	}
	
	static render(htmlString, dataObject) {
		for (const i in dataObject) {
			if (dataObject.hasOwnProperty(i)) {
				htmlString = htmlString.replace(new RegExp('{{' + i + '}}', 'g'), dataObject[i]);
			}
		}
		
		return htmlString;
	}
	
	static ParseString_AccessProperty(object, property) {
		if (property.length == 0) {
			return object;
		} else {
			const prop = property.shift();
			
			if (object[prop] === undefined) {
				return undefined;
			} else {
				return PE.ParseString_AccessProperty(object[prop], property);
			}
		}
	}
	
	//#endregion
}

//#region Utility Functions

const qs = (selector, context_or_callbackIfNotNull, callbackIfNotNull) => {
	const documentContext = context_or_callbackIfNotNull === undefined || context_or_callbackIfNotNull === null ? document : context_or_callbackIfNotNull;
	
	if (documentContext instanceof HTMLElement || documentContext instanceof Document) {
		if (callbackIfNotNull == null) {
			return documentContext.querySelector(selector);
		} else {
			const obj = documentContext.querySelector(selector);
			if (obj != null) { callbackIfNotNull(obj); }
		}
	} else if (typeof context_or_callbackIfNotNull === 'function') {
		const obj = document.querySelector(selector);
		if (obj != null) { context_or_callbackIfNotNull(obj); }
	}
	
	return null;
};

const qsa = (selector, context_or_callbackIfNotNull, callbackIfNotNull) => {
	const documentContext = context_or_callbackIfNotNull === undefined || context_or_callbackIfNotNull === null ? document : context_or_callbackIfNotNull;
	
	if (documentContext instanceof HTMLElement || documentContext instanceof Document) {
		if (callbackIfNotNull == null) {
			return documentContext.querySelectorAll(selector);
		} else {
			const obj = documentContext.querySelectorAll(selector);
			if (obj != null) { callbackIfNotNull(Array.from(obj)); }
		}
	} else if (typeof context_or_callbackIfNotNull === 'function') {
		const obj = document.querySelectorAll(selector);
		if (obj != null) { context_or_callbackIfNotNull(Array.from(obj)); }
	}
	
	return null;
};

const htCache = {};
const ht = (id) => { if (htCache[id] == null) { htCache[id] = document.getElementById(id).innerHTML; } return htCache[id]; };
const closest = (el, selector, callback) => { const closest = el.closest(selector); if (closest != null) { callback(closest); } };

const e = (eventNames, eventHandler, context, once = false) => {
	const options = {};
	if (once == true) { options.once = true; }
	
	for (const ename of eventNames.replace(/\s/g, '').split(',')) {
		if (context === undefined || context === document.body) {
			document.removeEventListener(ename, eventHandler, options);
			document.addEventListener(ename, eventHandler, options);
		} else {
			if (context instanceof NodeList || Array.isArray(context)) {
				context.forEach(b => {
					b.removeEventListener(ename, eventHandler, options);
					b.addEventListener(ename, eventHandler, options);
				});
			} else {
				context.removeEventListener(ename, eventHandler, options);
				context.addEventListener(ename, eventHandler, options);
			}
		}
	}
};

//#endregion

window['PE'] = PE;
