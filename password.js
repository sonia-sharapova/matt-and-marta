(function () {
    const SESSION_KEY = 'mm_auth';

    function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }

    const CORRECT_HASH = hashCode('trueloveskiss');

    if (sessionStorage.getItem(SESSION_KEY) === CORRECT_HASH) return;

    const overlay = document.createElement('div');
    overlay.id = 'pw-overlay';
    overlay.innerHTML = `
        <div id="pw-box">
            <h1>marta &amp; matt</h1>
            <p class="pw-subtitle">please enter the password to continue</p>
            <div class="pw-form-group">
                <input type="password" id="pw-input" placeholder="password" autocomplete="off" />
            </div>
            <p id="pw-error">incorrect password — please try again</p>
            <button id="pw-submit">enter</button>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Sorts+Mill+Goudy:ital@0;1&family=Rosarivo:ital@0;1&display=swap');

        #pw-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background-color: #f5f3f0;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #pw-box {
            text-align: center;
            max-width: 400px;
            width: 90%;
            padding: 20px;
        }

        #pw-box h1 {
            font-family: 'Sorts Mill Goudy', serif;
            font-size: 42px;
            font-weight: normal;
            letter-spacing: 0.15em;
            color: #000;
            margin-bottom: 30px;
        }

        .pw-subtitle {
            font-family: 'Rosarivo', serif;
            font-style: italic;
            font-size: 13px;
            letter-spacing: 0.05em;
            color: rgba(49, 49, 49, 0.63);
            margin-bottom: 24px;
        }

        .pw-form-group {
            margin-bottom: 20px;
        }

        #pw-input {
            width: 100%;
            padding: 12px;
            font-family: 'Sorts Mill Goudy', serif;
            font-size: 16px;
            border: 1px solid #ccc;
            background-color: #fff;
            letter-spacing: 0.02em;
            text-align: center;
            outline: none;
            color: #000;
        }

        #pw-input:focus {
            border-color: #888;
        }

        #pw-error {
            font-family: 'Rosarivo', serif;
            font-style: italic;
            font-size: 12px;
            letter-spacing: 0.05em;
            color: rgba(49, 49, 49, 0.63);
            margin-bottom: 16px;
            margin-top: -8px;
            display: none;
        }

        #pw-submit {
            background-color: #575757;
            color: #fff;
            padding: 14px 40px;
            font-family: 'Sorts Mill Goudy', serif;
            font-size: 16px;
            letter-spacing: 0.1em;
            border: none;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }

        #pw-submit:hover {
            background-color: #333;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);

    function attempt() {
        const val = document.getElementById('pw-input').value;
        if (hashCode(val) === CORRECT_HASH) {
            sessionStorage.setItem(SESSION_KEY, CORRECT_HASH);
            overlay.remove();
        } else {
            document.getElementById('pw-error').style.display = 'block';
            document.getElementById('pw-input').value = '';
            document.getElementById('pw-input').focus();
        }
    }

    document.getElementById('pw-submit').addEventListener('click', attempt);
    document.getElementById('pw-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') attempt();
    });

    document.getElementById('pw-input').focus();
})();
