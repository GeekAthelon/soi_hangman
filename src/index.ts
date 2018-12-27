interface IKhar {
    symbol: string;
    selected: boolean;
}
interface IGameData {
    clues: string;
    lettersAvailable: IKhar[];
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

    const khars = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
        .map((s) => ({ symbol: s, selected: false } as IKhar));

    Object.freeze(khars);

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

        // Create HTML
        const phraseStr = Array.from(gd.phrase).map((l) => {
            const status = gd.lettersAvailable.filter(((la) => la.symbol === l.toUpperCase()))[0];
            if (!status) {
                return l;
            }
            return status.selected ? l : "_";
        })
            .map((l) => l.replace(/ /, "&nbsp;&nbsp;"))
            .join(" ");

        const clueStr = gd.clues.split(/\r\n|\r|\n/).map((s) =>
            (`<li>${s}</li>`))
            .join("");

        const notFound = gd.lettersAvailable
            .filter((khar) => khar.selected)
            .filter((khar) => Array.from(gd.phrase.toUpperCase()).indexOf(khar.symbol) === -1)
            .map((khar) => khar.symbol)
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
            lettersAvailable: JSON.parse(JSON.stringify(khars)),
            phrase: "",
        };

        const els = document.querySelectorAll(".button-pressed");
        Array.from(els).forEach((el) => el.classList.remove("button-pressed"));

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

        copytoClipboardButton.addEventListener("click", () => {
            const html = htmlEl.textContent;
            if (html) {
                copyToClipboard(html);
            }
        });

        gameData.lettersAvailable.forEach((khar) => {
            const setPressedState = (e: HTMLElement, state: boolean) => {
                if (state) {
                    e.classList.add("button-pressed");
                } else {
                    e.classList.remove("button-pressed");
                }
            };

            const b = document.createElement("button");

            b.textContent = khar.symbol;
            b.classList.add("letter-button");
            b.classList.add("button");
            b.dataset.symbol = khar.symbol;
            lettersEl.appendChild(b);
            const k = gameData.lettersAvailable.filter((l) => l.symbol === khar.symbol)[0];
            setPressedState(b, k.selected);

            b.addEventListener("click", (e) => {
                const gd = loadGame();
                if (!gd) {
                    return;
                }

                const target = e.target as HTMLElement;
                const symbol = target.dataset.symbol;

                const k1 = gd.lettersAvailable.filter((l) => l.symbol === symbol)[0];
                k1.selected = !k1.selected;
                setPressedState(b, k1.selected);

                saveGame(gd);
                showGame();
            });
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
