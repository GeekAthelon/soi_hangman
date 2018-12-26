interface IGameData {
    clues: string;
    lettersAvailable: string[];
    phrase: string;
}

(() => {

    let gameData: IGameData;

    const statusEl = document.querySelector(".js-status") as HTMLElement;
    const phraseEl = document.querySelector(".js-phrase") as HTMLInputElement;
    const cluesEl = document.querySelector(".js-clues") as HTMLTextAreaElement;
    const lettersEl = document.querySelector(".js-letters") as HTMLElement;
    const copytoClipboardButton = document.querySelector(".js-copy-to-clipboard") as HTMLButtonElement;
    const newButton = document.querySelector(".js-new-game") as HTMLButtonElement;
    const htmlEl = document.querySelector(".js-html") as HTMLTextAreaElement;
    const displayEl = document.querySelector(".js-display") as HTMLTextAreaElement;

    const letters = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
    Object.freeze(letters);

    const localStorageName = "hangman-game-data";

    const storage = (() => {
        const uid = "" + new Date().getTime();
        try {
            localStorage.setItem(uid, uid);
            const result = localStorage.getItem(uid) === uid;
            localStorage.removeItem(uid);
            return result && localStorage;
        } catch (exception) {
            // Do nothing
        }
    })();

    const saveGame = (gd: IGameData) => {
        localStorage.setItem(localStorageName, JSON.stringify(gd));
    };

    const loadGame = () => {
        const gd = localStorage.getItem(localStorageName);
        if (gd) {
            try {
                return JSON.parse(gd) as IGameData;
            } catch (err) {
                return null;
            }
        }
        return null;
    };

    const showGame = () => {
        const gd = loadGame();

        if (!gd) {
            return;
        }

        cluesEl.value = gd.clues;
        phraseEl.value = gd.phrase;

        lettersEl.innerHTML = "";

        letters.forEach((letter) => {
            const b = document.createElement("button");
            b.classList.add("letter-button");

            b.textContent = letter;
            if (gd.lettersAvailable.indexOf(letter) === -1) {
                b.disabled = true;
            }

            lettersEl.appendChild(b);
        });

        // Create HTML

        const phraseStr = Array.from(gd.phrase).map((l) =>
            (gd.lettersAvailable.indexOf(l.toUpperCase()) === -1 ? l : "_"))
            .map((l) => l.replace(/ /, "&nbsp;&nbsp;"))
            .join(" ");

        const clueStr = gd.clues.split(/\r\n|\r|\n/).map((s) =>
            (`<li>${s}</li>`))
            .join("");

        const sortedLetters = letters.map((l) => {
            const used = (gd.lettersAvailable.indexOf(l) === -1);
            return { letter: l, used };
        });

        const notFound = sortedLetters
            .filter((l) => l.used)
            .filter((l) => Array.from(gd.phrase.toUpperCase()).indexOf(l.letter) === -1)
            .map((l) => l.letter)
            ;

        // Don't use a multi-line string literal.
        // SOI processes CR|LF and turns them into
        // `<p>`.
        const out = [
            `Phrase: ${phraseStr}`,
            `<br>Clues: <ul>${clueStr}</ul>`,
            `<br>Not found: ${notFound}`,
        ];

        htmlEl.textContent = out.join("");
        displayEl.innerHTML = out.join("");
    };

    const startGame = () => {
        phraseEl.value = "";
        cluesEl.value = "";

        const gd: IGameData = {
            clues: "",
            lettersAvailable: letters,
            phrase: "",
        };

        return gd;
    };

    if (!storage) {
        statusEl.textContent = "No localStorage -- cannot use this";
    } else {
        statusEl.textContent = "System check complete";
        const loadedData = loadGame();
        if (loadedData) {
            gameData = loadedData;
        } else {
            gameData = startGame();
        }

        saveGame(gameData);
        showGame();
        newButton.addEventListener("click", () => {
            const gd = startGame();
            saveGame(gd);
            showGame();
        });

        cluesEl.addEventListener("change", () => {
            const val = cluesEl.value;
            const gd = loadGame();
            if (gd) {
                gd.clues = val;
                saveGame(gd);
            }
            showGame();
        });

        phraseEl.addEventListener("change", () => {
            const val = phraseEl.value;
            const gd = loadGame();
            if (gd) {
                gd.phrase = val;
                saveGame(gd);
            }
            showGame();
        });

        lettersEl.addEventListener("click", (event) => {
            const target = event!.target as HTMLButtonElement;
            const letter = target.textContent;
            const gd = loadGame();

            if (!gd) {
                return;
            }

            const index = gd.lettersAvailable.indexOf(letter!);
            if (index > -1) {
                gd.lettersAvailable.splice(index, 1);
            }
            saveGame(gd);
            showGame();
        });

        copytoClipboardButton.addEventListener("click", () => {
            const html = htmlEl.textContent;
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
    function copyToClipboard(text: string) {
        const win = window as any;

        if (win.clipboardData && win.clipboardData.setData) {
            // IE specific code path to prevent textarea being shown while dialog is visible.
            return win.clipboardData.setData("Text", text);

        } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
            const textarea = document.createElement("textarea");
            textarea.textContent = text;
            textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
            document.body.appendChild(textarea);
            textarea.select();
            try {
                return document.execCommand("copy");  // Security exception may be thrown by some browsers.
            } catch (ex) {
                statusEl.textContent = "Copy to clipboard failed.";
                return false;
            } finally {
                document.body.removeChild(textarea);
            }
        }
    }

})();
