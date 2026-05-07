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
            <img src="images/Website-Title.png" alt="Marta & Matt" style="max-width: 260px; width: 80%; margin-bottom: 30px; display: block; margin-left: auto; margin-right: auto;">
            <p class="pw-subtitle">please enter the password to continue</p>
            <div class="pw-form-group">
                <div class="pw-input-wrap">
                    <input type="password" id="pw-input" placeholder="password" autocomplete="off" />
                    <button type="button" id="pw-toggle" aria-label="Show password">
                        <svg id="pw-eye" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                        <svg id="pw-eye-off" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                    </button>
                </div>
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

        .pw-input-wrap {
            position: relative;
            display: flex;
            align-items: center;
        }

        #pw-toggle {
            position: absolute;
            right: 10px;
            background: none;
            border: none;
            cursor: pointer;
            color: #999;
            padding: 0;
            display: flex;
            align-items: center;
        }

        #pw-toggle:hover { color: #555; }

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
    document.getElementById('pw-toggle').addEventListener('click', function () {
        var input = document.getElementById('pw-input');
        var isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        document.getElementById('pw-eye').style.display = isHidden ? 'none' : '';
        document.getElementById('pw-eye-off').style.display = isHidden ? '' : 'none';
    });

    document.getElementById('pw-input').focus();
})();
