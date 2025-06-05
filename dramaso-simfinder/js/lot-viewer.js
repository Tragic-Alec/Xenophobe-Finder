document.addEventListener("DOMContentLoaded", async function() {

    main.buildPage();
});

main = function() {

    async function buildPage() {

        let siteLink = getSiteLink();
        let urlParams = new URLSearchParams(siteLink);

        let lotData = await fetchAPI(`${BASE_URL}/userapi/lots/${urlParams.get(`lot-id`)}`);
        console.log(lotData);

        let cacheBust = Math.floor(Math.random() * 10000000);
        let imageSource = `${BASE_URL}/userapi/city/1/${lotData.location}.png?cachebust:${cacheBust}`;
        console.log("%cFetching Lot Image:\n\n", "color: black; background-color: lightgreen;", imageSource);

        let lotImage = document.getElementById("lot-viewer-image");
        lotImage.src = imageSource;

        document.getElementById("lot-viewer-title").textContent = lotData.name;
        document.title = lotData.name;
        
        document.querySelector(`meta[name="og:title"]`).setAttribute("content", `${lotData.name} At DramaSO`);
        document.querySelector(`meta[name="og:url"]`).setAttribute("content", `${siteLink}`);
        document.querySelector(`meta[name="og:image"]`).setAttribute("content", `${imageSource}`);
    }

    function getSiteLink() {

        return window.location.search;
    }

    async function fetchAPI(apiLink) {

        let obj;
        const res = await fetch(apiLink);
        obj = await res.json();
    
        console.log("%cFetching Api Data:\n\n", "color: white; background-color: green;", apiLink);

        return obj;
    }

    return {
        buildPage: buildPage
    }
}();