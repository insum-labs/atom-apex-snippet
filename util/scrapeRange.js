//Parameters
//apex_5
//apex_5.1
//oracle_12c
//oracle_11g
var scrapeType = ['apex_5.1','oracle_12c'];
var getFirstSignatureOnly = true;
var doNotScrapeBody = false;



/////////////////////////////////


function initScrapeParameters() {
	let st = scrapeType;
	if(typeof scrapeType  == 'object') {
		st = scrapeType.pop();
	}
	switch(st){
		case 'apex_5':
				beginUrl = 'http://docs.oracle.com/cd/E59726_01/doc.50/e39149/apex_app.htm';
				finishUrl = 'http://docs.oracle.com/cd/E59726_01/doc.50/e39149/apex_zip.htm';
				baseUrl = 'http://docs.oracle.com/cd/E59726_01/doc.50/e39149/';
				isApexScrape = true;
				apexVersion = 5.0;
				filename += 'apexVer5'
			break;
		case 'apex_5.1':
				beginUrl = 'http://docs.oracle.com/database/apex-5.1/AEAPI/APEX_APPLICATION.htm';
				finishUrl = 'http://docs.oracle.com/database/apex-5.1/AEAPI/GET_FILES-Function.htm';
				baseUrl = 'http://docs.oracle.com/database/apex-5.1/AEAPI/';
				isApexScrape = true;
				apexVersion = 5.1
				filename += 'ApexVer51'
			break;
		case 'oracle_12c':
				beginUrl = 'http://docs.oracle.com/database/121/ARPLS/c_adm.htm';
				finishUrl = 'http://docs.oracle.com/database/121/ARPLS/w_wdoclo.htm';
				baseUrl = 'http://docs.oracle.com/database/121/ARPLS/';
				isApexScrape = false;
				filename += 'oracle12c'
			break;
		case 'oracle_11g':
				beginUrl = 'http://docs.oracle.com/cd/B28359_01/appdev.111/b28419/c_adm.htm';
				finishUrl = 'http://docs.oracle.com/cd/B28359_01/appdev.111/b28419/t_xml.htm';
				baseUrl = 'http://docs.oracle.com/cd/B28359_01/appdev.111/b28419/';
				isApexScrape = false;
				filename += 'oracle11g'
			break;
	}
	if(typeof scrapeType == 'object') {
		if(scrapeType.length == 0) {
			//We are on our last scrape
			filename += '.json';
		}
	} else {
		filename += '.json'
	}

}

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var $;


var allSignatures = {};
var allScrapedObjs = [];
var currentScrapeUrl;
var isExternalDoc = false;
var beginUrl  = '';
var finishUrl = '';
var isApexScrape;
var apexVersion;
var filename = '';



initScrapeParameters();


function scrapeRange(startUrl,endUrl){
	currentScrapeUrl = startUrl;
	console.log('start scraping ' + currentScrapeUrl);
	request(currentScrapeUrl, function(error, response,html){
		if(!error){
			// Now use cheerio on the returned HTML which will give jQuery functionality
			$ = cheerio.load(html);
			mergeConsecutivePres();


			if(!isExternalDoc) {
				nextUrl = html.match(/<a href="([^"]+)"><img width="24" height="24" src="[^"]*" alt="Go to next page"/)[1];

				if(html.indexOf('For a complete description of this package') != -1) {
					let externalDocUrl = $('p:contains("For a complete description of this package")').find('a').first().prop('href');
					if(externalDocUrl) {
						isExternalDoc = true;
						scrapeRange(baseUrl+externalDocUrl, endUrl);
						return;
					}
					else {
						console.log('-Error- cannot find external document url')
						return;
					}
				}
			} else {
				//nextUrl was set before this function was called, so we will go there next
			}



			let scrapedObjs = scrapeSnippetsFromPage();

			for(let i = 0; i < scrapedObjs.length; i++) {
				if(scrapedObjs[i]){
					if(!scrapedObjs[i]) {
						continue;
					}
					allScrapedObjs.push(scrapedObjs[i]);
				}
			}

			setTimeout(function(){
				if (startUrl != endUrl){
					//console.log('startUrl', startUrl, 'endUrl', endUrl )
					isExternalDoc = false;
					scrapeRange(baseUrl+nextUrl,endUrl);
				}
				else if(typeof scrapeType == 'object' && scrapeType.length > 0) {
						initScrapeParameters();
						console.log('beginUrl',beginUrl,'finishUrl',finishUrl);
						scrapeRange(beginUrl,finishUrl);
				}
				else {
					//Time to add back prefixes in where possible
					addPrefixesToAllScrapedObjsWherePossible()


					console.log('\nScraping Complete, sorting then writing allScrapedObjs to file');

					allScrapedObjs.sort(function(a,b) {
						//console.log('comparing',a['sN'].name,'to',b['sN'].name);
						let textA = a.name.toLowerCase();
						let textB = b.name.toLowerCase();
						return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
					});
					writeObjectsToFile(allScrapedObjs);


					convertAllScrapedObjsToDictionaryFormat();
					writeDiffBetween

					process.exit();
				};
			}, 100); //The speed 100 is subject to change if we get hit by a rate limiter
		}
	});
}




function mergeConsecutivePres() {
	var all = $('*').toArray();
	var $lastItem;
	var $currentItem;
	for(let i = 0; i < all.length; i++) {
		$currentItem = $(all[i]);
		 if($lastItem && $currentItem.prop('tagName') == 'PRE' && $lastItem.prop('tagName') == 'PRE') {
			 $lastItem.text($lastItem.text() + $currentItem.text());
		 } else {
			 $lastItem = $currentItem;
		 }
	}
}

function scrapeSnippetsFromPage() {
	let $allSyntaxCodeSections = $('.titleinrefsubsect:contains("Syntax"),'+
																 '.subhead1:contains("Syntax"),' +
																 '.subhead2:contains("Syntax")'
															 );

	if($allSyntaxCodeSections.length == 0){
		console.log('No Syntax Code Found')
		return [null];
	} else if ($allSyntaxCodeSections.length > 1)
	{
		let allSyntaxCodeSections = $allSyntaxCodeSections.toArray();
		let rslts = [];
		for(let i = 0; i < allSyntaxCodeSections.length; i++) {
			let $snippetHNode =  getPrevHNode($(allSyntaxCodeSections[i]));
			rslts.push(scrapeSingleSnippet(getSyntaxText($(allSyntaxCodeSections[i])), $snippetHNode));
		}
		return rslts;
	} else {
		let $snippetHNode = getPrevHNode($allSyntaxCodeSections);
		return [scrapeSingleSnippet(getSyntaxText($allSyntaxCodeSections), $snippetHNode)];
	}
}

function getPrevHNode($syntaxCodeSection) {

	let firstH = null;
	let seedNode = $syntaxCodeSection[0];
	let walk_the_DOM = function walk(node, func) {
			let rslt;
			if(rslt = func(node)) {
					if(rslt != 'found no pre') {
						firstH = node;
					} else {

					}
					return;
			};

			node = node.firstChild;
			while (node && !firstH) {
					walk(node, func);
					node = node.nextSibling;
			}
	};

	while(!firstH && seedNode) {
			walk_the_DOM(seedNode, function(node) {
					if(node && node.tagName && node.tagName) {
							let tagName = node.tagName.toLowerCase();
							if(tagName == 'h1' ||
								 tagName == 'h2' ||
								 tagName == 'h3') {
								 return node;
							}
					}
			});

		if($(seedNode).prev().length) {
			seedNode = $(seedNode).prev()[0];
		}
		else {
			seedNode = $(seedNode).parent()[0];
		}
	}
	return $(firstH);

}

function getSyntaxText($syntaxCodeSection) {
	let $section = $syntaxCodeSection;

	let firstPre = null;
	let foundNewSection = false;
	let sectionClass = $section[0].attribs.class; //For some reason cheerio doesn't like node.tagName or $(node).prop('tagName') here
	let seedNode = $section[0];
  let firstPass = true;
	let walk_the_DOM = function walk(node, func) {
			let rslt;
			if(rslt = func(node)) {
					if(rslt != 'found no pre') {
						firstPre = node;
					} else {
						foundNewSection = true;
					}
					return;
			};

			node = node.firstChild;
			while (node && !firstPre) {
					walk(node, func);
					node = node.nextSibling;
			}
	};

	while(!firstPre && seedNode && !foundNewSection) {
			walk_the_DOM(seedNode, function(node) {
					if(node && node.tagName && node.tagName.toLowerCase() == 'pre') {
							return node;
					}
					else if((node.className == sectionClass) && !firstPass) {
						return 'found no pre';
					}
					firstPass = false;
			});
		if($(seedNode).next().length) {
			seedNode = $(seedNode).next()[0];
		} else {
			seedNode = $(seedNode).parent()[0];
		}
	}

	if(!firstPre || foundNewSection) {
		console.log('-Error- Could not find pre, syntaxCodeSection:', $syntaxCodeSection.text());
		return -1;
	}

	let syntax = $(firstPre).text().trim();

	//Get rid of the occasional starting of: "function" or "procedure" or "exec"
	syntax = syntax.split(' ');
	if(syntax[0].toLowerCase() == 'function' ||
		 syntax[0].toLowerCase() == 'procedure' ||
		 syntax[0].toLowerCase() == 'exec') {
		syntax.splice(0,1);
	}
	syntax = syntax.join(' ');

	//console.log('syntax: ', syntax);
	return syntax;
}

function scrapeSingleSnippet(syntax, $snippetHNode) {
		if(syntax == -1) {
			return null;
		}

		let firstId = null;
		let seedNode = $snippetHNode[0];
		let walk_the_DOM = function walk(node, func) {
				if(func(node)) {
						return;
				};

				node = node.firstChild;
				while (node && !firstId) {
						walk(node, func);
						node = node.nextSibling;
				}
		};

		while(!firstId && seedNode) {
			walk_the_DOM(seedNode, function(node) {
					if(node && $(node) && $(node).prop('id')) {
							firstId = $(node).prop('id');
							return true;
					}
			});
			if(!$(seedNode).next().legnth) {
				seedNode = $(seedNode).next()[0];
			}
			else {
				seedNode = $(seedNode).parent()[0];
			}

		}

		if(!firstId) {
			console.log('-Error-Cannot find id for snippet');
			snippetUrl = 'error';
		} else {
			//console.log('currentScrapeUrl', currentScrapeUrl);
			//Remove '#'
			snippetUrl = currentScrapeUrl.split('#')[0];
			snippetUrl = snippetUrl + '#' + firstId;
		}

		let name;
		let missingPrefix = false;
		let descriptionText = getSnippetDescriptionText($snippetHNode);

		//Get the name of the function/procedure.
		//Note:the\s* fixes "DBMS_DATA_MINING. ALTER_REVERSE_EXPRESSION (" on http://docs.oracle.com/cd/B28359_01/appdev.111/b28419/d_datmin.htm#CACCBBJG
		var nameReg = /^[\w]+(\s*\.\s*)?[\w]+/;
		name = syntax.match(nameReg);
		if(!name || !name[0]) {
			return null;
		}
		else {
			name = name[0].toLowerCase();
		}
		//console.log('name: ' + name);
		if(getFirstSignatureOnly) {
			if(allSignatures[name]) {
				//console.log('skipping ' + name + ', signature already found');
				return null;
			} else {
				allSignatures[name] = true;
			}
		} else {
			if(!allSignatures[name]) {
				allSignatures[name] = 1;
			} else {
				allSignatures[name]++;
				signatureNum = allSignatures[name];
			}
		}

		if(name.indexOf('.') == -1) {
			if(!isExternalDoc) {
				if(isApexScrape && (apexVersion == 5.1 || apxVersion == 4.2)) {
					let regexp = /<meta name="keywords" content="([^"]+)"/;
					let rslt = regexp.exec($('html').html());
					if(rslt) {
						//console.log('found content to search through');
						let content = rslt[1];
						let apexPrefix = null;
						let onlyOneApexPrefix = true;
						content = content.split(',');
						for(let i = 0; i < content.length; i++) {
							content[i] = content[i].toLowerCase().trim();
							//console.log(content[i]);
							if(content[i].indexOf('apex_') == 0 && !apexPrefix) {
								apexPrefix = content[i].match(/apex_[\w]+/)[0];
							} else if(content[i].indexOf('apex_') == 0 && apexPrefix){
								//Looks like there's more than one apexPrefix so we can't draw any conclusions
								onlyOneApexPrefix = false;
								break;
							}
						}
						if(!apexPrefix)  {
							onlyOneApexPrefix = false;
						}

						if(onlyOneApexPrefix) {
							name = apexPrefix + '.' + name;
						}
					}

				} else {
					name = $('title').text().trim().split(' ')[0].toUpperCase() + '.' + name;
				}
			}
			else {
				console.log('-Warning- Name without period', name);
				missingPrefix = true;
			}
		}

		let packageName = '';
		if(name.indexOf('.') != -1) {
			packageName = name.match('^[^\.]+')[0];
		}
		let procFuncName = name.match('[^\.]+$')[0];

		console.log('scraping', name);
		//console.log('syntax', syntax);

		let body = "";
		let bodyNoDefault = "";
		let bodyFullText = syntax;
		let containsNonStandardParameterLine = false;
		let parameters = [];

		if(!doNotScrapeBody) {
			if(syntax.indexOf('(') == -1) {
				body = "";
			}
			else {
				//ASSUMPTIONS
				//Each paramter begins with /\w/

				let tmpCode;

				//Lop off the front
				tmpCode = syntax.replace(/^[^\(]+\(/,'');
				//Lop off the end (note: we want the LAST end parenthesis, hence the lookahead)
				tmpCode = tmpCode.replace(/\)(?=([^\)]+$))[^$]*?$/,'');

				let tmpCodeBase = tmpCode;
				tmpCode = "";
				isInStr = false;
				parenthesis = 1;
				for(let i = 0; i < tmpCodeBase.length; i++) {

					if(tmpCodeBase[i] == "'") {
						isInStr = !isInStr;
					}
					else if(!isInStr && tmpCodeBase[i] == ')') {
						parenthesis--;
						}
					else if(!isInStr && tmpCodeBase[i] == '(') {
							parenthesis++;
					}
					if(parenthesis != 0) {
							tmpCode += tmpCodeBase[i];
						} else {
							break;
						}
				}

				tmpCode = tmpCode.trim();



				if(!tmpCode || tmpCode == "") {
					console.log('-Warning- tmpCode is empty, Syntax:', syntax );
					body = "";
				}
				else {
					//The first half of the regex matches for when there's a default
					//The second half of the regex regex matches for when there is no default
					tmpCode = tmpCode.replace(/[\t \r]*([\w]+)[^,]+?(default|\:\=)\s([^,\n]+)[^\n]*|[\t \r]*([\w]+)[^\n]*/gi, '$1,$2,$3,$4');
					tmpCode = tmpCode.split('\n');
					let cursorIndexSkipDefault = 0;
					let cursorIndex = 0;
					//NOTE: For now prefixSpaces will always be a single tab, maybe later we'll change This
					//The issue is that atom's snippet interpretter has difficulty with tabbing at the start of a new line
					let prefixSpaces = '\t';
					//console.log(tmpCode);
					for(let i = 0; i < tmpCode.length; i++) {
						tmpCode[i] = tmpCode[i].split(',');
						if(tmpCode[i].length != 4) {
							//There is either no parameter here and instead something like "..."
							//e.g. http://docs.oracle.com/database/apex-5.1/AEAPI/ADD_MEMBER-Procedure.htm
							tmpCode[i] = tmpCode[i].join(',').trim();
							console.log('-Warning- found non-standard parameter line: ' + tmpCode[i]);
							containsNonStandardParameterLine = true;
							tmpCode[i] = prefixSpaces + tmpCode[i] + '\n';
							body += tmpCode[i];
							bodyNoDefault += tmpCode[i];
							continue;
						}
						cursorIndex++;
						let param;
						//Check to see whether we have a default or not
						if(tmpCode[i][3] != "") {
							//We don't have a default
							param = tmpCode[i][3];
							param = param.trim();
							cursorIndexSkipDefault++;

							body += prefixSpaces + ', ' + param + ' => $' + cursorIndexSkipDefault + '\n';
							bodyNoDefault += prefixSpaces + ', ' + param + ' => $' + cursorIndex + '\n';
							parameters.push(param);
						}
						else
						{
							//We do have a default
							param = tmpCode[i][0];
							param = param.trim();
							let defaultVal = tmpCode[i][2];
							body += prefixSpaces + ', ' + param + ' => ' + defaultVal + '\n';
							bodyNoDefault += prefixSpaces + ', ' + param + ' => $' + cursorIndex + '\n';
							parameters.push(param);
						}



						//We set prefixSpaces to 0 because we're on the second line or lower
						prefixSpaces = '\t';

					}
					//Remove the first comma and trailing whitespace
					body = body.replace(/,/, ' ');
					body = body.replace(/[\r\n\s\t]*$/, '');
					bodyNoDefault = bodyNoDefault.replace(/,/, ' ');
					bodyNoDefault = bodyNoDefault.replace(/[\r\n\s\t]*$/, '');

				}
			}
		}

		if(!name) {
			console.log('-Error- name is empty or undefined')
		}

		return {
			name: name,
			packageName: packageName,
			procFuncName: procFuncName,
			body: body,
			bodyNoDefault: bodyNoDefault,
			bodyFullText: bodyFullText,
			parameters: parameters,
			url: snippetUrl,
			descriptionText: descriptionText,
			rightLabelHTML: '',
			containsNonStandardParameterLine: containsNonStandardParameterLine,
			missingPrefix: missingPrefix,
			isApexFuncProc: isApexScrape,
			apexVersion: apexVersion ? apexVersion : null
		}
}

function addPrefixToName(name) {
	name = name.trim();
	console.log('-Error- Name found without prefix', name);
	return name;
}



//ASSUMPTION - the first text after the h1/h2 we are given will always contain the description text
//ASSUMPTION - we are already on a page where a snippet is found
function getSnippetDescriptionText($desc) {
	$desc = $desc.next();
	if(!$desc || $desc.length != 1) {
		console.log('-Warning-: unable to find description for snippet')
	}
	let text = $desc.text().trim().match(/[^\n]+/);
	if(text) {
		text = text[0];
	}
	if(!text) {
		console.log('-Warning-: description is empty for snippet')
		text = "";
	}
	text = text.replace(/[^\\]\\[^']/g,'\\\\'); //Replace \ with \\ unless it's escaping nothing or a '
	text = text.replace(/[^\\]\'/g,'\\\''); //Replace ' with \', unless it's already escaped.

	return text;
}


function addPrefixesToAllScrapedObjsWherePossible() {
	let lasPrefix = "";
	let nextPrefix = "";
	for(let i = 1; i < allScrapedObjs.length -1; i++) {
		if(allScrapedObjs[i].missingPrefix) {
			lastPrefix = allScrapedObjs[i-1].name.match(/^[^\.]+\./);
			nextPrefix = allScrapedObjs[i+1].name.match(/^[^\.]+\./);
			if(lastPrefix && nextPrefix) {
				lastPrefix = lastPrefix[0].replace(/\./,'').toUpperCase();
				nextPrefix = nextPrefix[0].replace(/\./,'').toUpperCase();
				if(lastPrefix == nextPrefix) {
					allScrapedObjs[i].name = nextPrefix + allScrapedObjs[i].name;
					allScrapedObjs[i].missingPrefix = false;
				}
			} else {
				console.log('-Error-Cannot find prefix for ' + allScrapedObjs[i].name);
			}
		}
	}
}

function writeObjectsToFile(allScrapedObjects){

	fs.writeFileSync(filename, JSON.stringify(allScrapedObjects));

	console.log('Finished. Scraped ' + allScrapedObjects.length + ' funcs/procs');
	let missingPrefixCount = 0;
	let containsNonStandardParameterLineCount = 0;
	for(let i = 0; i < allScrapedObjects.length; i++) {
		if(allScrapedObjects[i].missingPrefix) {
			missingPrefixCount++;
		}
		if(allScrapedObjects[i].containsNonStandardParameterLine){
			containsNonStandardParameterLineCount++;
		}
	}

	console.log('# MissingPrefixes: ' + missingPrefixCount + ', # w/ nonstandard parameter line: ' + containsNonStandardParameterLineCount );
	console.log('Writing to File: ' + filename);
}


scrapeRange(beginUrl,finishUrl);
exports = module.exports = app;
