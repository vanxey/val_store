window.addEventListener('load', (ev)=>{
    const tokenInput = document.querySelector("#token-input");
    const fetchBtn = document.querySelector("#fetch-btn");
    const errorMsg = document.querySelector("#error-msg");
    const storeWrapper = document.querySelector("#store-wrapper");
    const storeItems = document.querySelector("#store-items");
    const JWT_PATTERN = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/;

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.hidden = false;
    }

    function clearError() {
        errorMsg.textContent = "";
        errorMsg.hidden = true;
    }

    fetchBtn.addEventListener('click', async ()=>{
        clearError();
        const token = tokenInput.value.trim();
        
        if (token.length === 0) {
            showError("Please paste your bearer token.");
            return;
        }

        if (!JWT_PATTERN.test(token)) {
            showError("Invalid token format. Make sure you copied the full token.");
            return;
        }

        fetchBtn.disabled = true;
        fetchBtn.textContent = "Loading...";

        try {
            const response = await fetch("/api/store", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (!response.ok) {
                showError(data.error ?? "Something went wrong.");
                return;
            }
            renderStore(data);

        } catch {
            showError("Could not reach the server. Try again.");
        } finally {
            fetchBtn.disabled = false;
            fetchBtn.textContent = "View Store";
        }
    });

    function renderStore(data) {
        storeItems.innerHTML = "";
        storeWrapper.hidden = false;

        data.skins.forEach((skin) => {
            const card = document.createElement("div");
            card.className = "skin-card";

            const img = document.createElement("img");
            img.src = skin.icon;
            img.alt = skin.name;
            img.loading = "lazy";

            const name = document.createElement("p");
            name.textContent = skin.name;

            card.appendChild(img);
            card.appendChild(name);
            storeItems.appendChild(card);
        });
    }

});