let explication = "Explication indisponible. Merci de rafraichir la page.";
function getToken(details) {
    if (details.url.startsWith("https://api.tests.ecriplus.fr/api/assessments/") && details.url.endsWith("/next") && details.originUrl.startsWith("https://app.tests.ecriplus.fr/assessments")) {
        console.log(details)
        // console.log(details.requestHeaders)
        let authHeader = details.requestHeaders.find(header => header.name.toLowerCase() === "authorization");
        let myToken = authHeader.value.match(/Bearer (.+)/)[1];

        // test = 1;
        // Effectuer la nouvelle requête
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
                console.log(jsonData.data.attributes.explication)
                explication = filterProblematicCharacters(jsonData.data.attributes.explication);
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

// Fonction à exécuter lorsque la page est complètement chargée
function onPageLoadCompleted(details) {
    if (details.url.startsWith("https://app.tests.ecriplus.fr/assessments/")){
        console.log('page chargé', details.url);
        setTimeout(() => {
            browser.tabs.executeScript(details.tabId, {
                code: `
                instructionSection = document.querySelector('.challenge-statement');
                instructionSection.innerHTML += '${explication}';
                delete instructionSection;
                if (!instructionSection) console.log('errreur');`
            });
            console.log('ajouté', explication);
        }, 1500); // Délai en millisecondes (2 secondes = 2000millisecondes)
    }
}



browser.webNavigation.onCompleted.addListener(onPageLoadCompleted);

browser.webNavigation.onHistoryStateUpdated.addListener(details => {
    // Vérifier si l'URL correspond à ce que vous attendez
    if (details.url.startsWith("https://app.tests.ecriplus.fr/assessments/")) {
        // Lorsqu'une mise à jour de l'historique de navigation est détectée, exécutez votre fonction onPageLoadCompleted
        onPageLoadCompleted(details);
        console.log("history changed")
        // Retirer le gestionnaire d'événements onCompleted après exécution
        browser.webNavigation.onCompleted.removeListener(onPageLoadCompleted);
    }
});

// browser.webNavigation.onCreatedNavigationTarget.addListener(details => {
//     // Lorsqu'une nouvelle cible de navigation est créée, écoutez l'événement onCompleted pour cette nouvelle cible
//     browser.webNavigation.onCompleted.addListener(onPageLoadCompleted, {tabId: details.tabId});
// });

// // Événement initial onCompleted pour la page actuelle (celle qui est déjà ouverte)


browser.webRequest.onBeforeSendHeaders.addListener(
    getToken,
    { urls: ["*://*.ecriplus.fr/*"] },
    ['blocking', 'requestHeaders']
);

