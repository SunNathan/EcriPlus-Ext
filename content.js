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
            mode: 'same-origin', // Utilisez 'same-origin' ou 'cors' selon vos besoins
            redirect: 'follow'
        })
            .then(response => response.json())  // Supposons que la réponse est au format JSON
            .then(jsonData => {
                // console.log(jsonData.data.attributes.explication)
                explication = filterProblematicCharacters(jsonData.data.attributes.explication);
                printExplication(explication,tabid);
            })
            .catch(error => console.error("Erreur lors de la récupération de la nouvelle réponse :", error));
    }

    // Retourner les détails de la requête inchangés
    return { requestHeaders: details.requestHeaders };
}
function filterProblematicCharacters(text) {
    // Remplacer les guillemets simples par une séquence d'échappement
    text = text.replace(/'/g, "\\'");

    // Supprimer les occurrences de &nbsp;
    text = text.replace(/&nbsp;/g, " ");

    return text;
}

function printExplication(explication, tabId) {

        setTimeout(() => {
            browser.tabs.executeScript(tabId, {
                code: `
                instructionSection = document.querySelector('.challenge-statement');
                instructionSection.innerHTML += '${explication}';
                delete instructionSection;
                if (!instructionSection) console.log('errreur');`
            });
            // console.log('ajouté', explication);
        }, 1500); // Délai en millisecondes (2 secondes = 2000millisecondes)

}

browser.webRequest.onBeforeSendHeaders.addListener(
    catchAssessment,
    { urls: ["*://*.ecriplus.fr/*"] },
    ['blocking', 'requestHeaders']
);

