// ============================================================
// PDF + QR EDITOR
// ============================================================

const pdfUpload =
    document.getElementById("pdf-upload");

const pdfCanvas =
    document.getElementById("pdf-canvas");

const pdfCanvasWrapper =
    document.getElementById("pdf-canvas-wrapper");

const pdfEmptyState =
    document.getElementById("pdf-empty-state");

const pdfQrOverlay =
    document.getElementById("pdf-qr-overlay");

const previousPageButton =
    document.getElementById("prev-page-btn");

const nextPageButton =
    document.getElementById("next-page-btn");

const pageIndicator =
    document.getElementById("page-indicator");

const addQrButton =
    document.getElementById("add-qr-to-pdf-btn");

const removeQrButton =
    document.getElementById("remove-qr-from-pdf-btn");

const exportPdfButton =
    document.getElementById("export-pdf-btn");

const pdfQrSize =
    document.getElementById("pdf-qr-size");

const pdfQrSizeValue =
    document.getElementById("pdf-qr-size-value");


// ============================================================
// STATE
// ============================================================

let loadedPdf = null;

let originalPdfBytes = null;

let currentPageNumber = 1;

let totalPages = 0;

const pdfScale = 1.35;

/*
Each page can have its own QR placement.

Stored as percentages so different PDF page sizes
still export correctly.
*/

const qrPlacements = {};


// ============================================================
// HELPERS
// ============================================================

function getGeneratedQrDataUrl() {

    const qrCanvas =
        document.querySelector(
            "#qr-code canvas"
        );

    const qrImage =
        document.querySelector(
            "#qr-code img"
        );

    if (qrCanvas) {

        return qrCanvas.toDataURL(
            "image/png"
        );

    }

    if (qrImage) {

        return qrImage.src;

    }

    return null;
}


function updateEditorButtons() {

    const hasPdf =
        loadedPdf !== null;

    const hasQr =
        Boolean(
            getGeneratedQrDataUrl()
        );

    const hasPlacement =
        Boolean(
            qrPlacements[
                currentPageNumber
            ]
        );

    previousPageButton.disabled =
        !hasPdf ||
        currentPageNumber <= 1;

    nextPageButton.disabled =
        !hasPdf ||
        currentPageNumber >= totalPages;

    addQrButton.disabled =
        !hasPdf ||
        !hasQr;

    removeQrButton.disabled =
        !hasPlacement;

    exportPdfButton.disabled =
        !hasPdf ||
        Object.keys(
            qrPlacements
        ).length === 0;
}


function updatePageIndicator() {

    if (!loadedPdf) {

        pageIndicator.textContent =
            "Page 0 / 0";

        return;
    }

    pageIndicator.textContent =
        `Page ${currentPageNumber} / ${totalPages}`;
}


// ============================================================
// LOAD PDF
// ============================================================

pdfUpload.addEventListener(
    "change",
    async (event) => {

        const file =
            event.target.files[0];

        if (!file) {
            return;
        }

        if (
            file.type !==
            "application/pdf"
        ) {

            alert(
                "Please upload a PDF file."
            );

            return;
        }

        try {

            const bytes =
                await file.arrayBuffer();

            originalPdfBytes =
                bytes.slice(0);

            loadedPdf =
                await pdfjsLib.getDocument({
                    data:
                        new Uint8Array(
                            bytes.slice(0)
                        )
                }).promise;

            totalPages =
                loadedPdf.numPages;

            currentPageNumber =
                1;

            Object.keys(
                qrPlacements
            ).forEach(
                (key) => {
                    delete qrPlacements[
                        key
                    ];
                }
            );

            pdfEmptyState.classList.add(
                "hidden"
            );

            pdfCanvasWrapper.classList.remove(
                "hidden"
            );

            await renderCurrentPage();

        } catch (error) {

            console.error(error);

            alert(
                "The PDF could not be loaded."
            );

        }

    }
);


// ============================================================
// RENDER PDF PAGE
// ============================================================

async function renderCurrentPage() {

    if (!loadedPdf) {
        return;
    }

    const page =
        await loadedPdf.getPage(
            currentPageNumber
        );

    const viewport =
        page.getViewport({
            scale:
                pdfScale
        });

    const context =
        pdfCanvas.getContext(
            "2d"
        );

    pdfCanvas.width =
        viewport.width;

    pdfCanvas.height =
        viewport.height;

    pdfCanvas.style.width =
        `${viewport.width}px`;

    pdfCanvas.style.height =
        `${viewport.height}px`;

    pdfCanvasWrapper.style.width =
        `${viewport.width}px`;

    pdfCanvasWrapper.style.height =
        `${viewport.height}px`;

    await page.render({
        canvasContext:
            context,

        viewport
    }).promise;

    updatePageIndicator();

    displayPlacement();

    updateEditorButtons();
}


// ============================================================
// PAGE NAVIGATION
// ============================================================

previousPageButton.addEventListener(
    "click",
    async () => {

        if (
            currentPageNumber <= 1
        ) {
            return;
        }

        currentPageNumber--;

        await renderCurrentPage();

    }
);


nextPageButton.addEventListener(
    "click",
    async () => {

        if (
            currentPageNumber >=
            totalPages
        ) {
            return;
        }

        currentPageNumber++;

        await renderCurrentPage();

    }
);


// ============================================================
// ADD QR
// ============================================================

addQrButton.addEventListener(
    "click",
    () => {

        const qrDataUrl =
            getGeneratedQrDataUrl();

        if (!qrDataUrl) {

            alert(
                "Generate a QR code first."
            );

            return;
        }

        if (!loadedPdf) {

            alert(
                "Upload a PDF first."
            );

            return;
        }

        const size =
            Number(
                pdfQrSize.value
            );

        const canvasWidth =
            pdfCanvas.width;

        const canvasHeight =
            pdfCanvas.height;

        const x =
            (
                canvasWidth -
                size
            ) / 2;

        const y =
            (
                canvasHeight -
                size
            ) / 2;

        qrPlacements[
            currentPageNumber
        ] = {

            image:
                qrDataUrl,

            x:
                x /
                canvasWidth,

            y:
                y /
                canvasHeight,

            size:
                size /
                canvasWidth

        };

        displayPlacement();

        updateEditorButtons();

    }
);


// ============================================================
// DISPLAY QR PLACEMENT
// ============================================================

function displayPlacement() {

    const placement =
        qrPlacements[
            currentPageNumber
        ];

    if (!placement) {

        pdfQrOverlay.classList.add(
            "hidden"
        );

        return;
    }

    const canvasWidth =
        pdfCanvas.width;

    const canvasHeight =
        pdfCanvas.height;

    const size =
        placement.size *
        canvasWidth;

    const x =
        placement.x *
        canvasWidth;

    const y =
        placement.y *
        canvasHeight;

    pdfQrOverlay.src =
        placement.image;

    pdfQrOverlay.style.width =
        `${size}px`;

    pdfQrOverlay.style.height =
        `${size}px`;

    pdfQrOverlay.style.left =
        `${x}px`;

    pdfQrOverlay.style.top =
        `${y}px`;

    pdfQrOverlay.classList.remove(
        "hidden"
    );

    pdfQrSize.value =
        Math.round(
            size
        );

    pdfQrSizeValue.textContent =
        `${Math.round(size)} px`;

    updateEditorButtons();
}


// ============================================================
// REMOVE QR
// ============================================================

removeQrButton.addEventListener(
    "click",
    () => {

        delete qrPlacements[
            currentPageNumber
        ];

        pdfQrOverlay.classList.add(
            "hidden"
        );

        updateEditorButtons();

    }
);


// ============================================================
// SIZE CONTROL
// ============================================================

pdfQrSize.addEventListener(
    "input",
    () => {

        const size =
            Number(
                pdfQrSize.value
            );

        pdfQrSizeValue.textContent =
            `${size} px`;

        const placement =
            qrPlacements[
                currentPageNumber
            ];

        if (!placement) {
            return;
        }

        const canvasWidth =
            pdfCanvas.width;

        const canvasHeight =
            pdfCanvas.height;

        placement.size =
            size /
            canvasWidth;

        let x =
            placement.x *
            canvasWidth;

        let y =
            placement.y *
            canvasHeight;

        if (
            x + size >
            canvasWidth
        ) {

            x =
                canvasWidth -
                size;

        }

        if (
            y + size >
            canvasHeight
        ) {

            y =
                canvasHeight -
                size;

        }

        placement.x =
            Math.max(
                0,
                x
            ) /
            canvasWidth;

        placement.y =
            Math.max(
                0,
                y
            ) /
            canvasHeight;

        displayPlacement();

    }
);


// ============================================================
// DRAG QR
// ============================================================

let dragging =
    false;

let dragOffsetX =
    0;

let dragOffsetY =
    0;


pdfQrOverlay.addEventListener(
    "pointerdown",
    (event) => {

        const placement =
            qrPlacements[
                currentPageNumber
            ];

        if (!placement) {
            return;
        }

        dragging =
            true;

        const overlayRect =
            pdfQrOverlay.getBoundingClientRect();

        dragOffsetX =
            event.clientX -
            overlayRect.left;

        dragOffsetY =
            event.clientY -
            overlayRect.top;

        pdfQrOverlay.setPointerCapture(
            event.pointerId
        );

        event.preventDefault();

    }
);


pdfQrOverlay.addEventListener(
    "pointermove",
    (event) => {

        if (!dragging) {
            return;
        }

        const placement =
            qrPlacements[
                currentPageNumber
            ];

        if (!placement) {
            return;
        }

        const wrapperRect =
            pdfCanvasWrapper.getBoundingClientRect();

        const overlayWidth =
            pdfQrOverlay.offsetWidth;

        const overlayHeight =
            pdfQrOverlay.offsetHeight;

        let x =
            event.clientX -
            wrapperRect.left -
            dragOffsetX;

        let y =
            event.clientY -
            wrapperRect.top -
            dragOffsetY;

        x =
            Math.max(
                0,
                Math.min(
                    x,
                    pdfCanvas.width -
                    overlayWidth
                )
            );

        y =
            Math.max(
                0,
                Math.min(
                    y,
                    pdfCanvas.height -
                    overlayHeight
                )
            );

        pdfQrOverlay.style.left =
            `${x}px`;

        pdfQrOverlay.style.top =
            `${y}px`;

        placement.x =
            x /
            pdfCanvas.width;

        placement.y =
            y /
            pdfCanvas.height;

    }
);


pdfQrOverlay.addEventListener(
    "pointerup",
    (event) => {

        dragging =
            false;

        try {

            pdfQrOverlay.releasePointerCapture(
                event.pointerId
            );

        } catch {
            // Nothing required.
        }

    }
);


pdfQrOverlay.addEventListener(
    "pointercancel",
    () => {

        dragging =
            false;

    }
);


// ============================================================
// EXPORT PDF
// ============================================================

exportPdfButton.addEventListener(
    "click",
    async () => {

        if (
            !originalPdfBytes
        ) {
            return;
        }

        if (
            Object.keys(
                qrPlacements
            ).length === 0
        ) {

            alert(
                "Add a QR code to at least one page first."
            );

            return;
        }

        const originalText =
            exportPdfButton.textContent;

        exportPdfButton.disabled =
            true;

        exportPdfButton.textContent =
            "Exporting...";

        try {

            const {
                PDFDocument
            } =
                PDFLib;

            const pdfDocument =
                await PDFDocument.load(
                    originalPdfBytes.slice(
                        0
                    )
                );

            const pages =
                pdfDocument.getPages();

            for (
                const [
                    pageNumberText,
                    placement
                ]
                of Object.entries(
                    qrPlacements
                )
            ) {

                const pageNumber =
                    Number(
                        pageNumberText
                    );

                const page =
                    pages[
                        pageNumber -
                        1
                    ];

                if (!page) {
                    continue;
                }

                const qrImage =
                    await pdfDocument.embedPng(
                        placement.image
                    );

                const pageWidth =
                    page.getWidth();

                const pageHeight =
                    page.getHeight();

                const qrSize =
                    placement.size *
                    pageWidth;

                const x =
                    placement.x *
                    pageWidth;

                /*
                Browser canvas coordinates start
                at the top-left.

                PDF coordinates start
                at the bottom-left.
                */

                const browserY =
                    placement.y *
                    pageHeight;

                const pdfY =
                    pageHeight -
                    browserY -
                    qrSize;

                page.drawImage(
                    qrImage,
                    {
                        x:
                            x,

                        y:
                            pdfY,

                        width:
                            qrSize,

                        height:
                            qrSize
                    }
                );

            }

            const outputBytes =
                await pdfDocument.save();

            const blob =
                new Blob(
                    [
                        outputBytes
                    ],
                    {
                        type:
                            "application/pdf"
                    }
                );

            const url =
                URL.createObjectURL(
                    blob
                );

            const link =
                document.createElement(
                    "a"
                );

            link.href =
                url;

            let filename =
                pdfUpload
                    .files[0]
                    ?.name ||
                "document.pdf";

            filename =
                filename.replace(
                    /\.pdf$/i,
                    ""
                );

            link.download =
                `${filename}-with-qr.pdf`;

            document.body.appendChild(
                link
            );

            link.click();

            link.remove();

            setTimeout(
                () => {
                    URL.revokeObjectURL(
                        url
                    );
                },
                1000
            );

        } catch (error) {

            console.error(
                error
            );

            alert(
                "The PDF could not be exported."
            );

        } finally {

            exportPdfButton.textContent =
                originalText;

            updateEditorButtons();

        }

    }
);


// ============================================================
// DETECT NEW QR GENERATION
// ============================================================

const qrObserver =
    new MutationObserver(
        () => {

            updateEditorButtons();

            /*
            If a placement already exists,
            don't automatically replace it.
            The user can press Add QR again.
            */

        }
    );


const existingQrContainer =
    document.getElementById(
        "qr-code"
    );

if (existingQrContainer) {

    qrObserver.observe(
        existingQrContainer,
        {
            childList:
                true,

            subtree:
                true
        }
    );

}


// ============================================================
// INITIAL STATE
// ============================================================

updatePageIndicator();

updateEditorButtons();

pdfQrSizeValue.textContent =
    `${pdfQrSize.value} px`;