// =============================================
// ELEMENTS
// =============================================

const input =
    document.getElementById("qr-input");

const generateButton =
    document.getElementById("generate-btn");

const clearButton =
    document.getElementById("clear-btn");

const downloadButton =
    document.getElementById("download-btn");

const copyInputButton =
    document.getElementById("copy-input-btn");

const qrContainer =
    document.getElementById("qr-code");

const qrSection =
    document.getElementById("qr-section");

const qrPlaceholder =
    document.getElementById("qr-placeholder");

const qrFrame =
    document.getElementById("qr-frame");

const sizeSelect =
    document.getElementById("size-select");

const filenameInput =
    document.getElementById("filename-input");

const resolutionText =
    document.getElementById("resolution-text");

const characterCount =
    document.getElementById("character-count");

const foregroundColor =
    document.getElementById("foreground-color");

const foregroundHex =
    document.getElementById("foreground-hex");

const backgroundColor =
    document.getElementById("background-color");

const backgroundHex =
    document.getElementById("background-hex");

const resetColorsButton =
    document.getElementById("reset-colors-btn");

const errorMessage =
    document.getElementById("error-message");

const presets =
    document.querySelectorAll(".color-preset");


// =============================================
// CONSTANTS
// =============================================

const DEFAULT_FOREGROUND = "#111827";
const DEFAULT_BACKGROUND = "#ffffff";

let generationTimer = null;


// =============================================
// HEX VALIDATION
// =============================================

function isValidHex(value) {
    return /^#[0-9A-F]{6}$/i.test(value);
}


// =============================================
// ERROR
// =============================================

function showError(message) {
    errorMessage.textContent = message;

    errorMessage.classList.remove("hidden");
}

function hideError() {
    errorMessage.textContent = "";

    errorMessage.classList.add("hidden");
}


// =============================================
// CHARACTER COUNT
// =============================================

function updateCharacterCount() {
    const length =
        input.value.length;

    characterCount.textContent =
        `${length} ${length === 1
            ? "character"
            : "characters"
        }`;
}


// =============================================
// QR VISIBILITY
// =============================================

function showQRResult() {
    qrPlaceholder.classList.add("hidden");

    qrSection.classList.remove("hidden");
}

function showPlaceholder() {
    qrSection.classList.add("hidden");

    qrPlaceholder.classList.remove("hidden");
}


// =============================================
// QR GENERATION
// =============================================

function generateQRCode() {
    hideError();

    const value =
        input.value.trim();

    if (!value) {
        qrContainer.innerHTML = "";

        showPlaceholder();

        return;
    }

    if (value.length > 1500) {
        showError(
            "The content is too long. Please shorten it before generating the QR code."
        );

        return;
    }

    const size =
        Number(sizeSelect.value);

    const dark =
        foregroundColor.value;

    const light =
        backgroundColor.value;

    qrContainer.innerHTML = "";

    try {

        new QRCode(
            qrContainer,
            {
                text: value,

                width: size,

                height: size,

                colorDark: dark,

                colorLight: light,

                correctLevel:
                    QRCode.CorrectLevel.H
            }
        );

        resolutionText.textContent =
            `${size} × ${size}`;

        qrFrame.style.background =
            light;

        showQRResult();

    } catch (error) {

        console.error(error);

        showError(
            "The QR code could not be generated. Try using shorter content."
        );

    }
}


// =============================================
// LIVE GENERATION
// =============================================

function scheduleGeneration() {
    clearTimeout(
        generationTimer
    );

    generationTimer =
        setTimeout(
            generateQRCode,
            250
        );
}


// =============================================
// CLEAR
// =============================================

function clearQRCode() {
    input.value = "";

    filenameInput.value =
        "qr-code";

    sizeSelect.value =
        "240";

    resetColors();

    qrContainer.innerHTML = "";

    hideError();

    updateCharacterCount();

    showPlaceholder();

    input.focus();
}


// =============================================
// DOWNLOAD
// =============================================

function downloadQRCode() {
    const canvas =
        qrContainer.querySelector(
            "canvas"
        );

    const image =
        qrContainer.querySelector(
            "img"
        );

    let imageUrl = "";

    if (canvas) {

        imageUrl =
            canvas.toDataURL(
                "image/png"
            );

    } else if (image) {

        imageUrl =
            image.src;

    } else {

        showError(
            "Generate a QR code before downloading."
        );

        return;
    }

    let filename =
        filenameInput.value.trim();

    if (!filename) {
        filename =
            "qr-code";
    }

    filename =
        filename
            .replace(
                /\.png$/i,
                ""
            )
            .replace(
                /[^a-zA-Z0-9-_]/g,
                "-"
            )
            .replace(
                /-+/g,
                "-"
            );

    const link =
        document.createElement(
            "a"
        );

    link.href =
        imageUrl;

    link.download =
        `${filename}.png`;

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();
}


// =============================================
// COPY CONTENT
// =============================================

async function copyInput() {
    const value =
        input.value.trim();

    if (!value) {
        return;
    }

    try {

        await navigator.clipboard.writeText(
            value
        );

        const originalText =
            copyInputButton.textContent;

        copyInputButton.textContent =
            "Copied!";

        setTimeout(
            () => {
                copyInputButton.textContent =
                    originalText;
            },
            1200
        );

    } catch {

        input.select();

        document.execCommand(
            "copy"
        );

    }
}


// =============================================
// COLOR HELPERS
// =============================================

function setForegroundColor(
    value
) {
    foregroundColor.value =
        value;

    foregroundHex.value =
        value;

    scheduleGeneration();
}

function setBackgroundColor(
    value
) {
    backgroundColor.value =
        value;

    backgroundHex.value =
        value;

    qrFrame.style.background =
        value;

    scheduleGeneration();
}


// =============================================
// RESET COLORS
// =============================================

function resetColors() {
    foregroundColor.value =
        DEFAULT_FOREGROUND;

    foregroundHex.value =
        DEFAULT_FOREGROUND;

    backgroundColor.value =
        DEFAULT_BACKGROUND;

    backgroundHex.value =
        DEFAULT_BACKGROUND;

    qrFrame.style.background =
        DEFAULT_BACKGROUND;

    presets.forEach(
        (preset) =>
            preset.classList.remove(
                "active"
            )
    );

    if (presets[0]) {
        presets[0].classList.add(
            "active"
        );
    }

    scheduleGeneration();
}


// =============================================
// PRESETS
// =============================================

presets.forEach(
    (preset) => {

        preset.addEventListener(
            "click",
            () => {

                const dark =
                    preset.dataset.dark;

                const light =
                    preset.dataset.light;

                foregroundColor.value =
                    dark;

                foregroundHex.value =
                    dark;

                backgroundColor.value =
                    light;

                backgroundHex.value =
                    light;

                qrFrame.style.background =
                    light;

                presets.forEach(
                    (item) =>
                        item.classList.remove(
                            "active"
                        )
                );

                preset.classList.add(
                    "active"
                );

                scheduleGeneration();
            }
        );

    }
);


// =============================================
// INPUT EVENTS
// =============================================

input.addEventListener(
    "input",
    () => {

        updateCharacterCount();

        if (
            input.value.trim()
        ) {

            scheduleGeneration();

        } else {

            qrContainer.innerHTML =
                "";

            showPlaceholder();

        }

    }
);


// =============================================
// SIZE
// =============================================

sizeSelect.addEventListener(
    "change",
    () => {

        const size =
            Number(
                sizeSelect.value
            );

        resolutionText.textContent =
            `${size} × ${size}`;

        if (
            input.value.trim()
        ) {
            generateQRCode();
        }

    }
);


// =============================================
// FOREGROUND COLOR
// =============================================

foregroundColor.addEventListener(
    "input",
    () => {

        foregroundHex.value =
            foregroundColor.value;

        presets.forEach(
            (preset) =>
                preset.classList.remove(
                    "active"
                )
        );

        scheduleGeneration();

    }
);


foregroundHex.addEventListener(
    "input",
    () => {

        let value =
            foregroundHex.value.trim();

        if (
            !value.startsWith("#")
        ) {
            value =
                `#${value}`;
        }

        if (
            isValidHex(value)
        ) {

            foregroundColor.value =
                value;

            scheduleGeneration();

        }

    }
);


// =============================================
// BACKGROUND COLOR
// =============================================

backgroundColor.addEventListener(
    "input",
    () => {

        backgroundHex.value =
            backgroundColor.value;

        qrFrame.style.background =
            backgroundColor.value;

        presets.forEach(
            (preset) =>
                preset.classList.remove(
                    "active"
                )
        );

        scheduleGeneration();

    }
);


backgroundHex.addEventListener(
    "input",
    () => {

        let value =
            backgroundHex.value.trim();

        if (
            !value.startsWith("#")
        ) {
            value =
                `#${value}`;
        }

        if (
            isValidHex(value)
        ) {

            backgroundColor.value =
                value;

            qrFrame.style.background =
                value;

            scheduleGeneration();

        }

    }
);


// =============================================
// BUTTON EVENTS
// =============================================

generateButton.addEventListener(
    "click",
    generateQRCode
);

clearButton.addEventListener(
    "click",
    clearQRCode
);

downloadButton.addEventListener(
    "click",
    downloadQRCode
);

copyInputButton.addEventListener(
    "click",
    copyInput
);

resetColorsButton.addEventListener(
    "click",
    resetColors
);


// =============================================
// KEYBOARD SHORTCUTS
// =============================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            (
                event.metaKey ||
                event.ctrlKey
            ) &&
            event.key ===
                "Enter"
        ) {

            event.preventDefault();

            generateQRCode();

        }

    }
);


// =============================================
// INITIAL STATE
// =============================================

updateCharacterCount();

showPlaceholder();