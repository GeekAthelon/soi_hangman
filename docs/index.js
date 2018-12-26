"use strict";
(function () {
    var gameData;
    var statusEl = document.querySelector(".js-status");
    var phraseEl = document.querySelector(".js-phrase");
    var cluesEl = document.querySelector(".js-clues");
    var lettersEl = document.querySelector(".js-letters");
    var copytoClipboardButton = document.querySelector(".js-copy-to-clipboard");
    var newButton = document.querySelector(".js-new-game");
    var htmlEl = document.querySelector(".js-html");
    var displayEl = document.querySelector(".js-display");
    var letters = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    Object.freeze(letters);
    var localStorageName = "hangman-game-data";
    var storage = (function () {
        var uid = "" + new Date().getTime();
        try {
            localStorage.setItem(uid, uid);
            var result = localStorage.getItem(uid) === uid;
            localStorage.removeItem(uid);
            return result && localStorage;
        }
        catch (exception) {
            // Do nothing
        }
    })();
    var saveGame = function (gd) {
        localStorage.setItem(localStorageName, JSON.stringify(gd));
    };
    var loadGame = function () {
        var gd = localStorage.getItem(localStorageName);
        if (gd) {
            try {
                return JSON.parse(gd);
            }
            catch (err) {
                return null;
            }
        }
        return null;
    };
    var showGame = function () {
        var gd = loadGame();
        if (!gd) {
            return;
        }
        cluesEl.value = gd.clues;
        phraseEl.value = gd.phrase;
        lettersEl.innerHTML = "";
        letters.forEach(function (letter) {
            var b = document.createElement("button");
            b.classList.add("letter-button");
            b.textContent = letter;
            if (gd.lettersAvailable.indexOf(letter) === -1) {
                b.disabled = true;
            }
            lettersEl.appendChild(b);
        });
        // Create HTML
        var phraseStr = Array.from(gd.phrase).map(function (l) {
            return (gd.lettersAvailable.indexOf(l.toUpperCase()) === -1 ? l : "_");
        })
            .map(function (l) { return l.replace(/ /, "&nbsp;&nbsp;"); })
            .join(" ");
        var clueStr = gd.clues.split(/\r\n|\r|\n/).map(function (s) {
            return ("<li>" + s + "</li>");
        })
            .join("");
        var sortedLetters = letters.map(function (l) {
            var used = (gd.lettersAvailable.indexOf(l) === -1);
            return { letter: l, used: used };
        });
        var notFound = sortedLetters
            .filter(function (l) { return l.used; })
            .filter(function (l) { return Array.from(gd.phrase.toUpperCase()).indexOf(l.letter) === -1; })
            .map(function (l) { return l.letter; });
        // Don't use a multi-line string literal.
        // SOI processes CR|LF and turns them into
        // `<p>`.
        var out = [
            "Phrase: " + phraseStr,
            "<br>Clues: <ul>" + clueStr + "</ul>",
            "<br>Not found: " + notFound,
        ];
        htmlEl.textContent = out.join("");
        displayEl.innerHTML = out.join("");
    };
    var startGame = function () {
        phraseEl.value = "";
        cluesEl.value = "";
        var gd = {
            clues: "",
            lettersAvailable: letters,
            phrase: ""
        };
        return gd;
    };
    if (!storage) {
        statusEl.textContent = "No localStorage -- cannot use this";
    }
    else {
        statusEl.textContent = "System check complete";
        var loadedData = loadGame();
        if (loadedData) {
            gameData = loadedData;
        }
        else {
            gameData = startGame();
        }
        saveGame(gameData);
        showGame();
        newButton.addEventListener("click", function () {
            var gd = startGame();
            saveGame(gd);
            showGame();
        });
        cluesEl.addEventListener("change", function () {
            var val = cluesEl.value;
            var gd = loadGame();
            if (gd) {
                gd.clues = val;
                saveGame(gd);
            }
            showGame();
        });
        phraseEl.addEventListener("change", function () {
            var val = phraseEl.value;
            var gd = loadGame();
            if (gd) {
                gd.phrase = val;
                saveGame(gd);
            }
            showGame();
        });
        lettersEl.addEventListener("click", function (event) {
            var target = event.target;
            var letter = target.textContent;
            var gd = loadGame();
            if (!gd) {
                return;
            }
            var index = gd.lettersAvailable.indexOf(letter);
            if (index > -1) {
                gd.lettersAvailable.splice(index, 1);
            }
            saveGame(gd);
            showGame();
        });
        copytoClipboardButton.addEventListener("click", function () {
            var html = htmlEl.textContent;
            if (html) {
                copyToClipboard(html);
            }
        });
    }
    // Copies a string to the clipboard. Must be called from within an
    // event handler such as click. May return false if it failed, but
    // this is not always possible. Browser support for Chrome 43+,
    // Firefox 42+, Safari 10+, Edge and IE 10+.
    // IE: The clipboard feature may be disabled by an administrator. By
    // default a prompt is shown the first time the clipboard is
    // used (per session).
    function copyToClipboard(text) {
        var win = window;
        if (win.clipboardData && win.clipboardData.setData) {
            // IE specific code path to prevent textarea being shown while dialog is visible.
            return win.clipboardData.setData("Text", text);
        }
        else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
            var textarea = document.createElement("textarea");
            textarea.textContent = text;
            textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
            document.body.appendChild(textarea);
            textarea.select();
            try {
                return document.execCommand("copy"); // Security exception may be thrown by some browsers.
            }
            catch (ex) {
                statusEl.textContent = "Copy to clipboard failed.";
                return false;
            }
            finally {
                document.body.removeChild(textarea);
            }
        }
    }
})();
//# sourceMappingURL=index.js.map