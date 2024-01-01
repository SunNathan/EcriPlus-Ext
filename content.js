let explication = "Explication indisponible. Merci de rafraichir la page.";
function catchAssessment(details) {
    if (details.url.startsWith("https://api.tests.ecriplus.fr/api/assessments/") && details.url.endsWith("/next") && details.originUrl.startsWith("https://app.tests.ecriplus.fr/assessments")) {

        // console.log(details)
        // console.log(details.requestHeaders)
        let authHeader = details.requestHeaders.find(header => header.name.toLowerCase() === "authorization");
        let myToken = authHeader.value.match(/Bearer (.+)/)[1];
        let tabid = details.tabId;

        fetch(details.url, {
            method: details.method,
            headers: {
                ...details.requestHeaders,
                'Authorization': `Bearer ${myToken}`
            },
            mode: 'same-origin',
            redirect: 'follow'
        })
            .then(response => response.json())
            .then(jsonData => {
                explication = filterProblematicCharacters(jsonData.data.attributes.explication);
                // console.log(tabid)
                printExplication(explication,tabid);
            })
            .catch(error => console.error("Erreur lors de la récupération de la nouvelle réponse :", error));
    }
    return { requestHeaders: details.requestHeaders };
}
function filterProblematicCharacters(text) {
    text = text.replace(/'/g, "\\'");
    text = text.replace(/&nbsp;/g, " ");

    return text;
}

function printExplication(explication, tabId) {
        // console.log("avant ajout", explication);
        setTimeout(() => {
            browser.tabs.executeScript(tabId, {
                code: `
                instructionSection = document.querySelector('.challenge-statement');
                instructionSection.innerHTML += '${explication}';
                if (!instructionSection) console.log('errreur');`
            });
            // console.log('ajouté', explication);
        }, 1000); // Délai en millisecondes (2 secondes = 2000millisecondes)

}

browser.webRequest.onBeforeSendHeaders.addListener(
    catchAssessment,
    { urls: ["*://*.ecriplus.fr/*"] },
    ['blocking', 'requestHeaders']
);

