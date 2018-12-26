interface IGameData {
    clues: string;
    lettersAvailable: string[];
    lettersUsed: string[];
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
        lettersEl.textContent = gd.lettersAvailable.join(", ");
    };

    const startGame = () => {
        phraseEl.value = "";
        cluesEl.value = "";

        gameData = {
            clues: "",
            lettersAvailable: letters,
            lettersUsed: [],
            phrase: "",
        };

        saveGame(gameData);
        showGame(gameData);
    };

    if (!storage) {
        statusEl.textContent = "No localStorage -- cannot use this";
    } else {
        statusEl.textContent = "System check complete";
        startGame();
    }
})();
