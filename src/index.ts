import { start } from "repl";

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

    const letters = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");

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
        localStorage.setItem("hangman-game-data", JSON.stringify(gd));
    };

    const loadGame = () => {
        const gd = localStorage.getItem("hangman-game-data");
        if (gd) {
            try {
                return JSON.parse(gd) as IGameData;
            } catch (err) {
                return null;
            }
        }
        return null;
    };

    const showGame = (gd: IGameData) => {
        if (!gd) {
            return;
        }

        cluesEl.value = gd.clues;
        phraseEl.value = gd.phrase;

        lettersEl.innerHTML = "";

        letters.forEach((letter) => {
            const b = document.createElement("button");
            b.textContent = letter;
            if (gd.lettersAvailable.indexOf(letter) === -1) {
                b.disabled = true;
            }

            b.addEventListener("click", () => {
                const index = gd.lettersAvailable.indexOf(letter);
                if (index > -1) {
                    gd.lettersAvailable.splice(index, 1);
                    showGame(gd);
                }
            });

            lettersEl.appendChild(b);
        });
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
        const newButton = document.querySelector(".js-new-game") as HTMLButtonElement;

        saveGame(gameData);
        showGame(gameData);
        newButton.addEventListener("click", () => {
            const gd = startGame();
            saveGame(gd);
            showGame(gd);
        });
    }
})();
