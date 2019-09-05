(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.outdatedBrowserRework = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/* Highly dumbed down version of https://github.com/unclechu/node-deep-extend */

/**
 * Extening object that entered in first argument.
 *
 * Returns extended object or false if have no target object or incorrect type.
 *
 * If you wish to clone source object (without modify it), just use empty new
 * object as first argument, like this:
 *   deepExtend({}, yourObj_1, [yourObj_N]);
 */
module.exports = function deepExtend(/*obj_1, [obj_2], [obj_N]*/) {
	if (arguments.length < 1 || typeof arguments[0] !== "object") {
		return false
	}

	if (arguments.length < 2) {
		return arguments[0]
	}

	var target = arguments[0]

	for (var i = 1; i < arguments.length; i++) {
		var obj = arguments[i]

		for (var key in obj) {
			var src = target[key]
			var val = obj[key]

			if (typeof val !== "object" || val === null) {
				target[key] = val

				// just clone arrays (and recursive clone objects inside)
			} else if (typeof src !== "object" || src === null) {
				target[key] = deepExtend({}, val)

				// source value and new value is objects both, extending...
			} else {
				target[key] = deepExtend(src, val)
			}
		}
	}

	return target
}

},{}],2:[function(require,module,exports){
var UserAgentParser = require("ua-parser-js")
var languageMessages = require("./languages.json")
var deepExtend = require("./extend")

var DEFAULTS = {
	Chrome: 57, // Includes Chrome for mobile devices
	Edge: 39,
	Safari: 10,
	"Mobile Safari": 10,
	Opera: 50,
	Firefox: 50,
	Vivaldi: 1,
	IE: false
}

var LAST_KNOWN_EDGEHTML_VERSION = 18
var EDGEHTML_VS_EDGE_VERSIONS = {
	12: 0.1,
	13: 21,
	14: 31,
	15: 39,
	16: 41,
	17: 42
}
EDGEHTML_VS_EDGE_VERSIONS[LAST_KNOWN_EDGEHTML_VERSION] = 44

var COLORS = {
	salmon: "#f25648",
	white: "white"
}

var updateDefaults = function(defaults, updatedValues) {
	for (var key in updatedValues) {
		defaults[key] = updatedValues[key]
	}

	return defaults
}

module.exports = function(options) {
	var main = function() {
		// Despite the docs, UA needs to be provided to constructor explicitly:
		// https://github.com/faisalman/ua-parser-js/issues/90
		var parsedUserAgent = new UserAgentParser(window.navigator.userAgent).getResult()

		// Variable definition (before ajax)
		var outdatedUI = document.getElementById("outdated")

		options = options || {}

		var browserLocale = window.navigator.language || window.navigator.userLanguage // Everyone else, IE

		// Set default options
		var browserSupport = options.browserSupport ? updateDefaults(DEFAULTS, options.browserSupport) : DEFAULTS
		// CSS property to check for. You may also like 'borderSpacing', 'boxShadow', 'transform', 'borderImage';
		var requiredCssProperty = options.requiredCssProperty || false
		var backgroundColor = options.backgroundColor || COLORS.salmon
		var textColor = options.textColor || COLORS.white
		var fullscreen = options.fullscreen || false
		var language = options.language || browserLocale.slice(0, 2) // Language code

		var updateSource = "web" // Other possible values are 'googlePlay' or 'appStore'. Determines where we tell users to go for upgrades.

		// Chrome mobile is still Chrome (unlike Safari which is 'Mobile Safari')
		var isAndroid = parsedUserAgent.os.name === "Android"
		if (isAndroid) {
			updateSource = "googlePlay"
		}

		var isAndroidButNotChrome
		if (options.requireChromeOnAndroid) {
			isAndroidButNotChrome = isAndroid && parsedUserAgent.browser.name !== "Chrome"
		}

		if (parsedUserAgent.os.name === "iOS") {
			updateSource = "appStore"
		}

		var done = true

		var changeOpacity = function(opacityValue) {
			outdatedUI.style.opacity = opacityValue / 100
			outdatedUI.style.filter = "alpha(opacity=" + opacityValue + ")"
		}

		var fadeIn = function(opacityValue) {
			changeOpacity(opacityValue)
			if (opacityValue === 1) {
				outdatedUI.style.display = "table"
			}
			if (opacityValue === 100) {
				done = true
			}
		}

		var parseMinorVersion = function (version) {
			return version.replace(/[^\d.]/g,'').split(".")[1];
		}

		var isBrowserUnsupported = function() {
			var browserName = parsedUserAgent.browser.name
			var isUnsupported = false
			if (!(browserName in browserSupport)) {
				if (!options.isUnknownBrowserOK) {
					isUnsupported = true
				}
			} else if (!browserSupport[browserName]) {
				isUnsupported = true
			}
			return isUnsupported;
		}

		var isBrowserOutOfDate = function() {
			var browserName = parsedUserAgent.browser.name
			var browserMajorVersion = parsedUserAgent.browser.major
			if (browserName === "Edge") {
				var edgeVersion = EDGEHTML_VS_EDGE_VERSIONS[browserMajorVersion]
				var IS_UNKNOWN_EDGEHTML = !edgeVersion 
				if (IS_UNKNOWN_EDGEHTML) {
					var IS_NEW_UNKNOWN_EDGEHTML = browserMajorVersion > LAST_KNOWN_EDGEHTML_VERSION
					if (IS_NEW_UNKNOWN_EDGEHTML) {
						edgeVersion = EDGEHTML_VS_EDGE_VERSIONS[LAST_KNOWN_EDGEHTML_VERSION]
					}
				}
				browserMajorVersion = edgeVersion
			}
			var isOutOfDate = false
			if (isBrowserUnsupported()) {
				isOutOfDate = true;
			} else if (browserName in browserSupport) {
				var minVersion = browserSupport[browserName];
				if (typeof minVersion == 'object') {
					var minMajorVersion = minVersion.major;
					var minMinorVersion = minVersion.minor;

					if (browserMajorVersion < minMajorVersion) {
						isOutOfDate = true
					} else if (browserMajorVersion == minMajorVersion) {
						var browserMinorVersion = parseMinorVersion(parsedUserAgent.browser.version)

						if (browserMinorVersion < minMinorVersion) {
							isOutOfDate = true
						}
					}
				} else if (browserMajorVersion < minVersion) {
					isOutOfDate = true
				}
			}
			return isOutOfDate
		}

		// Returns true if a browser supports a css3 property
		var isPropertySupported = function(property) {
			if (!property) {
				return true
			}
			var div = document.createElement("div")
			var vendorPrefixes = ["khtml", "ms", "o", "moz", "webkit"]
			var count = vendorPrefixes.length

			// Note: HTMLElement.style.hasOwnProperty seems broken in Edge
			if (property in div.style) {
				return true
			}

			property = property.replace(/^[a-z]/, function(val) {
				return val.toUpperCase()
			})

			while (count--) {
				var prefixedProperty = vendorPrefixes[count] + property
				// See comment re: HTMLElement.style.hasOwnProperty above
				if (prefixedProperty in div.style) {
					return true
				}
			}
			return false
		}

		var makeFadeInFunction = function(opacityValue) {
			return function() {
				fadeIn(opacityValue)
			}
		}

		// Style element explicitly - TODO: investigate and delete if not needed
		var startStylesAndEvents = function() {
			var buttonClose = document.getElementById("buttonCloseUpdateBrowser")
			var buttonUpdate = document.getElementById("buttonUpdateBrowser")

			//check settings attributes
			outdatedUI.style.backgroundColor = backgroundColor
			//way too hard to put !important on IE6
			outdatedUI.style.color = textColor
			outdatedUI.children[0].children[0].style.color = textColor
			outdatedUI.children[0].children[1].style.color = textColor

			// Update button is desktop only
			if (buttonUpdate) {
				buttonUpdate.style.color = textColor
				if (buttonUpdate.style.borderColor) {
					buttonUpdate.style.borderColor = textColor
				}

				// Override the update button color to match the background color
				buttonUpdate.onmouseover = function() {
					this.style.color = backgroundColor
					this.style.backgroundColor = textColor
				}

				buttonUpdate.onmouseout = function() {
					this.style.color = textColor
					this.style.backgroundColor = backgroundColor
				}
			}

			buttonClose.style.color = textColor

			buttonClose.onmousedown = function() {
				outdatedUI.style.display = "none"
				return false
			}
		}

		var getmessage = function(lang) {
			var defaultMessages = languageMessages[lang] || languageMessages.en
			var customMessages = options.messages && options.messages[lang]
			var messages = deepExtend({}, defaultMessages, customMessages)

			var updateMessages = {
				web:
					"<p>" +
					messages.update.web +
					(messages.url ? (
						'<a id="buttonUpdateBrowser" rel="nofollow" href="' +
						messages.url +
						'">' +
						messages.callToAction +
						"</a>"
					) : '') +
					"</p>",
				googlePlay:
					"<p>" +
					messages.update.googlePlay +
					'<a id="buttonUpdateBrowser" rel="nofollow" href="https://play.google.com/store/apps/details?id=com.android.chrome">' +
					messages.callToAction +
					"</a></p>",
				appStore: "<p>" + messages.update[updateSource] + "</p>"
			}

			var updateMessage = updateMessages[updateSource]

			var browserSupportMessage = messages.outOfDate;
			if (isBrowserUnsupported() && messages.unsupported) {
				browserSupportMessage = messages.unsupported;
			}

			return (
				'<div class="vertical-center"><h6>' +
				browserSupportMessage +
				"</h6>" +
				updateMessage +
				'<p class="last"><a href="#" id="buttonCloseUpdateBrowser" title="' +
				messages.close +
				'">&times;</a></p></div>'
			)
		}

		// Check if browser is supported
		if (isBrowserOutOfDate() || !isPropertySupported(requiredCssProperty) || isAndroidButNotChrome) {
			// This is an outdated browser
			if (done && outdatedUI.style.opacity !== "1") {
				done = false

				for (var opacity = 1; opacity <= 100; opacity++) {
					setTimeout(makeFadeInFunction(opacity), opacity * 8)
				}
			}

			var insertContentHere = document.getElementById("outdated")
			if (fullscreen) {
				insertContentHere.classList.add("fullscreen")
			}
			insertContentHere.innerHTML = getmessage(language)
			startStylesAndEvents()
		}
	}

	// Load main when DOM ready.
	var oldOnload = window.onload
	if (typeof window.onload !== "function") {
		window.onload = main
	} else {
		window.onload = function() {
			if (oldOnload) {
				oldOnload()
			}
			main()
		}
	}
}

},{"./extend":1,"./languages.json":3,"ua-parser-js":4}],3:[function(require,module,exports){
module.exports={
  "br": {
    "outOfDate": "O seu navegador est&aacute; desatualizado!",
    "update": {
      "web": "Atualize o seu navegador para ter uma melhor experi&ecirc;ncia e visualiza&ccedil;&atilde;o deste site. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/br",
    "callToAction": "Atualize o seu navegador agora",
    "close": "Fechar"
  },
  "ca": {
    "outOfDate": "El vostre navegador no està actualitzat!",
    "update": {
      "web": "Actualitzeu el vostre navegador per veure correctament aquest lloc web. ",
      "googlePlay": "Instal·leu Chrome des de Google Play",
      "appStore": "Actualitzeu iOS des de l'aplicació Configuració"
    },
    "url": "http://outdatedbrowser.com/es",
    "callToAction": "Actualitzar el meu navegador ara",
    "close": "Tancar"
  },
  "cn": {
    "outOfDate": "您的浏览器已过时",
    "update": {
      "web": "要正常浏览本网站请升级您的浏览器。",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/cn",
    "callToAction": "现在升级",
    "close": "关闭"
  },
  "cz": {
    "outOfDate": "Váš prohlížeč je zastaralý!",
    "update": {
      "web": "Pro správné zobrazení těchto stránek aktualizujte svůj prohlížeč. ",
      "googlePlay": "Nainstalujte si Chrome z Google Play",
      "appStore": "Aktualizujte si systém iOS"
    },
    "url": "http://outdatedbrowser.com/cz",
    "callToAction": "Aktualizovat nyní svůj prohlížeč",
    "close": "Zavřít"
  },
   "da": {
    "outOfDate": "Din browser er forældet!",
    "update": {
      "web": "Opdatér din browser for at få vist denne hjemmeside korrekt. ",
      "googlePlay": "Installér venligst Chrome fra Google Play",
      "appStore": "Opdatér venligst iOS"
    },
    "url": "http://outdatedbrowser.com/da",
    "callToAction": "Opdatér din browser nu",
    "close": "Luk"
  },
  "de": {
    "outOfDate": "Ihr Browser ist veraltet!",
    "update": {
      "web": "Bitte aktualisieren Sie Ihren Browser, um diese Website korrekt darzustellen. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/de",
    "callToAction": "Den Browser jetzt aktualisieren ",
    "close": "Schließen"
  },
  "ee": {
    "outOfDate": "Sinu veebilehitseja on vananenud!",
    "update": {
      "web": "Palun uuenda oma veebilehitsejat, et näha lehekülge korrektselt. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/ee",
    "callToAction": "Uuenda oma veebilehitsejat kohe",
    "close": "Sulge"
  },
  "en": {
    "outOfDate": "Your browser is out-of-date!",
    "update": {
      "web": "Update your browser to view this website correctly. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/",
    "callToAction": "Update my browser now",
    "close": "Close"
  },
  "es": {
    "outOfDate": "¡Tu navegador está anticuado!",
    "update": {
      "web": "Actualiza tu navegador para ver esta página correctamente. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/es",
    "callToAction": "Actualizar mi navegador ahora",
    "close": "Cerrar"
  },
  "fa": {
    "rightToLeft": true,
    "outOfDate": "مرورگر شما منسوخ شده است!",
    "update": {
      "web": "جهت مشاهده صحیح این وبسایت، مرورگرتان را بروز رسانی نمایید. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/",
    "callToAction": "همین حالا مرورگرم را بروز کن",
    "close": "Close"
  },
  "fi": {
    "outOfDate": "Selaimesi on vanhentunut!",
    "update": {
      "web": "Lataa ajantasainen selain n&auml;hd&auml;ksesi t&auml;m&auml;n sivun oikein. ",
      "googlePlay": "Asenna uusin Chrome Google Play -kaupasta",
      "appStore": "Päivitä iOS puhelimesi asetuksista"
    },
    "url": "http://outdatedbrowser.com/fi",
    "callToAction": "P&auml;ivit&auml; selaimeni nyt ",
    "close": "Sulje"
  },
  "fr": {
    "outOfDate": "Votre navigateur n'est plus compatible !",
    "update": {
      "web": "Mettez à jour votre navigateur pour afficher correctement ce site Web. ",
      "googlePlay": "Merci d'installer Chrome depuis le Google Play Store",
      "appStore": "Merci de mettre à jour iOS depuis l'application Réglages"
    },
    "url": "http://outdatedbrowser.com/fr",
    "callToAction": "Mettre à jour maintenant ",
    "close": "Fermer"
  },
  "hu": {
    "outOfDate": "A böngészője elavult!",
    "update": {
      "web": "Firssítse vagy cserélje le a böngészőjét. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/hu",
    "callToAction": "A böngészőm frissítése ",
    "close": "Close"
  },
  "id":{
    "outOfDate": "Browser yang Anda gunakan sudah ketinggalan zaman!",
    "update": {
      "web": "Perbaharuilah browser Anda agar bisa menjelajahi website ini dengan nyaman. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/",
    "callToAction": "Perbaharui browser sekarang ",
    "close": "Close"
  },
  "it": {
    "outOfDate": "Il tuo browser non &egrave; aggiornato!",
    "update": {
      "web": "Aggiornalo per vedere questo sito correttamente. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/it",
    "callToAction": "Aggiorna ora",
    "close": "Chiudi"
  },
  "lt":{
    "outOfDate": "Jūsų naršyklės versija yra pasenusi!",
    "update": {
      "web": "Atnaujinkite savo naršyklę, kad galėtumėte peržiūrėti šią svetainę tinkamai. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/",
    "callToAction": "Atnaujinti naršyklę ",
    "close": "Close"
  },
  "nl": {
    "outOfDate": "Je gebruikt een oude browser!",
    "update": {
      "web": "Update je browser om deze website correct te bekijken. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/nl",
    "callToAction": "Update mijn browser nu ",
    "close": "Sluiten"
  },
  "pl": {
    "outOfDate": "Twoja przeglądarka jest przestarzała!",
    "update": {
      "web": "Zaktualizuj swoją przeglądarkę, aby poprawnie wyświetlić tę stronę. ",
      "googlePlay": "Proszę zainstalować przeglądarkę Chrome ze sklepu Google Play",
      "appStore": "Proszę zaktualizować iOS z Ustawień"
    },
    "url": "http://outdatedbrowser.com/pl",
    "callToAction": "Zaktualizuj przeglądarkę już teraz",
    "close": "Zamknij"
  },
  "pt": {
    "outOfDate": "O seu browser est&aacute; desatualizado!",
    "update": {
      "web": "Atualize o seu browser para ter uma melhor experi&ecirc;ncia e visualiza&ccedil;&atilde;o deste site. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/pt",
    "callToAction": "Atualize o seu browser agora",
    "close": "Fechar"
  },
  "ro": {
    "outOfDate": "Browserul este învechit!",
    "update": {
      "web": "Actualizați browserul pentru a vizualiza corect acest site. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/",
    "callToAction": "Actualizați browserul acum!",
    "close": "Close"
  },
  "ru": {
    "outOfDate": "Ваш браузер устарел!",
    "update": {
      "web": "Обновите ваш браузер для правильного отображения этого сайта. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/ru",
    "callToAction": "Обновить мой браузер ",
    "close": "Закрыть"
  },
  "si": {
    "outOfDate": "Vaš brskalnik je zastarel!",
    "update": {
      "web": "Za pravilen prikaz spletne strani posodobite vaš brskalnik. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/si",
    "callToAction": "Posodobi brskalnik ",
    "close": "Zapri"
  },
  "sv": {
    "outOfDate": "Din webbläsare stödjs ej längre!",
    "update": {
      "web": "Uppdatera din webbläsare för att webbplatsen ska visas korrekt. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/",
    "callToAction": "Uppdatera min webbläsare nu",
    "close": "Stäng"
  },
  "ua": {
    "outOfDate": "Ваш браузер застарів!",
    "update": {
      "web": "Оновіть ваш браузер для правильного відображення цього сайта. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/ua",
    "callToAction": "Оновити мій браузер ",
    "close": "Закрити"
  }
}

},{}],4:[function(require,module,exports){
/*!
 * UAParser.js v0.7.20
 * Lightweight JavaScript-based User-Agent string parser
 * https://github.com/faisalman/ua-parser-js
 *
 * Copyright © 2012-2019 Faisal Salman <f@faisalman.com>
 * Licensed under MIT License
 */

(function (window, undefined) {

    'use strict';

    //////////////
    // Constants
    /////////////


    var LIBVERSION  = '0.7.20',
        EMPTY       = '',
        UNKNOWN     = '?',
        FUNC_TYPE   = 'function',
        UNDEF_TYPE  = 'undefined',
        OBJ_TYPE    = 'object',
        STR_TYPE    = 'string',
        MAJOR       = 'major', // deprecated
        MODEL       = 'model',
        NAME        = 'name',
        TYPE        = 'type',
        VENDOR      = 'vendor',
        VERSION     = 'version',
        ARCHITECTURE= 'architecture',
        CONSOLE     = 'console',
        MOBILE      = 'mobile',
        TABLET      = 'tablet',
        SMARTTV     = 'smarttv',
        WEARABLE    = 'wearable',
        EMBEDDED    = 'embedded';


    ///////////
    // Helper
    //////////


    var util = {
        extend : function (regexes, extensions) {
            var mergedRegexes = {};
            for (var i in regexes) {
                if (extensions[i] && extensions[i].length % 2 === 0) {
                    mergedRegexes[i] = extensions[i].concat(regexes[i]);
                } else {
                    mergedRegexes[i] = regexes[i];
                }
            }
            return mergedRegexes;
        },
        has : function (str1, str2) {
          if (typeof str1 === "string") {
            return str2.toLowerCase().indexOf(str1.toLowerCase()) !== -1;
          } else {
            return false;
          }
        },
        lowerize : function (str) {
            return str.toLowerCase();
        },
        major : function (version) {
            return typeof(version) === STR_TYPE ? version.replace(/[^\d\.]/g,'').split(".")[0] : undefined;
        },
        trim : function (str) {
          return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        }
    };


    ///////////////
    // Map helper
    //////////////


    var mapper = {

        rgx : function (ua, arrays) {

            var i = 0, j, k, p, q, matches, match;

            // loop through all regexes maps
            while (i < arrays.length && !matches) {

                var regex = arrays[i],       // even sequence (0,2,4,..)
                    props = arrays[i + 1];   // odd sequence (1,3,5,..)
                j = k = 0;

                // try matching uastring with regexes
                while (j < regex.length && !matches) {

                    matches = regex[j++].exec(ua);

                    if (!!matches) {
                        for (p = 0; p < props.length; p++) {
                            match = matches[++k];
                            q = props[p];
                            // check if given property is actually array
                            if (typeof q === OBJ_TYPE && q.length > 0) {
                                if (q.length == 2) {
                                    if (typeof q[1] == FUNC_TYPE) {
                                        // assign modified match
                                        this[q[0]] = q[1].call(this, match);
                                    } else {
                                        // assign given value, ignore regex match
                                        this[q[0]] = q[1];
                                    }
                                } else if (q.length == 3) {
                                    // check whether function or regex
                                    if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                        // call function (usually string mapper)
                                        this[q[0]] = match ? q[1].call(this, match, q[2]) : undefined;
                                    } else {
                                        // sanitize match using given regex
                                        this[q[0]] = match ? match.replace(q[1], q[2]) : undefined;
                                    }
                                } else if (q.length == 4) {
                                        this[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined;
                                }
                            } else {
                                this[q] = match ? match : undefined;
                            }
                        }
                    }
                }
                i += 2;
            }
        },

        str : function (str, map) {

            for (var i in map) {
                // check if array
                if (typeof map[i] === OBJ_TYPE && map[i].length > 0) {
                    for (var j = 0; j < map[i].length; j++) {
                        if (util.has(map[i][j], str)) {
                            return (i === UNKNOWN) ? undefined : i;
                        }
                    }
                } else if (util.has(map[i], str)) {
                    return (i === UNKNOWN) ? undefined : i;
                }
            }
            return str;
        }
    };


    ///////////////
    // String map
    //////////////


    var maps = {

        browser : {
            oldsafari : {
                version : {
                    '1.0'   : '/8',
                    '1.2'   : '/1',
                    '1.3'   : '/3',
                    '2.0'   : '/412',
                    '2.0.2' : '/416',
                    '2.0.3' : '/417',
                    '2.0.4' : '/419',
                    '?'     : '/'
                }
            }
        },

        device : {
            amazon : {
                model : {
                    'Fire Phone' : ['SD', 'KF']
                }
            },
            sprint : {
                model : {
                    'Evo Shift 4G' : '7373KT'
                },
                vendor : {
                    'HTC'       : 'APA',
                    'Sprint'    : 'Sprint'
                }
            }
        },

        os : {
            windows : {
                version : {
                    'ME'        : '4.90',
                    'NT 3.11'   : 'NT3.51',
                    'NT 4.0'    : 'NT4.0',
                    '2000'      : 'NT 5.0',
                    'XP'        : ['NT 5.1', 'NT 5.2'],
                    'Vista'     : 'NT 6.0',
                    '7'         : 'NT 6.1',
                    '8'         : 'NT 6.2',
                    '8.1'       : 'NT 6.3',
                    '10'        : ['NT 6.4', 'NT 10.0'],
                    'RT'        : 'ARM'
                }
            }
        }
    };


    //////////////
    // Regex map
    /////////////


    var regexes = {

        browser : [[

            // Presto based
            /(opera\smini)\/([\w\.-]+)/i,                                       // Opera Mini
            /(opera\s[mobiletab]+).+version\/([\w\.-]+)/i,                      // Opera Mobi/Tablet
            /(opera).+version\/([\w\.]+)/i,                                     // Opera > 9.80
            /(opera)[\/\s]+([\w\.]+)/i                                          // Opera < 9.80
            ], [NAME, VERSION], [

            /(opios)[\/\s]+([\w\.]+)/i                                          // Opera mini on iphone >= 8.0
            ], [[NAME, 'Opera Mini'], VERSION], [

            /\s(opr)\/([\w\.]+)/i                                               // Opera Webkit
            ], [[NAME, 'Opera'], VERSION], [

            // Mixed
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?([\w\.]*)/i,
                                                                                // Lunascape/Maxthon/Netfront/Jasmine/Blazer

            // Trident based
            /(avant\s|iemobile|slim|baidu)(?:browser)?[\/\s]?([\w\.]*)/i,
                                                                                // Avant/IEMobile/SlimBrowser/Baidu
            /(?:ms|\()(ie)\s([\w\.]+)/i,                                        // Internet Explorer

            // Webkit/KHTML based
            /(rekonq)\/([\w\.]*)/i,                                             // Rekonq
            /(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon)\/([\w\.-]+)/i
                                                                                // Chromium/Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS/Bowser/QupZilla/Falkon
            ], [NAME, VERSION], [

            /(konqueror)\/([\w\.]+)/i                                           // Konqueror
            ], [[NAME, 'Konqueror'], VERSION], [

            /(trident).+rv[:\s]([\w\.]+).+like\sgecko/i                         // IE11
            ], [[NAME, 'IE'], VERSION], [

            /(edge|edgios|edga|edg)\/((\d+)?[\w\.]+)/i                          // Microsoft Edge
            ], [[NAME, 'Edge'], VERSION], [

            /(yabrowser)\/([\w\.]+)/i                                           // Yandex
            ], [[NAME, 'Yandex'], VERSION], [

            /(puffin)\/([\w\.]+)/i                                              // Puffin
            ], [[NAME, 'Puffin'], VERSION], [

            /(focus)\/([\w\.]+)/i                                               // Firefox Focus
            ], [[NAME, 'Firefox Focus'], VERSION], [

            /(opt)\/([\w\.]+)/i                                                 // Opera Touch
            ], [[NAME, 'Opera Touch'], VERSION], [

            /((?:[\s\/])uc?\s?browser|(?:juc.+)ucweb)[\/\s]?([\w\.]+)/i         // UCBrowser
            ], [[NAME, 'UCBrowser'], VERSION], [

            /(comodo_dragon)\/([\w\.]+)/i                                       // Comodo Dragon
            ], [[NAME, /_/g, ' '], VERSION], [

            /(windowswechat qbcore)\/([\w\.]+)/i                                // WeChat Desktop for Windows Built-in Browser
            ], [[NAME, 'WeChat(Win) Desktop'], VERSION], [

            /(micromessenger)\/([\w\.]+)/i                                      // WeChat
            ], [[NAME, 'WeChat'], VERSION], [

            /(brave)\/([\w\.]+)/i                                              // Brave browser
            ], [[NAME, 'Brave'], VERSION], [

            /(qqbrowserlite)\/([\w\.]+)/i                                       // QQBrowserLite
            ], [NAME, VERSION], [

            /(QQ)\/([\d\.]+)/i                                                  // QQ, aka ShouQ
            ], [NAME, VERSION], [

            /m?(qqbrowser)[\/\s]?([\w\.]+)/i                                    // QQBrowser
            ], [NAME, VERSION], [

            /(BIDUBrowser)[\/\s]?([\w\.]+)/i                                    // Baidu Browser
            ], [NAME, VERSION], [

            /(2345Explorer)[\/\s]?([\w\.]+)/i                                   // 2345 Browser
            ], [NAME, VERSION], [

            /(MetaSr)[\/\s]?([\w\.]+)/i                                         // SouGouBrowser
            ], [NAME], [

            /(LBBROWSER)/i                                      // LieBao Browser
            ], [NAME], [

            /xiaomi\/miuibrowser\/([\w\.]+)/i                                   // MIUI Browser
            ], [VERSION, [NAME, 'MIUI Browser']], [

            /;fbav\/([\w\.]+);/i                                                // Facebook App for iOS & Android
            ], [VERSION, [NAME, 'Facebook']], [

            /safari\s(line)\/([\w\.]+)/i,                                       // Line App for iOS
            /android.+(line)\/([\w\.]+)\/iab/i                                  // Line App for Android
            ], [NAME, VERSION], [

            /headlesschrome(?:\/([\w\.]+)|\s)/i                                 // Chrome Headless
            ], [VERSION, [NAME, 'Chrome Headless']], [

            /\swv\).+(chrome)\/([\w\.]+)/i                                      // Chrome WebView
            ], [[NAME, /(.+)/, '$1 WebView'], VERSION], [

            /((?:oculus|samsung)browser)\/([\w\.]+)/i
            ], [[NAME, /(.+(?:g|us))(.+)/, '$1 $2'], VERSION], [                // Oculus / Samsung Browser

            /android.+version\/([\w\.]+)\s+(?:mobile\s?safari|safari)*/i        // Android Browser
            ], [VERSION, [NAME, 'Android Browser']], [

            /(sailfishbrowser)\/([\w\.]+)/i                                     // Sailfish Browser
            ], [[NAME, 'Sailfish Browser'], VERSION], [

            /(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?([\w\.]+)/i
                                                                                // Chrome/OmniWeb/Arora/Tizen/Nokia
            ], [NAME, VERSION], [

            /(dolfin)\/([\w\.]+)/i                                              // Dolphin
            ], [[NAME, 'Dolphin'], VERSION], [

            /((?:android.+)crmo|crios)\/([\w\.]+)/i                             // Chrome for Android/iOS
            ], [[NAME, 'Chrome'], VERSION], [

            /(coast)\/([\w\.]+)/i                                               // Opera Coast
            ], [[NAME, 'Opera Coast'], VERSION], [

            /fxios\/([\w\.-]+)/i                                                // Firefox for iOS
            ], [VERSION, [NAME, 'Firefox']], [

            /version\/([\w\.]+).+?mobile\/\w+\s(safari)/i                       // Mobile Safari
            ], [VERSION, [NAME, 'Mobile Safari']], [

            /version\/([\w\.]+).+?(mobile\s?safari|safari)/i                    // Safari & Safari Mobile
            ], [VERSION, NAME], [

            /webkit.+?(gsa)\/([\w\.]+).+?(mobile\s?safari|safari)(\/[\w\.]+)/i  // Google Search Appliance on iOS
            ], [[NAME, 'GSA'], VERSION], [

            /webkit.+?(mobile\s?safari|safari)(\/[\w\.]+)/i                     // Safari < 3.0
            ], [NAME, [VERSION, mapper.str, maps.browser.oldsafari.version]], [

            /(webkit|khtml)\/([\w\.]+)/i
            ], [NAME, VERSION], [

            // Gecko based
            /(navigator|netscape)\/([\w\.-]+)/i                                 // Netscape
            ], [[NAME, 'Netscape'], VERSION], [
            /(swiftfox)/i,                                                      // Swiftfox
            /(icedragon|iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?([\w\.\+]+)/i,
                                                                                // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
            /(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([\w\.-]+)$/i,

                                                                                // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
            /(mozilla)\/([\w\.]+).+rv\:.+gecko\/\d+/i,                          // Mozilla

            // Other
            /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir)[\/\s]?([\w\.]+)/i,
                                                                                // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Sleipnir
            /(links)\s\(([\w\.]+)/i,                                            // Links
            /(gobrowser)\/?([\w\.]*)/i,                                         // GoBrowser
            /(ice\s?browser)\/v?([\w\._]+)/i,                                   // ICE Browser
            /(mosaic)[\/\s]([\w\.]+)/i                                          // Mosaic
            ], [NAME, VERSION]
        ],

        cpu : [[

            /(?:(amd|x(?:(?:86|64)[_-])?|wow|win)64)[;\)]/i                     // AMD64
            ], [[ARCHITECTURE, 'amd64']], [

            /(ia32(?=;))/i                                                      // IA32 (quicktime)
            ], [[ARCHITECTURE, util.lowerize]], [

            /((?:i[346]|x)86)[;\)]/i                                            // IA32
            ], [[ARCHITECTURE, 'ia32']], [

            // PocketPC mistakenly identified as PowerPC
            /windows\s(ce|mobile);\sppc;/i
            ], [[ARCHITECTURE, 'arm']], [

            /((?:ppc|powerpc)(?:64)?)(?:\smac|;|\))/i                           // PowerPC
            ], [[ARCHITECTURE, /ower/, '', util.lowerize]], [

            /(sun4\w)[;\)]/i                                                    // SPARC
            ], [[ARCHITECTURE, 'sparc']], [

            /((?:avr32|ia64(?=;))|68k(?=\))|arm(?:64|(?=v\d+[;l]))|(?=atmel\s)avr|(?:irix|mips|sparc)(?:64)?(?=;)|pa-risc)/i
                                                                                // IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
            ], [[ARCHITECTURE, util.lowerize]]
        ],

        device : [[

            /\((ipad|playbook);[\w\s\),;-]+(rim|apple)/i                        // iPad/PlayBook
            ], [MODEL, VENDOR, [TYPE, TABLET]], [

            /applecoremedia\/[\w\.]+ \((ipad)/                                  // iPad
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, TABLET]], [

            /(apple\s{0,1}tv)/i                                                 // Apple TV
            ], [[MODEL, 'Apple TV'], [VENDOR, 'Apple']], [

            /(archos)\s(gamepad2?)/i,                                           // Archos
            /(hp).+(touchpad)/i,                                                // HP TouchPad
            /(hp).+(tablet)/i,                                                  // HP Tablet
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /\s(nook)[\w\s]+build\/(\w+)/i,                                     // Nook
            /(dell)\s(strea[kpr\s\d]*[\dko])/i                                  // Dell Streak
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(kf[A-z]+)\sbuild\/.+silk\//i                                      // Kindle Fire HD
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [
            /(sd|kf)[0349hijorstuw]+\sbuild\/.+silk\//i                         // Fire Phone
            ], [[MODEL, mapper.str, maps.device.amazon.model], [VENDOR, 'Amazon'], [TYPE, MOBILE]], [
            /android.+aft([bms])\sbuild/i                                       // Fire TV
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, SMARTTV]], [

            /\((ip[honed|\s\w*]+);.+(apple)/i                                   // iPod/iPhone
            ], [MODEL, VENDOR, [TYPE, MOBILE]], [
            /\((ip[honed|\s\w*]+);/i                                            // iPod/iPhone
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, MOBILE]], [

            /(blackberry)[\s-]?(\w+)/i,                                         // BlackBerry
            /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[\s_-]?([\w-]*)/i,
                                                                                // BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Meizu/Motorola/Polytron
            /(hp)\s([\w\s]+\w)/i,                                               // HP iPAQ
            /(asus)-?(\w+)/i                                                    // Asus
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /\(bb10;\s(\w+)/i                                                   // BlackBerry 10
            ], [MODEL, [VENDOR, 'BlackBerry'], [TYPE, MOBILE]], [
                                                                                // Asus Tablets
            /android.+(transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+|nexus 7|padfone|p00c)/i
            ], [MODEL, [VENDOR, 'Asus'], [TYPE, TABLET]], [

            /(sony)\s(tablet\s[ps])\sbuild\//i,                                  // Sony
            /(sony)?(?:sgp.+)\sbuild\//i
            ], [[VENDOR, 'Sony'], [MODEL, 'Xperia Tablet'], [TYPE, TABLET]], [
            /android.+\s([c-g]\d{4}|so[-l]\w+)(?=\sbuild\/|\).+chrome\/(?![1-6]{0,1}\d\.))/i
            ], [MODEL, [VENDOR, 'Sony'], [TYPE, MOBILE]], [

            /\s(ouya)\s/i,                                                      // Ouya
            /(nintendo)\s([wids3u]+)/i                                          // Nintendo
            ], [VENDOR, MODEL, [TYPE, CONSOLE]], [

            /android.+;\s(shield)\sbuild/i                                      // Nvidia
            ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, CONSOLE]], [

            /(playstation\s[34portablevi]+)/i                                   // Playstation
            ], [MODEL, [VENDOR, 'Sony'], [TYPE, CONSOLE]], [

            /(sprint\s(\w+))/i                                                  // Sprint Phones
            ], [[VENDOR, mapper.str, maps.device.sprint.vendor], [MODEL, mapper.str, maps.device.sprint.model], [TYPE, MOBILE]], [

            /(htc)[;_\s-]+([\w\s]+(?=\)|\sbuild)|\w+)/i,                        // HTC
            /(zte)-(\w*)/i,                                                     // ZTE
            /(alcatel|geeksphone|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]*)/i
                                                                                // Alcatel/GeeksPhone/Nexian/Panasonic/Sony
            ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [

            /(nexus\s9)/i                                                       // HTC Nexus 9
            ], [MODEL, [VENDOR, 'HTC'], [TYPE, TABLET]], [

            /d\/huawei([\w\s-]+)[;\)]/i,
            /(nexus\s6p)/i                                                      // Huawei
            ], [MODEL, [VENDOR, 'Huawei'], [TYPE, MOBILE]], [

            /(microsoft);\s(lumia[\s\w]+)/i                                     // Microsoft Lumia
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /[\s\(;](xbox(?:\sone)?)[\s\);]/i                                   // Microsoft Xbox
            ], [MODEL, [VENDOR, 'Microsoft'], [TYPE, CONSOLE]], [
            /(kin\.[onetw]{3})/i                                                // Microsoft Kin
            ], [[MODEL, /\./g, ' '], [VENDOR, 'Microsoft'], [TYPE, MOBILE]], [

                                                                                // Motorola
            /\s(milestone|droid(?:[2-4x]|\s(?:bionic|x2|pro|razr))?:?(\s4g)?)[\w\s]+build\//i,
            /mot[\s-]?(\w*)/i,
            /(XT\d{3,4}) build\//i,
            /(nexus\s6)/i
            ], [MODEL, [VENDOR, 'Motorola'], [TYPE, MOBILE]], [
            /android.+\s(mz60\d|xoom[\s2]{0,2})\sbuild\//i
            ], [MODEL, [VENDOR, 'Motorola'], [TYPE, TABLET]], [

            /hbbtv\/\d+\.\d+\.\d+\s+\([\w\s]*;\s*(\w[^;]*);([^;]*)/i            // HbbTV devices
            ], [[VENDOR, util.trim], [MODEL, util.trim], [TYPE, SMARTTV]], [

            /hbbtv.+maple;(\d+)/i
            ], [[MODEL, /^/, 'SmartTV'], [VENDOR, 'Samsung'], [TYPE, SMARTTV]], [

            /\(dtv[\);].+(aquos)/i                                              // Sharp
            ], [MODEL, [VENDOR, 'Sharp'], [TYPE, SMARTTV]], [

            /android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n\d+|sgh-t8[56]9|nexus 10))/i,
            /((SM-T\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, TABLET]], [                  // Samsung
            /smart-tv.+(samsung)/i
            ], [VENDOR, [TYPE, SMARTTV], MODEL], [
            /((s[cgp]h-\w+|gt-\w+|galaxy\snexus|sm-\w[\w\d]+))/i,
            /(sam[sung]*)[\s-]*(\w+-?[\w-]*)/i,
            /sec-((sgh\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, MOBILE]], [

            /sie-(\w*)/i                                                        // Siemens
            ], [MODEL, [VENDOR, 'Siemens'], [TYPE, MOBILE]], [

            /(maemo|nokia).*(n900|lumia\s\d+)/i,                                // Nokia
            /(nokia)[\s_-]?([\w-]*)/i
            ], [[VENDOR, 'Nokia'], MODEL, [TYPE, MOBILE]], [

            /android[x\d\.\s;]+\s([ab][1-7]\-?[0178a]\d\d?)/i                   // Acer
            ], [MODEL, [VENDOR, 'Acer'], [TYPE, TABLET]], [

            /android.+([vl]k\-?\d{3})\s+build/i                                 // LG Tablet
            ], [MODEL, [VENDOR, 'LG'], [TYPE, TABLET]], [
            /android\s3\.[\s\w;-]{10}(lg?)-([06cv9]{3,4})/i                     // LG Tablet
            ], [[VENDOR, 'LG'], MODEL, [TYPE, TABLET]], [
            /(lg) netcast\.tv/i                                                 // LG SmartTV
            ], [VENDOR, MODEL, [TYPE, SMARTTV]], [
            /(nexus\s[45])/i,                                                   // LG
            /lg[e;\s\/-]+(\w*)/i,
            /android.+lg(\-?[\d\w]+)\s+build/i
            ], [MODEL, [VENDOR, 'LG'], [TYPE, MOBILE]], [

            /(lenovo)\s?(s(?:5000|6000)(?:[\w-]+)|tab(?:[\s\w]+))/i             // Lenovo tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [
            /android.+(ideatab[a-z0-9\-\s]+)/i                                  // Lenovo
            ], [MODEL, [VENDOR, 'Lenovo'], [TYPE, TABLET]], [
            /(lenovo)[_\s-]?([\w-]+)/i
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /linux;.+((jolla));/i                                               // Jolla
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /((pebble))app\/[\d\.]+\s/i                                         // Pebble
            ], [VENDOR, MODEL, [TYPE, WEARABLE]], [

            /android.+;\s(oppo)\s?([\w\s]+)\sbuild/i                            // OPPO
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /crkey/i                                                            // Google Chromecast
            ], [[MODEL, 'Chromecast'], [VENDOR, 'Google']], [

            /android.+;\s(glass)\s\d/i                                          // Google Glass
            ], [MODEL, [VENDOR, 'Google'], [TYPE, WEARABLE]], [

            /android.+;\s(pixel c)[\s)]/i                                       // Google Pixel C
            ], [MODEL, [VENDOR, 'Google'], [TYPE, TABLET]], [

            /android.+;\s(pixel( [23])?( xl)?)[\s)]/i                              // Google Pixel
            ], [MODEL, [VENDOR, 'Google'], [TYPE, MOBILE]], [

            /android.+;\s(\w+)\s+build\/hm\1/i,                                 // Xiaomi Hongmi 'numeric' models
            /android.+(hm[\s\-_]*note?[\s_]*(?:\d\w)?)\s+build/i,               // Xiaomi Hongmi
            /android.+(mi[\s\-_]*(?:a\d|one|one[\s_]plus|note lte)?[\s_]*(?:\d?\w?)[\s_]*(?:plus)?)\s+build/i,    
                                                                                // Xiaomi Mi
            /android.+(redmi[\s\-_]*(?:note)?(?:[\s_]*[\w\s]+))\s+build/i       // Redmi Phones
            ], [[MODEL, /_/g, ' '], [VENDOR, 'Xiaomi'], [TYPE, MOBILE]], [
            /android.+(mi[\s\-_]*(?:pad)(?:[\s_]*[\w\s]+))\s+build/i            // Mi Pad tablets
            ],[[MODEL, /_/g, ' '], [VENDOR, 'Xiaomi'], [TYPE, TABLET]], [
            /android.+;\s(m[1-5]\snote)\sbuild/i                                // Meizu
            ], [MODEL, [VENDOR, 'Meizu'], [TYPE, MOBILE]], [
            /(mz)-([\w-]{2,})/i
            ], [[VENDOR, 'Meizu'], MODEL, [TYPE, MOBILE]], [

            /android.+a000(1)\s+build/i,                                        // OnePlus
            /android.+oneplus\s(a\d{4})\s+build/i
            ], [MODEL, [VENDOR, 'OnePlus'], [TYPE, MOBILE]], [

            /android.+[;\/]\s*(RCT[\d\w]+)\s+build/i                            // RCA Tablets
            ], [MODEL, [VENDOR, 'RCA'], [TYPE, TABLET]], [

            /android.+[;\/\s]+(Venue[\d\s]{2,7})\s+build/i                      // Dell Venue Tablets
            ], [MODEL, [VENDOR, 'Dell'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Q[T|M][\d\w]+)\s+build/i                         // Verizon Tablet
            ], [MODEL, [VENDOR, 'Verizon'], [TYPE, TABLET]], [

            /android.+[;\/]\s+(Barnes[&\s]+Noble\s+|BN[RT])(V?.*)\s+build/i     // Barnes & Noble Tablet
            ], [[VENDOR, 'Barnes & Noble'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s+(TM\d{3}.*\b)\s+build/i                           // Barnes & Noble Tablet
            ], [MODEL, [VENDOR, 'NuVision'], [TYPE, TABLET]], [

            /android.+;\s(k88)\sbuild/i                                         // ZTE K Series Tablet
            ], [MODEL, [VENDOR, 'ZTE'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(gen\d{3})\s+build.*49h/i                         // Swiss GEN Mobile
            ], [MODEL, [VENDOR, 'Swiss'], [TYPE, MOBILE]], [

            /android.+[;\/]\s*(zur\d{3})\s+build/i                              // Swiss ZUR Tablet
            ], [MODEL, [VENDOR, 'Swiss'], [TYPE, TABLET]], [

            /android.+[;\/]\s*((Zeki)?TB.*\b)\s+build/i                         // Zeki Tablets
            ], [MODEL, [VENDOR, 'Zeki'], [TYPE, TABLET]], [

            /(android).+[;\/]\s+([YR]\d{2})\s+build/i,
            /android.+[;\/]\s+(Dragon[\-\s]+Touch\s+|DT)(\w{5})\sbuild/i        // Dragon Touch Tablet
            ], [[VENDOR, 'Dragon Touch'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(NS-?\w{0,9})\sbuild/i                            // Insignia Tablets
            ], [MODEL, [VENDOR, 'Insignia'], [TYPE, TABLET]], [

            /android.+[;\/]\s*((NX|Next)-?\w{0,9})\s+build/i                    // NextBook Tablets
            ], [MODEL, [VENDOR, 'NextBook'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Xtreme\_)?(V(1[045]|2[015]|30|40|60|7[05]|90))\s+build/i
            ], [[VENDOR, 'Voice'], MODEL, [TYPE, MOBILE]], [                    // Voice Xtreme Phones

            /android.+[;\/]\s*(LVTEL\-)?(V1[12])\s+build/i                     // LvTel Phones
            ], [[VENDOR, 'LvTel'], MODEL, [TYPE, MOBILE]], [

            /android.+;\s(PH-1)\s/i
            ], [MODEL, [VENDOR, 'Essential'], [TYPE, MOBILE]], [                // Essential PH-1

            /android.+[;\/]\s*(V(100MD|700NA|7011|917G).*\b)\s+build/i          // Envizen Tablets
            ], [MODEL, [VENDOR, 'Envizen'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Le[\s\-]+Pan)[\s\-]+(\w{1,9})\s+build/i          // Le Pan Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(Trio[\s\-]*.*)\s+build/i                         // MachSpeed Tablets
            ], [MODEL, [VENDOR, 'MachSpeed'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Trinity)[\-\s]*(T\d{3})\s+build/i                // Trinity Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*TU_(1491)\s+build/i                               // Rotor Tablets
            ], [MODEL, [VENDOR, 'Rotor'], [TYPE, TABLET]], [

            /android.+(KS(.+))\s+build/i                                        // Amazon Kindle Tablets
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [

            /android.+(Gigaset)[\s\-]+(Q\w{1,9})\s+build/i                      // Gigaset Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /\s(tablet|tab)[;\/]/i,                                             // Unidentifiable Tablet
            /\s(mobile)(?:[;\/]|\ssafari)/i                                     // Unidentifiable Mobile
            ], [[TYPE, util.lowerize], VENDOR, MODEL], [

            /[\s\/\(](smart-?tv)[;\)]/i                                         // SmartTV
            ], [[TYPE, SMARTTV]], [

            /(android[\w\.\s\-]{0,9});.+build/i                                 // Generic Android Device
            ], [MODEL, [VENDOR, 'Generic']]
        ],

        engine : [[

            /windows.+\sedge\/([\w\.]+)/i                                       // EdgeHTML
            ], [VERSION, [NAME, 'EdgeHTML']], [

            /webkit\/537\.36.+chrome\/(?!27)/i                                  // Blink
            ], [[NAME, 'Blink']], [

            /(presto)\/([\w\.]+)/i,                                             // Presto
            /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i,     
                                                                                // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m/Goanna
            /(khtml|tasman|links)[\/\s]\(?([\w\.]+)/i,                          // KHTML/Tasman/Links
            /(icab)[\/\s]([23]\.[\d\.]+)/i                                      // iCab
            ], [NAME, VERSION], [

            /rv\:([\w\.]{1,9}).+(gecko)/i                                       // Gecko
            ], [VERSION, NAME]
        ],

        os : [[

            // Windows based
            /microsoft\s(windows)\s(vista|xp)/i                                 // Windows (iTunes)
            ], [NAME, VERSION], [
            /(windows)\snt\s6\.2;\s(arm)/i,                                     // Windows RT
            /(windows\sphone(?:\sos)*)[\s\/]?([\d\.\s\w]*)/i,                   // Windows Phone
            /(windows\smobile|windows)[\s\/]?([ntce\d\.\s]+\w)/i
            ], [NAME, [VERSION, mapper.str, maps.os.windows.version]], [
            /(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i
            ], [[NAME, 'Windows'], [VERSION, mapper.str, maps.os.windows.version]], [

            // Mobile/Embedded OS
            /\((bb)(10);/i                                                      // BlackBerry 10
            ], [[NAME, 'BlackBerry'], VERSION], [
            /(blackberry)\w*\/?([\w\.]*)/i,                                     // Blackberry
            /(tizen)[\/\s]([\w\.]+)/i,                                          // Tizen
            /(android|webos|palm\sos|qnx|bada|rim\stablet\sos|meego|sailfish|contiki)[\/\s-]?([\w\.]*)/i
                                                                                // Android/WebOS/Palm/QNX/Bada/RIM/MeeGo/Contiki/Sailfish OS
            ], [NAME, VERSION], [
            /(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]*)/i                  // Symbian
            ], [[NAME, 'Symbian'], VERSION], [
            /\((series40);/i                                                    // Series 40
            ], [NAME], [
            /mozilla.+\(mobile;.+gecko.+firefox/i                               // Firefox OS
            ], [[NAME, 'Firefox OS'], VERSION], [

            // Console
            /(nintendo|playstation)\s([wids34portablevu]+)/i,                   // Nintendo/Playstation

            // GNU/Linux based
            /(mint)[\/\s\(]?(\w*)/i,                                            // Mint
            /(mageia|vectorlinux)[;\s]/i,                                       // Mageia/VectorLinux
            /(joli|[kxln]?ubuntu|debian|suse|opensuse|gentoo|(?=\s)arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk|linpus)[\/\s-]?(?!chrom)([\w\.-]*)/i,
                                                                                // Joli/Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware
                                                                                // Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus
            /(hurd|linux)\s?([\w\.]*)/i,                                        // Hurd/Linux
            /(gnu)\s?([\w\.]*)/i                                                // GNU
            ], [NAME, VERSION], [

            /(cros)\s[\w]+\s([\w\.]+\w)/i                                       // Chromium OS
            ], [[NAME, 'Chromium OS'], VERSION],[

            // Solaris
            /(sunos)\s?([\w\.\d]*)/i                                            // Solaris
            ], [[NAME, 'Solaris'], VERSION], [

            // BSD based
            /\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]*)/i                    // FreeBSD/NetBSD/OpenBSD/PC-BSD/DragonFly
            ], [NAME, VERSION],[

            /(haiku)\s(\w+)/i                                                   // Haiku
            ], [NAME, VERSION],[

            /cfnetwork\/.+darwin/i,
            /ip[honead]{2,4}(?:.*os\s([\w]+)\slike\smac|;\sopera)/i             // iOS
            ], [[VERSION, /_/g, '.'], [NAME, 'iOS']], [

            /(mac\sos\sx)\s?([\w\s\.]*)/i,
            /(macintosh|mac(?=_powerpc)\s)/i                                    // Mac OS
            ], [[NAME, 'Mac OS'], [VERSION, /_/g, '.']], [

            // Other
            /((?:open)?solaris)[\/\s-]?([\w\.]*)/i,                             // Solaris
            /(aix)\s((\d)(?=\.|\)|\s)[\w\.])*/i,                                // AIX
            /(plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos|openvms|fuchsia)/i,
                                                                                // Plan9/Minix/BeOS/OS2/AmigaOS/MorphOS/RISCOS/OpenVMS/Fuchsia
            /(unix)\s?([\w\.]*)/i                                               // UNIX
            ], [NAME, VERSION]
        ]
    };


    /////////////////
    // Constructor
    ////////////////
    var UAParser = function (uastring, extensions) {

        if (typeof uastring === 'object') {
            extensions = uastring;
            uastring = undefined;
        }

        if (!(this instanceof UAParser)) {
            return new UAParser(uastring, extensions).getResult();
        }

        var ua = uastring || ((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : EMPTY);
        var rgxmap = extensions ? util.extend(regexes, extensions) : regexes;

        this.getBrowser = function () {
            var browser = { name: undefined, version: undefined };
            mapper.rgx.call(browser, ua, rgxmap.browser);
            browser.major = util.major(browser.version); // deprecated
            return browser;
        };
        this.getCPU = function () {
            var cpu = { architecture: undefined };
            mapper.rgx.call(cpu, ua, rgxmap.cpu);
            return cpu;
        };
        this.getDevice = function () {
            var device = { vendor: undefined, model: undefined, type: undefined };
            mapper.rgx.call(device, ua, rgxmap.device);
            return device;
        };
        this.getEngine = function () {
            var engine = { name: undefined, version: undefined };
            mapper.rgx.call(engine, ua, rgxmap.engine);
            return engine;
        };
        this.getOS = function () {
            var os = { name: undefined, version: undefined };
            mapper.rgx.call(os, ua, rgxmap.os);
            return os;
        };
        this.getResult = function () {
            return {
                ua      : this.getUA(),
                browser : this.getBrowser(),
                engine  : this.getEngine(),
                os      : this.getOS(),
                device  : this.getDevice(),
                cpu     : this.getCPU()
            };
        };
        this.getUA = function () {
            return ua;
        };
        this.setUA = function (uastring) {
            ua = uastring;
            return this;
        };
        return this;
    };

    UAParser.VERSION = LIBVERSION;
    UAParser.BROWSER = {
        NAME    : NAME,
        MAJOR   : MAJOR, // deprecated
        VERSION : VERSION
    };
    UAParser.CPU = {
        ARCHITECTURE : ARCHITECTURE
    };
    UAParser.DEVICE = {
        MODEL   : MODEL,
        VENDOR  : VENDOR,
        TYPE    : TYPE,
        CONSOLE : CONSOLE,
        MOBILE  : MOBILE,
        SMARTTV : SMARTTV,
        TABLET  : TABLET,
        WEARABLE: WEARABLE,
        EMBEDDED: EMBEDDED
    };
    UAParser.ENGINE = {
        NAME    : NAME,
        VERSION : VERSION
    };
    UAParser.OS = {
        NAME    : NAME,
        VERSION : VERSION
    };

    ///////////
    // Export
    //////////


    // check js environment
    if (typeof(exports) !== UNDEF_TYPE) {
        // nodejs env
        if (typeof module !== UNDEF_TYPE && module.exports) {
            exports = module.exports = UAParser;
        }
        exports.UAParser = UAParser;
    } else {
        // requirejs env (optional)
        if (typeof(define) === 'function' && define.amd) {
            define(function () {
                return UAParser;
            });
        } else if (window) {
            // browser env
            window.UAParser = UAParser;
        }
    }

    // jQuery/Zepto specific (optional)
    // Note:
    //   In AMD env the global scope should be kept clean, but jQuery is an exception.
    //   jQuery always exports to global scope, unless jQuery.noConflict(true) is used,
    //   and we should catch that.
    var $ = window && (window.jQuery || window.Zepto);
    if (typeof $ !== UNDEF_TYPE && !$.ua) {
        var parser = new UAParser();
        $.ua = parser.getResult();
        $.ua.get = function () {
            return parser.getUA();
        };
        $.ua.set = function (uastring) {
            parser.setUA(uastring);
            var result = parser.getResult();
            for (var prop in result) {
                $.ua[prop] = result[prop];
            }
        };
    }

})(typeof window === 'object' ? window : this);

},{}]},{},[2])(2)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleHRlbmQuanMiLCJpbmRleC5qcyIsImxhbmd1YWdlcy5qc29uIiwibm9kZV9tb2R1bGVzL3VhLXBhcnNlci1qcy9zcmMvdWEtcGFyc2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKiBIaWdobHkgZHVtYmVkIGRvd24gdmVyc2lvbiBvZiBodHRwczovL2dpdGh1Yi5jb20vdW5jbGVjaHUvbm9kZS1kZWVwLWV4dGVuZCAqL1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuaW5nIG9iamVjdCB0aGF0IGVudGVyZWQgaW4gZmlyc3QgYXJndW1lbnQuXHJcbiAqXHJcbiAqIFJldHVybnMgZXh0ZW5kZWQgb2JqZWN0IG9yIGZhbHNlIGlmIGhhdmUgbm8gdGFyZ2V0IG9iamVjdCBvciBpbmNvcnJlY3QgdHlwZS5cclxuICpcclxuICogSWYgeW91IHdpc2ggdG8gY2xvbmUgc291cmNlIG9iamVjdCAod2l0aG91dCBtb2RpZnkgaXQpLCBqdXN0IHVzZSBlbXB0eSBuZXdcclxuICogb2JqZWN0IGFzIGZpcnN0IGFyZ3VtZW50LCBsaWtlIHRoaXM6XHJcbiAqICAgZGVlcEV4dGVuZCh7fSwgeW91ck9ial8xLCBbeW91ck9ial9OXSk7XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlZXBFeHRlbmQoLypvYmpfMSwgW29ial8yXSwgW29ial9OXSovKSB7XHJcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPCAxIHx8IHR5cGVvZiBhcmd1bWVudHNbMF0gIT09IFwib2JqZWN0XCIpIHtcclxuXHRcdHJldHVybiBmYWxzZVxyXG5cdH1cclxuXHJcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XHJcblx0XHRyZXR1cm4gYXJndW1lbnRzWzBdXHJcblx0fVxyXG5cclxuXHR2YXIgdGFyZ2V0ID0gYXJndW1lbnRzWzBdXHJcblxyXG5cdGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHR2YXIgb2JqID0gYXJndW1lbnRzW2ldXHJcblxyXG5cdFx0Zm9yICh2YXIga2V5IGluIG9iaikge1xyXG5cdFx0XHR2YXIgc3JjID0gdGFyZ2V0W2tleV1cclxuXHRcdFx0dmFyIHZhbCA9IG9ialtrZXldXHJcblxyXG5cdFx0XHRpZiAodHlwZW9mIHZhbCAhPT0gXCJvYmplY3RcIiB8fCB2YWwgPT09IG51bGwpIHtcclxuXHRcdFx0XHR0YXJnZXRba2V5XSA9IHZhbFxyXG5cclxuXHRcdFx0XHQvLyBqdXN0IGNsb25lIGFycmF5cyAoYW5kIHJlY3Vyc2l2ZSBjbG9uZSBvYmplY3RzIGluc2lkZSlcclxuXHRcdFx0fSBlbHNlIGlmICh0eXBlb2Ygc3JjICE9PSBcIm9iamVjdFwiIHx8IHNyYyA9PT0gbnVsbCkge1xyXG5cdFx0XHRcdHRhcmdldFtrZXldID0gZGVlcEV4dGVuZCh7fSwgdmFsKVxyXG5cclxuXHRcdFx0XHQvLyBzb3VyY2UgdmFsdWUgYW5kIG5ldyB2YWx1ZSBpcyBvYmplY3RzIGJvdGgsIGV4dGVuZGluZy4uLlxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRhcmdldFtrZXldID0gZGVlcEV4dGVuZChzcmMsIHZhbClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIHRhcmdldFxyXG59XHJcbiIsInZhciBVc2VyQWdlbnRQYXJzZXIgPSByZXF1aXJlKFwidWEtcGFyc2VyLWpzXCIpXHJcbnZhciBsYW5ndWFnZU1lc3NhZ2VzID0gcmVxdWlyZShcIi4vbGFuZ3VhZ2VzLmpzb25cIilcclxudmFyIGRlZXBFeHRlbmQgPSByZXF1aXJlKFwiLi9leHRlbmRcIilcclxuXHJcbnZhciBERUZBVUxUUyA9IHtcclxuXHRDaHJvbWU6IDU3LCAvLyBJbmNsdWRlcyBDaHJvbWUgZm9yIG1vYmlsZSBkZXZpY2VzXHJcblx0RWRnZTogMzksXHJcblx0U2FmYXJpOiAxMCxcclxuXHRcIk1vYmlsZSBTYWZhcmlcIjogMTAsXHJcblx0T3BlcmE6IDUwLFxyXG5cdEZpcmVmb3g6IDUwLFxyXG5cdFZpdmFsZGk6IDEsXHJcblx0SUU6IGZhbHNlXHJcbn1cclxuXHJcbnZhciBMQVNUX0tOT1dOX0VER0VIVE1MX1ZFUlNJT04gPSAxOFxyXG52YXIgRURHRUhUTUxfVlNfRURHRV9WRVJTSU9OUyA9IHtcclxuXHQxMjogMC4xLFxyXG5cdDEzOiAyMSxcclxuXHQxNDogMzEsXHJcblx0MTU6IDM5LFxyXG5cdDE2OiA0MSxcclxuXHQxNzogNDJcclxufVxyXG5FREdFSFRNTF9WU19FREdFX1ZFUlNJT05TW0xBU1RfS05PV05fRURHRUhUTUxfVkVSU0lPTl0gPSA0NFxyXG5cclxudmFyIENPTE9SUyA9IHtcclxuXHRzYWxtb246IFwiI2YyNTY0OFwiLFxyXG5cdHdoaXRlOiBcIndoaXRlXCJcclxufVxyXG5cclxudmFyIHVwZGF0ZURlZmF1bHRzID0gZnVuY3Rpb24oZGVmYXVsdHMsIHVwZGF0ZWRWYWx1ZXMpIHtcclxuXHRmb3IgKHZhciBrZXkgaW4gdXBkYXRlZFZhbHVlcykge1xyXG5cdFx0ZGVmYXVsdHNba2V5XSA9IHVwZGF0ZWRWYWx1ZXNba2V5XVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIGRlZmF1bHRzXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0aW9ucykge1xyXG5cdHZhciBtYWluID0gZnVuY3Rpb24oKSB7XHJcblx0XHQvLyBEZXNwaXRlIHRoZSBkb2NzLCBVQSBuZWVkcyB0byBiZSBwcm92aWRlZCB0byBjb25zdHJ1Y3RvciBleHBsaWNpdGx5OlxyXG5cdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL2ZhaXNhbG1hbi91YS1wYXJzZXItanMvaXNzdWVzLzkwXHJcblx0XHR2YXIgcGFyc2VkVXNlckFnZW50ID0gbmV3IFVzZXJBZ2VudFBhcnNlcih3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCkuZ2V0UmVzdWx0KClcclxuXHJcblx0XHQvLyBWYXJpYWJsZSBkZWZpbml0aW9uIChiZWZvcmUgYWpheClcclxuXHRcdHZhciBvdXRkYXRlZFVJID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvdXRkYXRlZFwiKVxyXG5cclxuXHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcblxyXG5cdFx0dmFyIGJyb3dzZXJMb2NhbGUgPSB3aW5kb3cubmF2aWdhdG9yLmxhbmd1YWdlIHx8IHdpbmRvdy5uYXZpZ2F0b3IudXNlckxhbmd1YWdlIC8vIEV2ZXJ5b25lIGVsc2UsIElFXHJcblxyXG5cdFx0Ly8gU2V0IGRlZmF1bHQgb3B0aW9uc1xyXG5cdFx0dmFyIGJyb3dzZXJTdXBwb3J0ID0gb3B0aW9ucy5icm93c2VyU3VwcG9ydCA/IHVwZGF0ZURlZmF1bHRzKERFRkFVTFRTLCBvcHRpb25zLmJyb3dzZXJTdXBwb3J0KSA6IERFRkFVTFRTXHJcblx0XHQvLyBDU1MgcHJvcGVydHkgdG8gY2hlY2sgZm9yLiBZb3UgbWF5IGFsc28gbGlrZSAnYm9yZGVyU3BhY2luZycsICdib3hTaGFkb3cnLCAndHJhbnNmb3JtJywgJ2JvcmRlckltYWdlJztcclxuXHRcdHZhciByZXF1aXJlZENzc1Byb3BlcnR5ID0gb3B0aW9ucy5yZXF1aXJlZENzc1Byb3BlcnR5IHx8IGZhbHNlXHJcblx0XHR2YXIgYmFja2dyb3VuZENvbG9yID0gb3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3IgfHwgQ09MT1JTLnNhbG1vblxyXG5cdFx0dmFyIHRleHRDb2xvciA9IG9wdGlvbnMudGV4dENvbG9yIHx8IENPTE9SUy53aGl0ZVxyXG5cdFx0dmFyIGZ1bGxzY3JlZW4gPSBvcHRpb25zLmZ1bGxzY3JlZW4gfHwgZmFsc2VcclxuXHRcdHZhciBsYW5ndWFnZSA9IG9wdGlvbnMubGFuZ3VhZ2UgfHwgYnJvd3NlckxvY2FsZS5zbGljZSgwLCAyKSAvLyBMYW5ndWFnZSBjb2RlXHJcblxyXG5cdFx0dmFyIHVwZGF0ZVNvdXJjZSA9IFwid2ViXCIgLy8gT3RoZXIgcG9zc2libGUgdmFsdWVzIGFyZSAnZ29vZ2xlUGxheScgb3IgJ2FwcFN0b3JlJy4gRGV0ZXJtaW5lcyB3aGVyZSB3ZSB0ZWxsIHVzZXJzIHRvIGdvIGZvciB1cGdyYWRlcy5cclxuXHJcblx0XHQvLyBDaHJvbWUgbW9iaWxlIGlzIHN0aWxsIENocm9tZSAodW5saWtlIFNhZmFyaSB3aGljaCBpcyAnTW9iaWxlIFNhZmFyaScpXHJcblx0XHR2YXIgaXNBbmRyb2lkID0gcGFyc2VkVXNlckFnZW50Lm9zLm5hbWUgPT09IFwiQW5kcm9pZFwiXHJcblx0XHRpZiAoaXNBbmRyb2lkKSB7XHJcblx0XHRcdHVwZGF0ZVNvdXJjZSA9IFwiZ29vZ2xlUGxheVwiXHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGlzQW5kcm9pZEJ1dE5vdENocm9tZVxyXG5cdFx0aWYgKG9wdGlvbnMucmVxdWlyZUNocm9tZU9uQW5kcm9pZCkge1xyXG5cdFx0XHRpc0FuZHJvaWRCdXROb3RDaHJvbWUgPSBpc0FuZHJvaWQgJiYgcGFyc2VkVXNlckFnZW50LmJyb3dzZXIubmFtZSAhPT0gXCJDaHJvbWVcIlxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChwYXJzZWRVc2VyQWdlbnQub3MubmFtZSA9PT0gXCJpT1NcIikge1xyXG5cdFx0XHR1cGRhdGVTb3VyY2UgPSBcImFwcFN0b3JlXCJcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgZG9uZSA9IHRydWVcclxuXHJcblx0XHR2YXIgY2hhbmdlT3BhY2l0eSA9IGZ1bmN0aW9uKG9wYWNpdHlWYWx1ZSkge1xyXG5cdFx0XHRvdXRkYXRlZFVJLnN0eWxlLm9wYWNpdHkgPSBvcGFjaXR5VmFsdWUgLyAxMDBcclxuXHRcdFx0b3V0ZGF0ZWRVSS5zdHlsZS5maWx0ZXIgPSBcImFscGhhKG9wYWNpdHk9XCIgKyBvcGFjaXR5VmFsdWUgKyBcIilcIlxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBmYWRlSW4gPSBmdW5jdGlvbihvcGFjaXR5VmFsdWUpIHtcclxuXHRcdFx0Y2hhbmdlT3BhY2l0eShvcGFjaXR5VmFsdWUpXHJcblx0XHRcdGlmIChvcGFjaXR5VmFsdWUgPT09IDEpIHtcclxuXHRcdFx0XHRvdXRkYXRlZFVJLnN0eWxlLmRpc3BsYXkgPSBcInRhYmxlXCJcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAob3BhY2l0eVZhbHVlID09PSAxMDApIHtcclxuXHRcdFx0XHRkb25lID0gdHJ1ZVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIHBhcnNlTWlub3JWZXJzaW9uID0gZnVuY3Rpb24gKHZlcnNpb24pIHtcclxuXHRcdFx0cmV0dXJuIHZlcnNpb24ucmVwbGFjZSgvW15cXGQuXS9nLCcnKS5zcGxpdChcIi5cIilbMV07XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGlzQnJvd3NlclVuc3VwcG9ydGVkID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBicm93c2VyTmFtZSA9IHBhcnNlZFVzZXJBZ2VudC5icm93c2VyLm5hbWVcclxuXHRcdFx0dmFyIGlzVW5zdXBwb3J0ZWQgPSBmYWxzZVxyXG5cdFx0XHRpZiAoIShicm93c2VyTmFtZSBpbiBicm93c2VyU3VwcG9ydCkpIHtcclxuXHRcdFx0XHRpZiAoIW9wdGlvbnMuaXNVbmtub3duQnJvd3Nlck9LKSB7XHJcblx0XHRcdFx0XHRpc1Vuc3VwcG9ydGVkID0gdHJ1ZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIGlmICghYnJvd3NlclN1cHBvcnRbYnJvd3Nlck5hbWVdKSB7XHJcblx0XHRcdFx0aXNVbnN1cHBvcnRlZCA9IHRydWVcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gaXNVbnN1cHBvcnRlZDtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgaXNCcm93c2VyT3V0T2ZEYXRlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBicm93c2VyTmFtZSA9IHBhcnNlZFVzZXJBZ2VudC5icm93c2VyLm5hbWVcclxuXHRcdFx0dmFyIGJyb3dzZXJNYWpvclZlcnNpb24gPSBwYXJzZWRVc2VyQWdlbnQuYnJvd3Nlci5tYWpvclxyXG5cdFx0XHRpZiAoYnJvd3Nlck5hbWUgPT09IFwiRWRnZVwiKSB7XHJcblx0XHRcdFx0dmFyIGVkZ2VWZXJzaW9uID0gRURHRUhUTUxfVlNfRURHRV9WRVJTSU9OU1ticm93c2VyTWFqb3JWZXJzaW9uXVxyXG5cdFx0XHRcdHZhciBJU19VTktOT1dOX0VER0VIVE1MID0gIWVkZ2VWZXJzaW9uIFxyXG5cdFx0XHRcdGlmIChJU19VTktOT1dOX0VER0VIVE1MKSB7XHJcblx0XHRcdFx0XHR2YXIgSVNfTkVXX1VOS05PV05fRURHRUhUTUwgPSBicm93c2VyTWFqb3JWZXJzaW9uID4gTEFTVF9LTk9XTl9FREdFSFRNTF9WRVJTSU9OXHJcblx0XHRcdFx0XHRpZiAoSVNfTkVXX1VOS05PV05fRURHRUhUTUwpIHtcclxuXHRcdFx0XHRcdFx0ZWRnZVZlcnNpb24gPSBFREdFSFRNTF9WU19FREdFX1ZFUlNJT05TW0xBU1RfS05PV05fRURHRUhUTUxfVkVSU0lPTl1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0YnJvd3Nlck1ham9yVmVyc2lvbiA9IGVkZ2VWZXJzaW9uXHJcblx0XHRcdH1cclxuXHRcdFx0dmFyIGlzT3V0T2ZEYXRlID0gZmFsc2VcclxuXHRcdFx0aWYgKGlzQnJvd3NlclVuc3VwcG9ydGVkKCkpIHtcclxuXHRcdFx0XHRpc091dE9mRGF0ZSA9IHRydWU7XHJcblx0XHRcdH0gZWxzZSBpZiAoYnJvd3Nlck5hbWUgaW4gYnJvd3NlclN1cHBvcnQpIHtcclxuXHRcdFx0XHR2YXIgbWluVmVyc2lvbiA9IGJyb3dzZXJTdXBwb3J0W2Jyb3dzZXJOYW1lXTtcclxuXHRcdFx0XHRpZiAodHlwZW9mIG1pblZlcnNpb24gPT0gJ29iamVjdCcpIHtcclxuXHRcdFx0XHRcdHZhciBtaW5NYWpvclZlcnNpb24gPSBtaW5WZXJzaW9uLm1ham9yO1xyXG5cdFx0XHRcdFx0dmFyIG1pbk1pbm9yVmVyc2lvbiA9IG1pblZlcnNpb24ubWlub3I7XHJcblxyXG5cdFx0XHRcdFx0aWYgKGJyb3dzZXJNYWpvclZlcnNpb24gPCBtaW5NYWpvclZlcnNpb24pIHtcclxuXHRcdFx0XHRcdFx0aXNPdXRPZkRhdGUgPSB0cnVlXHJcblx0XHRcdFx0XHR9IGVsc2UgaWYgKGJyb3dzZXJNYWpvclZlcnNpb24gPT0gbWluTWFqb3JWZXJzaW9uKSB7XHJcblx0XHRcdFx0XHRcdHZhciBicm93c2VyTWlub3JWZXJzaW9uID0gcGFyc2VNaW5vclZlcnNpb24ocGFyc2VkVXNlckFnZW50LmJyb3dzZXIudmVyc2lvbilcclxuXHJcblx0XHRcdFx0XHRcdGlmIChicm93c2VyTWlub3JWZXJzaW9uIDwgbWluTWlub3JWZXJzaW9uKSB7XHJcblx0XHRcdFx0XHRcdFx0aXNPdXRPZkRhdGUgPSB0cnVlXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9IGVsc2UgaWYgKGJyb3dzZXJNYWpvclZlcnNpb24gPCBtaW5WZXJzaW9uKSB7XHJcblx0XHRcdFx0XHRpc091dE9mRGF0ZSA9IHRydWVcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGlzT3V0T2ZEYXRlXHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gUmV0dXJucyB0cnVlIGlmIGEgYnJvd3NlciBzdXBwb3J0cyBhIGNzczMgcHJvcGVydHlcclxuXHRcdHZhciBpc1Byb3BlcnR5U3VwcG9ydGVkID0gZnVuY3Rpb24ocHJvcGVydHkpIHtcclxuXHRcdFx0aWYgKCFwcm9wZXJ0eSkge1xyXG5cdFx0XHRcdHJldHVybiB0cnVlXHJcblx0XHRcdH1cclxuXHRcdFx0dmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcclxuXHRcdFx0dmFyIHZlbmRvclByZWZpeGVzID0gW1wia2h0bWxcIiwgXCJtc1wiLCBcIm9cIiwgXCJtb3pcIiwgXCJ3ZWJraXRcIl1cclxuXHRcdFx0dmFyIGNvdW50ID0gdmVuZG9yUHJlZml4ZXMubGVuZ3RoXHJcblxyXG5cdFx0XHQvLyBOb3RlOiBIVE1MRWxlbWVudC5zdHlsZS5oYXNPd25Qcm9wZXJ0eSBzZWVtcyBicm9rZW4gaW4gRWRnZVxyXG5cdFx0XHRpZiAocHJvcGVydHkgaW4gZGl2LnN0eWxlKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cHJvcGVydHkgPSBwcm9wZXJ0eS5yZXBsYWNlKC9eW2Etel0vLCBmdW5jdGlvbih2YWwpIHtcclxuXHRcdFx0XHRyZXR1cm4gdmFsLnRvVXBwZXJDYXNlKClcclxuXHRcdFx0fSlcclxuXHJcblx0XHRcdHdoaWxlIChjb3VudC0tKSB7XHJcblx0XHRcdFx0dmFyIHByZWZpeGVkUHJvcGVydHkgPSB2ZW5kb3JQcmVmaXhlc1tjb3VudF0gKyBwcm9wZXJ0eVxyXG5cdFx0XHRcdC8vIFNlZSBjb21tZW50IHJlOiBIVE1MRWxlbWVudC5zdHlsZS5oYXNPd25Qcm9wZXJ0eSBhYm92ZVxyXG5cdFx0XHRcdGlmIChwcmVmaXhlZFByb3BlcnR5IGluIGRpdi5zdHlsZSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIG1ha2VGYWRlSW5GdW5jdGlvbiA9IGZ1bmN0aW9uKG9wYWNpdHlWYWx1ZSkge1xyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0ZmFkZUluKG9wYWNpdHlWYWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIFN0eWxlIGVsZW1lbnQgZXhwbGljaXRseSAtIFRPRE86IGludmVzdGlnYXRlIGFuZCBkZWxldGUgaWYgbm90IG5lZWRlZFxyXG5cdFx0dmFyIHN0YXJ0U3R5bGVzQW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBidXR0b25DbG9zZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYnV0dG9uQ2xvc2VVcGRhdGVCcm93c2VyXCIpXHJcblx0XHRcdHZhciBidXR0b25VcGRhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJ1dHRvblVwZGF0ZUJyb3dzZXJcIilcclxuXHJcblx0XHRcdC8vY2hlY2sgc2V0dGluZ3MgYXR0cmlidXRlc1xyXG5cdFx0XHRvdXRkYXRlZFVJLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGJhY2tncm91bmRDb2xvclxyXG5cdFx0XHQvL3dheSB0b28gaGFyZCB0byBwdXQgIWltcG9ydGFudCBvbiBJRTZcclxuXHRcdFx0b3V0ZGF0ZWRVSS5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxyXG5cdFx0XHRvdXRkYXRlZFVJLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLnN0eWxlLmNvbG9yID0gdGV4dENvbG9yXHJcblx0XHRcdG91dGRhdGVkVUkuY2hpbGRyZW5bMF0uY2hpbGRyZW5bMV0uc3R5bGUuY29sb3IgPSB0ZXh0Q29sb3JcclxuXHJcblx0XHRcdC8vIFVwZGF0ZSBidXR0b24gaXMgZGVza3RvcCBvbmx5XHJcblx0XHRcdGlmIChidXR0b25VcGRhdGUpIHtcclxuXHRcdFx0XHRidXR0b25VcGRhdGUuc3R5bGUuY29sb3IgPSB0ZXh0Q29sb3JcclxuXHRcdFx0XHRpZiAoYnV0dG9uVXBkYXRlLnN0eWxlLmJvcmRlckNvbG9yKSB7XHJcblx0XHRcdFx0XHRidXR0b25VcGRhdGUuc3R5bGUuYm9yZGVyQ29sb3IgPSB0ZXh0Q29sb3JcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdC8vIE92ZXJyaWRlIHRoZSB1cGRhdGUgYnV0dG9uIGNvbG9yIHRvIG1hdGNoIHRoZSBiYWNrZ3JvdW5kIGNvbG9yXHJcblx0XHRcdFx0YnV0dG9uVXBkYXRlLm9ubW91c2VvdmVyID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHR0aGlzLnN0eWxlLmNvbG9yID0gYmFja2dyb3VuZENvbG9yXHJcblx0XHRcdFx0XHR0aGlzLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRleHRDb2xvclxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0YnV0dG9uVXBkYXRlLm9ubW91c2VvdXQgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHRoaXMuc3R5bGUuY29sb3IgPSB0ZXh0Q29sb3JcclxuXHRcdFx0XHRcdHRoaXMuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gYmFja2dyb3VuZENvbG9yXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRidXR0b25DbG9zZS5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxyXG5cclxuXHRcdFx0YnV0dG9uQ2xvc2Uub25tb3VzZWRvd24gPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRvdXRkYXRlZFVJLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIlxyXG5cdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGdldG1lc3NhZ2UgPSBmdW5jdGlvbihsYW5nKSB7XHJcblx0XHRcdHZhciBkZWZhdWx0TWVzc2FnZXMgPSBsYW5ndWFnZU1lc3NhZ2VzW2xhbmddIHx8IGxhbmd1YWdlTWVzc2FnZXMuZW5cclxuXHRcdFx0dmFyIGN1c3RvbU1lc3NhZ2VzID0gb3B0aW9ucy5tZXNzYWdlcyAmJiBvcHRpb25zLm1lc3NhZ2VzW2xhbmddXHJcblx0XHRcdHZhciBtZXNzYWdlcyA9IGRlZXBFeHRlbmQoe30sIGRlZmF1bHRNZXNzYWdlcywgY3VzdG9tTWVzc2FnZXMpXHJcblxyXG5cdFx0XHR2YXIgdXBkYXRlTWVzc2FnZXMgPSB7XHJcblx0XHRcdFx0d2ViOlxyXG5cdFx0XHRcdFx0XCI8cD5cIiArXHJcblx0XHRcdFx0XHRtZXNzYWdlcy51cGRhdGUud2ViICtcclxuXHRcdFx0XHRcdChtZXNzYWdlcy51cmwgPyAoXHJcblx0XHRcdFx0XHRcdCc8YSBpZD1cImJ1dHRvblVwZGF0ZUJyb3dzZXJcIiByZWw9XCJub2ZvbGxvd1wiIGhyZWY9XCInICtcclxuXHRcdFx0XHRcdFx0bWVzc2FnZXMudXJsICtcclxuXHRcdFx0XHRcdFx0J1wiPicgK1xyXG5cdFx0XHRcdFx0XHRtZXNzYWdlcy5jYWxsVG9BY3Rpb24gK1xyXG5cdFx0XHRcdFx0XHRcIjwvYT5cIlxyXG5cdFx0XHRcdFx0KSA6ICcnKSArXHJcblx0XHRcdFx0XHRcIjwvcD5cIixcclxuXHRcdFx0XHRnb29nbGVQbGF5OlxyXG5cdFx0XHRcdFx0XCI8cD5cIiArXHJcblx0XHRcdFx0XHRtZXNzYWdlcy51cGRhdGUuZ29vZ2xlUGxheSArXHJcblx0XHRcdFx0XHQnPGEgaWQ9XCJidXR0b25VcGRhdGVCcm93c2VyXCIgcmVsPVwibm9mb2xsb3dcIiBocmVmPVwiaHR0cHM6Ly9wbGF5Lmdvb2dsZS5jb20vc3RvcmUvYXBwcy9kZXRhaWxzP2lkPWNvbS5hbmRyb2lkLmNocm9tZVwiPicgK1xyXG5cdFx0XHRcdFx0bWVzc2FnZXMuY2FsbFRvQWN0aW9uICtcclxuXHRcdFx0XHRcdFwiPC9hPjwvcD5cIixcclxuXHRcdFx0XHRhcHBTdG9yZTogXCI8cD5cIiArIG1lc3NhZ2VzLnVwZGF0ZVt1cGRhdGVTb3VyY2VdICsgXCI8L3A+XCJcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIHVwZGF0ZU1lc3NhZ2UgPSB1cGRhdGVNZXNzYWdlc1t1cGRhdGVTb3VyY2VdXHJcblxyXG5cdFx0XHR2YXIgYnJvd3NlclN1cHBvcnRNZXNzYWdlID0gbWVzc2FnZXMub3V0T2ZEYXRlO1xyXG5cdFx0XHRpZiAoaXNCcm93c2VyVW5zdXBwb3J0ZWQoKSAmJiBtZXNzYWdlcy51bnN1cHBvcnRlZCkge1xyXG5cdFx0XHRcdGJyb3dzZXJTdXBwb3J0TWVzc2FnZSA9IG1lc3NhZ2VzLnVuc3VwcG9ydGVkO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gKFxyXG5cdFx0XHRcdCc8ZGl2IGNsYXNzPVwidmVydGljYWwtY2VudGVyXCI+PGg2PicgK1xyXG5cdFx0XHRcdGJyb3dzZXJTdXBwb3J0TWVzc2FnZSArXHJcblx0XHRcdFx0XCI8L2g2PlwiICtcclxuXHRcdFx0XHR1cGRhdGVNZXNzYWdlICtcclxuXHRcdFx0XHQnPHAgY2xhc3M9XCJsYXN0XCI+PGEgaHJlZj1cIiNcIiBpZD1cImJ1dHRvbkNsb3NlVXBkYXRlQnJvd3NlclwiIHRpdGxlPVwiJyArXHJcblx0XHRcdFx0bWVzc2FnZXMuY2xvc2UgK1xyXG5cdFx0XHRcdCdcIj4mdGltZXM7PC9hPjwvcD48L2Rpdj4nXHJcblx0XHRcdClcclxuXHRcdH1cclxuXHJcblx0XHQvLyBDaGVjayBpZiBicm93c2VyIGlzIHN1cHBvcnRlZFxyXG5cdFx0aWYgKGlzQnJvd3Nlck91dE9mRGF0ZSgpIHx8ICFpc1Byb3BlcnR5U3VwcG9ydGVkKHJlcXVpcmVkQ3NzUHJvcGVydHkpIHx8IGlzQW5kcm9pZEJ1dE5vdENocm9tZSkge1xyXG5cdFx0XHQvLyBUaGlzIGlzIGFuIG91dGRhdGVkIGJyb3dzZXJcclxuXHRcdFx0aWYgKGRvbmUgJiYgb3V0ZGF0ZWRVSS5zdHlsZS5vcGFjaXR5ICE9PSBcIjFcIikge1xyXG5cdFx0XHRcdGRvbmUgPSBmYWxzZVxyXG5cclxuXHRcdFx0XHRmb3IgKHZhciBvcGFjaXR5ID0gMTsgb3BhY2l0eSA8PSAxMDA7IG9wYWNpdHkrKykge1xyXG5cdFx0XHRcdFx0c2V0VGltZW91dChtYWtlRmFkZUluRnVuY3Rpb24ob3BhY2l0eSksIG9wYWNpdHkgKiA4KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIGluc2VydENvbnRlbnRIZXJlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvdXRkYXRlZFwiKVxyXG5cdFx0XHRpZiAoZnVsbHNjcmVlbikge1xyXG5cdFx0XHRcdGluc2VydENvbnRlbnRIZXJlLmNsYXNzTGlzdC5hZGQoXCJmdWxsc2NyZWVuXCIpXHJcblx0XHRcdH1cclxuXHRcdFx0aW5zZXJ0Q29udGVudEhlcmUuaW5uZXJIVE1MID0gZ2V0bWVzc2FnZShsYW5ndWFnZSlcclxuXHRcdFx0c3RhcnRTdHlsZXNBbmRFdmVudHMoKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Ly8gTG9hZCBtYWluIHdoZW4gRE9NIHJlYWR5LlxyXG5cdHZhciBvbGRPbmxvYWQgPSB3aW5kb3cub25sb2FkXHJcblx0aWYgKHR5cGVvZiB3aW5kb3cub25sb2FkICE9PSBcImZ1bmN0aW9uXCIpIHtcclxuXHRcdHdpbmRvdy5vbmxvYWQgPSBtYWluXHJcblx0fSBlbHNlIHtcclxuXHRcdHdpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0aWYgKG9sZE9ubG9hZCkge1xyXG5cdFx0XHRcdG9sZE9ubG9hZCgpXHJcblx0XHRcdH1cclxuXHRcdFx0bWFpbigpXHJcblx0XHR9XHJcblx0fVxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzPXtcclxuICBcImJyXCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiTyBzZXUgbmF2ZWdhZG9yIGVzdCZhYWN1dGU7IGRlc2F0dWFsaXphZG8hXCIsXHJcbiAgICBcInVwZGF0ZVwiOiB7XHJcbiAgICAgIFwid2ViXCI6IFwiQXR1YWxpemUgbyBzZXUgbmF2ZWdhZG9yIHBhcmEgdGVyIHVtYSBtZWxob3IgZXhwZXJpJmVjaXJjO25jaWEgZSB2aXN1YWxpemEmY2NlZGlsOyZhdGlsZGU7byBkZXN0ZSBzaXRlLiBcIixcclxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuICAgICAgXCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcbiAgICB9LFxyXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9iclwiLFxyXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJBdHVhbGl6ZSBvIHNldSBuYXZlZ2Fkb3IgYWdvcmFcIixcclxuICAgIFwiY2xvc2VcIjogXCJGZWNoYXJcIlxyXG4gIH0sXHJcbiAgXCJjYVwiOiB7XHJcbiAgICBcIm91dE9mRGF0ZVwiOiBcIkVsIHZvc3RyZSBuYXZlZ2Fkb3Igbm8gZXN0w6AgYWN0dWFsaXR6YXQhXCIsXHJcbiAgICBcInVwZGF0ZVwiOiB7XHJcbiAgICAgIFwid2ViXCI6IFwiQWN0dWFsaXR6ZXUgZWwgdm9zdHJlIG5hdmVnYWRvciBwZXIgdmV1cmUgY29ycmVjdGFtZW50IGFxdWVzdCBsbG9jIHdlYi4gXCIsXHJcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIkluc3RhbMK3bGV1IENocm9tZSBkZXMgZGUgR29vZ2xlIFBsYXlcIixcclxuICAgICAgXCJhcHBTdG9yZVwiOiBcIkFjdHVhbGl0emV1IGlPUyBkZXMgZGUgbCdhcGxpY2FjacOzIENvbmZpZ3VyYWNpw7NcIlxyXG4gICAgfSxcclxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vZXNcIixcclxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiQWN0dWFsaXR6YXIgZWwgbWV1IG5hdmVnYWRvciBhcmFcIixcclxuICAgIFwiY2xvc2VcIjogXCJUYW5jYXJcIlxyXG4gIH0sXHJcbiAgXCJjblwiOiB7XHJcbiAgICBcIm91dE9mRGF0ZVwiOiBcIuaCqOeahOa1j+iniOWZqOW3sui/h+aXtlwiLFxyXG4gICAgXCJ1cGRhdGVcIjoge1xyXG4gICAgICBcIndlYlwiOiBcIuimgeato+W4uOa1j+iniOacrOe9keermeivt+WNh+e6p+aCqOeahOa1j+iniOWZqOOAglwiLFxyXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL2NuXCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIueOsOWcqOWNh+e6p1wiLFxyXG4gICAgXCJjbG9zZVwiOiBcIuWFs+mXrVwiXHJcbiAgfSxcclxuICBcImN6XCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiVsOhxaEgcHJvaGzDrcW+ZcSNIGplIHphc3RhcmFsw70hXCIsXHJcbiAgICBcInVwZGF0ZVwiOiB7XHJcbiAgICAgIFwid2ViXCI6IFwiUHJvIHNwcsOhdm7DqSB6b2JyYXplbsOtIHTEm2NodG8gc3Ryw6FuZWsgYWt0dWFsaXp1anRlIHN2xa9qIHByb2hsw63FvmXEjS4gXCIsXHJcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIk5haW5zdGFsdWp0ZSBzaSBDaHJvbWUgeiBHb29nbGUgUGxheVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiQWt0dWFsaXp1anRlIHNpIHN5c3TDqW0gaU9TXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL2N6XCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIkFrdHVhbGl6b3ZhdCBueW7DrSBzdsWvaiBwcm9obMOtxb5lxI1cIixcclxuICAgIFwiY2xvc2VcIjogXCJaYXbFmcOtdFwiXHJcbiAgfSxcclxuICAgXCJkYVwiOiB7XHJcbiAgICBcIm91dE9mRGF0ZVwiOiBcIkRpbiBicm93c2VyIGVyIGZvcsOmbGRldCFcIixcclxuICAgIFwidXBkYXRlXCI6IHtcclxuICAgICAgXCJ3ZWJcIjogXCJPcGRhdMOpciBkaW4gYnJvd3NlciBmb3IgYXQgZsOlIHZpc3QgZGVubmUgaGplbW1lc2lkZSBrb3JyZWt0LiBcIixcclxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiSW5zdGFsbMOpciB2ZW5saWdzdCBDaHJvbWUgZnJhIEdvb2dsZSBQbGF5XCIsXHJcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJPcGRhdMOpciB2ZW5saWdzdCBpT1NcIlxyXG4gICAgfSxcclxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vZGFcIixcclxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiT3BkYXTDqXIgZGluIGJyb3dzZXIgbnVcIixcclxuICAgIFwiY2xvc2VcIjogXCJMdWtcIlxyXG4gIH0sXHJcbiAgXCJkZVwiOiB7XHJcbiAgICBcIm91dE9mRGF0ZVwiOiBcIklociBCcm93c2VyIGlzdCB2ZXJhbHRldCFcIixcclxuICAgIFwidXBkYXRlXCI6IHtcclxuICAgICAgXCJ3ZWJcIjogXCJCaXR0ZSBha3R1YWxpc2llcmVuIFNpZSBJaHJlbiBCcm93c2VyLCB1bSBkaWVzZSBXZWJzaXRlIGtvcnJla3QgZGFyenVzdGVsbGVuLiBcIixcclxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuICAgICAgXCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcbiAgICB9LFxyXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9kZVwiLFxyXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJEZW4gQnJvd3NlciBqZXR6dCBha3R1YWxpc2llcmVuIFwiLFxyXG4gICAgXCJjbG9zZVwiOiBcIlNjaGxpZcOfZW5cIlxyXG4gIH0sXHJcbiAgXCJlZVwiOiB7XHJcbiAgICBcIm91dE9mRGF0ZVwiOiBcIlNpbnUgdmVlYmlsZWhpdHNlamEgb24gdmFuYW5lbnVkIVwiLFxyXG4gICAgXCJ1cGRhdGVcIjoge1xyXG4gICAgICBcIndlYlwiOiBcIlBhbHVuIHV1ZW5kYSBvbWEgdmVlYmlsZWhpdHNlamF0LCBldCBuw6RoYSBsZWhla8O8bGdlIGtvcnJla3RzZWx0LiBcIixcclxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuICAgICAgXCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcbiAgICB9LFxyXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9lZVwiLFxyXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJVdWVuZGEgb21hIHZlZWJpbGVoaXRzZWphdCBrb2hlXCIsXHJcbiAgICBcImNsb3NlXCI6IFwiU3VsZ2VcIlxyXG4gIH0sXHJcbiAgXCJlblwiOiB7XHJcbiAgICBcIm91dE9mRGF0ZVwiOiBcIllvdXIgYnJvd3NlciBpcyBvdXQtb2YtZGF0ZSFcIixcclxuICAgIFwidXBkYXRlXCI6IHtcclxuICAgICAgXCJ3ZWJcIjogXCJVcGRhdGUgeW91ciBicm93c2VyIHRvIHZpZXcgdGhpcyB3ZWJzaXRlIGNvcnJlY3RseS4gXCIsXHJcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG4gICAgfSxcclxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vXCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIlVwZGF0ZSBteSBicm93c2VyIG5vd1wiLFxyXG4gICAgXCJjbG9zZVwiOiBcIkNsb3NlXCJcclxuICB9LFxyXG4gIFwiZXNcIjoge1xyXG4gICAgXCJvdXRPZkRhdGVcIjogXCLCoVR1IG5hdmVnYWRvciBlc3TDoSBhbnRpY3VhZG8hXCIsXHJcbiAgICBcInVwZGF0ZVwiOiB7XHJcbiAgICAgIFwid2ViXCI6IFwiQWN0dWFsaXphIHR1IG5hdmVnYWRvciBwYXJhIHZlciBlc3RhIHDDoWdpbmEgY29ycmVjdGFtZW50ZS4gXCIsXHJcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG4gICAgfSxcclxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vZXNcIixcclxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiQWN0dWFsaXphciBtaSBuYXZlZ2Fkb3IgYWhvcmFcIixcclxuICAgIFwiY2xvc2VcIjogXCJDZXJyYXJcIlxyXG4gIH0sXHJcbiAgXCJmYVwiOiB7XHJcbiAgICBcInJpZ2h0VG9MZWZ0XCI6IHRydWUsXHJcbiAgICBcIm91dE9mRGF0ZVwiOiBcItmF2LHZiNix2q/YsSDYtNmF2Kcg2YXZhtiz2YjYriDYtNiv2Ycg2KfYs9iqIVwiLFxyXG4gICAgXCJ1cGRhdGVcIjoge1xyXG4gICAgICBcIndlYlwiOiBcItis2YfYqiDZhdi02KfZh9iv2Ycg2LXYrduM2K0g2KfbjNmGINmI2KjYs9in24zYqtiMINmF2LHZiNix2q/Ysdiq2KfZhiDYsdinINio2LHZiNiyINix2LPYp9mG24wg2YbZhdin24zbjNivLiBcIixcclxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuICAgICAgXCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcbiAgICB9LFxyXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9cIixcclxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwi2YfZhduM2YYg2K3Yp9mE2Kcg2YXYsdmI2LHar9ix2YUg2LHYpyDYqNix2YjYsiDaqdmGXCIsXHJcbiAgICBcImNsb3NlXCI6IFwiQ2xvc2VcIlxyXG4gIH0sXHJcbiAgXCJmaVwiOiB7XHJcbiAgICBcIm91dE9mRGF0ZVwiOiBcIlNlbGFpbWVzaSBvbiB2YW5oZW50dW51dCFcIixcclxuICAgIFwidXBkYXRlXCI6IHtcclxuICAgICAgXCJ3ZWJcIjogXCJMYXRhYSBhamFudGFzYWluZW4gc2VsYWluIG4mYXVtbDtoZCZhdW1sO2tzZXNpIHQmYXVtbDttJmF1bWw7biBzaXZ1biBvaWtlaW4uIFwiLFxyXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJBc2VubmEgdXVzaW4gQ2hyb21lIEdvb2dsZSBQbGF5IC1rYXVwYXN0YVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUMOkaXZpdMOkIGlPUyBwdWhlbGltZXNpIGFzZXR1a3Npc3RhXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL2ZpXCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIlAmYXVtbDtpdml0JmF1bWw7IHNlbGFpbWVuaSBueXQgXCIsXHJcbiAgICBcImNsb3NlXCI6IFwiU3VsamVcIlxyXG4gIH0sXHJcbiAgXCJmclwiOiB7XHJcbiAgICBcIm91dE9mRGF0ZVwiOiBcIlZvdHJlIG5hdmlnYXRldXIgbidlc3QgcGx1cyBjb21wYXRpYmxlICFcIixcclxuICAgIFwidXBkYXRlXCI6IHtcclxuICAgICAgXCJ3ZWJcIjogXCJNZXR0ZXogw6Agam91ciB2b3RyZSBuYXZpZ2F0ZXVyIHBvdXIgYWZmaWNoZXIgY29ycmVjdGVtZW50IGNlIHNpdGUgV2ViLiBcIixcclxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiTWVyY2kgZCdpbnN0YWxsZXIgQ2hyb21lIGRlcHVpcyBsZSBHb29nbGUgUGxheSBTdG9yZVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiTWVyY2kgZGUgbWV0dHJlIMOgIGpvdXIgaU9TIGRlcHVpcyBsJ2FwcGxpY2F0aW9uIFLDqWdsYWdlc1wiXHJcbiAgICB9LFxyXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9mclwiLFxyXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJNZXR0cmUgw6Agam91ciBtYWludGVuYW50IFwiLFxyXG4gICAgXCJjbG9zZVwiOiBcIkZlcm1lclwiXHJcbiAgfSxcclxuICBcImh1XCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiQSBiw7ZuZ8Opc3rFkWplIGVsYXZ1bHQhXCIsXHJcbiAgICBcInVwZGF0ZVwiOiB7XHJcbiAgICAgIFwid2ViXCI6IFwiRmlyc3PDrXRzZSB2YWd5IGNzZXLDqWxqZSBsZSBhIGLDtm5nw6lzesWRasOpdC4gXCIsXHJcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG4gICAgfSxcclxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vaHVcIixcclxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiQSBiw7ZuZ8Opc3rFkW0gZnJpc3PDrXTDqXNlIFwiLFxyXG4gICAgXCJjbG9zZVwiOiBcIkNsb3NlXCJcclxuICB9LFxyXG4gIFwiaWRcIjp7XHJcbiAgICBcIm91dE9mRGF0ZVwiOiBcIkJyb3dzZXIgeWFuZyBBbmRhIGd1bmFrYW4gc3VkYWgga2V0aW5nZ2FsYW4gemFtYW4hXCIsXHJcbiAgICBcInVwZGF0ZVwiOiB7XHJcbiAgICAgIFwid2ViXCI6IFwiUGVyYmFoYXJ1aWxhaCBicm93c2VyIEFuZGEgYWdhciBiaXNhIG1lbmplbGFqYWhpIHdlYnNpdGUgaW5pIGRlbmdhbiBueWFtYW4uIFwiLFxyXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL1wiLFxyXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJQZXJiYWhhcnVpIGJyb3dzZXIgc2VrYXJhbmcgXCIsXHJcbiAgICBcImNsb3NlXCI6IFwiQ2xvc2VcIlxyXG4gIH0sXHJcbiAgXCJpdFwiOiB7XHJcbiAgICBcIm91dE9mRGF0ZVwiOiBcIklsIHR1byBicm93c2VyIG5vbiAmZWdyYXZlOyBhZ2dpb3JuYXRvIVwiLFxyXG4gICAgXCJ1cGRhdGVcIjoge1xyXG4gICAgICBcIndlYlwiOiBcIkFnZ2lvcm5hbG8gcGVyIHZlZGVyZSBxdWVzdG8gc2l0byBjb3JyZXR0YW1lbnRlLiBcIixcclxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuICAgICAgXCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcbiAgICB9LFxyXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9pdFwiLFxyXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJBZ2dpb3JuYSBvcmFcIixcclxuICAgIFwiY2xvc2VcIjogXCJDaGl1ZGlcIlxyXG4gIH0sXHJcbiAgXCJsdFwiOntcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiSsWrc8WzIG5hcsWheWtsxJdzIHZlcnNpamEgeXJhIHBhc2VudXNpIVwiLFxyXG4gICAgXCJ1cGRhdGVcIjoge1xyXG4gICAgICBcIndlYlwiOiBcIkF0bmF1amlua2l0ZSBzYXZvIG5hcsWheWtsxJksIGthZCBnYWzEl3R1bcSXdGUgcGVyxb5pxatyxJd0aSDFoWnEhSBzdmV0YWluxJkgdGlua2FtYWkuIFwiLFxyXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL1wiLFxyXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJBdG5hdWppbnRpIG5hcsWheWtsxJkgXCIsXHJcbiAgICBcImNsb3NlXCI6IFwiQ2xvc2VcIlxyXG4gIH0sXHJcbiAgXCJubFwiOiB7XHJcbiAgICBcIm91dE9mRGF0ZVwiOiBcIkplIGdlYnJ1aWt0IGVlbiBvdWRlIGJyb3dzZXIhXCIsXHJcbiAgICBcInVwZGF0ZVwiOiB7XHJcbiAgICAgIFwid2ViXCI6IFwiVXBkYXRlIGplIGJyb3dzZXIgb20gZGV6ZSB3ZWJzaXRlIGNvcnJlY3QgdGUgYmVraWprZW4uIFwiLFxyXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL25sXCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIlVwZGF0ZSBtaWpuIGJyb3dzZXIgbnUgXCIsXHJcbiAgICBcImNsb3NlXCI6IFwiU2x1aXRlblwiXHJcbiAgfSxcclxuICBcInBsXCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiVHdvamEgcHJ6ZWdsxIVkYXJrYSBqZXN0IHByemVzdGFyemHFgmEhXCIsXHJcbiAgICBcInVwZGF0ZVwiOiB7XHJcbiAgICAgIFwid2ViXCI6IFwiWmFrdHVhbGl6dWogc3dvasSFIHByemVnbMSFZGFya8SZLCBhYnkgcG9wcmF3bmllIHd5xZt3aWV0bGnEhyB0xJkgc3Ryb27EmS4gXCIsXHJcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlByb3N6xJkgemFpbnN0YWxvd2HEhyBwcnplZ2zEhWRhcmvEmSBDaHJvbWUgemUgc2tsZXB1IEdvb2dsZSBQbGF5XCIsXHJcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQcm9zesSZIHpha3R1YWxpem93YcSHIGlPUyB6IFVzdGF3aWXFhFwiXHJcbiAgICB9LFxyXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9wbFwiLFxyXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJaYWt0dWFsaXp1aiBwcnplZ2zEhWRhcmvEmSBqdcW8IHRlcmF6XCIsXHJcbiAgICBcImNsb3NlXCI6IFwiWmFta25palwiXHJcbiAgfSxcclxuICBcInB0XCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiTyBzZXUgYnJvd3NlciBlc3QmYWFjdXRlOyBkZXNhdHVhbGl6YWRvIVwiLFxyXG4gICAgXCJ1cGRhdGVcIjoge1xyXG4gICAgICBcIndlYlwiOiBcIkF0dWFsaXplIG8gc2V1IGJyb3dzZXIgcGFyYSB0ZXIgdW1hIG1lbGhvciBleHBlcmkmZWNpcmM7bmNpYSBlIHZpc3VhbGl6YSZjY2VkaWw7JmF0aWxkZTtvIGRlc3RlIHNpdGUuIFwiLFxyXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL3B0XCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIkF0dWFsaXplIG8gc2V1IGJyb3dzZXIgYWdvcmFcIixcclxuICAgIFwiY2xvc2VcIjogXCJGZWNoYXJcIlxyXG4gIH0sXHJcbiAgXCJyb1wiOiB7XHJcbiAgICBcIm91dE9mRGF0ZVwiOiBcIkJyb3dzZXJ1bCBlc3RlIMOubnZlY2hpdCFcIixcclxuICAgIFwidXBkYXRlXCI6IHtcclxuICAgICAgXCJ3ZWJcIjogXCJBY3R1YWxpemHIm2kgYnJvd3NlcnVsIHBlbnRydSBhIHZpenVhbGl6YSBjb3JlY3QgYWNlc3Qgc2l0ZS4gXCIsXHJcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG4gICAgfSxcclxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vXCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIkFjdHVhbGl6YcibaSBicm93c2VydWwgYWN1bSFcIixcclxuICAgIFwiY2xvc2VcIjogXCJDbG9zZVwiXHJcbiAgfSxcclxuICBcInJ1XCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwi0JLQsNGIINCx0YDQsNGD0LfQtdGAINGD0YHRgtCw0YDQtdC7IVwiLFxyXG4gICAgXCJ1cGRhdGVcIjoge1xyXG4gICAgICBcIndlYlwiOiBcItCe0LHQvdC+0LLQuNGC0LUg0LLQsNGIINCx0YDQsNGD0LfQtdGAINC00LvRjyDQv9GA0LDQstC40LvRjNC90L7Qs9C+INC+0YLQvtCx0YDQsNC20LXQvdC40Y8g0Y3RgtC+0LPQviDRgdCw0LnRgtCwLiBcIixcclxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuICAgICAgXCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcbiAgICB9LFxyXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9ydVwiLFxyXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCLQntCx0L3QvtCy0LjRgtGMINC80L7QuSDQsdGA0LDRg9C30LXRgCBcIixcclxuICAgIFwiY2xvc2VcIjogXCLQl9Cw0LrRgNGL0YLRjFwiXHJcbiAgfSxcclxuICBcInNpXCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiVmHFoSBicnNrYWxuaWsgamUgemFzdGFyZWwhXCIsXHJcbiAgICBcInVwZGF0ZVwiOiB7XHJcbiAgICAgIFwid2ViXCI6IFwiWmEgcHJhdmlsZW4gcHJpa2F6IHNwbGV0bmUgc3RyYW5pIHBvc29kb2JpdGUgdmHFoSBicnNrYWxuaWsuIFwiLFxyXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL3NpXCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIlBvc29kb2JpIGJyc2thbG5payBcIixcclxuICAgIFwiY2xvc2VcIjogXCJaYXByaVwiXHJcbiAgfSxcclxuICBcInN2XCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiRGluIHdlYmJsw6RzYXJlIHN0w7ZkanMgZWogbMOkbmdyZSFcIixcclxuICAgIFwidXBkYXRlXCI6IHtcclxuICAgICAgXCJ3ZWJcIjogXCJVcHBkYXRlcmEgZGluIHdlYmJsw6RzYXJlIGbDtnIgYXR0IHdlYmJwbGF0c2VuIHNrYSB2aXNhcyBrb3JyZWt0LiBcIixcclxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuICAgICAgXCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcbiAgICB9LFxyXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9cIixcclxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiVXBwZGF0ZXJhIG1pbiB3ZWJibMOkc2FyZSBudVwiLFxyXG4gICAgXCJjbG9zZVwiOiBcIlN0w6RuZ1wiXHJcbiAgfSxcclxuICBcInVhXCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwi0JLQsNGIINCx0YDQsNGD0LfQtdGAINC30LDRgdGC0LDRgNGW0LIhXCIsXHJcbiAgICBcInVwZGF0ZVwiOiB7XHJcbiAgICAgIFwid2ViXCI6IFwi0J7QvdC+0LLRltGC0Ywg0LLQsNGIINCx0YDQsNGD0LfQtdGAINC00LvRjyDQv9GA0LDQstC40LvRjNC90L7Qs9C+INCy0ZbQtNC+0LHRgNCw0LbQtdC90L3RjyDRhtGM0L7Qs9C+INGB0LDQudGC0LAuIFwiLFxyXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL3VhXCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcItCe0L3QvtCy0LjRgtC4INC80ZbQuSDQsdGA0LDRg9C30LXRgCBcIixcclxuICAgIFwiY2xvc2VcIjogXCLQl9Cw0LrRgNC40YLQuFwiXHJcbiAgfVxyXG59XHJcbiIsIi8qIVxuICogVUFQYXJzZXIuanMgdjAuNy4yMFxuICogTGlnaHR3ZWlnaHQgSmF2YVNjcmlwdC1iYXNlZCBVc2VyLUFnZW50IHN0cmluZyBwYXJzZXJcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWlzYWxtYW4vdWEtcGFyc2VyLWpzXG4gKlxuICogQ29weXJpZ2h0IMKpIDIwMTItMjAxOSBGYWlzYWwgU2FsbWFuIDxmQGZhaXNhbG1hbi5jb20+XG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgTGljZW5zZVxuICovXG5cbihmdW5jdGlvbiAod2luZG93LCB1bmRlZmluZWQpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vLy8vLy8vLy8vLy8vXG4gICAgLy8gQ29uc3RhbnRzXG4gICAgLy8vLy8vLy8vLy8vL1xuXG5cbiAgICB2YXIgTElCVkVSU0lPTiAgPSAnMC43LjIwJyxcbiAgICAgICAgRU1QVFkgICAgICAgPSAnJyxcbiAgICAgICAgVU5LTk9XTiAgICAgPSAnPycsXG4gICAgICAgIEZVTkNfVFlQRSAgID0gJ2Z1bmN0aW9uJyxcbiAgICAgICAgVU5ERUZfVFlQRSAgPSAndW5kZWZpbmVkJyxcbiAgICAgICAgT0JKX1RZUEUgICAgPSAnb2JqZWN0JyxcbiAgICAgICAgU1RSX1RZUEUgICAgPSAnc3RyaW5nJyxcbiAgICAgICAgTUFKT1IgICAgICAgPSAnbWFqb3InLCAvLyBkZXByZWNhdGVkXG4gICAgICAgIE1PREVMICAgICAgID0gJ21vZGVsJyxcbiAgICAgICAgTkFNRSAgICAgICAgPSAnbmFtZScsXG4gICAgICAgIFRZUEUgICAgICAgID0gJ3R5cGUnLFxuICAgICAgICBWRU5ET1IgICAgICA9ICd2ZW5kb3InLFxuICAgICAgICBWRVJTSU9OICAgICA9ICd2ZXJzaW9uJyxcbiAgICAgICAgQVJDSElURUNUVVJFPSAnYXJjaGl0ZWN0dXJlJyxcbiAgICAgICAgQ09OU09MRSAgICAgPSAnY29uc29sZScsXG4gICAgICAgIE1PQklMRSAgICAgID0gJ21vYmlsZScsXG4gICAgICAgIFRBQkxFVCAgICAgID0gJ3RhYmxldCcsXG4gICAgICAgIFNNQVJUVFYgICAgID0gJ3NtYXJ0dHYnLFxuICAgICAgICBXRUFSQUJMRSAgICA9ICd3ZWFyYWJsZScsXG4gICAgICAgIEVNQkVEREVEICAgID0gJ2VtYmVkZGVkJztcblxuXG4gICAgLy8vLy8vLy8vLy9cbiAgICAvLyBIZWxwZXJcbiAgICAvLy8vLy8vLy8vXG5cblxuICAgIHZhciB1dGlsID0ge1xuICAgICAgICBleHRlbmQgOiBmdW5jdGlvbiAocmVnZXhlcywgZXh0ZW5zaW9ucykge1xuICAgICAgICAgICAgdmFyIG1lcmdlZFJlZ2V4ZXMgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgaW4gcmVnZXhlcykge1xuICAgICAgICAgICAgICAgIGlmIChleHRlbnNpb25zW2ldICYmIGV4dGVuc2lvbnNbaV0ubGVuZ3RoICUgMiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBtZXJnZWRSZWdleGVzW2ldID0gZXh0ZW5zaW9uc1tpXS5jb25jYXQocmVnZXhlc1tpXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbWVyZ2VkUmVnZXhlc1tpXSA9IHJlZ2V4ZXNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1lcmdlZFJlZ2V4ZXM7XG4gICAgICAgIH0sXG4gICAgICAgIGhhcyA6IGZ1bmN0aW9uIChzdHIxLCBzdHIyKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBzdHIxID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyMi50b0xvd2VyQ2FzZSgpLmluZGV4T2Yoc3RyMS50b0xvd2VyQ2FzZSgpKSAhPT0gLTE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGxvd2VyaXplIDogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgcmV0dXJuIHN0ci50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB9LFxuICAgICAgICBtYWpvciA6IGZ1bmN0aW9uICh2ZXJzaW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mKHZlcnNpb24pID09PSBTVFJfVFlQRSA/IHZlcnNpb24ucmVwbGFjZSgvW15cXGRcXC5dL2csJycpLnNwbGl0KFwiLlwiKVswXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgfSxcbiAgICAgICAgdHJpbSA6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UoL15bXFxzXFx1RkVGRlxceEEwXSt8W1xcc1xcdUZFRkZcXHhBMF0rJC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBNYXAgaGVscGVyXG4gICAgLy8vLy8vLy8vLy8vLy9cblxuXG4gICAgdmFyIG1hcHBlciA9IHtcblxuICAgICAgICByZ3ggOiBmdW5jdGlvbiAodWEsIGFycmF5cykge1xuXG4gICAgICAgICAgICB2YXIgaSA9IDAsIGosIGssIHAsIHEsIG1hdGNoZXMsIG1hdGNoO1xuXG4gICAgICAgICAgICAvLyBsb29wIHRocm91Z2ggYWxsIHJlZ2V4ZXMgbWFwc1xuICAgICAgICAgICAgd2hpbGUgKGkgPCBhcnJheXMubGVuZ3RoICYmICFtYXRjaGVzKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgcmVnZXggPSBhcnJheXNbaV0sICAgICAgIC8vIGV2ZW4gc2VxdWVuY2UgKDAsMiw0LC4uKVxuICAgICAgICAgICAgICAgICAgICBwcm9wcyA9IGFycmF5c1tpICsgMV07ICAgLy8gb2RkIHNlcXVlbmNlICgxLDMsNSwuLilcbiAgICAgICAgICAgICAgICBqID0gayA9IDA7XG5cbiAgICAgICAgICAgICAgICAvLyB0cnkgbWF0Y2hpbmcgdWFzdHJpbmcgd2l0aCByZWdleGVzXG4gICAgICAgICAgICAgICAgd2hpbGUgKGogPCByZWdleC5sZW5ndGggJiYgIW1hdGNoZXMpIHtcblxuICAgICAgICAgICAgICAgICAgICBtYXRjaGVzID0gcmVnZXhbaisrXS5leGVjKHVhKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoISFtYXRjaGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHAgPSAwOyBwIDwgcHJvcHMubGVuZ3RoOyBwKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IG1hdGNoZXNbKytrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxID0gcHJvcHNbcF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgZ2l2ZW4gcHJvcGVydHkgaXMgYWN0dWFsbHkgYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHEgPT09IE9CSl9UWVBFICYmIHEubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocS5sZW5ndGggPT0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBxWzFdID09IEZVTkNfVFlQRSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFzc2lnbiBtb2RpZmllZCBtYXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbcVswXV0gPSBxWzFdLmNhbGwodGhpcywgbWF0Y2gpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhc3NpZ24gZ2l2ZW4gdmFsdWUsIGlnbm9yZSByZWdleCBtYXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbcVswXV0gPSBxWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHEubGVuZ3RoID09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIHdoZXRoZXIgZnVuY3Rpb24gb3IgcmVnZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcVsxXSA9PT0gRlVOQ19UWVBFICYmICEocVsxXS5leGVjICYmIHFbMV0udGVzdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjYWxsIGZ1bmN0aW9uICh1c3VhbGx5IHN0cmluZyBtYXBwZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1txWzBdXSA9IG1hdGNoID8gcVsxXS5jYWxsKHRoaXMsIG1hdGNoLCBxWzJdKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2FuaXRpemUgbWF0Y2ggdXNpbmcgZ2l2ZW4gcmVnZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzW3FbMF1dID0gbWF0Y2ggPyBtYXRjaC5yZXBsYWNlKHFbMV0sIHFbMl0pIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHEubGVuZ3RoID09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzW3FbMF1dID0gbWF0Y2ggPyBxWzNdLmNhbGwodGhpcywgbWF0Y2gucmVwbGFjZShxWzFdLCBxWzJdKSkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzW3FdID0gbWF0Y2ggPyBtYXRjaCA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaSArPSAyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHN0ciA6IGZ1bmN0aW9uIChzdHIsIG1hcCkge1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpIGluIG1hcCkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIGFycmF5XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtYXBbaV0gPT09IE9CSl9UWVBFICYmIG1hcFtpXS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbWFwW2ldLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodXRpbC5oYXMobWFwW2ldW2pdLCBzdHIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChpID09PSBVTktOT1dOKSA/IHVuZGVmaW5lZCA6IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHV0aWwuaGFzKG1hcFtpXSwgc3RyKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGkgPT09IFVOS05PV04pID8gdW5kZWZpbmVkIDogaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gU3RyaW5nIG1hcFxuICAgIC8vLy8vLy8vLy8vLy8vXG5cblxuICAgIHZhciBtYXBzID0ge1xuXG4gICAgICAgIGJyb3dzZXIgOiB7XG4gICAgICAgICAgICBvbGRzYWZhcmkgOiB7XG4gICAgICAgICAgICAgICAgdmVyc2lvbiA6IHtcbiAgICAgICAgICAgICAgICAgICAgJzEuMCcgICA6ICcvOCcsXG4gICAgICAgICAgICAgICAgICAgICcxLjInICAgOiAnLzEnLFxuICAgICAgICAgICAgICAgICAgICAnMS4zJyAgIDogJy8zJyxcbiAgICAgICAgICAgICAgICAgICAgJzIuMCcgICA6ICcvNDEyJyxcbiAgICAgICAgICAgICAgICAgICAgJzIuMC4yJyA6ICcvNDE2JyxcbiAgICAgICAgICAgICAgICAgICAgJzIuMC4zJyA6ICcvNDE3JyxcbiAgICAgICAgICAgICAgICAgICAgJzIuMC40JyA6ICcvNDE5JyxcbiAgICAgICAgICAgICAgICAgICAgJz8nICAgICA6ICcvJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBkZXZpY2UgOiB7XG4gICAgICAgICAgICBhbWF6b24gOiB7XG4gICAgICAgICAgICAgICAgbW9kZWwgOiB7XG4gICAgICAgICAgICAgICAgICAgICdGaXJlIFBob25lJyA6IFsnU0QnLCAnS0YnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcHJpbnQgOiB7XG4gICAgICAgICAgICAgICAgbW9kZWwgOiB7XG4gICAgICAgICAgICAgICAgICAgICdFdm8gU2hpZnQgNEcnIDogJzczNzNLVCdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHZlbmRvciA6IHtcbiAgICAgICAgICAgICAgICAgICAgJ0hUQycgICAgICAgOiAnQVBBJyxcbiAgICAgICAgICAgICAgICAgICAgJ1NwcmludCcgICAgOiAnU3ByaW50J1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBvcyA6IHtcbiAgICAgICAgICAgIHdpbmRvd3MgOiB7XG4gICAgICAgICAgICAgICAgdmVyc2lvbiA6IHtcbiAgICAgICAgICAgICAgICAgICAgJ01FJyAgICAgICAgOiAnNC45MCcsXG4gICAgICAgICAgICAgICAgICAgICdOVCAzLjExJyAgIDogJ05UMy41MScsXG4gICAgICAgICAgICAgICAgICAgICdOVCA0LjAnICAgIDogJ05UNC4wJyxcbiAgICAgICAgICAgICAgICAgICAgJzIwMDAnICAgICAgOiAnTlQgNS4wJyxcbiAgICAgICAgICAgICAgICAgICAgJ1hQJyAgICAgICAgOiBbJ05UIDUuMScsICdOVCA1LjInXSxcbiAgICAgICAgICAgICAgICAgICAgJ1Zpc3RhJyAgICAgOiAnTlQgNi4wJyxcbiAgICAgICAgICAgICAgICAgICAgJzcnICAgICAgICAgOiAnTlQgNi4xJyxcbiAgICAgICAgICAgICAgICAgICAgJzgnICAgICAgICAgOiAnTlQgNi4yJyxcbiAgICAgICAgICAgICAgICAgICAgJzguMScgICAgICAgOiAnTlQgNi4zJyxcbiAgICAgICAgICAgICAgICAgICAgJzEwJyAgICAgICAgOiBbJ05UIDYuNCcsICdOVCAxMC4wJ10sXG4gICAgICAgICAgICAgICAgICAgICdSVCcgICAgICAgIDogJ0FSTSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvLy8vLy8vLy8vLy8vL1xuICAgIC8vIFJlZ2V4IG1hcFxuICAgIC8vLy8vLy8vLy8vLy9cblxuXG4gICAgdmFyIHJlZ2V4ZXMgPSB7XG5cbiAgICAgICAgYnJvd3NlciA6IFtbXG5cbiAgICAgICAgICAgIC8vIFByZXN0byBiYXNlZFxuICAgICAgICAgICAgLyhvcGVyYVxcc21pbmkpXFwvKFtcXHdcXC4tXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgTWluaVxuICAgICAgICAgICAgLyhvcGVyYVxcc1ttb2JpbGV0YWJdKykuK3ZlcnNpb25cXC8oW1xcd1xcLi1dKykvaSwgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgTW9iaS9UYWJsZXRcbiAgICAgICAgICAgIC8ob3BlcmEpLit2ZXJzaW9uXFwvKFtcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgPiA5LjgwXG4gICAgICAgICAgICAvKG9wZXJhKVtcXC9cXHNdKyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPcGVyYSA8IDkuODBcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKG9waW9zKVtcXC9cXHNdKyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPcGVyYSBtaW5pIG9uIGlwaG9uZSA+PSA4LjBcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ09wZXJhIE1pbmknXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgL1xccyhvcHIpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgV2Via2l0XG4gICAgICAgICAgICBdLCBbW05BTUUsICdPcGVyYSddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvLyBNaXhlZFxuICAgICAgICAgICAgLyhraW5kbGUpXFwvKFtcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBLaW5kbGVcbiAgICAgICAgICAgIC8obHVuYXNjYXBlfG1heHRob258bmV0ZnJvbnR8amFzbWluZXxibGF6ZXIpW1xcL1xcc10/KFtcXHdcXC5dKikvaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTHVuYXNjYXBlL01heHRob24vTmV0ZnJvbnQvSmFzbWluZS9CbGF6ZXJcblxuICAgICAgICAgICAgLy8gVHJpZGVudCBiYXNlZFxuICAgICAgICAgICAgLyhhdmFudFxcc3xpZW1vYmlsZXxzbGltfGJhaWR1KSg/OmJyb3dzZXIpP1tcXC9cXHNdPyhbXFx3XFwuXSopL2ksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF2YW50L0lFTW9iaWxlL1NsaW1Ccm93c2VyL0JhaWR1XG4gICAgICAgICAgICAvKD86bXN8XFwoKShpZSlcXHMoW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJbnRlcm5ldCBFeHBsb3JlclxuXG4gICAgICAgICAgICAvLyBXZWJraXQvS0hUTUwgYmFzZWRcbiAgICAgICAgICAgIC8ocmVrb25xKVxcLyhbXFx3XFwuXSopL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVrb25xXG4gICAgICAgICAgICAvKGNocm9taXVtfGZsb2NrfHJvY2ttZWx0fG1pZG9yaXxlcGlwaGFueXxzaWxrfHNreWZpcmV8b3ZpYnJvd3Nlcnxib2x0fGlyb258dml2YWxkaXxpcmlkaXVtfHBoYW50b21qc3xib3dzZXJ8cXVhcmt8cXVwemlsbGF8ZmFsa29uKVxcLyhbXFx3XFwuLV0rKS9pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENocm9taXVtL0Zsb2NrL1JvY2tNZWx0L01pZG9yaS9FcGlwaGFueS9TaWxrL1NreWZpcmUvQm9sdC9Jcm9uL0lyaWRpdW0vUGhhbnRvbUpTL0Jvd3Nlci9RdXBaaWxsYS9GYWxrb25cbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKGtvbnF1ZXJvcilcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEtvbnF1ZXJvclxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnS29ucXVlcm9yJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8odHJpZGVudCkuK3J2WzpcXHNdKFtcXHdcXC5dKykuK2xpa2VcXHNnZWNrby9pICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElFMTFcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0lFJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oZWRnZXxlZGdpb3N8ZWRnYXxlZGcpXFwvKChcXGQrKT9bXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1pY3Jvc29mdCBFZGdlXG4gICAgICAgICAgICBdLCBbW05BTUUsICdFZGdlJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oeWFicm93c2VyKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gWWFuZGV4XG4gICAgICAgICAgICBdLCBbW05BTUUsICdZYW5kZXgnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhwdWZmaW4pXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQdWZmaW5cbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ1B1ZmZpbiddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKGZvY3VzKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggRm9jdXNcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0ZpcmVmb3ggRm9jdXMnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhvcHQpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPcGVyYSBUb3VjaFxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnT3BlcmEgVG91Y2gnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLygoPzpbXFxzXFwvXSl1Yz9cXHM/YnJvd3NlcnwoPzpqdWMuKyl1Y3dlYilbXFwvXFxzXT8oW1xcd1xcLl0rKS9pICAgICAgICAgLy8gVUNCcm93c2VyXG4gICAgICAgICAgICBdLCBbW05BTUUsICdVQ0Jyb3dzZXInXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhjb21vZG9fZHJhZ29uKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDb21vZG8gRHJhZ29uXG4gICAgICAgICAgICBdLCBbW05BTUUsIC9fL2csICcgJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8od2luZG93c3dlY2hhdCBxYmNvcmUpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2VDaGF0IERlc2t0b3AgZm9yIFdpbmRvd3MgQnVpbHQtaW4gQnJvd3NlclxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnV2VDaGF0KFdpbikgRGVza3RvcCddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKG1pY3JvbWVzc2VuZ2VyKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlQ2hhdFxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnV2VDaGF0J10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oYnJhdmUpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCcmF2ZSBicm93c2VyXG4gICAgICAgICAgICBdLCBbW05BTUUsICdCcmF2ZSddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKHFxYnJvd3NlcmxpdGUpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFFRQnJvd3NlckxpdGVcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKFFRKVxcLyhbXFxkXFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFFRLCBha2EgU2hvdVFcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvbT8ocXFicm93c2VyKVtcXC9cXHNdPyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBRUUJyb3dzZXJcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKEJJRFVCcm93c2VyKVtcXC9cXHNdPyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCYWlkdSBCcm93c2VyXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLygyMzQ1RXhwbG9yZXIpW1xcL1xcc10/KFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMjM0NSBCcm93c2VyXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhNZXRhU3IpW1xcL1xcc10/KFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU291R291QnJvd3NlclxuICAgICAgICAgICAgXSwgW05BTUVdLCBbXG5cbiAgICAgICAgICAgIC8oTEJCUk9XU0VSKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMaWVCYW8gQnJvd3NlclxuICAgICAgICAgICAgXSwgW05BTUVdLCBbXG5cbiAgICAgICAgICAgIC94aWFvbWlcXC9taXVpYnJvd3NlclxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1JVUkgQnJvd3NlclxuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIFtOQU1FLCAnTUlVSSBCcm93c2VyJ11dLCBbXG5cbiAgICAgICAgICAgIC87ZmJhdlxcLyhbXFx3XFwuXSspOy9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmFjZWJvb2sgQXBwIGZvciBpT1MgJiBBbmRyb2lkXG4gICAgICAgICAgICBdLCBbVkVSU0lPTiwgW05BTUUsICdGYWNlYm9vayddXSwgW1xuXG4gICAgICAgICAgICAvc2FmYXJpXFxzKGxpbmUpXFwvKFtcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMaW5lIEFwcCBmb3IgaU9TXG4gICAgICAgICAgICAvYW5kcm9pZC4rKGxpbmUpXFwvKFtcXHdcXC5dKylcXC9pYWIvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMaW5lIEFwcCBmb3IgQW5kcm9pZFxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC9oZWFkbGVzc2Nocm9tZSg/OlxcLyhbXFx3XFwuXSspfFxccykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENocm9tZSBIZWFkbGVzc1xuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIFtOQU1FLCAnQ2hyb21lIEhlYWRsZXNzJ11dLCBbXG5cbiAgICAgICAgICAgIC9cXHN3dlxcKS4rKGNocm9tZSlcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaHJvbWUgV2ViVmlld1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAvKC4rKS8sICckMSBXZWJWaWV3J10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oKD86b2N1bHVzfHNhbXN1bmcpYnJvd3NlcilcXC8oW1xcd1xcLl0rKS9pXG4gICAgICAgICAgICBdLCBbW05BTUUsIC8oLisoPzpnfHVzKSkoLispLywgJyQxICQyJ10sIFZFUlNJT05dLCBbICAgICAgICAgICAgICAgIC8vIE9jdWx1cyAvIFNhbXN1bmcgQnJvd3NlclxuXG4gICAgICAgICAgICAvYW5kcm9pZC4rdmVyc2lvblxcLyhbXFx3XFwuXSspXFxzKyg/Om1vYmlsZVxccz9zYWZhcml8c2FmYXJpKSovaSAgICAgICAgLy8gQW5kcm9pZCBCcm93c2VyXG4gICAgICAgICAgICBdLCBbVkVSU0lPTiwgW05BTUUsICdBbmRyb2lkIEJyb3dzZXInXV0sIFtcblxuICAgICAgICAgICAgLyhzYWlsZmlzaGJyb3dzZXIpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTYWlsZmlzaCBCcm93c2VyXG4gICAgICAgICAgICBdLCBbW05BTUUsICdTYWlsZmlzaCBCcm93c2VyJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oY2hyb21lfG9tbml3ZWJ8YXJvcmF8W3RpemVub2thXXs1fVxccz9icm93c2VyKVxcL3Y/KFtcXHdcXC5dKykvaVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaHJvbWUvT21uaVdlYi9Bcm9yYS9UaXplbi9Ob2tpYVxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oZG9sZmluKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRG9scGhpblxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnRG9scGhpbiddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKCg/OmFuZHJvaWQuKyljcm1vfGNyaW9zKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENocm9tZSBmb3IgQW5kcm9pZC9pT1NcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0Nocm9tZSddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKGNvYXN0KVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZXJhIENvYXN0XG4gICAgICAgICAgICBdLCBbW05BTUUsICdPcGVyYSBDb2FzdCddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvZnhpb3NcXC8oW1xcd1xcLi1dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggZm9yIGlPU1xuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIFtOQU1FLCAnRmlyZWZveCddXSwgW1xuXG4gICAgICAgICAgICAvdmVyc2lvblxcLyhbXFx3XFwuXSspLis/bW9iaWxlXFwvXFx3K1xccyhzYWZhcmkpL2kgICAgICAgICAgICAgICAgICAgICAgIC8vIE1vYmlsZSBTYWZhcmlcbiAgICAgICAgICAgIF0sIFtWRVJTSU9OLCBbTkFNRSwgJ01vYmlsZSBTYWZhcmknXV0sIFtcblxuICAgICAgICAgICAgL3ZlcnNpb25cXC8oW1xcd1xcLl0rKS4rPyhtb2JpbGVcXHM/c2FmYXJpfHNhZmFyaSkvaSAgICAgICAgICAgICAgICAgICAgLy8gU2FmYXJpICYgU2FmYXJpIE1vYmlsZVxuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIE5BTUVdLCBbXG5cbiAgICAgICAgICAgIC93ZWJraXQuKz8oZ3NhKVxcLyhbXFx3XFwuXSspLis/KG1vYmlsZVxccz9zYWZhcml8c2FmYXJpKShcXC9bXFx3XFwuXSspL2kgIC8vIEdvb2dsZSBTZWFyY2ggQXBwbGlhbmNlIG9uIGlPU1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAnR1NBJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC93ZWJraXQuKz8obW9iaWxlXFxzP3NhZmFyaXxzYWZhcmkpKFxcL1tcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgIC8vIFNhZmFyaSA8IDMuMFxuICAgICAgICAgICAgXSwgW05BTUUsIFtWRVJTSU9OLCBtYXBwZXIuc3RyLCBtYXBzLmJyb3dzZXIub2xkc2FmYXJpLnZlcnNpb25dXSwgW1xuXG4gICAgICAgICAgICAvKHdlYmtpdHxraHRtbClcXC8oW1xcd1xcLl0rKS9pXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLy8gR2Vja28gYmFzZWRcbiAgICAgICAgICAgIC8obmF2aWdhdG9yfG5ldHNjYXBlKVxcLyhbXFx3XFwuLV0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTmV0c2NhcGVcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ05ldHNjYXBlJ10sIFZFUlNJT05dLCBbXG4gICAgICAgICAgICAvKHN3aWZ0Zm94KS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN3aWZ0Zm94XG4gICAgICAgICAgICAvKGljZWRyYWdvbnxpY2V3ZWFzZWx8Y2FtaW5vfGNoaW1lcmF8ZmVubmVjfG1hZW1vXFxzYnJvd3NlcnxtaW5pbW98Y29ua2Vyb3IpW1xcL1xcc10/KFtcXHdcXC5cXCtdKykvaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWNlRHJhZ29uL0ljZXdlYXNlbC9DYW1pbm8vQ2hpbWVyYS9GZW5uZWMvTWFlbW8vTWluaW1vL0Nvbmtlcm9yXG4gICAgICAgICAgICAvKGZpcmVmb3h8c2VhbW9ua2V5fGstbWVsZW9ufGljZWNhdHxpY2VhcGV8ZmlyZWJpcmR8cGhvZW5peHxwYWxlbW9vbnxiYXNpbGlza3x3YXRlcmZveClcXC8oW1xcd1xcLi1dKykkL2ksXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlyZWZveC9TZWFNb25rZXkvSy1NZWxlb24vSWNlQ2F0L0ljZUFwZS9GaXJlYmlyZC9QaG9lbml4XG4gICAgICAgICAgICAvKG1vemlsbGEpXFwvKFtcXHdcXC5dKykuK3J2XFw6LitnZWNrb1xcL1xcZCsvaSwgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1vemlsbGFcblxuICAgICAgICAgICAgLy8gT3RoZXJcbiAgICAgICAgICAgIC8ocG9sYXJpc3xseW54fGRpbGxvfGljYWJ8ZG9yaXN8YW1heWF8dzNtfG5ldHN1cmZ8c2xlaXBuaXIpW1xcL1xcc10/KFtcXHdcXC5dKykvaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUG9sYXJpcy9MeW54L0RpbGxvL2lDYWIvRG9yaXMvQW1heWEvdzNtL05ldFN1cmYvU2xlaXBuaXJcbiAgICAgICAgICAgIC8obGlua3MpXFxzXFwoKFtcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExpbmtzXG4gICAgICAgICAgICAvKGdvYnJvd3NlcilcXC8/KFtcXHdcXC5dKikvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdvQnJvd3NlclxuICAgICAgICAgICAgLyhpY2VcXHM/YnJvd3NlcilcXC92PyhbXFx3XFwuX10rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUNFIEJyb3dzZXJcbiAgICAgICAgICAgIC8obW9zYWljKVtcXC9cXHNdKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1vc2FpY1xuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dXG4gICAgICAgIF0sXG5cbiAgICAgICAgY3B1IDogW1tcblxuICAgICAgICAgICAgLyg/OihhbWR8eCg/Oig/Ojg2fDY0KVtfLV0pP3x3b3d8d2luKTY0KVs7XFwpXS9pICAgICAgICAgICAgICAgICAgICAgLy8gQU1ENjRcbiAgICAgICAgICAgIF0sIFtbQVJDSElURUNUVVJFLCAnYW1kNjQnXV0sIFtcblxuICAgICAgICAgICAgLyhpYTMyKD89OykpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJQTMyIChxdWlja3RpbWUpXG4gICAgICAgICAgICBdLCBbW0FSQ0hJVEVDVFVSRSwgdXRpbC5sb3dlcml6ZV1dLCBbXG5cbiAgICAgICAgICAgIC8oKD86aVszNDZdfHgpODYpWztcXCldL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElBMzJcbiAgICAgICAgICAgIF0sIFtbQVJDSElURUNUVVJFLCAnaWEzMiddXSwgW1xuXG4gICAgICAgICAgICAvLyBQb2NrZXRQQyBtaXN0YWtlbmx5IGlkZW50aWZpZWQgYXMgUG93ZXJQQ1xuICAgICAgICAgICAgL3dpbmRvd3NcXHMoY2V8bW9iaWxlKTtcXHNwcGM7L2lcbiAgICAgICAgICAgIF0sIFtbQVJDSElURUNUVVJFLCAnYXJtJ11dLCBbXG5cbiAgICAgICAgICAgIC8oKD86cHBjfHBvd2VycGMpKD86NjQpPykoPzpcXHNtYWN8O3xcXCkpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQb3dlclBDXG4gICAgICAgICAgICBdLCBbW0FSQ0hJVEVDVFVSRSwgL293ZXIvLCAnJywgdXRpbC5sb3dlcml6ZV1dLCBbXG5cbiAgICAgICAgICAgIC8oc3VuNFxcdylbO1xcKV0vaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTUEFSQ1xuICAgICAgICAgICAgXSwgW1tBUkNISVRFQ1RVUkUsICdzcGFyYyddXSwgW1xuXG4gICAgICAgICAgICAvKCg/OmF2cjMyfGlhNjQoPz07KSl8NjhrKD89XFwpKXxhcm0oPzo2NHwoPz12XFxkK1s7bF0pKXwoPz1hdG1lbFxccylhdnJ8KD86aXJpeHxtaXBzfHNwYXJjKSg/OjY0KT8oPz07KXxwYS1yaXNjKS9pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElBNjQsIDY4SywgQVJNLzY0LCBBVlIvMzIsIElSSVgvNjQsIE1JUFMvNjQsIFNQQVJDLzY0LCBQQS1SSVNDXG4gICAgICAgICAgICBdLCBbW0FSQ0hJVEVDVFVSRSwgdXRpbC5sb3dlcml6ZV1dXG4gICAgICAgIF0sXG5cbiAgICAgICAgZGV2aWNlIDogW1tcblxuICAgICAgICAgICAgL1xcKChpcGFkfHBsYXlib29rKTtbXFx3XFxzXFwpLDstXSsocmltfGFwcGxlKS9pICAgICAgICAgICAgICAgICAgICAgICAgLy8gaVBhZC9QbGF5Qm9va1xuICAgICAgICAgICAgXSwgW01PREVMLCBWRU5ET1IsIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYXBwbGVjb3JlbWVkaWFcXC9bXFx3XFwuXSsgXFwoKGlwYWQpLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpUGFkXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdBcHBsZSddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgLyhhcHBsZVxcc3swLDF9dHYpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXBwbGUgVFZcbiAgICAgICAgICAgIF0sIFtbTU9ERUwsICdBcHBsZSBUViddLCBbVkVORE9SLCAnQXBwbGUnXV0sIFtcblxuICAgICAgICAgICAgLyhhcmNob3MpXFxzKGdhbWVwYWQyPykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXJjaG9zXG4gICAgICAgICAgICAvKGhwKS4rKHRvdWNocGFkKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhQIFRvdWNoUGFkXG4gICAgICAgICAgICAvKGhwKS4rKHRhYmxldCkvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhQIFRhYmxldFxuICAgICAgICAgICAgLyhraW5kbGUpXFwvKFtcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBLaW5kbGVcbiAgICAgICAgICAgIC9cXHMobm9vaylbXFx3XFxzXStidWlsZFxcLyhcXHcrKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOb29rXG4gICAgICAgICAgICAvKGRlbGwpXFxzKHN0cmVhW2twclxcc1xcZF0qW1xcZGtvXSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEZWxsIFN0cmVha1xuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvKGtmW0Etel0rKVxcc2J1aWxkXFwvLitzaWxrXFwvL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEtpbmRsZSBGaXJlIEhEXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdBbWF6b24nXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG4gICAgICAgICAgICAvKHNkfGtmKVswMzQ5aGlqb3JzdHV3XStcXHNidWlsZFxcLy4rc2lsa1xcLy9pICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpcmUgUGhvbmVcbiAgICAgICAgICAgIF0sIFtbTU9ERUwsIG1hcHBlci5zdHIsIG1hcHMuZGV2aWNlLmFtYXpvbi5tb2RlbF0sIFtWRU5ET1IsICdBbWF6b24nXSwgW1RZUEUsIE1PQklMRV1dLCBbXG4gICAgICAgICAgICAvYW5kcm9pZC4rYWZ0KFtibXNdKVxcc2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXJlIFRWXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdBbWF6b24nXSwgW1RZUEUsIFNNQVJUVFZdXSwgW1xuXG4gICAgICAgICAgICAvXFwoKGlwW2hvbmVkfFxcc1xcdypdKyk7LisoYXBwbGUpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlQb2QvaVBob25lXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFZFTkRPUiwgW1RZUEUsIE1PQklMRV1dLCBbXG4gICAgICAgICAgICAvXFwoKGlwW2hvbmVkfFxcc1xcdypdKyk7L2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlQb2QvaVBob25lXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdBcHBsZSddLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgLyhibGFja2JlcnJ5KVtcXHMtXT8oXFx3KykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJsYWNrQmVycnlcbiAgICAgICAgICAgIC8oYmxhY2tiZXJyeXxiZW5xfHBhbG0oPz1cXC0pfHNvbnllcmljc3NvbnxhY2VyfGFzdXN8ZGVsbHxtZWl6dXxtb3Rvcm9sYXxwb2x5dHJvbilbXFxzXy1dPyhbXFx3LV0qKS9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCZW5RL1BhbG0vU29ueS1Fcmljc3Nvbi9BY2VyL0FzdXMvRGVsbC9NZWl6dS9Nb3Rvcm9sYS9Qb2x5dHJvblxuICAgICAgICAgICAgLyhocClcXHMoW1xcd1xcc10rXFx3KS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFAgaVBBUVxuICAgICAgICAgICAgLyhhc3VzKS0/KFxcdyspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXN1c1xuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgW1xuICAgICAgICAgICAgL1xcKGJiMTA7XFxzKFxcdyspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCbGFja0JlcnJ5IDEwXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdCbGFja0JlcnJ5J10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBc3VzIFRhYmxldHNcbiAgICAgICAgICAgIC9hbmRyb2lkLisodHJhbnNmb1twcmltZVxcc117NCwxMH1cXHNcXHcrfGVlZXBjfHNsaWRlclxcc1xcdyt8bmV4dXMgN3xwYWRmb25lfHAwMGMpL2lcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0FzdXMnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC8oc29ueSlcXHModGFibGV0XFxzW3BzXSlcXHNidWlsZFxcLy9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTb255XG4gICAgICAgICAgICAvKHNvbnkpPyg/OnNncC4rKVxcc2J1aWxkXFwvL2lcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnU29ueSddLCBbTU9ERUwsICdYcGVyaWEgVGFibGV0J10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuICAgICAgICAgICAgL2FuZHJvaWQuK1xccyhbYy1nXVxcZHs0fXxzb1stbF1cXHcrKSg/PVxcc2J1aWxkXFwvfFxcKS4rY2hyb21lXFwvKD8hWzEtNl17MCwxfVxcZFxcLikpL2lcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ1NvbnknXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9cXHMob3V5YSlcXHMvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPdXlhXG4gICAgICAgICAgICAvKG5pbnRlbmRvKVxccyhbd2lkczN1XSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOaW50ZW5kb1xuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBDT05TT0xFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKztcXHMoc2hpZWxkKVxcc2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE52aWRpYVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnTnZpZGlhJ10sIFtUWVBFLCBDT05TT0xFXV0sIFtcblxuICAgICAgICAgICAgLyhwbGF5c3RhdGlvblxcc1szNHBvcnRhYmxldmldKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUGxheXN0YXRpb25cbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ1NvbnknXSwgW1RZUEUsIENPTlNPTEVdXSwgW1xuXG4gICAgICAgICAgICAvKHNwcmludFxccyhcXHcrKSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3ByaW50IFBob25lc1xuICAgICAgICAgICAgXSwgW1tWRU5ET1IsIG1hcHBlci5zdHIsIG1hcHMuZGV2aWNlLnNwcmludC52ZW5kb3JdLCBbTU9ERUwsIG1hcHBlci5zdHIsIG1hcHMuZGV2aWNlLnNwcmludC5tb2RlbF0sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvKGh0YylbO19cXHMtXSsoW1xcd1xcc10rKD89XFwpfFxcc2J1aWxkKXxcXHcrKS9pLCAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhUQ1xuICAgICAgICAgICAgLyh6dGUpLShcXHcqKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gWlRFXG4gICAgICAgICAgICAvKGFsY2F0ZWx8Z2Vla3NwaG9uZXxuZXhpYW58cGFuYXNvbmljfCg/PTtcXHMpc29ueSlbX1xccy1dPyhbXFx3LV0qKS9pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsY2F0ZWwvR2Vla3NQaG9uZS9OZXhpYW4vUGFuYXNvbmljL1NvbnlcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIFtNT0RFTCwgL18vZywgJyAnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC8obmV4dXNcXHM5KS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhUQyBOZXh1cyA5XG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdIVEMnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9kXFwvaHVhd2VpKFtcXHdcXHMtXSspWztcXCldL2ksXG4gICAgICAgICAgICAvKG5leHVzXFxzNnApL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIdWF3ZWlcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0h1YXdlaSddLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgLyhtaWNyb3NvZnQpO1xccyhsdW1pYVtcXHNcXHddKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNaWNyb3NvZnQgTHVtaWFcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL1tcXHNcXCg7XSh4Ym94KD86XFxzb25lKT8pW1xcc1xcKTtdL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1pY3Jvc29mdCBYYm94XG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdNaWNyb3NvZnQnXSwgW1RZUEUsIENPTlNPTEVdXSwgW1xuICAgICAgICAgICAgLyhraW5cXC5bb25ldHddezN9KS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWljcm9zb2Z0IEtpblxuICAgICAgICAgICAgXSwgW1tNT0RFTCwgL1xcLi9nLCAnICddLCBbVkVORE9SLCAnTWljcm9zb2Z0J10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1vdG9yb2xhXG4gICAgICAgICAgICAvXFxzKG1pbGVzdG9uZXxkcm9pZCg/OlsyLTR4XXxcXHMoPzpiaW9uaWN8eDJ8cHJvfHJhenIpKT86PyhcXHM0Zyk/KVtcXHdcXHNdK2J1aWxkXFwvL2ksXG4gICAgICAgICAgICAvbW90W1xccy1dPyhcXHcqKS9pLFxuICAgICAgICAgICAgLyhYVFxcZHszLDR9KSBidWlsZFxcLy9pLFxuICAgICAgICAgICAgLyhuZXh1c1xcczYpL2lcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ01vdG9yb2xhJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuICAgICAgICAgICAgL2FuZHJvaWQuK1xccyhtejYwXFxkfHhvb21bXFxzMl17MCwyfSlcXHNidWlsZFxcLy9pXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdNb3Rvcm9sYSddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2hiYnR2XFwvXFxkK1xcLlxcZCtcXC5cXGQrXFxzK1xcKFtcXHdcXHNdKjtcXHMqKFxcd1teO10qKTsoW147XSopL2kgICAgICAgICAgICAvLyBIYmJUViBkZXZpY2VzXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgdXRpbC50cmltXSwgW01PREVMLCB1dGlsLnRyaW1dLCBbVFlQRSwgU01BUlRUVl1dLCBbXG5cbiAgICAgICAgICAgIC9oYmJ0di4rbWFwbGU7KFxcZCspL2lcbiAgICAgICAgICAgIF0sIFtbTU9ERUwsIC9eLywgJ1NtYXJ0VFYnXSwgW1ZFTkRPUiwgJ1NhbXN1bmcnXSwgW1RZUEUsIFNNQVJUVFZdXSwgW1xuXG4gICAgICAgICAgICAvXFwoZHR2W1xcKTtdLisoYXF1b3MpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2hhcnBcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ1NoYXJwJ10sIFtUWVBFLCBTTUFSVFRWXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKygoc2NoLWlbODldMFxcZHxzaHctbTM4MHN8Z3QtcFxcZHs0fXxndC1uXFxkK3xzZ2gtdDhbNTZdOXxuZXh1cyAxMCkpL2ksXG4gICAgICAgICAgICAvKChTTS1UXFx3KykpL2lcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnU2Ftc3VuZyddLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbICAgICAgICAgICAgICAgICAgLy8gU2Ftc3VuZ1xuICAgICAgICAgICAgL3NtYXJ0LXR2Lisoc2Ftc3VuZykvaVxuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgW1RZUEUsIFNNQVJUVFZdLCBNT0RFTF0sIFtcbiAgICAgICAgICAgIC8oKHNbY2dwXWgtXFx3K3xndC1cXHcrfGdhbGF4eVxcc25leHVzfHNtLVxcd1tcXHdcXGRdKykpL2ksXG4gICAgICAgICAgICAvKHNhbVtzdW5nXSopW1xccy1dKihcXHcrLT9bXFx3LV0qKS9pLFxuICAgICAgICAgICAgL3NlYy0oKHNnaFxcdyspKS9pXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ1NhbXN1bmcnXSwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvc2llLShcXHcqKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaWVtZW5zXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdTaWVtZW5zJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvKG1hZW1vfG5va2lhKS4qKG45MDB8bHVtaWFcXHNcXGQrKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm9raWFcbiAgICAgICAgICAgIC8obm9raWEpW1xcc18tXT8oW1xcdy1dKikvaVxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdOb2tpYSddLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkW3hcXGRcXC5cXHM7XStcXHMoW2FiXVsxLTddXFwtP1swMTc4YV1cXGRcXGQ/KS9pICAgICAgICAgICAgICAgICAgIC8vIEFjZXJcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0FjZXInXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLisoW3ZsXWtcXC0/XFxkezN9KVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTEcgVGFibGV0XG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdMRyddLCBbVFlQRSwgVEFCTEVUXV0sIFtcbiAgICAgICAgICAgIC9hbmRyb2lkXFxzM1xcLltcXHNcXHc7LV17MTB9KGxnPyktKFswNmN2OV17Myw0fSkvaSAgICAgICAgICAgICAgICAgICAgIC8vIExHIFRhYmxldFxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdMRyddLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbXG4gICAgICAgICAgICAvKGxnKSBuZXRjYXN0XFwudHYvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMRyBTbWFydFRWXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIFNNQVJUVFZdXSwgW1xuICAgICAgICAgICAgLyhuZXh1c1xcc1s0NV0pL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTEdcbiAgICAgICAgICAgIC9sZ1tlO1xcc1xcLy1dKyhcXHcqKS9pLFxuICAgICAgICAgICAgL2FuZHJvaWQuK2xnKFxcLT9bXFxkXFx3XSspXFxzK2J1aWxkL2lcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0xHJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvKGxlbm92bylcXHM/KHMoPzo1MDAwfDYwMDApKD86W1xcdy1dKyl8dGFiKD86W1xcc1xcd10rKSkvaSAgICAgICAgICAgICAvLyBMZW5vdm8gdGFibGV0c1xuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBUQUJMRVRdXSwgW1xuICAgICAgICAgICAgL2FuZHJvaWQuKyhpZGVhdGFiW2EtejAtOVxcLVxcc10rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExlbm92b1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnTGVub3ZvJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuICAgICAgICAgICAgLyhsZW5vdm8pW19cXHMtXT8oW1xcdy1dKykvaVxuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvbGludXg7LisoKGpvbGxhKSk7L2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEpvbGxhXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC8oKHBlYmJsZSkpYXBwXFwvW1xcZFxcLl0rXFxzL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBlYmJsZVxuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBXRUFSQUJMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLis7XFxzKG9wcG8pXFxzPyhbXFx3XFxzXSspXFxzYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPUFBPXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9jcmtleS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR29vZ2xlIENocm9tZWNhc3RcbiAgICAgICAgICAgIF0sIFtbTU9ERUwsICdDaHJvbWVjYXN0J10sIFtWRU5ET1IsICdHb29nbGUnXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKztcXHMoZ2xhc3MpXFxzXFxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHb29nbGUgR2xhc3NcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0dvb2dsZSddLCBbVFlQRSwgV0VBUkFCTEVdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rO1xccyhwaXhlbCBjKVtcXHMpXS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR29vZ2xlIFBpeGVsIENcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0dvb2dsZSddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKztcXHMocGl4ZWwoIFsyM10pPyggeGwpPylbXFxzKV0vaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdvb2dsZSBQaXhlbFxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnR29vZ2xlJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rO1xccyhcXHcrKVxccytidWlsZFxcL2htXFwxL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gWGlhb21pIEhvbmdtaSAnbnVtZXJpYycgbW9kZWxzXG4gICAgICAgICAgICAvYW5kcm9pZC4rKGhtW1xcc1xcLV9dKm5vdGU/W1xcc19dKig/OlxcZFxcdyk/KVxccytidWlsZC9pLCAgICAgICAgICAgICAgIC8vIFhpYW9taSBIb25nbWlcbiAgICAgICAgICAgIC9hbmRyb2lkLisobWlbXFxzXFwtX10qKD86YVxcZHxvbmV8b25lW1xcc19dcGx1c3xub3RlIGx0ZSk/W1xcc19dKig/OlxcZD9cXHc/KVtcXHNfXSooPzpwbHVzKT8pXFxzK2J1aWxkL2ksICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBYaWFvbWkgTWlcbiAgICAgICAgICAgIC9hbmRyb2lkLisocmVkbWlbXFxzXFwtX10qKD86bm90ZSk/KD86W1xcc19dKltcXHdcXHNdKykpXFxzK2J1aWxkL2kgICAgICAgLy8gUmVkbWkgUGhvbmVzXG4gICAgICAgICAgICBdLCBbW01PREVMLCAvXy9nLCAnICddLCBbVkVORE9SLCAnWGlhb21pJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuICAgICAgICAgICAgL2FuZHJvaWQuKyhtaVtcXHNcXC1fXSooPzpwYWQpKD86W1xcc19dKltcXHdcXHNdKykpXFxzK2J1aWxkL2kgICAgICAgICAgICAvLyBNaSBQYWQgdGFibGV0c1xuICAgICAgICAgICAgXSxbW01PREVMLCAvXy9nLCAnICddLCBbVkVORE9SLCAnWGlhb21pJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuICAgICAgICAgICAgL2FuZHJvaWQuKztcXHMobVsxLTVdXFxzbm90ZSlcXHNidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNZWl6dVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnTWVpenUnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG4gICAgICAgICAgICAvKG16KS0oW1xcdy1dezIsfSkvaVxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdNZWl6dSddLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLithMDAwKDEpXFxzK2J1aWxkL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9uZVBsdXNcbiAgICAgICAgICAgIC9hbmRyb2lkLitvbmVwbHVzXFxzKGFcXGR7NH0pXFxzK2J1aWxkL2lcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ09uZVBsdXMnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKFJDVFtcXGRcXHddKylcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSQ0EgVGFibGV0c1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnUkNBJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9cXHNdKyhWZW51ZVtcXGRcXHNdezIsN30pXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgLy8gRGVsbCBWZW51ZSBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdEZWxsJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihRW1R8TV1bXFxkXFx3XSspXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmVyaXpvbiBUYWJsZXRcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ1Zlcml6b24nXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMrKEJhcm5lc1smXFxzXStOb2JsZVxccyt8Qk5bUlRdKShWPy4qKVxccytidWlsZC9pICAgICAvLyBCYXJuZXMgJiBOb2JsZSBUYWJsZXRcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnQmFybmVzICYgTm9ibGUnXSwgTU9ERUwsIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKyhUTVxcZHszfS4qXFxiKVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQmFybmVzICYgTm9ibGUgVGFibGV0XG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdOdVZpc2lvbiddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKztcXHMoazg4KVxcc2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFpURSBLIFNlcmllcyBUYWJsZXRcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ1pURSddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooZ2VuXFxkezN9KVxccytidWlsZC4qNDloL2kgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3dpc3MgR0VOIE1vYmlsZVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnU3dpc3MnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKHp1clxcZHszfSlcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN3aXNzIFpVUiBUYWJsZXRcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ1N3aXNzJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKigoWmVraSk/VEIuKlxcYilcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAvLyBaZWtpIFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ1pla2knXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC8oYW5kcm9pZCkuK1s7XFwvXVxccysoW1lSXVxcZHsyfSlcXHMrYnVpbGQvaSxcbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMrKERyYWdvbltcXC1cXHNdK1RvdWNoXFxzK3xEVCkoXFx3ezV9KVxcc2J1aWxkL2kgICAgICAgIC8vIERyYWdvbiBUb3VjaCBUYWJsZXRcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnRHJhZ29uIFRvdWNoJ10sIE1PREVMLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooTlMtP1xcd3swLDl9KVxcc2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW5zaWduaWEgVGFibGV0c1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnSW5zaWduaWEnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKChOWHxOZXh0KS0/XFx3ezAsOX0pXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgIC8vIE5leHRCb29rIFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ05leHRCb29rJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihYdHJlbWVcXF8pPyhWKDFbMDQ1XXwyWzAxNV18MzB8NDB8NjB8N1swNV18OTApKVxccytidWlsZC9pXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ1ZvaWNlJ10sIE1PREVMLCBbVFlQRSwgTU9CSUxFXV0sIFsgICAgICAgICAgICAgICAgICAgIC8vIFZvaWNlIFh0cmVtZSBQaG9uZXNcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooTFZURUxcXC0pPyhWMVsxMl0pXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAvLyBMdlRlbCBQaG9uZXNcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnTHZUZWwnXSwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rO1xccyhQSC0xKVxccy9pXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdFc3NlbnRpYWwnXSwgW1RZUEUsIE1PQklMRV1dLCBbICAgICAgICAgICAgICAgIC8vIEVzc2VudGlhbCBQSC0xXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKFYoMTAwTUR8NzAwTkF8NzAxMXw5MTdHKS4qXFxiKVxccytidWlsZC9pICAgICAgICAgIC8vIEVudml6ZW4gVGFibGV0c1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnRW52aXplbiddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooTGVbXFxzXFwtXStQYW4pW1xcc1xcLV0rKFxcd3sxLDl9KVxccytidWlsZC9pICAgICAgICAgIC8vIExlIFBhbiBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKFRyaW9bXFxzXFwtXSouKilcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYWNoU3BlZWQgVGFibGV0c1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnTWFjaFNwZWVkJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihUcmluaXR5KVtcXC1cXHNdKihUXFxkezN9KVxccytidWlsZC9pICAgICAgICAgICAgICAgIC8vIFRyaW5pdHkgVGFibGV0c1xuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKlRVXygxNDkxKVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJvdG9yIFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ1JvdG9yJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rKEtTKC4rKSlcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbWF6b24gS2luZGxlIFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0FtYXpvbiddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKyhHaWdhc2V0KVtcXHNcXC1dKyhRXFx3ezEsOX0pXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgLy8gR2lnYXNldCBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9cXHModGFibGV0fHRhYilbO1xcL10vaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVbmlkZW50aWZpYWJsZSBUYWJsZXRcbiAgICAgICAgICAgIC9cXHMobW9iaWxlKSg/Ols7XFwvXXxcXHNzYWZhcmkpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVW5pZGVudGlmaWFibGUgTW9iaWxlXG4gICAgICAgICAgICBdLCBbW1RZUEUsIHV0aWwubG93ZXJpemVdLCBWRU5ET1IsIE1PREVMXSwgW1xuXG4gICAgICAgICAgICAvW1xcc1xcL1xcKF0oc21hcnQtP3R2KVs7XFwpXS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTbWFydFRWXG4gICAgICAgICAgICBdLCBbW1RZUEUsIFNNQVJUVFZdXSwgW1xuXG4gICAgICAgICAgICAvKGFuZHJvaWRbXFx3XFwuXFxzXFwtXXswLDl9KTsuK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmljIEFuZHJvaWQgRGV2aWNlXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdHZW5lcmljJ11dXG4gICAgICAgIF0sXG5cbiAgICAgICAgZW5naW5lIDogW1tcblxuICAgICAgICAgICAgL3dpbmRvd3MuK1xcc2VkZ2VcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRWRnZUhUTUxcbiAgICAgICAgICAgIF0sIFtWRVJTSU9OLCBbTkFNRSwgJ0VkZ2VIVE1MJ11dLCBbXG5cbiAgICAgICAgICAgIC93ZWJraXRcXC81MzdcXC4zNi4rY2hyb21lXFwvKD8hMjcpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQmxpbmtcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0JsaW5rJ11dLCBbXG5cbiAgICAgICAgICAgIC8ocHJlc3RvKVxcLyhbXFx3XFwuXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJlc3RvXG4gICAgICAgICAgICAvKHdlYmtpdHx0cmlkZW50fG5ldGZyb250fG5ldHN1cmZ8YW1heWF8bHlueHx3M218Z29hbm5hKVxcLyhbXFx3XFwuXSspL2ksICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2ViS2l0L1RyaWRlbnQvTmV0RnJvbnQvTmV0U3VyZi9BbWF5YS9MeW54L3czbS9Hb2FubmFcbiAgICAgICAgICAgIC8oa2h0bWx8dGFzbWFufGxpbmtzKVtcXC9cXHNdXFwoPyhbXFx3XFwuXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBLSFRNTC9UYXNtYW4vTGlua3NcbiAgICAgICAgICAgIC8oaWNhYilbXFwvXFxzXShbMjNdXFwuW1xcZFxcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpQ2FiXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgL3J2XFw6KFtcXHdcXC5dezEsOX0pLisoZ2Vja28pL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZWNrb1xuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIE5BTUVdXG4gICAgICAgIF0sXG5cbiAgICAgICAgb3MgOiBbW1xuXG4gICAgICAgICAgICAvLyBXaW5kb3dzIGJhc2VkXG4gICAgICAgICAgICAvbWljcm9zb2Z0XFxzKHdpbmRvd3MpXFxzKHZpc3RhfHhwKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2luZG93cyAoaVR1bmVzKVxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG4gICAgICAgICAgICAvKHdpbmRvd3MpXFxzbnRcXHM2XFwuMjtcXHMoYXJtKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXaW5kb3dzIFJUXG4gICAgICAgICAgICAvKHdpbmRvd3NcXHNwaG9uZSg/Olxcc29zKSopW1xcc1xcL10/KFtcXGRcXC5cXHNcXHddKikvaSwgICAgICAgICAgICAgICAgICAgLy8gV2luZG93cyBQaG9uZVxuICAgICAgICAgICAgLyh3aW5kb3dzXFxzbW9iaWxlfHdpbmRvd3MpW1xcc1xcL10/KFtudGNlXFxkXFwuXFxzXStcXHcpL2lcbiAgICAgICAgICAgIF0sIFtOQU1FLCBbVkVSU0lPTiwgbWFwcGVyLnN0ciwgbWFwcy5vcy53aW5kb3dzLnZlcnNpb25dXSwgW1xuICAgICAgICAgICAgLyh3aW4oPz0zfDl8bil8d2luXFxzOXhcXHMpKFtudFxcZFxcLl0rKS9pXG4gICAgICAgICAgICBdLCBbW05BTUUsICdXaW5kb3dzJ10sIFtWRVJTSU9OLCBtYXBwZXIuc3RyLCBtYXBzLm9zLndpbmRvd3MudmVyc2lvbl1dLCBbXG5cbiAgICAgICAgICAgIC8vIE1vYmlsZS9FbWJlZGRlZCBPU1xuICAgICAgICAgICAgL1xcKChiYikoMTApOy9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQmxhY2tCZXJyeSAxMFxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnQmxhY2tCZXJyeSddLCBWRVJTSU9OXSwgW1xuICAgICAgICAgICAgLyhibGFja2JlcnJ5KVxcdypcXC8/KFtcXHdcXC5dKikvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQmxhY2tiZXJyeVxuICAgICAgICAgICAgLyh0aXplbilbXFwvXFxzXShbXFx3XFwuXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGl6ZW5cbiAgICAgICAgICAgIC8oYW5kcm9pZHx3ZWJvc3xwYWxtXFxzb3N8cW54fGJhZGF8cmltXFxzdGFibGV0XFxzb3N8bWVlZ298c2FpbGZpc2h8Y29udGlraSlbXFwvXFxzLV0/KFtcXHdcXC5dKikvaVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbmRyb2lkL1dlYk9TL1BhbG0vUU5YL0JhZGEvUklNL01lZUdvL0NvbnRpa2kvU2FpbGZpc2ggT1NcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuICAgICAgICAgICAgLyhzeW1iaWFuXFxzP29zfHN5bWJvc3xzNjAoPz07KSlbXFwvXFxzLV0/KFtcXHdcXC5dKikvaSAgICAgICAgICAgICAgICAgIC8vIFN5bWJpYW5cbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ1N5bWJpYW4nXSwgVkVSU0lPTl0sIFtcbiAgICAgICAgICAgIC9cXCgoc2VyaWVzNDApOy9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNlcmllcyA0MFxuICAgICAgICAgICAgXSwgW05BTUVdLCBbXG4gICAgICAgICAgICAvbW96aWxsYS4rXFwobW9iaWxlOy4rZ2Vja28uK2ZpcmVmb3gvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXJlZm94IE9TXG4gICAgICAgICAgICBdLCBbW05BTUUsICdGaXJlZm94IE9TJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8vIENvbnNvbGVcbiAgICAgICAgICAgIC8obmludGVuZG98cGxheXN0YXRpb24pXFxzKFt3aWRzMzRwb3J0YWJsZXZ1XSspL2ksICAgICAgICAgICAgICAgICAgIC8vIE5pbnRlbmRvL1BsYXlzdGF0aW9uXG5cbiAgICAgICAgICAgIC8vIEdOVS9MaW51eCBiYXNlZFxuICAgICAgICAgICAgLyhtaW50KVtcXC9cXHNcXChdPyhcXHcqKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWludFxuICAgICAgICAgICAgLyhtYWdlaWF8dmVjdG9ybGludXgpWztcXHNdL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFnZWlhL1ZlY3RvckxpbnV4XG4gICAgICAgICAgICAvKGpvbGl8W2t4bG5dP3VidW50dXxkZWJpYW58c3VzZXxvcGVuc3VzZXxnZW50b298KD89XFxzKWFyY2h8c2xhY2t3YXJlfGZlZG9yYXxtYW5kcml2YXxjZW50b3N8cGNsaW51eG9zfHJlZGhhdHx6ZW53YWxrfGxpbnB1cylbXFwvXFxzLV0/KD8hY2hyb20pKFtcXHdcXC4tXSopL2ksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEpvbGkvVWJ1bnR1L0RlYmlhbi9TVVNFL0dlbnRvby9BcmNoL1NsYWNrd2FyZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGZWRvcmEvTWFuZHJpdmEvQ2VudE9TL1BDTGludXhPUy9SZWRIYXQvWmVud2Fsay9MaW5wdXNcbiAgICAgICAgICAgIC8oaHVyZHxsaW51eClcXHM/KFtcXHdcXC5dKikvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSHVyZC9MaW51eFxuICAgICAgICAgICAgLyhnbnUpXFxzPyhbXFx3XFwuXSopL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHTlVcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKGNyb3MpXFxzW1xcd10rXFxzKFtcXHdcXC5dK1xcdykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENocm9taXVtIE9TXG4gICAgICAgICAgICBdLCBbW05BTUUsICdDaHJvbWl1bSBPUyddLCBWRVJTSU9OXSxbXG5cbiAgICAgICAgICAgIC8vIFNvbGFyaXNcbiAgICAgICAgICAgIC8oc3Vub3MpXFxzPyhbXFx3XFwuXFxkXSopL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNvbGFyaXNcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ1NvbGFyaXMnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLy8gQlNEIGJhc2VkXG4gICAgICAgICAgICAvXFxzKFtmcmVudG9wYy1dezAsNH1ic2R8ZHJhZ29uZmx5KVxccz8oW1xcd1xcLl0qKS9pICAgICAgICAgICAgICAgICAgICAvLyBGcmVlQlNEL05ldEJTRC9PcGVuQlNEL1BDLUJTRC9EcmFnb25GbHlcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSxbXG5cbiAgICAgICAgICAgIC8oaGFpa3UpXFxzKFxcdyspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIYWlrdVxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLFtcblxuICAgICAgICAgICAgL2NmbmV0d29ya1xcLy4rZGFyd2luL2ksXG4gICAgICAgICAgICAvaXBbaG9uZWFkXXsyLDR9KD86Lipvc1xccyhbXFx3XSspXFxzbGlrZVxcc21hY3w7XFxzb3BlcmEpL2kgICAgICAgICAgICAgLy8gaU9TXG4gICAgICAgICAgICBdLCBbW1ZFUlNJT04sIC9fL2csICcuJ10sIFtOQU1FLCAnaU9TJ11dLCBbXG5cbiAgICAgICAgICAgIC8obWFjXFxzb3NcXHN4KVxccz8oW1xcd1xcc1xcLl0qKS9pLFxuICAgICAgICAgICAgLyhtYWNpbnRvc2h8bWFjKD89X3Bvd2VycGMpXFxzKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFjIE9TXG4gICAgICAgICAgICBdLCBbW05BTUUsICdNYWMgT1MnXSwgW1ZFUlNJT04sIC9fL2csICcuJ11dLCBbXG5cbiAgICAgICAgICAgIC8vIE90aGVyXG4gICAgICAgICAgICAvKCg/Om9wZW4pP3NvbGFyaXMpW1xcL1xccy1dPyhbXFx3XFwuXSopL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTb2xhcmlzXG4gICAgICAgICAgICAvKGFpeClcXHMoKFxcZCkoPz1cXC58XFwpfFxccylbXFx3XFwuXSkqL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBSVhcbiAgICAgICAgICAgIC8ocGxhblxcczl8bWluaXh8YmVvc3xvc1xcLzJ8YW1pZ2Fvc3xtb3JwaG9zfHJpc2NcXHNvc3xvcGVudm1zfGZ1Y2hzaWEpL2ksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBsYW45L01pbml4L0JlT1MvT1MyL0FtaWdhT1MvTW9ycGhPUy9SSVNDT1MvT3BlblZNUy9GdWNoc2lhXG4gICAgICAgICAgICAvKHVuaXgpXFxzPyhbXFx3XFwuXSopL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVOSVhcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXVxuICAgICAgICBdXG4gICAgfTtcblxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBDb25zdHJ1Y3RvclxuICAgIC8vLy8vLy8vLy8vLy8vLy9cbiAgICB2YXIgVUFQYXJzZXIgPSBmdW5jdGlvbiAodWFzdHJpbmcsIGV4dGVuc2lvbnMpIHtcblxuICAgICAgICBpZiAodHlwZW9mIHVhc3RyaW5nID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgZXh0ZW5zaW9ucyA9IHVhc3RyaW5nO1xuICAgICAgICAgICAgdWFzdHJpbmcgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVUFQYXJzZXIpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFVBUGFyc2VyKHVhc3RyaW5nLCBleHRlbnNpb25zKS5nZXRSZXN1bHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB1YSA9IHVhc3RyaW5nIHx8ICgod2luZG93ICYmIHdpbmRvdy5uYXZpZ2F0b3IgJiYgd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpID8gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQgOiBFTVBUWSk7XG4gICAgICAgIHZhciByZ3htYXAgPSBleHRlbnNpb25zID8gdXRpbC5leHRlbmQocmVnZXhlcywgZXh0ZW5zaW9ucykgOiByZWdleGVzO1xuXG4gICAgICAgIHRoaXMuZ2V0QnJvd3NlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBicm93c2VyID0geyBuYW1lOiB1bmRlZmluZWQsIHZlcnNpb246IHVuZGVmaW5lZCB9O1xuICAgICAgICAgICAgbWFwcGVyLnJneC5jYWxsKGJyb3dzZXIsIHVhLCByZ3htYXAuYnJvd3Nlcik7XG4gICAgICAgICAgICBicm93c2VyLm1ham9yID0gdXRpbC5tYWpvcihicm93c2VyLnZlcnNpb24pOyAvLyBkZXByZWNhdGVkXG4gICAgICAgICAgICByZXR1cm4gYnJvd3NlcjtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXRDUFUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY3B1ID0geyBhcmNoaXRlY3R1cmU6IHVuZGVmaW5lZCB9O1xuICAgICAgICAgICAgbWFwcGVyLnJneC5jYWxsKGNwdSwgdWEsIHJneG1hcC5jcHUpO1xuICAgICAgICAgICAgcmV0dXJuIGNwdTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXREZXZpY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZGV2aWNlID0geyB2ZW5kb3I6IHVuZGVmaW5lZCwgbW9kZWw6IHVuZGVmaW5lZCwgdHlwZTogdW5kZWZpbmVkIH07XG4gICAgICAgICAgICBtYXBwZXIucmd4LmNhbGwoZGV2aWNlLCB1YSwgcmd4bWFwLmRldmljZSk7XG4gICAgICAgICAgICByZXR1cm4gZGV2aWNlO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmdldEVuZ2luZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBlbmdpbmUgPSB7IG5hbWU6IHVuZGVmaW5lZCwgdmVyc2lvbjogdW5kZWZpbmVkIH07XG4gICAgICAgICAgICBtYXBwZXIucmd4LmNhbGwoZW5naW5lLCB1YSwgcmd4bWFwLmVuZ2luZSk7XG4gICAgICAgICAgICByZXR1cm4gZW5naW5lO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmdldE9TID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG9zID0geyBuYW1lOiB1bmRlZmluZWQsIHZlcnNpb246IHVuZGVmaW5lZCB9O1xuICAgICAgICAgICAgbWFwcGVyLnJneC5jYWxsKG9zLCB1YSwgcmd4bWFwLm9zKTtcbiAgICAgICAgICAgIHJldHVybiBvcztcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXRSZXN1bHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHVhICAgICAgOiB0aGlzLmdldFVBKCksXG4gICAgICAgICAgICAgICAgYnJvd3NlciA6IHRoaXMuZ2V0QnJvd3NlcigpLFxuICAgICAgICAgICAgICAgIGVuZ2luZSAgOiB0aGlzLmdldEVuZ2luZSgpLFxuICAgICAgICAgICAgICAgIG9zICAgICAgOiB0aGlzLmdldE9TKCksXG4gICAgICAgICAgICAgICAgZGV2aWNlICA6IHRoaXMuZ2V0RGV2aWNlKCksXG4gICAgICAgICAgICAgICAgY3B1ICAgICA6IHRoaXMuZ2V0Q1BVKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZ2V0VUEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdWE7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuc2V0VUEgPSBmdW5jdGlvbiAodWFzdHJpbmcpIHtcbiAgICAgICAgICAgIHVhID0gdWFzdHJpbmc7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIFVBUGFyc2VyLlZFUlNJT04gPSBMSUJWRVJTSU9OO1xuICAgIFVBUGFyc2VyLkJST1dTRVIgPSB7XG4gICAgICAgIE5BTUUgICAgOiBOQU1FLFxuICAgICAgICBNQUpPUiAgIDogTUFKT1IsIC8vIGRlcHJlY2F0ZWRcbiAgICAgICAgVkVSU0lPTiA6IFZFUlNJT05cbiAgICB9O1xuICAgIFVBUGFyc2VyLkNQVSA9IHtcbiAgICAgICAgQVJDSElURUNUVVJFIDogQVJDSElURUNUVVJFXG4gICAgfTtcbiAgICBVQVBhcnNlci5ERVZJQ0UgPSB7XG4gICAgICAgIE1PREVMICAgOiBNT0RFTCxcbiAgICAgICAgVkVORE9SICA6IFZFTkRPUixcbiAgICAgICAgVFlQRSAgICA6IFRZUEUsXG4gICAgICAgIENPTlNPTEUgOiBDT05TT0xFLFxuICAgICAgICBNT0JJTEUgIDogTU9CSUxFLFxuICAgICAgICBTTUFSVFRWIDogU01BUlRUVixcbiAgICAgICAgVEFCTEVUICA6IFRBQkxFVCxcbiAgICAgICAgV0VBUkFCTEU6IFdFQVJBQkxFLFxuICAgICAgICBFTUJFRERFRDogRU1CRURERURcbiAgICB9O1xuICAgIFVBUGFyc2VyLkVOR0lORSA9IHtcbiAgICAgICAgTkFNRSAgICA6IE5BTUUsXG4gICAgICAgIFZFUlNJT04gOiBWRVJTSU9OXG4gICAgfTtcbiAgICBVQVBhcnNlci5PUyA9IHtcbiAgICAgICAgTkFNRSAgICA6IE5BTUUsXG4gICAgICAgIFZFUlNJT04gOiBWRVJTSU9OXG4gICAgfTtcblxuICAgIC8vLy8vLy8vLy8vXG4gICAgLy8gRXhwb3J0XG4gICAgLy8vLy8vLy8vL1xuXG5cbiAgICAvLyBjaGVjayBqcyBlbnZpcm9ubWVudFxuICAgIGlmICh0eXBlb2YoZXhwb3J0cykgIT09IFVOREVGX1RZUEUpIHtcbiAgICAgICAgLy8gbm9kZWpzIGVudlxuICAgICAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gVU5ERUZfVFlQRSAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gVUFQYXJzZXI7XG4gICAgICAgIH1cbiAgICAgICAgZXhwb3J0cy5VQVBhcnNlciA9IFVBUGFyc2VyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHJlcXVpcmVqcyBlbnYgKG9wdGlvbmFsKVxuICAgICAgICBpZiAodHlwZW9mKGRlZmluZSkgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAgICAgZGVmaW5lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVUFQYXJzZXI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICh3aW5kb3cpIHtcbiAgICAgICAgICAgIC8vIGJyb3dzZXIgZW52XG4gICAgICAgICAgICB3aW5kb3cuVUFQYXJzZXIgPSBVQVBhcnNlcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGpRdWVyeS9aZXB0byBzcGVjaWZpYyAob3B0aW9uYWwpXG4gICAgLy8gTm90ZTpcbiAgICAvLyAgIEluIEFNRCBlbnYgdGhlIGdsb2JhbCBzY29wZSBzaG91bGQgYmUga2VwdCBjbGVhbiwgYnV0IGpRdWVyeSBpcyBhbiBleGNlcHRpb24uXG4gICAgLy8gICBqUXVlcnkgYWx3YXlzIGV4cG9ydHMgdG8gZ2xvYmFsIHNjb3BlLCB1bmxlc3MgalF1ZXJ5Lm5vQ29uZmxpY3QodHJ1ZSkgaXMgdXNlZCxcbiAgICAvLyAgIGFuZCB3ZSBzaG91bGQgY2F0Y2ggdGhhdC5cbiAgICB2YXIgJCA9IHdpbmRvdyAmJiAod2luZG93LmpRdWVyeSB8fCB3aW5kb3cuWmVwdG8pO1xuICAgIGlmICh0eXBlb2YgJCAhPT0gVU5ERUZfVFlQRSAmJiAhJC51YSkge1xuICAgICAgICB2YXIgcGFyc2VyID0gbmV3IFVBUGFyc2VyKCk7XG4gICAgICAgICQudWEgPSBwYXJzZXIuZ2V0UmVzdWx0KCk7XG4gICAgICAgICQudWEuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlci5nZXRVQSgpO1xuICAgICAgICB9O1xuICAgICAgICAkLnVhLnNldCA9IGZ1bmN0aW9uICh1YXN0cmluZykge1xuICAgICAgICAgICAgcGFyc2VyLnNldFVBKHVhc3RyaW5nKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBwYXJzZXIuZ2V0UmVzdWx0KCk7XG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICQudWFbcHJvcF0gPSByZXN1bHRbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG59KSh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JyA/IHdpbmRvdyA6IHRoaXMpO1xuIl19
